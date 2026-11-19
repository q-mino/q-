import type * as z from 'zod'
import { $Composed } from './condition.ts'
import { is_a_schema } from './kind.ts'

// A condition bound by a creator, as data (LIB-14, DOM-5): the tree of its
// operators and named components, each leaf with its path and its parsed
// parameters. The library folds it into an adapter's fragments, lists its
// leaves in order, and names the failed ones from their values.

/**
 * A condition bound by a creator: AND and OR with their named components,
 * NOT with its operand, a leaf with its path and its parameters, parsed by
 * its schema. LIB-7
 */
export type Bound =
  | { readonly operator: 'and' | 'or'; readonly components: readonly Named[] }
  | { readonly operator: 'not'; readonly operand: Bound }
  | { readonly operator: 'leaf'; readonly path: string; readonly parameters: unknown }

/** A component of AND or OR, under its business name. */
export interface Named {
  readonly name: string
  readonly condition: Bound
}

/** A leaf of a bound condition, where it stands: its components' names, its path, its parameters. */
export interface BoundLeaf {
  readonly components: readonly string[]
  readonly path: string
  readonly parameters: unknown
}

/** A failed leaf: its components' names and its path (DOM-6). */
export interface FailedLeaf {
  readonly components: readonly string[]
  readonly path: string
}

/** Whether a value is a record, to read its fields. */
const is_a_record = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** How a condition is composed, read at runtime: AND, OR with their named components, NOT with its operand. */
export type Composition =
  | {
      readonly operator: 'and' | 'or'
      readonly components: readonly (readonly [string, z.ZodType])[]
    }
  | { readonly operator: 'not'; readonly operand: z.ZodType }

/** The named schemas of a record, those that are schemas. */
const schemas_in = (components: Readonly<Record<string, unknown>>) =>
  Object.entries(components).flatMap(
    ([name, component]): readonly (readonly [string, z.ZodType])[] =>
      is_a_schema(component) ? [[name, component]] : [],
  )

/**
 * How a condition is composed (DOM-5): its operands under its operator
 * (`$Composed`), NOT's value telling its own alone; none for a leaf.
 */
export const composition_of = (condition: z.ZodType): Composition | undefined => {
  const operands: unknown = $Composed in condition ? condition[$Composed] : undefined
  if (!is_a_record(operands)) return undefined
  const not = operands['not']
  if (is_a_schema(not)) return { operator: 'not', operand: not }
  const and = operands['and']
  if (is_a_record(and)) return { operator: 'and', components: schemas_in(and) }
  const or = operands['or']
  return is_a_record(or) ? { operator: 'or', components: schemas_in(or) } : undefined
}

/**
 * A condition bound to its parameters, parsed once by the condition's schema
 * (which puts the brands on), then walked: AND and OR give each component the
 * field under its name, NOT gives its operand its own parameters (its schema
 * is a copy of its operand's), a leaf takes its path from `path_of`, the
 * registry read in reverse. A leaf with no path is a fault of the wiring.
 */
export const bind =
  (path_of: (component: unknown) => string | undefined) =>
  (condition: z.ZodType, parameters: unknown): Bound => {
    const walk = (node: z.ZodType, parsed: unknown): Bound => {
      const composition = composition_of(node)
      if (composition === undefined) {
        const path = path_of(node)
        if (path === undefined) {
          throw new Error('a condition holds a leaf that no registry given names (DOM-24)')
        }
        return { operator: 'leaf', path, parameters: parsed }
      }
      if (composition.operator === 'not') {
        return { operator: 'not', operand: walk(composition.operand, parsed) }
      }
      return {
        operator: composition.operator,
        components: composition.components.map(([name, component]) => ({
          name,
          condition: walk(component, is_a_record(parsed) ? parsed[name] : undefined),
        })),
      }
    }
    return walk(condition, condition.parse(parameters))
  }

/** The operators a bound condition folds into, and what a leaf becomes. */
export interface Folding<result> {
  readonly leaf: (leaf: BoundLeaf) => result
  readonly and: (components: readonly result[]) => result
  readonly or: (components: readonly result[]) => result
  readonly not: (operand: result) => result
}

/** A bound condition folded, every leaf with its components' names (an adapter's algebra, ADP-8). */
export const fold =
  <result>(folding: Folding<result>) =>
  (bound: Bound): result => {
    const walk = (node: Bound, components: readonly string[]): result => {
      switch (node.operator) {
        case 'leaf':
          return folding.leaf({ components, path: node.path, parameters: node.parameters })
        case 'not':
          return folding.not(walk(node.operand, components))
        case 'and':
        case 'or':
          return folding[node.operator](
            node.components.map((named) => walk(named.condition, [...components, named.name])),
          )
      }
    }
    return walk(bound, [])
  }

/** The leaves of a bound condition, in order: depth first, components in the order written. */
export const leaves_of: (bound: Bound) => readonly BoundLeaf[] = fold<readonly BoundLeaf[]>({
  leaf: (leaf) => [leaf],
  and: (components) => components.flat(),
  or: (components) => components.flat(),
  not: (operand) => operand,
})

/** A bound condition judged on the values of its leaves: whether it holds, and the leaves to blame. */
interface Judged {
  readonly holds: boolean
  readonly blamed: (expected: boolean) => readonly FailedLeaf[]
}

/** How many leaves a bound condition has. */
const size = (bound: Bound): number => leaves_of(bound).length

/**
 * The failed leaves of a condition that does not hold, from the values of
 * its leaves in order (DOM-6, D17): a leaf fails when its value is not the
 * one its place asks for, so a leaf under NOT fails when it holds (the drill
 * is booked, under "no one booked the tool"). AND names its components that
 * fail, OR every component when none holds, NOT its operand's leaves that
 * hold where it asks them not to; a condition that holds names nothing.
 * Every leaf has its value, with no short-circuit (D51), so the failures are
 * the same in any order of evaluation. An interpreter rule (V10).
 */
export const failures_of = (bound: Bound, values: readonly boolean[]): readonly FailedLeaf[] =>
  judged(bound, values).blamed(true)

/** Whether a bound condition holds on the values of its leaves, in order (a transition's branch, SC-10). */
export const holds_on = (bound: Bound, values: readonly boolean[]): boolean =>
  judged(bound, values).holds

/** A bound condition judged on the values of its leaves, in order, with no short-circuit (D51). */
const judged = (bound: Bound, values: readonly boolean[]): Judged => {
  const judge = (node: Bound, components: readonly string[], at: number): Judged => {
    switch (node.operator) {
      case 'leaf': {
        const holds = values[at] ?? false
        return {
          holds,
          blamed: (expected) => (holds === expected ? [] : [{ components, path: node.path }]),
        }
      }
      case 'not': {
        const operand = judge(node.operand, components, at)
        return { holds: !operand.holds, blamed: (expected) => operand.blamed(!expected) }
      }
      case 'and':
      case 'or': {
        const offsets = node.components.reduce<readonly number[]>(
          (starts, named) => [...starts, (starts.at(-1) ?? at) + size(named.condition)],
          [at],
        )
        const judged = node.components.map((named, i) =>
          judge(named.condition, [...components, named.name], offsets[i] ?? at),
        )
        const holds =
          node.operator === 'and'
            ? judged.every((component) => component.holds)
            : judged.some((component) => component.holds)
        return {
          holds,
          blamed: (expected) =>
            holds === expected
              ? []
              : judged
                  .filter((component) => component.holds !== expected)
                  .flatMap((component) => component.blamed(expected)),
        }
      }
    }
  }
  return judge(bound, [], 0)
}
