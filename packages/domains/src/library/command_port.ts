import * as z from 'zod'
import { date_time, type Semver } from './format.ts'
import type { CommandRootContext } from './context.ts'
import type { Envelope, PartFields, Resource, StoredEnvelope, StoredPart } from './envelope.ts'
import { $Command, $Composition, entry_id, type Commands, type Outcome } from './command.ts'
import { $Step } from './step.ts'
import { $Node } from './node.ts'
import { $UseCase, type CommandUseCases, type CommandsOf } from './use_case.ts'
import { $Version } from './version.ts'
import { $Versions, type Registry, type Versions } from './registry.ts'
import type { CommandUseCasePort } from './use_case_port.ts'
import type {
  Execution,
  PlannedBranch,
  PlannedCommand,
  StateAdapter,
  StoredEntry,
} from './state_adapter.ts'
import { is_a_schema, kind_of } from './kind.ts'
import {
  bind,
  failures_of,
  fold,
  leaves_of,
  type Bound,
  type BoundLeaf,
  type FailedLeaf,
} from './bound_condition.ts'
import { resources_of } from './resources.ts'

// The ports of the command use cases (DOM-2, LIB-1, LIB-14), which the
// library builds over a state adapter: for each invocation, the input parsed
// by its schema, built over the context (DOM-21); the creator resolved into a
// plan, the branches in their order, each condition as data folded into the
// adapter's fragments, with the conditions of the nodes of the use case's
// path before every branch's (D105, SC-31), each fact in its envelope with
// its resources and its domain's version (DOM-10), its outbox entries
// (DOM-13); the adapter's step (`Execute`); the outcome (DOM-7): the branch
// with its fact, the rejection naming every failed predicate, or, from the
// duplicate branch, the fact recorded or the identity already used (DOM-11).
// The command ports stay inside the library.

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
    }
  | { readonly outcome: 'rejected'; readonly failures: readonly RuntimeFailure[] }
  | { readonly outcome: 'identity_already_used' }
  | { readonly outcome: 'invalid_request' }

/** A command use case's port at runtime: one message in, its outcome out (DOM-3). */
type RuntimePort = (context: CommandRootContext, input: unknown) => AsyncIterable<RuntimeOutcome>

/** Whether a value is a record, to read its fields. */
const is_a_record = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** A function of the domain called with its one argument (a creator, a schema of the context): its result, unknown until parsed. */
const called = (callee: unknown, argument: unknown): unknown => {
  if (typeof callee !== 'function') throw new Error('a creator is not a function')
  const result: unknown = Reflect.apply(callee, undefined, [argument])
  return result
}

/** The folder of a component's path: its segments before the kind and the name. */
const folder_of = (path: string): string => path.split('/').slice(0, -2).join('/')

/** Whether a folder is the other or holds it. */
const is_at_or_above = (folder: string, below: string): boolean =>
  below === folder || below.startsWith(`${folder}/`)

/** The registry read in reverse: a component's path, by object identity (DOM-24). */
const paths_in = (registry: Registry): ((component: unknown) => string | undefined) => {
  const paths = new Map<unknown, string>(
    Object.entries(registry).map(([path, entry]) => [entry, path]),
  )
  return (component) => paths.get(component)
}

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
interface PathNode {
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
const nodes_above =
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
const bound_by = (
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
interface RuntimeCommand {
  readonly creator: unknown
  readonly input: unknown
  readonly outcomes: Readonly<Record<string, Outcome>>
}

/** A command's parts, or none for a step (DOM-20), whose port comes with its plan. */
const command_parts = (command: Commands[string]): RuntimeCommand | undefined => {
  if ($Step in command) return undefined
  const outcomes = command[$Command].outcomes
  if (outcomes === undefined) return undefined
  return { creator: command, input: 'input' in command ? command.input : undefined, outcomes }
}

/** A branch's entry as the creator resolves it (DOM-13): its id, its payload, when it may go. */
const resolved_entry = z.strictObject({
  id: entry_id,
  payload: z.unknown(),
  not_before: date_time.optional(),
})

/** A branch as planned, with what the outcome reads back: its name, its condition, its fact as parsed. */
interface Planned<fragment, write> {
  readonly name: string
  readonly bound: Bound
  readonly branch: PlannedBranch<fragment, write>
  readonly parts: readonly PartFields[]
}

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

    /** A branch planned: its condition after the path's, its fact in its envelope, its entries, its write. */
    const planned_branch =
      (context: CommandRootContext, path: readonly Bound[]) =>
      (name: string, declared: Outcome, resolved: unknown): Planned<fragment, write> => {
        if (!Array.isArray(resolved)) throw new Error(`the creator resolves no branch ${name}`)
        const [condition, fact, entries, composition] = declared
        if (composition !== undefined && Object.keys(composition[$Composition]).length > 0) {
          // Part 4.3: the transitions a branch composes outside a step (SC-10, SC-54).
          throw new Error(`${name} composes transitions (SC-10): planned from part 4.3`)
        }
        const bound = binding(condition, resolved[0])
        const fact_path = named(fact)
        const payload: unknown = fact.parse(resolved[1])
        const part_resources: readonly Resource[] = resources(fact, payload)
        const version = version_of(fact_path)
        const write = adapter.write[fact_path]
        if (write === undefined)
          throw new Error(`the adapter gives no write of ${fact_path} (ADP-8)`)
        const queued: unknown = resolved[2] ?? {}
        const entry_of = ([entry_name, effect]: readonly [string, z.ZodType]): StoredEntry => {
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
        const stored: StoredEnvelope = {
          parts: [{ path: fact_path, payload, resources: part_resources, version }],
          operation: context.operation,
          correlation: context.correlation,
          branch: name,
          fingerprint: context.fingerprint,
        }
        const conditions = [...path, bound]
        return {
          name,
          bound,
          branch: {
            condition:
              conditions.length === 1 ? folded(bound) : adapter.algebra.and(conditions.map(folded)),
            leaves: conditions.flatMap(leaves_of).map(fragment_of),
            writes: [write(payload)],
            fact: stored,
            entries: Object.entries(entries ?? {}).map(entry_of),
          },
          parts: [{ path: fact_path, payload, resources: part_resources }],
        }
      }

    /** The failed predicates of a rejection: the path's once, with no branch (D105.4), then each branch's. */
    const failures = (
      path: readonly Bound[],
      planned: readonly Planned<fragment, write>[],
      leaves: readonly (readonly boolean[])[],
    ): readonly RuntimeFailure[] => {
      const in_the_path = path.reduce<{
        readonly at: number
        readonly failed: readonly FailedLeaf[]
      }>(
        (walked, bound) => {
          const size = leaves_of(bound).length
          return {
            at: walked.at + size,
            failed: [
              ...walked.failed,
              ...failures_of(bound, (leaves[0] ?? []).slice(walked.at, walked.at + size)),
            ],
          }
        },
        { at: 0, failed: [] },
      )
      return [
        ...in_the_path.failed.map((leaf) => ({
          components: leaf.components,
          predicate: leaf.path,
        })),
        ...planned.flatMap((branch, i) =>
          failures_of(branch.bound, (leaves[i] ?? []).slice(in_the_path.at)).map((leaf) => ({
            branch: branch.name,
            components: leaf.components,
            predicate: leaf.path,
          })),
        ),
      ]
    }

    /** The outcome of an execution (DOM-7, DOM-11). */
    const outcome_of = (
      context: CommandRootContext,
      path: readonly Bound[],
      planned: readonly Planned<fragment, write>[],
      execution: Execution,
    ): RuntimeOutcome => {
      switch (execution.outcome) {
        case 'recorded':
          return execution.fact.fingerprint === context.fingerprint
            ? {
                outcome: 'applied',
                branch: execution.fact.branch,
                position: execution.position,
                fact: {
                  parts: execution.fact.parts.map(read_part),
                  operation: execution.fact.operation,
                  correlation: execution.fact.correlation,
                },
              }
            : { outcome: 'identity_already_used' }
        case 'applied': {
          const applied = planned[execution.branch]
          if (applied === undefined) throw new Error('the adapter applied no planned branch')
          return {
            outcome: 'applied',
            branch: applied.name,
            position: execution.position,
            fact: {
              parts: applied.parts,
              operation: context.operation,
              correlation: context.correlation,
            },
          }
        }
        case 'rejected':
          return { outcome: 'rejected', failures: failures(path, planned, execution.leaves) }
      }
    }

    const port = (use_case: string, command: RuntimeCommand): RuntimePort =>
      async function* (context, input) {
        const parsed = parse(command, nodes_above(ports.registry)(use_case), context, input)
        if (parsed.parsed === 'invalid') {
          yield { outcome: 'invalid_request' }
          return
        }
        const resolved = called(called(command.creator, parsed.context), parsed.input)
        if (!is_a_record(resolved)) throw new Error(`${use_case}: the creator resolves no branches`)
        const planned = Object.entries(command.outcomes).map(([name, declared]) =>
          planned_branch(context, parsed.path)(name, declared, resolved[name]),
        )
        const execution = await adapter.execute({
          operation: context.operation,
          branches: planned.map((each) => each.branch),
        })
        yield outcome_of(context, parsed.path, planned, execution)
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
          command === undefined
            ? () => {
                // Part 7.4: the plan of a step (DOM-20).
                throw new Error(`${path} runs a step (DOM-20): planned from part 7.4`)
              }
            : port(path, command),
        ]
      }),
    )
  }
}
