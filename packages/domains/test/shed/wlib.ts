import * as z from 'zod'

// Formats (DOM-24): branded values with no word of a domain. A format's brand
// is its name: no domain path is a bare name, so it meets no domain's brand.

/** An instant, ISO 8601 with the time zone. */
export const date_time_string = z.iso.datetime().brand<'date_time_string'>()
export type date_time_string = z.output<typeof date_time_string>

/** A calendar day, `YYYY-MM-DD`. */
export const day = z.iso.date().brand<'day'>()
export type day = z.output<typeof day>

/**
 * The context the library gives, made of small interfaces: a function that
 * needs part of it declares only that part (`Now`), so that it serves any
 * context that has it (a command, the interface, the client).
 */
export interface Now {
  readonly now: date_time_string
}

export interface CommandContext extends Now {
  uid: string
  /**
   * vari metadati necessari alla lib (ids,  keys, path, now, ... )
   * estendibile dall'applicazione
   */
}

/**
 * The path of a component (DOM-24): its domain, folders, conventional module
 * and name, as in `tools/fact/a_tool_has_been_added`. A folder is never named
 * as a conventional module.
 */
export type Path<module extends string> = `${string}/${module}/${string}`

/**
 * A component of a domain that the library meets: a fact, a predicate, a
 * selection predicate. An object schema that the generator brands with its
 * path in its generated module, as an identity (`fact.ts`): the same object as the
 * author's, nominal in the types. Its path is not in its data: at runtime the
 * library finds it in the registry, and a fact carries it in its envelope.
 * DOM-24
 */
export type Component = z.ZodObject & { _zod: { output: { readonly [z.core.$brand]: unknown } } }

/** The path a component, an identity or a format is branded with; `never` for an unbranded schema. */
export type PathOf<schema> = schema extends { _zod: { output: { [z.core.$brand]: infer brand } } }
  ? keyof brand & string
  : never

/** The components of a union that are not of a conventional module: a fact where a predicate goes. */
type Strays<components, module extends string> = components extends unknown
  ? PathOf<components> extends Path<module>
    ? never
    : components
  : never

declare const $Composed: unique symbol
/**
 * A condition composed with AND, OR, NOT (DOM-5). It is a zod schema: the
 * schema of its parameters, which the creator binds as an object of its type.
 * It carries the type of its leaves, so that the builders check that a
 * command takes only predicates and a query only selection predicates.
 */
export type Composed<
  parameters extends z.ZodObject = z.ZodObject,
  operands = unknown,
  leaves extends Component = Component,
> = parameters & {
  [$Composed]: { operator: 'and' | 'or' | 'not'; operands: operands; leaves: leaves }
}

/** A condition: a component, or components composed with AND, OR, NOT. */
export type Condition<leaves extends Component = Component> =
  leaves | Composed<z.ZodObject, unknown, leaves>

/** The leaves of a condition, own and of other domains (GR-3). */
export type Leaves<condition extends Condition> = condition extends {
  [$Composed]: { leaves: infer leaves extends Component }
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
 * All the components hold. Every predicate gets a value, with no
 * short-circuit; a rejection names every failed component, once. D47.1, D49, D17
 */
export declare function AND<const components extends Components>(
  components: components,
): Composed<ComponentsParameters<components>, components, Leaves<components[keyof components]>>

/** At least one component holds. */
export declare function OR<const components extends Components>(
  components: components,
): Composed<ComponentsParameters<components>, components, Leaves<components[keyof components]>>

/** The condition does not hold: its parameters are the condition's. */
export declare function NOT<const condition extends Condition>(
  condition: condition,
): Composed<condition, condition, Leaves<condition>>

/** A branch, declared: the condition and the fact it records. DOM-5 */
export type Outcome = readonly [condition: Condition, fact: Component]
/**
 * The closed set of a command's branches, each under a business name: at
 * most one applies, tried in the order they are written. DOM-5, DOM-3
 */
export type Outcomes = Readonly<Record<string, Outcome>>

/**
 * The branches resolved by the creator, under the same names as the outcomes:
 * for each, the parameters bound to its condition and the payload of its fact.
 * Inputs, not outputs: the library parses them and puts the brands on.
 */
export type ResolvedOutcomes<outcomes extends Outcomes> = {
  readonly [k in keyof outcomes]: readonly [
    condition: ConditionInput<outcomes[k][0]>,
    fact: z.input<outcomes[k][1]>,
  ]
}

export type CommandCreator<inputSchema extends z.ZodType, outcomes extends Outcomes> = (
  commandContext: CommandContext,
) => (input: z.output<inputSchema>) => ResolvedOutcomes<outcomes>

export declare const $Command: unique symbol
export type Command<inputSchema extends z.ZodType, outcomes extends Outcomes> = CommandCreator<
  inputSchema,
  outcomes
> & {
  [$Command]: {
    input: inputSchema
    outcomes: outcomes
  }
}

/**
 * A command's input: a schema, or a function of the part of the context its
 * validation needs (a static rule over `now`). The library builds it before
 * parsing. DOM-21
 */
export type CommandInput<inputSchema extends z.ZodType> =
  inputSchema | ((commandContext: CommandContext) => inputSchema)

/**
 * Branches whose conditions are made of predicates and whose facts are facts
 * are themselves; others ask for a field no command has, whose name says why
 * and whose type lists the paths of the strays. DOM-24
 */
export type PredicatesAndFacts<outcomes extends Outcomes> = [
  Strays<PredicatesOf<outcomes>, 'predicate'> | Strays<FactsOf<outcomes>, 'fact'>,
] extends [never]
  ? unknown
  : {
      readonly 'a condition is made of predicates, a branch records a fact (DOM-24)': PathOf<
        Strays<PredicatesOf<outcomes>, 'predicate'> | Strays<FactsOf<outcomes>, 'fact'>
      >
    }

/**
 * A command, declared in one argument whose parts have names: the input, the
 * branches, and last the creator that binds them. DOM-25. Its conditions are
 * made of predicates and its facts are facts, checked by type.
 */
export declare function command<
  inputSchema extends z.ZodType,
  const outcomes extends Outcomes,
>(command: {
  readonly input: CommandInput<inputSchema>
  readonly outcomes: outcomes & PredicatesAndFacts<outcomes>
  readonly creator: CommandCreator<inputSchema, outcomes>
}): Command<inputSchema, outcomes>

// ---------------------------------------------------------------------------
// Adapters (LIB-14): typed tools to implement the command port. The library
// derives what an adapter must cover and types the outcome. The algebra of
// fragments below is one way, recommended (ADP-8), not required: the adapter
// implements the port as it wants. No concept of state here.

/** Every predicate a command's branches use. */
export type PredicatesOf<outcomes extends Outcomes> = Leaves<outcomes[keyof outcomes][0]>

/** Every fact a command can record. */
export type FactsOf<outcomes extends Outcomes> = outcomes[keyof outcomes][1]

/**
 * The adapter's fragment for each predicate, under its path, from its parsed
 * parameters: a SQL condition, a MongoDB filter, a function over a
 * transaction. Exhaustive: a forgotten predicate does not compile.
 */
export type PredicateFragments<predicates extends Component, fragment> = {
  readonly [predicate in predicates as PathOf<predicate>]: (
    parameters: z.output<predicate>,
  ) => fragment
}

/**
 * How the adapter composes its fragments: one per predicate, and the boolean
 * operators. The same algebra serves commands and reads, so a predicate has
 * one translation in an adapter.
 */
export interface Algebra<predicates extends Component, fragment> {
  readonly predicate: PredicateFragments<predicates, fragment>
  readonly and: (components: readonly fragment[]) => fragment
  readonly or: (components: readonly fragment[]) => fragment
  readonly not: (operand: fragment) => fragment
}

/**
 * The adapter's write for each fact, under its path: how the fact's values
 * reach the state (DOM-5). Exhaustive, as a match over an ADT.
 */
export type FactWrites<facts extends Component, write> = {
  readonly [fact in facts as PathOf<fact>]: (fact: z.output<fact>) => write
}

/**
 * A branch ready to execute, in the order of the branches: its condition
 * composed, each leaf apart (to name the failures), its write.
 */
export interface PlannedBranch<fragment, write> {
  readonly condition: fragment
  readonly leaves: readonly fragment[]
  readonly write: write
}

/**
 * What the adapter's execution tells the library: the index of the applied
 * branch; or, when none applies, the value of every leaf of every branch,
 * read in the same step or in a second one, as the technology allows.
 */
export type Execution =
  | { readonly outcome: 'applied'; readonly branch: number }
  | { readonly outcome: 'rejected'; readonly leaves: readonly (readonly boolean[])[] }

/**
 * The execution of a planned command, in one consistent step of the adapter:
 * the first branch whose condition holds writes; nothing writes otherwise.
 */
export type Execute<fragment, write> = (
  plan: readonly PlannedBranch<fragment, write>[],
) => Promise<Execution>

/** A failed predicate, where it stands: its branch, its components' names, its path. */
export interface Failure<outcomes extends Outcomes> {
  readonly branch: keyof outcomes & string
  readonly components: readonly string[]
  readonly predicate: PathOf<PredicatesOf<outcomes>>
}

/**
 * A fact in its event envelope (DOM-10): its path apart from its payload, as
 * in the paper (D56, D101.2). Whoever consumes facts matches on the path,
 * exhaustively as on an ADT, and never reads the payload to know the fact
 * (D107). The other fields of the envelope come with their cases.
 */
export type Envelope<facts extends Component> = facts extends unknown
  ? { readonly path: PathOf<facts>; readonly payload: z.output<facts> }
  : never

/**
 * The outcome of a command (DOM-7), an ADT: one declared branch applied, with
 * its typed fact in its envelope; or the rejection, naming every failed
 * predicate (DOM-6).
 */
export type CommandOutcome<outcomes extends Outcomes> =
  | {
      [branch in keyof outcomes & string]: {
        readonly outcome: 'applied'
        readonly branch: branch
        readonly fact: Envelope<outcomes[branch][1]>
      }
    }[keyof outcomes & string]
  | { readonly outcome: 'rejected'; readonly failures: readonly Failure<outcomes>[] }

/** The commands of a domain, by name. */
export type Commands = Readonly<
  Record<string, { readonly [$Command]: { input: z.ZodType; outcomes: Outcomes } }>
>

/** The outcomes of a command. */
export type OutcomesOf<command> = command extends { [$Command]: { outcomes: infer outcomes } }
  ? outcomes extends Outcomes
    ? outcomes
    : never
  : never

type AllOutcomes<commands extends Commands> = OutcomesOf<commands[keyof commands]>

/** What a state adapter gives for a set of commands, of one or more domains. */
export interface StateAdapter<commands extends Commands, fragment, write> {
  readonly algebra: Algebra<PredicatesOf<AllOutcomes<commands>>, fragment>
  readonly write: FactWrites<FactsOf<AllOutcomes<commands>>, write>
  readonly execute: Execute<fragment, write>
}

/** A command port: the input in, the typed outcome out. */
export type CommandPort<command> = command extends {
  [$Command]: { input: infer input; outcomes: infer outcomes }
}
  ? input extends z.ZodType
    ? outcomes extends Outcomes
      ? (context: CommandContext, input: z.input<input>) => Promise<CommandOutcome<outcomes>>
      : never
    : never
  : never

/**
 * A domain's path registry (DOM-24), generated in `registry.ts`: each path
 * with its component. The configurator gives the library the registries of
 * the domains it composes; the library reads them in reverse, from a
 * component to its path, by object identity. One object, one path.
 */
export type Registry = Readonly<Record<string, z.ZodType>>

/**
 * The command ports of a set of commands over a state adapter, with the
 * registry where the library finds the paths of their predicates and facts.
 * Curried, so that the commands fix the types before the adapter is written.
 */
export declare function command_ports<const commands extends Commands>(ports: {
  readonly registry: Registry
  readonly commands: commands
}): <fragment, write>(
  adapter: StateAdapter<commands, fragment, write>,
) => { readonly [name in keyof commands]: CommandPort<commands[name]> }

/** The components of a generated module that belong to a conventional module. */
type ComponentsIn<module, conventional extends string> = {
  [name in keyof module]: module[name] extends Component
    ? PathOf<module[name]> extends Path<conventional>
      ? module[name]
      : never
    : never
}[keyof module]

/** The predicates declared in a generated module (`predicate.ts`), for an adapter's fragments. */
export type PredicatesIn<module> = ComponentsIn<module, 'predicate'>

/** The selection predicates declared in a generated module (`selection.ts`), for an adapter's fragments. */
export type SelectionsIn<module> = ComponentsIn<module, 'selection'>

/** The facts declared in a generated module (`fact.ts`), for an adapter's writes. */
export type FactsIn<module> = ComponentsIn<module, 'fact'>

// ---------------------------------------------------------------------------
// Queries (DOM-18): a query is data. Its selection is a condition in the
// language of the commands (D47.1) over selection predicates: predicates over
// the candidate, the entry the selection looks at, which they do not name;
// their parameters are the values of the filter. Its fields are the schema of
// an entry; its order, fields of the entry. Where the candidates are is the
// adapter's (LIB-14): the library knows no entities.

export type Direction = 'ascending' | 'descending'

/**
 * The order of the entries, by their fields, in the order they are written.
 * Total (LIB-9): the business closes it with a field unique per entry, which
 * its commands keep unique (`not(a_tool_has_this_id)`); the library cannot
 * check it, the author declares it.
 */
export type Order<fields extends z.ZodObject> = {
  readonly [field in keyof z.output<fields>]?: Direction
}

/** A path without its last segment: the file or folder its member is declared in. */
type Parent<path extends string> = path extends `${infer head}/${infer tail}`
  ? tail extends `${string}/${string}`
    ? `${head}/${Parent<tail>}`
    : head
  : never

/**
 * The subject of a selection predicate (DOM-18): the file of the module
 * `selection` that declares it, its path without its name
 * (`loans/selection/loan`; `tools/selection` while the module is one file).
 * The library knows the subject only by this path: what it is and where its
 * candidates are is the adapter's (LIB-14).
 */
export type SubjectOf<leaf extends Component> = Parent<PathOf<leaf>>

type UnionToIntersection<union> = (
  union extends unknown ? (member: union) => void : never
) extends (member: infer intersection) => void
  ? intersection
  : never

type IsUnion<type> = [type] extends [UnionToIntersection<type>] ? false : true

/**
 * A selection made of selection predicates of one subject is itself; another
 * asks for a field no selection has, whose name says why and whose type lists
 * the strays or the subjects. DOM-18
 */
export type OneSubject<selection extends Condition> = [
  Strays<Leaves<selection>, 'selection'>,
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
        Strays<Leaves<selection>, 'selection'>
      >
    }

/** What a query declares besides its input and creator. */
export interface QueryShape<fields extends z.ZodObject, selection extends Condition> {
  readonly fields: fields
  readonly selection: selection
  readonly order: Order<fields>
}

/** A query's input: a schema, or a function of the part of the context it needs. DOM-21 */
export type QueryInput<inputSchema extends z.ZodType> =
  inputSchema | ((context: Now) => inputSchema)

/** From the context and the input, the parameters bound to the selection. */
export type QueryCreator<inputSchema extends z.ZodType, selection extends Condition> = (
  context: Now,
) => (input: z.output<inputSchema>) => ConditionInput<selection>

export declare const $Query: unique symbol
export type Query<
  inputSchema extends z.ZodType,
  fields extends z.ZodObject,
  selection extends Condition,
> = QueryCreator<inputSchema, selection> & {
  [$Query]: { input: inputSchema } & QueryShape<fields, selection>
}

/**
 * A query, declared in one argument whose parts have names: the input, the
 * fields, the selection, the order, and last the creator that binds the
 * selection. DOM-25. The leaves of its selection come from one subject,
 * checked by type (DOM-18).
 */
export declare function query<
  inputSchema extends z.ZodType,
  fields extends z.ZodObject,
  const selection extends Condition,
>(
  query: { readonly input: QueryInput<inputSchema> } & QueryShape<fields, selection> & {
      readonly selection: OneSubject<selection>
      readonly creator: QueryCreator<inputSchema, selection>
    },
): Query<inputSchema, fields, selection>

// Read adapters (LIB-14): the operators of the commands (ADP-8), a fragment
// per selection predicate, one source per query, one read. No concept of
// state here.

/** The queries of a domain, by name. */
export type Queries = Readonly<
  Record<
    string,
    {
      readonly [$Query]: { input: z.ZodType } & QueryShape<z.ZodObject, Condition>
    }
  >
>

type QueryParts<query> = query extends { [$Query]: infer parts } ? parts : never

/** The schema of a query's entries. */
export type FieldsOf<query> =
  QueryParts<query> extends { fields: infer fields extends z.ZodObject } ? fields : never

/** Every selection predicate the selections of a set of queries use. */
export type PredicatesOfQueries<queries extends Queries> = Leaves<
  QueryParts<queries[keyof queries]>['selection']
>

/**
 * Where the adapter finds a query's candidates (a table, a store) and how it
 * reads each field of an entry from a candidate.
 */
export interface QuerySource<fields extends z.ZodObject, source, field> {
  readonly from: source
  readonly fields: { readonly [name in keyof z.output<fields>]-?: field }
}

/** A query ready to read: the selection composed, the fields and the order as fragments. */
export interface PlannedQuery<selection, source, field> {
  readonly from: source
  readonly fields: Readonly<Record<string, field>>
  readonly selection: selection
  readonly order: readonly (readonly [field, Direction])[]
}

/** The position of a read: opaque, compared only by order (DOM-17). */
export const position = z.string().min(1).brand<'position'>()
export type position = z.output<typeof position>

/**
 * The adapter's read, in one consistent snapshot: the entries as stored (the
 * library parses them with the query's fields) and the position read at (D66).
 */
export type Read<selection, source, field> = (
  plan: PlannedQuery<selection, source, field>,
) => Promise<{ readonly entries: readonly unknown[]; readonly position: position }>

/**
 * What a read adapter gives for a set of queries, of one or more domains. Its
 * fragments are of three types: a condition over a candidate (`selection`),
 * where the candidates are (`source`), how a field reads from a candidate
 * (`field`). In SQL the three are one type, and one adapter serves the
 * queries of every subject; an adapter whose fragments are typed by the
 * candidate (the in-memory oracle) serves the queries of one subject at a
 * time (DOM-18).
 */
export interface ReadAdapter<queries extends Queries, selection, source, field> {
  readonly algebra: Algebra<PredicatesOfQueries<queries>, selection>
  readonly sources: {
    readonly [name in keyof queries]: QuerySource<FieldsOf<queries[name]>, source, field>
  }
  readonly read: Read<selection, source, field>
}

/** The outcome of a read: the entries, typed by the query's fields, and the position read at. */
export interface Snapshot<entry> {
  readonly entries: readonly entry[]
  readonly position: position
}

/** A query port: the input in, the snapshot out. */
export type QueryPort<query> =
  QueryParts<query> extends {
    input: infer input extends z.ZodType
    fields: infer fields extends z.ZodObject
  }
    ? (context: Now, input: z.input<input>) => Promise<Snapshot<z.output<fields>>>
    : never

/**
 * The query ports of a set of queries over a read adapter, with the registry
 * where the library finds the paths of their selection predicates; curried as
 * `command_ports`.
 */
export declare function query_ports<const queries extends Queries>(ports: {
  readonly registry: Registry
  readonly queries: queries
}): <selection, source, field>(
  adapter: ReadAdapter<queries, selection, source, field>,
) => {
  readonly [name in keyof queries]: QueryPort<queries[name]>
}
