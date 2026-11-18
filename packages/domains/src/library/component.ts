import type * as z from 'zod'
import type { BrandOf } from './types.ts'

// The builders of the components (DOM-25): an export built by a builder of the
// library is a component, and its builder gives the kind of its construct,
// the segment of its path after its folders; an exported zod schema is a value
// (DOM-21); the rest (the functions of `dsl`, helpers) the library ignores. The
// generator imports the authored files, which are pure, and finds the
// components by their builder: the files are named and grouped as the author
// likes. Each returns what it is given, for the generator to brand. None is
// exported: the authored files reach them through `Builders`, from the scope
// of their kind (`_scope_fact.ts`, `fact`).

/**
 * The path of a component (DOM-24, DOM-25): its folders from the root, the
 * kind of its construct, which its builder gives, and its export's name, as
 * in `business/tools/fact/a_tool_has_been_added`; the file it sits in is not
 * in it. No folder is named as a kind.
 */
export type Path<kind extends string> = `${string}/${kind}/${string}`

/** An identity (DOM-24): the format of the values that name an instance. */
export type IdBuilder = <const format extends z.ZodType>(id: { readonly format: format }) => format

/**
 * A fact (DOM-5): its payload, at least every value its change writes. Its
 * resources are every identity of its payload (DOM-10), unless it declares
 * narrower ones (`resources`, SC-55): the fields of its payload that carry
 * the instances it changes and its target (D94.6), each with the identities
 * it holds, at any depth, checked by type to hold one.
 */
export type FactBuilder = <
  const payload extends z.ZodObject,
  const fields extends ResourceFields<payload> = never,
>(fact: {
  readonly payload: payload
  readonly resources?: readonly [fields, ...fields[]]
}) => [fields] extends [never] ? payload : Resourced<payload, fields>

export const $Resources: unique symbol = Symbol('Resources')

/**
 * A fact that declares its resources (D94.6, SC-55): its payload, which
 * carries the fields of its resources, for the library to read when it
 * writes them in the envelope.
 */
export type Resourced<payload extends z.ZodObject, fields extends string> = payload &
  ResourcesOf<fields>

/** The fields of a fact's declared resources (D94.6, SC-55), as its payload carries them. */
export interface ResourcesOf<fields extends string> {
  readonly [$Resources]: readonly fields[]
}

/** The fields of a payload that hold an identity (DOM-24), at any depth: those that may carry a resource. */
export type ResourceFields<payload extends z.ZodObject> = {
  [field in keyof z.output<payload>]-?: true extends HoldsAnIdentity<z.output<payload>[field]>
    ? field
    : never
}[keyof z.output<payload>] &
  string

/** Whether a value holds an identity (DOM-24): is one, or holds one in a field or an element. */
type HoldsAnIdentity<value> = [BrandOf<value>] extends [never]
  ? value extends readonly (infer element)[]
    ? HoldsAnIdentity<element>
    : value extends object
      ? true extends { [field in keyof value]-?: HoldsAnIdentity<value[field]> }[keyof value]
        ? true
        : false
      : false
  : BrandOf<value> extends Path<'id'>
    ? true
    : false

/** A predicate, a word of the conditions (DOM-5): the schema of its parameters. */
export type PredicateBuilder = <const parameters extends z.ZodObject>(predicate: {
  readonly parameters: parameters
}) => parameters

/**
 * A selection predicate (DOM-18): a predicate over the candidate of a query,
 * which it does not name, and of its subject, a view named by the business,
 * which the generator writes after the kind
 * (`business/loans/selection/loan/the_loan_is_ongoing`).
 */
export type SelectionBuilder = <const parameters extends z.ZodObject>(selection: {
  readonly subject: string
  readonly parameters: parameters
}) => parameters

export const $Calculation: unique symbol = Symbol('Calculation')

/**
 * A calculation (DOM-18, SC-21): the schema of its parameters, which carries
 * the schema of the value it gives.
 */
export type Calculation<parameters extends z.ZodObject, value extends z.ZodType> = parameters & {
  readonly [$Calculation]: { readonly value: value }
}

/**
 * A calculation (DOM-18, D50.7, SC-21): a value of the candidate of a query
 * that depends on parameters of the read, a concept of the business named in
 * its vocabulary, whose meaning is the adapter's, as a selection predicate's
 * (the loans of a tool between two days: a count in SQL, a function over the
 * state in the oracle). The library calculates nothing and knows no kind of
 * aggregation: it binds the parameters and gives the adapter's fragment to
 * the read as a field. Of its subject, which the generator writes after the
 * kind (`business/loans/calculation/tool/the_loans_of_the_tool_between_these_days`);
 * its value, the schema of the field it gives.
 */
export type CalculationBuilder = <
  const parameters extends z.ZodObject,
  const value extends z.ZodType,
>(calculation: {
  readonly subject: string
  readonly parameters: parameters
  readonly value: value
}) => Calculation<parameters, value>

/**
 * An effect (DOM-13, D108.1): what the domain asks of the world, named by a
 * business phrase, and its payload, what the delivery needs. A branch queues
 * it with its fact; the domain never runs it (D12). Its order, the order per
 * resource by default (D64.4, LIB-8), or none if it tolerates reordering
 * (`order: 'any'`, D67.3, SC-56): its dead letters then hold nothing.
 */
export type EffectBuilder = <
  const payload extends z.ZodObject,
  const order extends DeliveryOrder = 'per_resource',
>(effect: {
  readonly payload: payload
  readonly order?: order
}) => [order] extends ['per_resource'] ? payload : Ordered<payload, order>

/**
 * The order a consumer keeps (D64.4, D67.3), an ADT: `per_resource`, the
 * default, the facts or entries of a resource in their order, a dead letter
 * holding its resources; `any`, a consumer that tolerates reordering, whose
 * dead letters hold nothing (SC-56).
 */
export type DeliveryOrder = 'per_resource' | 'any'

export const $Order: unique symbol = Symbol('Order')

/** An effect that declares its order (D67.3, SC-56): its payload, which carries it, for the executor to read. */
export type Ordered<payload extends z.ZodObject, order extends DeliveryOrder> = payload &
  OrderOf<order>

/** The order an effect declares (D67.3, SC-56), as its payload carries it. */
export interface OrderOf<order extends DeliveryOrder> {
  readonly [$Order]: order
}

/**
 * A component of a domain that the library meets: a fact, a predicate, a
 * selection predicate, an effect. An object schema that the generator brands with its
 * path in its generated module, as an identity (`_fact.ts`): the same object as the
 * author's, nominal in the types. Its path is not in its data: at runtime the
 * library finds it in the registry, and a fact carries it in its envelope.
 * DOM-24
 */
export type Component = z.ZodObject & { _zod: { output: { readonly [z.core.$brand]: unknown } } }

/** The path a component, an identity or a format is branded with; `never` for an unbranded schema. */
export type PathOf<schema> = schema extends { _zod: { output: { [z.core.$brand]: infer brand } } }
  ? keyof brand & string
  : never

/**
 * The path of a selection predicate (DOM-18): its builder declares its
 * subject, which the generator writes after the kind, before its name.
 */
export type SelectionPath = `${string}/selection/${string}/${string}`

/** The path of a calculation (DOM-18): its subject after the kind, as a selection predicate's. */
export type CalculationPath = `${string}/calculation/${string}/${string}`

/** The components of a union whose path is not of a kind: a fact where a predicate goes. */
export type Strays<components, path extends string> = components extends unknown
  ? PathOf<components> extends path
    ? never
    : components
  : never
