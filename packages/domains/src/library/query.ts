import type * as z from 'zod'
import type { BrandOf, IsUnion } from './types.ts'
import { mark } from './kind.ts'
import type {
  $Calculation,
  CalculationPath,
  Component,
  Path,
  PathOf,
  SelectionPath,
  Strays,
} from './component.ts'
import type { Condition, ConditionInput, Leaves, SubjectOf } from './condition.ts'
import type { SchemaOf } from './command.ts'

// Queries (DOM-18): a query is data. Its selection is a condition in the
// language of the commands (D47.1) over selection predicates: predicates over
// the candidate, an instance of the subject that the selection looks at, which
// they do not name; their parameters are the values of the filter. Its fields
// are the schema of an entry, what the query returns of a candidate it keeps;
// its order, fields of the entry. Where the candidates are is the
// adapter's (LIB-14): the library knows no entities.

export type Direction = 'ascending' | 'descending'

/**
 * The order of the entries, by their fields, in the order they are written.
 * The library closes it with the entry's identity, ascending, so that it is
 * total (LIB-9, D109).
 */
export type Order<fields extends z.ZodObject> = EntryOrder<z.output<fields>>

/**
 * The order of the entries by any field of an entry, read or calculated
 * (SC-21: the tools by their loans of the month, the most lent first).
 */
export type EntryOrder<entry> = {
  readonly [field in keyof entry]?: Direction
}

/**
 * The fields of an entry whose value is an identity (DOM-24): branded with a
 * path of a module `id`. One of them is the entry's identity.
 */
export type IdentityFields<fields extends z.ZodObject> = {
  [name in keyof z.output<fields>]-?: [BrandOf<z.output<fields>[name]>] extends [never]
    ? never
    : BrandOf<z.output<fields>[name]> extends Path<'id'>
      ? name
      : never
}[keyof z.output<fields>] &
  string

/**
 * A selection made of selection predicates of one subject is itself; another
 * asks for a field no selection has, whose name says why and whose type lists
 * the strays or the subjects. DOM-18
 */
export type OneSubject<selection extends Condition> = [
  Strays<Leaves<selection>, SelectionPath>,
] extends [never]
  ? IsUnion<SubjectOf<Leaves<selection>>> extends true
    ? {
        readonly 'the leaves of a selection come from one subject (DOM-18)': SubjectOf<
          Leaves<selection>
        >
      }
    : unknown
  : {
      readonly 'a selection is made of selection predicates (DOM-18)': PathOf<
        Strays<Leaves<selection>, SelectionPath>
      >
    }

/**
 * What a query declares besides its input, its calculations and its creator.
 * Its `identity` is the field that names an entry: an identity, unique per
 * entry, which the business's commands keep unique (`NOT(a_loan_has_this_id)`);
 * the library cannot check the uniqueness, the author declares it. It closes
 * the order (LIB-9) and names the entry in a stream (DOM-17). The order is
 * over the entry, its fields read and calculated.
 */
export interface QueryShape<
  fields extends z.ZodObject,
  identity extends string,
  selection extends Condition,
  entry = z.output<fields>,
> {
  readonly fields: fields
  readonly identity: identity
  readonly selection: selection
  readonly order: EntryOrder<entry>
}

/** A calculation as a component: its parameters, branded with its path, and its value (DOM-18). */
export type CalculationComponent = Component & {
  readonly [$Calculation]: { readonly value: z.ZodType }
}

/** The calculations of a query, by the name of the field each gives (SC-21). */
export type Calculations = Readonly<Record<string, CalculationComponent>>

/** The schema of the value a calculation gives. */
type ValueOf<calculation> = calculation extends {
  readonly [$Calculation]: { readonly value: infer value extends z.ZodType }
}
  ? value
  : never

/**
 * An entry of a query: the fields it reads from a candidate, and one field
 * per calculation, its value; the library parses the entries with both.
 */
export type Entry<
  fields extends z.ZodObject,
  calculations extends Calculations,
> = z.output<fields> &
  ([calculations] extends [never]
    ? unknown
    : { readonly [name in keyof calculations]: z.output<ValueOf<calculations[name]>> })

/** The subject of a calculation, as a selection predicate names it, so that the two compare. */
type SubjectOfCalculation<calculation> = calculation extends unknown
  ? PathOf<calculation> extends `${infer head}/calculation/${infer subject}/${string}`
    ? `${head}/selection/${subject}`
    : never
  : never

/**
 * The calculations of a query that fit it are themselves; others ask for a
 * field no query has, whose name says why and whose type lists the culprits:
 * a component that is no calculation, a calculation of another subject than
 * the selection's (it reads the same candidate), a name a read field
 * already has. DOM-18
 */
export type CalculationsFit<
  fields extends z.ZodObject,
  selection extends Condition,
  calculations extends Calculations,
> = [calculations] extends [never]
  ? unknown
  : [Strays<calculations[keyof calculations], CalculationPath>] extends [never]
    ? [
        Exclude<
          SubjectOfCalculation<calculations[keyof calculations]>,
          SubjectOf<Leaves<selection>>
        >,
      ] extends [never]
      ? [keyof calculations & keyof z.output<fields>] extends [never]
        ? unknown
        : {
            readonly 'a calculation gives a field of its own, not one the query reads (DOM-18)': keyof calculations &
              keyof z.output<fields>
          }
      : {
          readonly 'a calculation is of the subject of the selection (DOM-18)': SubjectOfCalculation<
            calculations[keyof calculations]
          >
        }
    : {
        readonly 'the calculations of a query are calculations (DOM-18)': PathOf<
          Strays<calculations[keyof calculations], CalculationPath>
        >
      }

/** A query's input: a schema, or a function of the part of the context it needs. DOM-21 */
export type QueryInput<inputSchema extends z.ZodType, context = never> =
  inputSchema | ((context: context) => inputSchema)

/**
 * What a query's creator binds, by part, as a step's creator does (SC-21):
 * the parameters of its selection and, if it calculates, those of each
 * calculation, under the name of the field it gives. A query that
 * calculates nothing has `never` for its calculations, and binds none.
 */
export type QueryBinding<selection extends Condition, calculations extends Calculations> = {
  readonly selection: ConditionInput<selection>
} & ([calculations] extends [never]
  ? { readonly calculations?: never }
  : {
      readonly calculations: { readonly [name in keyof calculations]: z.input<calculations[name]> }
    })

/**
 * From the part of the context it declares, which the tree must give at the
 * query's point, and the input, the parameters bound to the selection and the
 * calculations.
 */
export type QueryCreator<
  inputSchema extends z.ZodType,
  selection extends Condition,
  calculations extends Calculations,
  context = never,
> = (context: context) => (input: z.output<inputSchema>) => QueryBinding<selection, calculations>

export const $Query: unique symbol = Symbol('Query')

/**
 * A query: its creator, its input as declared (`input`), from which the
 * generator writes `<query>_input` (DOM-25), and its parts for the library:
 * its shape and its calculations, if it has some; the schema of its input
 * for the types alone, as a command's.
 */
export type Query<
  input extends QueryInput<z.ZodType>,
  fields extends z.ZodObject,
  identity extends string,
  selection extends Condition,
  calculations extends Calculations,
  context,
> = QueryCreator<SchemaOf<input>, selection, calculations, context> & {
  readonly input: input
  [$Query]: { input?: SchemaOf<input>; calculations?: calculations } & QueryShape<
    fields,
    identity,
    selection,
    Entry<fields, calculations>
  >
}

/**
 * A query, declared in one argument whose parts have names: the input,
 * declared inline, the fields it reads, the calculations it gives beside
 * them if any (SC-21), the identity, the selection, the order, and last the
 * creator that binds the selection and the calculations. DOM-25. Its
 * identity is a field read whose value is an identity, the leaves of its
 * selection and its calculations come from one subject, checked by type
 * (DOM-18).
 */
export type QueryBuilder<context> = <
  const input extends QueryInput<z.ZodType, context>,
  fields extends z.ZodObject,
  const identity extends IdentityFields<fields>,
  const selection extends Condition,
  const calculations extends Calculations = never,
>(
  query: { readonly input: input } & QueryShape<
    fields,
    identity,
    selection,
    NoInfer<Entry<fields, calculations>>
  > & { readonly calculations?: calculations } & {
      readonly selection: OneSubject<selection>
      readonly calculations?: CalculationsFit<fields, selection, calculations>
      readonly creator: QueryCreator<SchemaOf<input>, selection, NoInfer<calculations>, context>
    },
) => Query<input, fields, identity, selection, calculations, context>

/** The queries of a domain, by name. */
export type Queries = Readonly<
  Record<
    string,
    {
      readonly [$Query]: { input?: z.ZodType; calculations?: Calculations } & QueryShape<
        z.ZodObject,
        string,
        Condition
      >
    }
  >
>

export type QueryParts<query> = query extends { [$Query]: infer parts } ? parts : never

/** The schema of the fields a query reads from a candidate: its source's. */
export type FieldsOf<query> =
  QueryParts<query> extends { fields: infer fields extends z.ZodObject } ? fields : never

/** A query's entry: its fields read and calculated, as the library parses it. */
export type QueryEntryOf<query> =
  QueryParts<query> extends {
    fields: infer fields extends z.ZodObject
    calculations?: infer calculations extends Calculations
  }
    ? Entry<fields, calculations>
    : never

/** Every calculation a set of queries gives. */
export type CalculationsOfQueries<queries extends Queries> = {
  [name in keyof queries]: CalculationsOfQuery<queries[name]>
}[keyof queries]

/** The calculations a query gives, none if it gives none. */
type CalculationsOfQuery<query> =
  QueryParts<query> extends { calculations?: infer calculations extends Calculations }
    ? calculations[keyof calculations]
    : never

/** Every selection predicate the selections of a set of queries use. */
export type PredicatesOfQueries<queries extends Queries> = Leaves<
  QueryParts<queries[keyof queries]>['selection']
>

// The builder's body (part 3.2): a query is its creator, with its input as
// declared and its parts.

export const query_builder =
  <context>(): QueryBuilder<context> =>
  (query) =>
    Object.assign(
      (context: context) => query.creator(context),
      {
        input: query.input,
        [$Query]: {
          fields: query.fields,
          identity: query.identity,
          selection: query.selection,
          order: query.order,
          ...(query.calculations === undefined ? {} : { calculations: query.calculations }),
        },
      },
      mark({ kind: 'query' }),
    )
