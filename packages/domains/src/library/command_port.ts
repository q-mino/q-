import * as z from 'zod'
import { date_time, type Semver } from './format.ts'
import type { CommandRootContext } from './context.ts'
import type { ComposedBranches, Envelope, PartFields, Resource, StoredPart } from './envelope.ts'
import {
  $Command,
  $Composition,
  $Each,
  entry_id,
  type Commands,
  type Composition,
  type Outcome,
  type Transitions,
} from './command.ts'
import { $Step } from './step.ts'
import { $Node } from './node.ts'
import { $UseCase, type CommandUseCases, type CommandsOf } from './use_case.ts'
import { $Version } from './version.ts'
import { $Versions, type Registry, type Versions } from './registry.ts'
import type { CommandUseCasePort } from './use_case_port.ts'
import type {
  Execution,
  PlannedCommand,
  PlannedCommandBranch,
  PlannedWrite,
  StateAdapter,
  StoredEntry,
} from './state_adapter.ts'
import { is_a_schema, kind_of } from './kind.ts'
import {
  bind,
  failures_of,
  fold,
  holds_on,
  leaves_of,
  type Bound,
  type BoundLeaf,
} from './bound_condition.ts'
import { resources_of } from './resources.ts'
import { called, folder_of, is_a_record, is_at_or_above, paths_in, serving } from './runtime.ts'

// The ports of the command use cases (DOM-2, LIB-1, LIB-14), which the
// library builds over a state adapter: for each invocation, the input parsed
// by its schema, built over the context (DOM-21); the creator resolved into a
// plan, the branches in their order, each condition as data folded into the
// adapter's fragments, with the conditions of the nodes of the use case's
// path before every branch's (D105, SC-31), each fact in its envelope with
// its resources and its domain's version (DOM-10), its outbox entries
// (DOM-13); a branch that composes planned once per combination of its
// transitions' branches, the adapter choosing each element's branch of a
// transition on a list (SC-10, SC-54); the adapter's step (`Execute`); the
// outcome (DOM-7): the branch with its fact and the parts it composed, the
// rejection naming every failed predicate, or, from the duplicate branch,
// the fact recorded or the identity already used (DOM-11). The command ports
// stay inside the library.

/** A predicate's fragment, an operator, a fact's write, as the ports meet them at runtime. */
interface RuntimeAdapter<fragment, write> {
  readonly algebra: {
    readonly predicate: Readonly<Record<string, (parameters: unknown) => fragment>>
    readonly and: (components: readonly fragment[]) => fragment
    readonly or: (components: readonly fragment[]) => fragment
    readonly not: (operand: fragment) => fragment
  }
  readonly write: Readonly<Record<string, (fact: unknown) => write>>
  readonly execute: (plan: PlannedCommand<fragment, write>) => Promise<Execution>
}

/** A failure as an outcome names it: of a branch, or of the path (no branch, D105.4). */
type RuntimeFailure =
  | { readonly branch: string; readonly components: readonly string[]; readonly predicate: string }
  | { readonly components: readonly string[]; readonly predicate: string }

/** An outcome as the ports give it at runtime: every value parsed by its schema. */
type RuntimeOutcome =
  | {
      readonly outcome: 'applied'
      readonly branch: string
      readonly position: string
      readonly fact: Envelope<readonly PartFields[]>
      readonly composed?: RuntimeComposed
    }
  | { readonly outcome: 'rejected'; readonly failures: readonly RuntimeFailure[] }
  | { readonly outcome: 'identity_already_used' }
  | { readonly outcome: 'invalid_request' }

/** A command use case's port at runtime: one message in, its outcome out (DOM-3). */
type RuntimePort = (context: CommandRootContext, input: unknown) => AsyncIterable<RuntimeOutcome>

/** The version of every domain in a registry, by its folder (`version.ts`, DOM-22). */
const versions_in = (registry: Registry): readonly (readonly [string, Semver])[] =>
  Object.entries(registry).flatMap(([path, entry]): readonly (readonly [string, Semver])[] =>
    typeof entry === 'object' && $Version in entry ? [[folder_of(path), entry[$Version]]] : [],
  )

/**
 * The version a component is written at: its domain's when written
 * (DOM-10, DOM-22), the version of the nearest folder above it that
 * declares one.
 */
const version_at =
  (versions: readonly (readonly [string, Semver])[]) =>
  (path: string): Semver => {
    const nearest = versions
      .filter(([folder]) => is_at_or_above(folder, folder_of(path)))
      .toSorted(([a], [b]) => b.length - a.length)[0]
    if (nearest === undefined) {
      throw new Error(`${path} is of no domain whose version the registry gives (DOM-22)`)
    }
    return nearest[1]
  }

/** A node of a use case's path in a business tree (D105, SC-31): what it binds, what it requires, its creator. */
export interface PathNode {
  readonly path: string
  readonly binds: z.ZodObject | undefined
  readonly requires: z.ZodType | undefined
  readonly creator: unknown
}

/**
 * The nodes above a use case, outer first, met as the library walks its
 * path down. Of a node, the command ports run what a business node
 * declares (`binds`, `requires`); what a persona's node declares runs at
 * its tree's leaf (PER-6).
 */
export const nodes_above =
  (registry: Registry) =>
  (use_case: string): readonly PathNode[] =>
    Object.entries(registry)
      .flatMap(([path, entry]): readonly PathNode[] => {
        if (
          typeof entry !== 'object' ||
          !($Node in entry) ||
          !is_at_or_above(folder_of(path), folder_of(use_case))
        ) {
          return []
        }
        const declared: Readonly<Record<string, unknown>> = { ...entry[$Node].declared }
        const persona = ['takes', 'looks_up', 'is_found_only_if', 'is_refused_unless', 'gives']
        if (persona.some((part) => declared[part] !== undefined)) {
          throw new Error(
            `${path} looks up, takes or gives: a node of a business tree binds and requires (D105)`,
          )
        }
        const binds = declared['binds']
        const requires = declared['requires']
        return [
          {
            path,
            binds: binds instanceof z.ZodObject ? binds : undefined,
            requires: is_a_schema(requires) ? requires : undefined,
            creator: declared['creator'],
          },
        ]
      })
      .toSorted((a, b) => a.path.split('/').length - b.path.split('/').length)

/**
 * What a node binds, from the flat input (D105.2): the fields its schema
 * names, parsed by it; nothing for a node that binds none; none at all
 * when they are not in its schema.
 */
export const bound_by = (
  node: PathNode,
  input: unknown,
): Readonly<Record<string, unknown>> | undefined => {
  if (node.binds === undefined) return {}
  if (!is_a_record(input)) return undefined
  const parsed = node.binds.safeParse(
    Object.fromEntries(
      Object.keys(node.binds.shape).flatMap((key) => (key in input ? [[key, input[key]]] : [])),
    ),
  )
  return parsed.success ? parsed.data : undefined
}

/** A command's parts at runtime: its creator, its input as declared, its branches. */
export interface RuntimeCommand {
  readonly creator: unknown
  readonly input: unknown
  readonly outcomes: Readonly<Record<string, Outcome>>
}

/** A command's parts, or none for a step (DOM-20), whose port comes with its plan. */
export const command_parts = (command: Commands[string]): RuntimeCommand | undefined => {
  if ($Step in command) return undefined
  const outcomes = command[$Command].outcomes
  if (outcomes === undefined) return undefined
  return { creator: command, input: 'input' in command ? command.input : undefined, outcomes }
}

/**
 * The facts a command records, its branches' and those of the transitions
 * they compose (DOM-19): what its duplicate branch reads back through the
 * versions of the store, which must read their domain (CFG-2).
 */
const facts_recorded = (command: RuntimeCommand): readonly unknown[] =>
  Object.values(command.outcomes).flatMap(([, fact, , composition]) => [
    fact,
    ...(composition === undefined
      ? []
      : Object.values(composition[$Composition]).flatMap((composed) => {
          const transition = command_parts($Each in composed ? composed[$Each] : composed)
          return transition === undefined
            ? []
            : Object.values(transition.outcomes).map(([, recorded]) => recorded)
        })),
  ])

/** A branch's entry as the creator resolves it (DOM-13): its id, its payload, when it may go. */
const resolved_entry = z.strictObject({
  id: entry_id,
  payload: z.unknown(),
  not_before: date_time.optional(),
})

/**
 * A part of a branch as planned, the branch's own or a composed
 * transition's (DOM-10, D111): the name of the branch, its condition bound
 * by the creator, its part as stored, with its resources and its domain's
 * version, its write, its outbox entries, each with the part's resources
 * (DOM-13, SC-53).
 */
interface PlannedPart<write> {
  readonly name: string
  readonly bound: Bound
  readonly part: StoredPart
  readonly write: write
  readonly entries: readonly Omit<StoredEntry, 'correlation'>[]
}

/**
 * What a branch composes, planned under the name of its composition
 * (SC-10, SC-54): a transition's branches, in their order; or, for a
 * transition on a list, each element's, in the order of the list.
 */
type PlannedComposition<write> =
  | {
      readonly composes: 'one'
      readonly name: string
      readonly branches: readonly PlannedPart<write>[]
    }
  | {
      readonly composes: 'each'
      readonly name: string
      readonly elements: readonly (readonly PlannedPart<write>[])[]
    }

/**
 * A plan of a branch: its own part, what it composes, and the branch of
 * each single transition this plan applies, in the order of the
 * composition (`combination`): a branch that composes is planned once per
 * combination of its single transitions' branches (SC-10).
 */
interface Plan<write> {
  readonly own: PlannedPart<write>
  readonly compositions: readonly PlannedComposition<write>[]
  readonly combination: readonly number[]
}

/** A plan of a branch with what the outcome reads back: the branch's name, and the branch the adapter meets. */
interface Planned<fragment, write> extends Plan<write> {
  readonly name: string
  readonly branch: PlannedCommandBranch<fragment, write>
}

/** The parts a plan writes for a choice, in order, and the branch each part it composed applied. */
interface Chosen<write> {
  readonly parts: readonly PlannedPart<write>[]
  readonly composed: ComposedBranches
}

/** The single transitions a plan composes, in the order written. */
const singles_of = <write>(plan: Plan<write>) =>
  plan.compositions.flatMap((composition) => (composition.composes === 'one' ? [composition] : []))

/** The transitions on a list a plan composes, in the order written. */
const lists_of = <write>(plan: Plan<write>) =>
  plan.compositions.flatMap((composition) => (composition.composes === 'each' ? [composition] : []))

/** The branch of each single transition a plan applies, in the order written. */
const combined = <write>(plan: Plan<write>): readonly PlannedPart<write>[] =>
  singles_of(plan).map((composition, i) => {
    const part = composition.branches[plan.combination[i] ?? -1]
    if (part === undefined) throw new Error(`no branch of ${composition.name} is planned`)
    return part
  })

/**
 * Every combination of one branch per single transition, the first
 * transition's varying slowest (SC-10): the adapter applies the first that
 * holds, so each transition applies the first of its branches that holds,
 * as a command does; one combination, none, for a branch that composes
 * nothing.
 */
const combinations = (sizes: readonly number[]): readonly (readonly number[])[] =>
  sizes.reduce<readonly (readonly number[])[]>(
    (prefixes, size) =>
      prefixes.flatMap((prefix) => Array.from({ length: size }, (_, i) => [...prefix, i])),
    [[]],
  )

/**
 * The parts a plan writes (D111, D113.2): its own, then, in the order its
 * composition is written, each single transition's branch of the plan's
 * combination, and, for a list, the branch each element chose (`elements`,
 * the adapter's choice, element by element in the order of the lists),
 * in the order of the list.
 */
const chosen_parts = <write>(plan: Plan<write>, elements: readonly number[]): Chosen<write> => {
  const singles = combined(plan)
  const walked = plan.compositions.reduce<{
    readonly single: number
    readonly element: number
    readonly parts: readonly PlannedPart<write>[]
    readonly composed: ComposedBranches
  }>(
    (at, composition) => {
      if (composition.composes === 'one') {
        const part = singles[at.single]
        if (part === undefined) throw new Error(`no branch of ${composition.name} is planned`)
        return {
          single: at.single + 1,
          element: at.element,
          parts: [...at.parts, part],
          composed: { ...at.composed, [composition.name]: part.name },
        }
      }
      const chosen = composition.elements.map((branches, i) => {
        const part = branches[elements[at.element + i] ?? -1]
        if (part === undefined) {
          throw new Error(
            `the adapter chose no branch of ${composition.name} for its element ${String(i + 1)} (SC-54)`,
          )
        }
        return part
      })
      return {
        single: at.single,
        element: at.element + composition.elements.length,
        parts: [...at.parts, ...chosen],
        composed: { ...at.composed, [composition.name]: chosen.map((part) => part.name) },
      }
    },
    { single: 0, element: 0, parts: [plan.own], composed: {} },
  )
  if (walked.element !== elements.length) {
    throw new Error('the adapter chose branches for elements the plan does not have (SC-54)')
  }
  return { parts: walked.parts, composed: walked.composed }
}

/** A part a branch composed, as the outcome gives it (`ComposedPart`): the branch applied, its fact's payload. */
interface RuntimeComposedPart {
  readonly branch: string
  readonly fact: unknown
}

/** The parts a branch composed, by the names of its composition, as the outcome gives them. */
type RuntimeComposed = Readonly<
  Record<string, RuntimeComposedPart | readonly RuntimeComposedPart[]>
>

/**
 * The parts a branch composed, by the names of its composition (SC-10,
 * SC-54, `ComposedParts`): from the parts of its fact after its own, in
 * order, and the branch each applied, as written with the fact, so that a
 * retry reads them as the first request did.
 */
const composed_parts = (
  composition: Transitions,
  branches: ComposedBranches,
  parts: readonly PartFields[],
): RuntimeComposed => {
  const part_at = (at: number, branch: string): RuntimeComposedPart => {
    const part = parts[at]
    if (part === undefined)
      throw new Error('a fact holds fewer parts than its branch composed (DOM-10)')
    return { branch, fact: part.payload }
  }
  const walked = Object.entries(composition).reduce<{
    readonly at: number
    readonly composed: RuntimeComposed
  }>(
    (walked, [name, transition]) => {
      const stored = branches[name]
      if (stored === undefined) throw new Error(`a fact names no branch of ${name} (DOM-10)`)
      if ($Each in transition) {
        if (typeof stored === 'string')
          throw new Error(`a fact names one branch of the list ${name}`)
        return {
          at: walked.at + stored.length,
          composed: {
            ...walked.composed,
            [name]: stored.map((branch, i) => part_at(walked.at + i, branch)),
          },
        }
      }
      if (typeof stored !== 'string') throw new Error(`a fact names a list for ${name}`)
      return {
        at: walked.at + 1,
        composed: { ...walked.composed, [name]: part_at(walked.at, stored) },
      }
    },
    { at: 1, composed: {} },
  )
  if (walked.at !== parts.length) {
    throw new Error('a fact holds parts its branch did not compose (DOM-10)')
  }
  return walked.composed
}

/** A part as an outcome gives it: its version, which never leaves the node (PER-18), left out. */
const read_fields = (part: StoredPart): PartFields => ({
  path: part.path,
  payload: part.payload,
  resources: part.resources,
})

/** The values of a plan's leaves cut by condition: the path's, its own, each single transition's, each element's branches'. */
const segments_of = <write>(
  path: readonly Bound[],
  plan: Plan<write>,
  values: readonly boolean[],
): readonly (readonly boolean[])[] =>
  [
    ...path,
    plan.own.bound,
    ...combined(plan).map((part) => part.bound),
    ...lists_of(plan).flatMap((list) =>
      list.elements.flatMap((branches) => branches.map((part) => part.bound)),
    ),
  ].reduce<{ readonly at: number; readonly segments: readonly (readonly boolean[])[] }>(
    (walked, bound) => {
      const size = leaves_of(bound).length
      return {
        at: walked.at + size,
        segments: [...walked.segments, values.slice(walked.at, walked.at + size)],
      }
    },
    { at: 0, segments: [] },
  ).segments

/**
 * The failures of a transition a branch composes (SC-10, SC-54): none when
 * one of its branches holds, as an OR's components; when none does, every
 * branch's, under the transition's name and the branch's, then the
 * components of the leaf where it stands (DOM-6).
 */
const transition_failures = (
  branch: string,
  transition: string,
  judged: readonly {
    readonly part: { readonly name: string; readonly bound: Bound }
    readonly values: readonly boolean[]
  }[],
): readonly RuntimeFailure[] =>
  judged.some(({ part, values }) => holds_on(part.bound, values))
    ? []
    : judged.flatMap(({ part, values }) =>
        failures_of(part.bound, values).map((leaf) => ({
          branch,
          components: [transition, part.name, ...leaf.components],
          predicate: leaf.path,
        })),
      )

/** Failures once each: two elements of a list fail where their names stand alike (SC-54). */
const once_each = (failures: readonly RuntimeFailure[]): readonly RuntimeFailure[] =>
  failures.filter(
    (failure, i) =>
      failures.findIndex((other) => JSON.stringify(other) === JSON.stringify(failure)) === i,
  )

/** What an invocation of a port parses, or why it does not (DOM-21). */
type Parsed =
  | { readonly parsed: 'invalid' }
  | {
      readonly parsed: 'valid'
      readonly context: Readonly<Record<string, unknown>>
      readonly input: unknown
      readonly path: readonly Bound[]
    }

/**
 * The ports of a set of command use cases over a state adapter for their
 * commands, with the registry where the library finds the paths of their
 * predicates, facts, effects and identities (another domain's identities
 * too, which a fact may hold: the configurator gives that domain's
 * registry), and the versions of the store, which read the fact that the
 * duplicate branch gives back. Curried, so that the use cases fix the types
 * before the adapter is written. The command ports stay inside the library.
 *
 * Its type is the use cases', which the compiler cannot follow into a body
 * over every use case: the body is typed by what it meets at runtime, every
 * value parsed by its schema, and the declaration above it is the type its
 * callers see, as `earlier`'s overloads (DOM-25).
 */
export function command_use_case_ports<const use_cases extends CommandUseCases>(ports: {
  readonly registry: Registry
  readonly versions: Versions
  readonly use_cases: use_cases
}): <fragment, write, read, selection, source, field>(
  adapter: StateAdapter<CommandsOf<use_cases>, fragment, write, read, selection, source, field>,
) => { readonly [name in keyof use_cases]: CommandUseCasePort<use_cases[name]> }
export function command_use_case_ports(ports: RuntimePorts): unknown {
  return runtime_ports(ports)
}

/** What the ports are built from, at runtime. */
interface RuntimePorts {
  readonly registry: Registry
  readonly versions: Versions
  readonly use_cases: CommandUseCases
}

/** The body of `command_use_case_ports`, typed by what it meets at runtime. */
const runtime_ports = (
  ports: RuntimePorts,
): (<fragment, write>(
  adapter: RuntimeAdapter<fragment, write>,
) => Readonly<Record<string, RuntimePort>>) => {
  const path_of = paths_in(ports.registry)
  const binding = bind(path_of)
  const version_of = version_at(versions_in(ports.registry))
  const identity = (schema: unknown): string | undefined => {
    if (kind_of(schema)?.kind !== 'id') return undefined
    const path = path_of(schema)
    if (path === undefined) {
      throw new Error(
        'a fact holds an identity that no registry given names: give the registry of its domain (DOM-10)',
      )
    }
    return path
  }
  const resources = resources_of(identity)
  const read_part = (stored: StoredPart): PartFields => ports.versions[$Versions].part(stored)
  const named = (component: unknown): string => {
    const path = path_of(component)
    if (path === undefined)
      throw new Error('a branch names a component no registry given names (DOM-24)')
    return path
  }
  const nodes_of = nodes_above(ports.registry)
  // At wiring (CFG-2): the facts the ports record, and read back, are of
  // domains whose majors the store's versions were given (DOM-22). A step's
  // facts with the steps (part 7.4).
  const unread = Object.values(ports.use_cases)
    .flatMap((use_case) => {
      const command = command_parts(use_case[$UseCase].command)
      return command === undefined ? [] : facts_recorded(command)
    })
    .flatMap((fact) => {
      const path = path_of(fact)
      return path === undefined || ports.versions[$Versions].reads(path) ? [] : [path]
    })
  if (unread.length > 0) {
    throw new Error(
      `the use cases record ${[...new Set(unread)].join(', ')}, of no domain whose majors the versions were given (DOM-22, CFG-2)`,
    )
  }

  return <fragment, write>(adapter: RuntimeAdapter<fragment, write>) => {
    const fragment_of = (leaf: BoundLeaf): fragment => {
      const fragment = adapter.algebra.predicate[leaf.path]
      if (fragment === undefined)
        throw new Error(`the adapter gives no fragment of ${leaf.path} (ADP-8)`)
      return fragment(leaf.parameters)
    }
    const folded = fold<fragment>({
      leaf: fragment_of,
      and: adapter.algebra.and,
      or: adapter.algebra.or,
      not: adapter.algebra.not,
    })

    /**
     * The input parsed (DOM-21): the target each node of the path binds,
     * from the flat input, by its schema, given down in the context, never
     * rewritten (D105.2); each node's requirement bound by its creator; the
     * rest, the command's input, by its schema, built over the context
     * where it is a function of it.
     */
    const parse = (
      command: RuntimeCommand,
      path: readonly PathNode[],
      context: CommandRootContext,
      input: unknown,
    ): Parsed => {
      const seen: Readonly<Record<string, unknown>> = Object.fromEntries(
        Object.entries(context).filter(([key]) => key !== 'correlation' && key !== 'fingerprint'),
      )
      const bound_keys = path.flatMap((node) => Object.keys(node.binds?.shape ?? {}))
      if (bound_keys.length > 0 && !is_a_record(input)) return { parsed: 'invalid' }
      const walked = path.reduce<
        | { readonly context: Readonly<Record<string, unknown>>; readonly path: readonly Bound[] }
        | undefined
      >(
        (above, node) => {
          if (above === undefined) return undefined
          const taken = bound_by(node, input)
          if (taken === undefined) return undefined
          const requirement =
            node.requires === undefined
              ? []
              : [binding(node.requires, called(called(node.creator, above.context), taken))]
          return {
            context: { ...above.context, ...taken },
            path: [...above.path, ...requirement],
          }
        },
        { context: seen, path: [] },
      )
      if (walked === undefined) return { parsed: 'invalid' }
      const own = is_a_record(input)
        ? Object.fromEntries(Object.entries(input).filter(([key]) => !bound_keys.includes(key)))
        : input
      const schema = is_a_schema(command.input)
        ? command.input
        : called(command.input, walked.context)
      if (!is_a_schema(schema)) throw new Error("a command's input is not a schema (DOM-21)")
      const parsed = schema.safeParse(own)
      return parsed.success
        ? { parsed: 'valid', context: walked.context, input: parsed.data, path: walked.path }
        : { parsed: 'invalid' }
    }

    /** A branch's part planned (DOM-10, DOM-13): its condition bound, its fact in its part, its write, its entries. */
    const planned_part = (
      name: string,
      declared: Outcome,
      resolved: unknown,
    ): PlannedPart<write> => {
      if (!Array.isArray(resolved)) throw new Error(`the creator resolves no branch ${name}`)
      const [condition, fact, entries] = declared
      const bound = binding(condition, resolved[0])
      const fact_path = named(fact)
      const payload: unknown = fact.parse(resolved[1])
      const part_resources: readonly Resource[] = resources(fact, payload)
      const write = adapter.write[fact_path]
      if (write === undefined) throw new Error(`the adapter gives no write of ${fact_path} (ADP-8)`)
      const queued: unknown = resolved[2] ?? {}
      const entry_of = ([entry_name, effect]: readonly [string, z.ZodType]): Omit<
        StoredEntry,
        'correlation'
      > => {
        const entry = resolved_entry.parse(is_a_record(queued) ? queued[entry_name] : undefined)
        const effect_path = named(effect)
        return {
          effect: effect_path,
          id: entry.id,
          version: version_of(effect_path),
          payload: effect.parse(entry.payload),
          ...(entry.not_before === undefined ? {} : { not_before: entry.not_before }),
          resources: part_resources,
        }
      }
      return {
        name,
        bound,
        part: {
          path: fact_path,
          payload,
          resources: part_resources,
          version: version_of(fact_path),
        },
        write: write(payload),
        entries: Object.entries(entries ?? {}).map(entry_of),
      }
    }

    /**
     * A transition a branch composes, planned on the input its creator gives
     * it (SC-10, D111): a command of the use case's domain with no use case
     * of its own, its input parsed by its schema, built over the context of
     * the use case's point (DOM-21), its creator resolving its branches,
     * each planned as a part; none when its input is not in its schema. It
     * composes nothing in turn (LIB-3); one below a node the use case's path
     * does not cross comes with its case (DOM-5).
     */
    const planned_transition =
      (context: Readonly<Record<string, unknown>>, above: readonly string[]) =>
      (
        name: string,
        transition: Commands[string],
        input: unknown,
      ): readonly PlannedPart<write>[] | undefined => {
        const command = command_parts(transition)
        const path = path_of(transition)
        if (command === undefined || path === undefined) {
          throw new Error(`${name} composes no command of the registry given (DOM-19)`)
        }
        if (nodes_of(path).some((node) => !above.includes(node.path))) {
          throw new Error(
            `${path} is below a node the use case's path does not cross: a transition composed below a node comes with its case (DOM-5)`,
          )
        }
        if (
          Object.values(command.outcomes).some(([, , , composition]) => composition !== undefined)
        ) {
          throw new Error(
            `${path} composes in turn: a composed transition composes nothing (DOM-19)`,
          )
        }
        const schema = is_a_schema(command.input) ? command.input : called(command.input, context)
        if (!is_a_schema(schema)) throw new Error(`${path}: its input is not a schema (DOM-21)`)
        const parsed = schema.safeParse(input)
        if (!parsed.success) return undefined
        const resolved = called(called(command.creator, context), parsed.data)
        if (!is_a_record(resolved)) throw new Error(`${path}: the creator resolves no branches`)
        return Object.entries(command.outcomes).map(([branch, declared]) =>
          planned_part(branch, declared, resolved[branch]),
        )
      }

    /**
     * What a branch composes, planned (SC-10, SC-54): each transition on the
     * input the creator gives it under its name, a list's on each element's,
     * in the order of the list; none when an input is not in its
     * transition's schema.
     */
    const planned_compositions =
      (context: Readonly<Record<string, unknown>>, above: readonly string[]) =>
      (
        name: string,
        composition: Composition<Transitions> | undefined,
        inputs: unknown,
      ): readonly PlannedComposition<write>[] | undefined => {
        if (composition === undefined) return []
        const transitioned = planned_transition(context, above)
        const planned = Object.entries(composition[$Composition]).map(
          ([key, composed]): PlannedComposition<write> | undefined => {
            const input = is_a_record(inputs) ? inputs[key] : undefined
            if ($Each in composed) {
              if (!Array.isArray(input)) {
                throw new Error(`${name}: the creator gives ${key} no list of inputs (SC-54)`)
              }
              const elements = input.map((element: unknown) =>
                transitioned(key, composed[$Each], element),
              )
              return elements.every((element) => element !== undefined)
                ? { composes: 'each', name: key, elements }
                : undefined
            }
            const branches = transitioned(key, composed, input)
            return branches === undefined ? undefined : { composes: 'one', name: key, branches }
          },
        )
        return planned.every((each) => each !== undefined) ? planned : undefined
      }

    /** What a plan writes for a choice (DOM-8, DOM-10): its parts' writes in order, its fact in its envelope, its entries. */
    const written =
      (context: CommandRootContext, name: string) =>
      (chosen: Chosen<write>): PlannedWrite<write> => ({
        writes: chosen.parts.map((part) => part.write),
        fact: {
          parts: chosen.parts.map((part) => part.part),
          operation: context.operation,
          correlation: context.correlation,
          branch: name,
          composed: chosen.composed,
          fingerprint: context.fingerprint,
        },
        entries: chosen.parts.flatMap((part) =>
          part.entries.map((entry) => ({ ...entry, correlation: context.correlation })),
        ),
      })

    /**
     * A branch planned, as the adapter meets it: its condition after the
     * path's; if it composes, once per combination of its single
     * transitions' branches, each one's condition after its own (SC-10), so
     * that the adapter meets plain branches; if it composes on a list, each
     * element's branches apart, for the adapter to choose, and what it writes
     * a function of the choice (`applies`, SC-54). None when an input it
     * composes is not in its schema.
     */
    const planned_branches =
      (
        context: CommandRootContext,
        parsed: {
          readonly context: Readonly<Record<string, unknown>>
          readonly path: readonly Bound[]
        },
        above: readonly string[],
      ) =>
      (
        name: string,
        declared: Outcome,
        resolved: unknown,
      ): readonly Planned<fragment, write>[] | undefined => {
        if (!Array.isArray(resolved)) throw new Error(`the creator resolves no branch ${name}`)
        const own = planned_part(name, declared, resolved)
        const [, , , composition] = declared
        const compositions = planned_compositions(parsed.context, above)(
          name,
          composition,
          resolved[3],
        )
        if (compositions === undefined) return undefined
        const sizes = compositions.flatMap((each) =>
          each.composes === 'one' ? [each.branches.length] : [],
        )
        return combinations(sizes).map((combination): Planned<fragment, write> => {
          const plan: Plan<write> = { own, compositions, combination }
          const conditions = [
            ...parsed.path,
            own.bound,
            ...combined(plan).map((part) => part.bound),
          ]
          const condition =
            conditions.length === 1
              ? folded(own.bound)
              : adapter.algebra.and(conditions.map(folded))
          const leaves = conditions.flatMap(leaves_of).map(fragment_of)
          const writes = (elements: readonly number[]): PlannedWrite<write> =>
            written(context, name)(chosen_parts(plan, elements))
          const lists = lists_of(plan)
          return {
            ...plan,
            name,
            branch:
              lists.length === 0
                ? { condition, leaves, ...writes([]) }
                : {
                    condition,
                    leaves,
                    elements: lists.flatMap((list) =>
                      list.elements.map((branches) =>
                        branches.map((part) => ({
                          condition: folded(part.bound),
                          leaves: leaves_of(part.bound).map(fragment_of),
                        })),
                      ),
                    ),
                    applies: writes,
                  },
          }
        })
      }

    /**
     * The failed predicates of a rejection (DOM-6): the path's once, with no
     * branch (D105.4); then each branch's, once whatever its plans: its own
     * condition's, then each transition's it composes on which no branch
     * holds, every branch's, under the transition's name and the branch's
     * (SC-10); on a list, each element's on which none holds, under the
     * transition's name, once each (SC-54: the element itself comes with
     * its case, D113.1).
     */
    const failures = (
      path: readonly Bound[],
      planned: readonly Planned<fragment, write>[],
      leaves: readonly (readonly boolean[])[],
    ): readonly RuntimeFailure[] => {
      const cut = planned.map((plan, i) => ({
        plan,
        segments: segments_of(path, plan, leaves[i] ?? []),
      }))
      const in_the_path = path.flatMap((bound, i) =>
        failures_of(bound, cut[0]?.segments[i] ?? []).map((leaf) => ({
          components: leaf.components,
          predicate: leaf.path,
        })),
      )
      const names = planned
        .map((plan) => plan.name)
        .filter((name, i, all) => all.indexOf(name) === i)
      const of_the_branches = names.flatMap((name): readonly RuntimeFailure[] => {
        const copies = cut.filter((copy) => copy.plan.name === name)
        const first = copies[0]
        if (first === undefined) return []
        const own_at = path.length
        const own = failures_of(first.plan.own.bound, first.segments[own_at] ?? []).map((leaf) => ({
          branch: name,
          components: leaf.components,
          predicate: leaf.path,
        }))
        const singles = singles_of(first.plan)
        const of_the_transitions = singles.flatMap((composition, s) =>
          transition_failures(
            name,
            composition.name,
            composition.branches.map((part, j) => ({
              part,
              values:
                copies.find((copy) => copy.plan.combination[s] === j)?.segments[own_at + 1 + s] ??
                [],
            })),
          ),
        )
        const of_the_elements = lists_of(first.plan)
          .flatMap((list) => list.elements.map((branches) => ({ name: list.name, branches })))
          .reduce<{ readonly at: number; readonly failed: readonly RuntimeFailure[] }>(
            (walked, element) => ({
              at: walked.at + element.branches.length,
              failed: [
                ...walked.failed,
                ...transition_failures(
                  name,
                  element.name,
                  element.branches.map((part, j) => ({
                    part,
                    values: first.segments[walked.at + j] ?? [],
                  })),
                ),
              ],
            }),
            { at: own_at + 1 + singles.length, failed: [] },
          ).failed
        return [...own, ...of_the_transitions, ...once_each(of_the_elements)]
      })
      return [...in_the_path, ...of_the_branches]
    }

    /** An applied outcome (DOM-7): its branch, its position, its fact, and, if the branch composes, the parts it composed by name. */
    const applied = (
      command: RuntimeCommand,
      branch: string,
      position: string,
      fact: Envelope<readonly PartFields[]>,
      composed: ComposedBranches,
    ): RuntimeOutcome => {
      const declared = command.outcomes[branch]
      const composition = declared?.[3]
      return {
        outcome: 'applied',
        branch,
        position,
        fact,
        ...(composition === undefined
          ? {}
          : { composed: composed_parts(composition[$Composition], composed, fact.parts) }),
      }
    }

    /** The outcome of an execution (DOM-7, DOM-11). */
    const outcome_of = (
      context: CommandRootContext,
      command: RuntimeCommand,
      path: readonly Bound[],
      planned: readonly Planned<fragment, write>[],
      execution: Execution,
    ): RuntimeOutcome => {
      switch (execution.outcome) {
        case 'recorded':
          return execution.fact.fingerprint === context.fingerprint
            ? applied(
                command,
                execution.fact.branch,
                execution.position,
                {
                  parts: execution.fact.parts.map(read_part),
                  operation: execution.fact.operation,
                  correlation: execution.fact.correlation,
                },
                execution.fact.composed,
              )
            : { outcome: 'identity_already_used' }
        case 'applied': {
          const plan = planned[execution.branch]
          if (plan === undefined) throw new Error('the adapter applied no planned branch')
          const chosen = chosen_parts(plan, execution.elements)
          return applied(
            command,
            plan.name,
            execution.position,
            {
              parts: chosen.parts.map((part) => read_fields(part.part)),
              operation: context.operation,
              correlation: context.correlation,
            },
            chosen.composed,
          )
        }
        case 'rejected':
          return { outcome: 'rejected', failures: failures(path, planned, execution.leaves) }
      }
    }

    const port = (use_case: string, command: RuntimeCommand): RuntimePort =>
      async function* (context, input) {
        const nodes = nodes_of(use_case)
        const parsed = parse(command, nodes, context, input)
        if (parsed.parsed === 'invalid') {
          yield { outcome: 'invalid_request' }
          return
        }
        const resolved = called(called(command.creator, parsed.context), parsed.input)
        if (!is_a_record(resolved)) throw new Error(`${use_case}: the creator resolves no branches`)
        const above = nodes.map((node) => node.path)
        const by_branch = Object.entries(command.outcomes).map(([name, declared]) =>
          planned_branches(context, parsed, above)(name, declared, resolved[name]),
        )
        if (!by_branch.every((plans) => plans !== undefined)) {
          yield { outcome: 'invalid_request' }
          return
        }
        const planned = by_branch.flat()
        const execution = await adapter.execute({
          operation: context.operation,
          branches: planned.map((each) => each.branch),
        })
        yield outcome_of(context, command, parsed.path, planned, execution)
      }

    return Object.fromEntries(
      Object.entries(ports.use_cases).map(([name, use_case]): readonly [string, RuntimePort] => {
        const path = path_of(use_case)
        if (path === undefined) {
          throw new Error(`the use case ${name} is not in the registry given (DOM-24)`)
        }
        const command = command_parts(use_case[$UseCase].command)
        return [
          name,
          serving(
            command === undefined
              ? (): AsyncIterable<RuntimeOutcome> => {
                  // Part 7.4: the plan of a step (DOM-20).
                  throw new Error(`${path} runs a step (DOM-20): planned from part 7.4`)
                }
              : port(path, command),
            { component: use_case, path },
          ),
        ]
      }),
    )
  }
}
