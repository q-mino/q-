import * as z from 'zod'
import { $GivenByTheCaller, type Truth } from './applicability.ts'
import { composition_of } from './bound_condition.ts'
import { bound_by, nodes_above, type PathNode } from './command_port.ts'
import { $Command } from './command.ts'
import { $Step } from './step.ts'
import type { Registry } from './registry.ts'
import { $UseCase } from './use_case.ts'
import { is_a_schema } from './kind.ts'
import { called, is_a_record } from './runtime.ts'

// The actions of a read (SC-33, D47.2, D51): for each entry, whether a
// command would apply, by the same pass as the write (D51.1): the nodes of
// its path (`binds`, `requires`), then its command's creator, each branch's
// condition bound as data. A leaf whose parameters hold a field the caller
// gives later (`given_by_the_caller`) is not known (D51.3); the adapter
// evaluates the leaves known, in the snapshot of the read, as one more field
// of the entry (`PlannedLeaves`); the library composes the three values in
// strong Kleene logic (D51.4), which live only here (D51.6).

/** Whether a value is the mark of a field the caller gives later, or holds one, at any depth. */
const holds_a_mark = (value: unknown): boolean =>
  typeof value === 'object' &&
  value !== null &&
  ($GivenByTheCaller in value || Object.values(value).some(holds_a_mark))

/**
 * A condition bound at a read (D51.3): AND and OR with their named
 * components, NOT with its operand, a leaf with its path, where it stands,
 * and its parameters parsed when they hold no mark, else not known.
 */
type Partly =
  | { readonly operator: 'and' | 'or'; readonly components: readonly Partly[] }
  | { readonly operator: 'not'; readonly operand: Partly }
  | {
      readonly operator: 'leaf'
      readonly path: string
      readonly components: readonly string[]
      readonly known: { readonly parameters: unknown } | undefined
    }

/**
 * A condition bound to parameters that may hold marks (D51.3), as `bind`
 * binds one at the write: each leaf's parameters parsed by its own schema,
 * where they hold no mark; one that holds a mark is not known. A leaf's
 * parameters its schema does not parse are the creator's having read a mark
 * (D51.4): thrown, so that the pass leaves every leaf of the command not
 * known.
 */
const bind_partly =
  (path_of: (component: unknown) => string | undefined) =>
  (condition: z.ZodType, parameters: unknown): Partly => {
    const walk = (node: z.ZodType, given: unknown, components: readonly string[]): Partly => {
      const composition = composition_of(node)
      if (composition === undefined) {
        const path = path_of(node)
        if (path === undefined) {
          throw new Error('a condition holds a leaf that no registry given names (DOM-24)')
        }
        return {
          operator: 'leaf',
          path,
          components,
          known: holds_a_mark(given) ? undefined : { parameters: node.parse(given) },
        }
      }
      if (composition.operator === 'not') {
        return { operator: 'not', operand: walk(composition.operand, given, components) }
      }
      return {
        operator: composition.operator,
        components: composition.components.map(([name, component]) =>
          walk(component, is_a_record(given) ? given[name] : undefined, [...components, name]),
        ),
      }
    }
    return walk(condition, parameters, [])
  }

/** The leaves of a condition bound at a read, in order, with whether each stands under NOT. */
const leaves_in = (
  partly: Partly,
  negated = false,
): readonly (Extract<Partly, { operator: 'leaf' }> & { readonly negated: boolean })[] => {
  switch (partly.operator) {
    case 'leaf':
      return [{ ...partly, negated }]
    case 'not':
      return leaves_in(partly.operand, !negated)
    case 'and':
    case 'or':
      return partly.components.flatMap((component) => leaves_in(component, negated))
  }
}

/** Strong Kleene logic (D51.4): NOT. */
const not = (truth: Truth): Truth => (truth === 'not_known' ? truth : !truth)

/** Strong Kleene logic (D51.4): AND, false if one is, else not known if one is. */
export const and = (truths: readonly Truth[]): Truth =>
  truths.includes(false) ? false : truths.includes('not_known') ? 'not_known' : true

/** Strong Kleene logic (D51.4): OR, true if one is, else not known if one is. */
const or = (truths: readonly Truth[]): Truth =>
  truths.includes(true) ? true : truths.includes('not_known') ? 'not_known' : false

/** A condition's value at a read, its leaves' values given in order. */
const value_of = (partly: Partly, truths: Iterator<Truth>): Truth => {
  switch (partly.operator) {
    case 'leaf': {
      const next = truths.next()
      return next.done === true ? 'not_known' : next.value
    }
    case 'not':
      return not(value_of(partly.operand, truths))
    case 'and':
      return and(partly.components.map((component) => value_of(component, truths)))
    case 'or':
      return or(partly.components.map((component) => value_of(component, truths)))
  }
}

/**
 * The pass of an action on an entry (D51.1): the conditions of the nodes of
 * its path, outer first, then each branch's own, by name; or, where the
 * pass met a mark it could not carry (a creator that read it, a target the
 * caller gives), none: every leaf not known (D51.4, prudent).
 */
type Pass =
  | {
      readonly known: true
      readonly path: readonly Partly[]
      readonly branches: readonly (readonly [string, Partly])[]
    }
  | { readonly known: false }

/** A command at runtime, as an action meets it: its creator, its input as declared, each branch's condition. */
interface ActionCommand {
  readonly creator: unknown
  readonly input: unknown
  readonly branches: readonly (readonly [string, z.ZodType])[]
}

/** An action of a read at runtime: its command use case's path, its command, the nodes above it, its input. */
export interface RuntimeAction {
  readonly name: string
  readonly path: string
  readonly command: ActionCommand
  readonly nodes: readonly PathNode[]
  readonly input: unknown
}

/**
 * The command a use case sends, as an action reads it: none for a step
 * (DOM-20), nor for a command whose branches compose (DOM-19), which come
 * with their cases (LIB-3).
 */
const action_command = (use_case: unknown): ActionCommand | undefined => {
  const own: unknown =
    typeof use_case === 'object' && use_case !== null ? Reflect.get(use_case, $UseCase) : undefined
  const command: unknown = is_a_record(own) ? own['command'] : undefined
  if (typeof command !== 'function' || $Step in command) return undefined
  const parts: unknown = Reflect.get(command, $Command)
  const outcomes = is_a_record(parts) ? parts['outcomes'] : undefined
  if (!is_a_record(outcomes)) return undefined
  const branches = Object.entries(outcomes).flatMap(
    ([name, outcome]): readonly (readonly [string, z.ZodType])[] => {
      if (!Array.isArray(outcome) || outcome[3] !== undefined) return []
      const condition: unknown = outcome[0]
      return is_a_schema(condition) ? [[name, condition]] : []
    },
  )
  return branches.length === Object.keys(outcomes).length
    ? { creator: command, input: Reflect.get(command, 'input'), branches }
    : undefined
}

/**
 * The actions given to a read use case's port (SC-33), read at its
 * `with_actions`: each a command use case of the registry given and its
 * input, a function of the context and an entry. One that is no command use
 * case of the registry, or whose command composes or is a step (with their
 * cases, LIB-3), is a fault of whoever gives it, thrown.
 */
export const actions_of =
  (registry: Registry, path_of: (component: unknown) => string | undefined) =>
  (actions: unknown, at: string): readonly RuntimeAction[] => {
    if (!is_a_record(actions)) throw new Error(`${at}: its actions are no record (SC-33)`)
    return Object.entries(actions).map(([name, action]): RuntimeAction => {
      const use_case = is_a_record(action) ? action['use_case'] : undefined
      const path = path_of(use_case)
      const parts = action_command(use_case)
      if (path === undefined || parts === undefined) {
        throw new Error(
          `${at}: the action ${name} is no command use case of its domain, or runs a step or composes, which come with their cases (SC-33, LIB-3)`,
        )
      }
      return {
        name,
        path,
        command: parts,
        nodes: nodes_above(registry)(path),
        input: is_a_record(action) ? action['input'] : undefined,
      }
    })
  }

/**
 * The pass of an action on an entry (D51.1), as the command port's at the
 * write: the action's input from the context and the entry, flat; each
 * node's target from it (D105.2), its requirement bound by its creator; the
 * command's input, its fields the caller gives left to them, the rest
 * parsed by its schema; its creator, each branch's condition bound. The
 * context has no operation, which the caller mints later (DOM-12). A pass
 * whose input holds a mark and that fails on the way is a creator that read
 * the mark (D51.4): every leaf not known; one with no mark that fails is a
 * fault, thrown.
 */
const pass_of =
  (path_of: (component: unknown) => string | undefined) =>
  (action: RuntimeAction, given: object, entry: unknown): Pass => {
    const context: Readonly<Record<string, unknown>> = { ...given }
    const input: unknown = called(called(action.input, context), entry)
    const marked = holds_a_mark(input)
    try {
      const flat = is_a_record(input) ? input : {}
      const marks = Object.keys(flat).filter((key) => holds_a_mark(flat[key]))
      const walked = action.nodes.reduce<{
        readonly context: Readonly<Record<string, unknown>>
        readonly path: readonly Partly[]
        readonly bound: readonly string[]
      }>(
        (above, node) => {
          const keys = Object.keys(node.binds?.shape ?? {})
          if (keys.some((key) => marks.includes(key))) {
            throw new Error(`${node.path}: its target is given by the caller (D51.3)`)
          }
          const taken = bound_by(node, flat)
          if (taken === undefined) throw new Error(`${node.path}: the entry binds no target`)
          return {
            context: { ...above.context, ...taken },
            path:
              node.requires === undefined
                ? above.path
                : [
                    ...above.path,
                    bind_partly(path_of)(
                      node.requires,
                      called(called(node.creator, above.context), taken),
                    ),
                  ],
            bound: [...above.bound, ...keys],
          }
        },
        { context, path: [], bound: [] },
      )
      const own = Object.fromEntries(
        Object.entries(flat).filter(([key]) => !walked.bound.includes(key)),
      )
      const declared = action.command.input
      const schema: unknown = is_a_schema(declared) ? declared : called(declared, walked.context)
      const known_fields = Object.fromEntries(
        Object.entries(own).filter(([key]) => !marks.includes(key)),
      )
      const without_marks =
        marks.length === 0
          ? schema
          : schema instanceof z.ZodObject
            ? z.strictObject(
                Object.fromEntries(
                  Object.entries(schema.shape).filter(([key]) => !marks.includes(key)),
                ),
              )
            : undefined
      if (!is_a_schema(without_marks)) {
        throw new Error(`${action.path}: a field given by the caller in an input that is no object`)
      }
      const parsed = without_marks.parse(known_fields)
      const resolved: unknown = called(
        called(action.command.creator, walked.context),
        is_a_record(parsed)
          ? { ...parsed, ...Object.fromEntries(marks.map((key) => [key, own[key]])) }
          : parsed,
      )
      if (!is_a_record(resolved))
        throw new Error(`${action.path}: the creator resolves no branches`)
      return {
        known: true,
        path: walked.path,
        branches: action.command.branches.map(([name, condition]) => {
          const branch = resolved[name]
          if (!Array.isArray(branch)) throw new Error(`the creator resolves no branch ${name}`)
          return [name, bind_partly(path_of)(condition, branch[0])] as const
        }),
      }
    } catch (error) {
      if (marked) return { known: false }
      throw error
    }
  }

/** The applicability of an action, as a business read gives it (D47.2, D51): no limits, which are a leaf's. */
export interface RuntimeApplicability {
  readonly value: Truth
  readonly branch?: string
  readonly leaves: readonly (Readonly<Record<string, unknown>> & { readonly holds: Truth })[]
  readonly limits: Readonly<Record<string, Truth>>
}

/** What the actions of a read give the plan of its query and the entries it reads (SC-33). */
export interface PlannedActions {
  /** The conditions of the leaves known, in order, as the adapter's fragments: for `PlannedLeaves.of`. */
  readonly conditions: (context: object, entry: unknown) => unknown[]
  /** The applicability of each action on an entry, by name, from the values the adapter gave. */
  readonly applicabilities: (
    context: object,
    entry: unknown,
    values: readonly unknown[],
  ) => Readonly<Record<string, RuntimeApplicability>>
}

/**
 * The actions of a read planned over an adapter's fragments (SC-33, ADP-8):
 * for an entry, the leaves known of every action, in order (the path's,
 * then each branch's), each its fragment over its parameters; and, from
 * their values, each action's applicability: every leaf with whether it
 * holds where it stands (a leaf under NOT holds when it is false, as a
 * failure names it, DOM-6), not known where the caller gives it; the value
 * composed, the path's conditions and the branches' in OR, in AND (D105);
 * the branch it would apply when every branch before it is false and it is
 * true (D51.5). The fragments of every leaf an action may meet are checked
 * when the plan is made, at the request; one the adapter does not give is a
 * fault of the adapter, thrown.
 */
export const planned_actions = (
  path_of: (component: unknown) => string | undefined,
  actions: readonly RuntimeAction[],
  fragments: Readonly<Record<string, unknown>>,
): PlannedActions => {
  const pass = pass_of(path_of)
  const passes = (context: object, entry: unknown) =>
    actions.map((action) => ({ action, pass: pass(action, context, entry) }))
  const leaves_of_pass = (each: Pass) =>
    each.known
      ? [...each.path, ...each.branches.map(([, partly]) => partly)].flatMap((partly) =>
          leaves_in(partly),
        )
      : []
  return {
    conditions: (context, entry) =>
      passes(context, entry).flatMap(({ pass: each }) =>
        leaves_of_pass(each).flatMap((leaf) => {
          if (leaf.known === undefined) return []
          const fragment = fragments[leaf.path]
          if (typeof fragment !== 'function') {
            throw new Error(`the adapter gives no fragment of ${leaf.path} for actions (ADP-8)`)
          }
          return [called(fragment, leaf.known.parameters)]
        }),
      ),
    applicabilities: (context, entry, values) => {
      const given = values[Symbol.iterator]()
      return Object.fromEntries(
        passes(context, entry).map(({ action, pass: each }) => {
          if (!each.known) return [action.name, { value: 'not_known', leaves: [], limits: {} }]
          // Each leaf's value: the adapter's, in order, where known.
          const truths = leaves_of_pass(each).map((leaf): Truth => {
            if (leaf.known === undefined) return 'not_known'
            const value = given.next().value
            if (typeof value !== 'boolean') {
              throw new Error(`the adapter gives no value of ${leaf.path} for actions (ADP-8)`)
            }
            return value
          })
          const read = truths[Symbol.iterator]()
          const path = each.path.map((partly) => value_of(partly, read))
          const branches = each.branches.map(
            ([name, partly]) => [name, value_of(partly, read)] as const,
          )
          const value = and([...path, or(branches.map(([, truth]) => truth))])
          const first = branches.findIndex(([, truth]) => truth !== false)
          const found = branches[first]
          const branch = found?.[1] === true ? found[0] : undefined
          const at = each.path.length
          const located = [
            ...each.path.map((partly) => ({ branch: undefined, partly })),
            ...each.branches.map(([name, partly]) => ({ branch: name, partly })),
          ].flatMap(({ branch: of, partly }, i) =>
            leaves_in(partly).map((leaf) => ({ of: i < at ? undefined : of, leaf })),
          )
          const leaves = located.map(({ of, leaf }, i) => {
            const truth = truths[i] ?? 'not_known'
            return {
              ...(of === undefined ? {} : { branch: of }),
              components: leaf.components,
              predicate: leaf.path,
              holds: leaf.negated ? not(truth) : truth,
            }
          })
          return [
            action.name,
            { value, ...(branch === undefined ? {} : { branch }), leaves, limits: {} },
          ]
        }),
      )
    },
  }
}
