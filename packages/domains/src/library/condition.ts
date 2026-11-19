import * as z from 'zod'
import type { IsUnion } from './types.ts'
import type { Component, Path, PathOf, SelectionPath } from './component.ts'
import { mark } from './kind.ts'

// Conditions (DOM-5, LIB-7): a branch's condition, a query's selection, a
// node's requirement, in a closed language: AND, OR, NOT and a leaf. The
// leaves of a composed condition are of one kind, checked by type where it is
// composed.

export const $Composed: unique symbol = Symbol('Composed')

/**
 * A condition composed with AND, OR, NOT (DOM-5). It is a zod schema: the
 * schema of its parameters, which the creator binds as an object of its type.
 * It carries its operands under its operator, for the library to walk, and
 * the type of its leaves, so that the builders check that a command takes
 * only predicates and a query only selection predicates; the leaves are the
 * types' alone, never there at runtime.
 */
export type Composed<
  parameters extends z.ZodObject = z.ZodObject,
  operands extends Operands = Operands,
  leaves extends Component = Component,
> = parameters & {
  [$Composed]: operands & { readonly leaves?: leaves }
}

/**
 * The operands of a composed condition, under its operator: the named
 * components of AND and OR, the condition of NOT. Each is optional in the
 * type, since NOT's schema is a copy of its condition's, which may itself be
 * composed: its type tells both, its value its own operator alone.
 */
export interface Operands {
  readonly and?: Components
  readonly or?: Components
  readonly not?: Condition
}

/** A condition: a component, or components composed with AND, OR, NOT. */
export type Condition<leaves extends Component = Component> =
  leaves | Composed<z.ZodObject, Operands, leaves>

/** The leaves of a condition, own and of other domains (GR-3). */
export type Leaves<condition extends Condition> = condition extends {
  [$Composed]: { leaves?: infer leaves extends Component }
}
  ? leaves
  : condition extends Component
    ? condition
    : never

/** The parameters the creator binds to a condition: its schema's input, unbranded. */
export type ConditionInput<condition extends Condition> = z.input<condition>

/** The named components of AND, OR: each name is a business phrase (DOM-25). */
export type Components = Readonly<Record<string, Condition>>

/** The schema of named components: one field per component, its parameters. */
export type ComponentsParameters<components extends Components> = z.ZodObject<
  { [k in keyof components]: components[k] },
  z.core.$strict
>

/**
 * The kind of a leaf: a predicate, or a selection predicate of its subject
 * (DOM-18); any other component is a kind of its own.
 */
type KindOf<leaves extends Component> = leaves extends unknown
  ? PathOf<leaves> extends SelectionPath
    ? SubjectOf<leaves>
    : PathOf<leaves> extends Path<'predicate'>
      ? 'predicate'
      : PathOf<leaves>
  : never

/**
 * Components whose leaves are of one kind are themselves; others ask for a
 * field no condition has, whose name says why and whose type lists the kinds.
 * A mixed condition is valid nowhere, so it fails where it is composed. DOM-5, DOM-18
 */
export type OneKind<components extends Components> =
  IsUnion<KindOf<Leaves<components[keyof components]>>> extends true
    ? {
        readonly 'the leaves of a condition are all predicates, or all selection predicates of one subject (DOM-5, DOM-18)': KindOf<
          Leaves<components[keyof components]>
        >
      }
    : unknown

/**
 * All the components hold. Every predicate gets a value, with no
 * short-circuit; a rejection names every failed component, once. Its leaves
 * are of one kind (`OneKind`). D47.1, D49, D17
 */
export type AndBuilder = <const components extends Components>(
  components: components & OneKind<components>,
) => Composed<
  ComponentsParameters<components>,
  { readonly and?: components },
  Leaves<components[keyof components]>
>

/** At least one component holds. Its leaves are of one kind (`OneKind`). */
export type OrBuilder = <const components extends Components>(
  components: components & OneKind<components>,
) => Composed<
  ComponentsParameters<components>,
  { readonly or?: components },
  Leaves<components[keyof components]>
>

/** The condition does not hold: its parameters are the condition's. */
export type NotBuilder = <const condition extends Condition>(
  condition: condition,
) => Composed<condition, { readonly not?: condition }, Leaves<condition>>

/**
 * The subject of a selection predicate (DOM-18): its path up to the segment
 * after the kind `selection`, the subject its builder declares
 * (`business/loans/selection/loan`). No folder is named `selection`, as no
 * folder is named as a kind (DOM-24). The library knows the subject only by this
 * path: what it is and where its candidates are is the adapter's (LIB-14).
 */
export type SubjectOf<leaf extends Component> =
  PathOf<leaf> extends `${infer head}/selection/${infer subject}/${string}`
    ? `${head}/selection/${subject}`
    : never

// The builders' bodies (part 3.2): AND and OR a strict object of their named
// components, NOT a copy of its condition's schema, each with its operands
// under its operator, marked as a condition, whose kind is its file's.

/** A copy of a schema, its own object with the same definition. */
const copy = <schema extends z.ZodObject>(schema: schema): schema => schema.clone()

export const and_builder: AndBuilder = <const components extends Components>(
  components: components & OneKind<components>,
) =>
  Object.assign(
    z.strictObject<components>(components),
    { [$Composed]: { and: components } },
    mark({ kind: 'condition' }),
  )

export const or_builder: OrBuilder = <const components extends Components>(
  components: components & OneKind<components>,
) =>
  Object.assign(
    z.strictObject<components>(components),
    { [$Composed]: { or: components } },
    mark({ kind: 'condition' }),
  )

export const not_builder: NotBuilder = (condition) =>
  Object.assign(copy(condition), { [$Composed]: { not: condition } }, mark({ kind: 'condition' }))
