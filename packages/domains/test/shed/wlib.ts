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

/**
 * The path of a selection predicate (DOM-18): the module `selection` has one
 * file per subject, so its subject's segment comes before its name.
 */
type SelectionPath = `${string}/selection/${string}/${string}`

/** The components of a union whose path is not of a kind: a fact where a predicate goes. */
type Strays<components, path extends string> = components extends unknown
  ? PathOf<components> extends path
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
export declare function AND<const components extends Components>(
  components: components & OneKind<components>,
): Composed<ComponentsParameters<components>, components, Leaves<components[keyof components]>>

/** At least one component holds. Its leaves are of one kind (`OneKind`). */
export declare function OR<const components extends Components>(
  components: components & OneKind<components>,
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

/**
 * A command's input: a schema, or a function of the part of the context its
 * validation needs (a static rule over `now`). The library builds it before
 * parsing. DOM-21
 */
export type CommandInput<inputSchema extends z.ZodType> =
  inputSchema | ((commandContext: CommandContext) => inputSchema)

/**
 * The schema of an input declared as a schema or as a function of a context
 * (DOM-21): the schema, or what the function returns.
 */
export type SchemaOf<input> = input extends z.ZodType
  ? input
  : input extends (context: never) => infer schema
    ? schema extends z.ZodType
      ? schema
      : never
    : never

export declare const $Command: unique symbol
/**
 * A command: its creator, its input as declared (`input`), from which the
 * generator writes `<command>_input` (DOM-25), and its parts for the library.
 */
export type Command<
  input extends CommandInput<z.ZodType>,
  outcomes extends Outcomes,
> = CommandCreator<SchemaOf<input>, outcomes> & {
  readonly input: input
  [$Command]: {
    input: SchemaOf<input>
    outcomes: outcomes
  }
}

/**
 * Branches whose conditions are made of predicates and whose facts are facts
 * are themselves; others ask for a field no command has, whose name says why
 * and whose type lists the paths of the strays. DOM-24
 */
export type PredicatesAndFacts<outcomes extends Outcomes> = [
  Strays<PredicatesOf<outcomes>, Path<'predicate'>> | Strays<FactsOf<outcomes>, Path<'fact'>>,
] extends [never]
  ? unknown
  : {
      readonly 'a condition is made of predicates, a branch records a fact (DOM-24)': PathOf<
        Strays<PredicatesOf<outcomes>, Path<'predicate'>> | Strays<FactsOf<outcomes>, Path<'fact'>>
      >
    }

/**
 * A command, declared in one argument whose parts have names: the input,
 * declared inline, the branches, and last the creator that binds them. DOM-25.
 * Its conditions are made of predicates and its facts are facts, checked by
 * type.
 */
export declare function command<
  const input extends CommandInput<z.ZodType>,
  const outcomes extends Outcomes,
>(command: {
  readonly input: input
  readonly outcomes: outcomes & PredicatesAndFacts<outcomes>
  readonly creator: CommandCreator<SchemaOf<input>, outcomes>
}): Command<input, outcomes>

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
 * operators. One algebra over the predicates serves every command, one over
 * the selection predicates of a subject every query (V12): each has one
 * translation in an adapter (ADP-8).
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
 * composed, each leaf apart (to name the failures), its write, and its fact
 * in its envelope, which the adapter records with the write, atomically
 * (DOM-8), for the streams to read (DOM-17).
 */
export interface PlannedBranch<fragment, write> {
  readonly condition: fragment
  readonly leaves: readonly fragment[]
  readonly write: write
  readonly fact: StoredEnvelope
}

/**
 * What the adapter's execution tells the library: the index of the applied
 * branch and the position of its fact; or, when none applies, the value of
 * every leaf of every branch, read in the same step or in a second one, as
 * the technology allows.
 */
export type Execution =
  | { readonly outcome: 'applied'; readonly branch: number; readonly position: position }
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
 * exhaustively as on an ADT (a `switch` on `path` with a `never` check, or a
 * record by path as `FactWrites`), and never reads the payload to know the
 * fact (D107). The other fields of the envelope come with their cases.
 */
export type Envelope<facts extends Component> = facts extends unknown
  ? {
      readonly path: PathOf<facts>
      readonly payload: z.output<facts>
      readonly resources: readonly Resource[]
    }
  : never

/**
 * A resource of a fact (DOM-10): an identity in its payload, by its path and
 * value (`loans/id/loan_id`, `L7`). The library derives a fact's resources
 * from its schema, finding the identities in the registry; nobody writes
 * them. In the paper they come from the mutation primitives (D107); in q-
 * the fact carries the change (V9), so they come from the fact.
 */
export interface Resource {
  readonly path: string
  readonly value: unknown
}

/** A fact's envelope as an adapter stores it: the library parses the payload by the path. */
export interface StoredEnvelope {
  readonly path: string
  readonly payload: unknown
  readonly resources: readonly Resource[]
}

/**
 * The outcome of a command (DOM-7), an ADT: one declared branch applied, with
 * its typed fact in its envelope and its position; or the rejection, naming
 * every failed predicate (DOM-6).
 */
export type CommandOutcome<outcomes extends Outcomes> =
  | {
      [branch in keyof outcomes & string]: {
        readonly outcome: 'applied'
        readonly branch: branch
        readonly position: position
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

/**
 * Every predicate of a set of commands, command by command: the outcomes of
 * two commands are two records, whose common keys would be none.
 */
type AllPredicates<commands extends Commands> = {
  [name in keyof commands]: PredicatesOf<OutcomesOf<commands[name]>>
}[keyof commands]

/** Every fact of a set of commands, command by command. */
type AllFacts<commands extends Commands> = {
  [name in keyof commands]: FactsOf<OutcomesOf<commands[name]>>
}[keyof commands]

/** What a state adapter gives for a set of commands, of one or more domains. */
export interface StateAdapter<commands extends Commands, fragment, write> {
  readonly algebra: Algebra<AllPredicates<commands>, fragment>
  readonly write: FactWrites<AllFacts<commands>, write>
  readonly execute: Execute<fragment, write>
}

/**
 * A domain's path registry (DOM-24), generated in `registry.ts`: every path
 * with its component, the map of the domain: identities, values, facts,
 * predicates, named conditions, commands and their inputs, selection
 * predicates, queries and their inputs, use cases. The configurator gives
 * the library the registries of the domains it composes; the library reads
 * them in reverse, from a component to its path, by object identity. One
 * object, one path.
 */
export type Registry = Readonly<Record<string, RegistryEntry>>

/**
 * What a registry maps a path to: a schema, an input that is a function of
 * the context (DOM-21), a command, a query, a use case.
 */
export type RegistryEntry =
  | z.ZodType
  | CommandInput<z.ZodType>
  | Commands[string]
  | Queries[string]
  | CommandUseCase<Commands[string]>
  | ReadUseCase<Queries[string]>
  | PersonaCommandUseCase<CommandUseCase<Commands[string]>, CommandInput<z.ZodType>, Events>

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

/** The selection predicates of a subject, from its generated module (`selection/loan.ts`), for an adapter's fragments. */
export type SelectionsIn<module> = ComponentsIn<module, 'selection'>

/** The facts declared in a generated module (`fact.ts`), for an adapter's writes. */
export type FactsIn<module> = ComponentsIn<module, 'fact'>

// ---------------------------------------------------------------------------
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
export type Order<fields extends z.ZodObject> = {
  readonly [field in keyof z.output<fields>]?: Direction
}

type BrandOf<value> = value extends { readonly [z.core.$brand]: infer brand }
  ? keyof brand & string
  : never

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
 * The subject of a selection predicate (DOM-18): its path up to the segment
 * after the module `selection`, the subject's file (`loans/selection/loan`);
 * a subject that grows into a folder keeps it. No folder is named `selection`
 * before the module (DOM-24). The library knows the subject only by this
 * path: what it is and where its candidates are is the adapter's (LIB-14).
 */
export type SubjectOf<leaf extends Component> =
  PathOf<leaf> extends `${infer head}/selection/${infer subject}/${string}`
    ? `${head}/selection/${subject}`
    : never

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
 * What a query declares besides its input and creator. Its `identity` is the
 * field that names an entry: an identity, unique per entry, which the
 * business's commands keep unique (`NOT(a_loan_has_this_id)`); the library
 * cannot check the uniqueness, the author declares it. It closes the order
 * (LIB-9) and names the entry in a stream (DOM-17).
 */
export interface QueryShape<
  fields extends z.ZodObject,
  identity extends string,
  selection extends Condition,
> {
  readonly fields: fields
  readonly identity: identity
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
/**
 * A query: its creator, its input as declared (`input`), from which the
 * generator writes `<query>_input` (DOM-25), and its parts for the library.
 */
export type Query<
  input extends QueryInput<z.ZodType>,
  fields extends z.ZodObject,
  identity extends string,
  selection extends Condition,
> = QueryCreator<SchemaOf<input>, selection> & {
  readonly input: input
  [$Query]: { input: SchemaOf<input> } & QueryShape<fields, identity, selection>
}

/**
 * A query, declared in one argument whose parts have names: the input,
 * declared inline, the fields, the identity, the selection, the order, and
 * last the creator that binds the selection. DOM-25. Its identity is a field
 * whose value is an identity, and the leaves of its selection come from one
 * subject, checked by type (DOM-18).
 */
export declare function query<
  const input extends QueryInput<z.ZodType>,
  fields extends z.ZodObject,
  const identity extends IdentityFields<fields>,
  const selection extends Condition,
>(
  query: { readonly input: input } & QueryShape<fields, identity, selection> & {
      readonly selection: OneSubject<selection>
      readonly creator: QueryCreator<SchemaOf<input>, selection>
    },
): Query<input, fields, identity, selection>

// Read adapters (LIB-14): the operators of the commands (ADP-8), a fragment
// per selection predicate, one source per query, one read. No concept of
// state here.

/** The queries of a domain, by name. */
export type Queries = Readonly<
  Record<
    string,
    {
      readonly [$Query]: { input: z.ZodType } & QueryShape<z.ZodObject, string, Condition>
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

/**
 * A query ready to read: the selection composed, the fields and the order as
 * fragments, the order closed by the identity; the identity by its field's
 * name and its path, for a stream to know which entries a fact touches.
 */
export interface PlannedQuery<selection, source, field> {
  readonly from: source
  readonly fields: Readonly<Record<string, field>>
  readonly identity: { readonly field: string; readonly path: string }
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

// ---------------------------------------------------------------------------
// Streams (DOM-17): a query read as a stream of facts, from a position (D64.3).
// An adapter's stream has no snapshot inside; the read use case composes the
// read at P and the stream from P (D72). A stream ends when its consumer
// stops, or on a terminal event.

/**
 * The events of a stream, a closed ADT (DOM-3). Every event but the terminal
 * one carries the position of the fact that caused it; resume is inclusive,
 * so a consumer deduplicates by position and identity (DOM-17).
 * - `fact`: the fact touched a candidate that the selection keeps after it:
 *   the fact in its envelope, the entry as it is after it (D72). A candidate
 *   that comes in through a fact that touches it comes this way, not as
 *   `entered`.
 * - `entered`: a candidate the fact did not touch now satisfies the
 *   selection, because a selection predicate reads another instance: its entry.
 * - `left`: a candidate, touched or not, no longer satisfies the selection:
 *   its identity only (D72.5).
 * - `caught_up`: the end of the historical part, once (D72.5).
 * - `position_unavailable`, terminal: the adapter no longer keeps the
 *   position; read the query again, then stream from its position (D73.3).
 */
export type StreamEvent<envelope, entry, identity> =
  | {
      readonly event: 'fact'
      readonly position: position
      readonly identity: identity
      readonly fact: envelope
      readonly entry: entry
    }
  | {
      readonly event: 'entered'
      readonly position: position
      readonly identity: identity
      readonly entry: entry
    }
  | { readonly event: 'left'; readonly position: position; readonly identity: identity }
  | { readonly event: 'caught_up'; readonly position: position }
  | { readonly event: 'position_unavailable' }

/**
 * The adapter's stream of a planned query, from a position: the events with
 * the entries and the facts as stored (the library parses them with the
 * query's fields and, by path, the registry).
 */
export type Stream<selection, source, field> = (
  plan: PlannedQuery<selection, source, field>,
) => (from: position) => AsyncIterable<StreamEvent<StoredEnvelope, unknown, unknown>>

/**
 * An event of the fact log, an ADT: a fact recorded at its position; the end
 * of what was recorded when the log was opened, once; or, terminal, a
 * position the adapter keeps no longer (D73.3).
 */
export type LogEvent =
  | { readonly event: 'fact'; readonly position: position; readonly fact: StoredEnvelope }
  | { readonly event: 'caught_up'; readonly position: position }
  | { readonly event: 'position_unavailable' }

/**
 * The adapter's fact log (DOM-17): the facts it records with their writes
 * (DOM-8), from a position on, inclusive, then each new one as it is
 * recorded. The library reads it to compose streams, and later to deliver
 * facts to reactions (step 8).
 */
export type FactLog = (from: position) => AsyncIterable<LogEvent>

/**
 * How an adapter streams a query (LIB-8), declared query by query, since
 * whether a stream scales depends on the technology and the data, not on the
 * business:
 * - `native`: the adapter's own stream (the oracle, a replication);
 * - `composed`: the library composes it from the adapter's read and fact
 *   log. For each fact after P it reads the query again and compares the
 *   entries with the previous ones by identity, as the oracle does (DOM-17):
 *   an entry the fact touches and that stays is the fact, a new untouched one
 *   entered, a missing one left. A whole read per fact of the domain: the
 *   adapter's author chooses it for the queries where that is cheap.
 * A query with no strategy is only read.
 */
export type StreamStrategy<selection, source, field> =
  | { readonly strategy: 'native'; readonly stream: Stream<selection, source, field> }
  | { readonly strategy: 'composed'; readonly log: FactLog }

/** The stream strategies of a set of queries, by name: a query may have none. */
export type Streams<queries extends Queries, selection, source, field> = {
  readonly [name in keyof queries]?: StreamStrategy<selection, source, field>
}

// ---------------------------------------------------------------------------
// Use cases (DOM-2, DOM-3, DOM-4): a domain's only entry. Personas, reactions
// and the effect executor reach a business domain through its use cases,
// never through its ports: its command is sent only by the domain, in its own
// store (DOM-8). A business use case does not know who asks (D85); what
// depends on the caller is the persona's.

export declare const $UseCase: unique symbol

/**
 * A command use case: the primary port of one command (DOM-4). In the
 * trivial case it declares only its command, so that it is a declared
 * boundary, not boilerplate: its input is the command's; its events are the
 * command's outcome, the first event and a terminal one (D72.3). Parts of its
 * own (an input and a creator, events after the outcome, their terminals)
 * come with the case that composes something.
 */
export interface CommandUseCase<command extends Commands[string]> {
  readonly [$UseCase]: { readonly command: command }
}

/** A command use case, declared in one argument whose parts have names (DOM-25). */
export declare function command_use_case<const command extends Commands[string]>(use_case: {
  readonly command: command
}): CommandUseCase<command>

// ---------------------------------------------------------------------------
// The persona's use cases (PER-6, D77): the leaves of its tree. A persona is
// a domain of its own (DOM-25), with its own language: a leaf invokes a
// business use case, conformist (D36), but its surface is the persona's,
// input and events, so that the persona can keep its contract when the
// business changes (PER-17, D75.6, GR-3). Always the full form: nothing
// derived from the business.

/**
 * The events of a persona's use case, by name: each a phrase of the
 * persona's language, its payload a schema (D72.1). A closed set (DOM-3).
 */
export type Events = Readonly<Record<string, z.ZodType>>

/**
 * One of the events of a use case, as a projection writes it: its name and
 * its payload, an input that the library parses with the event's schema.
 */
export type EventOf<events extends Events> = {
  [name in keyof events & string]: {
    readonly event: name
    readonly payload: z.input<events[name]>
  }
}[keyof events & string]

/** The command a business command use case runs. */
type CommandOfUseCase<use_case> = use_case extends { [$UseCase]: { command: infer command } }
  ? command
  : never

/** The input schema of the command a business command use case runs. */
type InputOfUseCase<use_case> =
  CommandOfUseCase<use_case> extends { [$Command]: { input: infer input extends z.ZodType } }
    ? input
    : never

/**
 * The persona's projection of a business command's outcome (D45): one
 * function per branch, from its fact's payload, and one for the rejection,
 * from its failures, each to one of the persona's events. Exhaustive, as a
 * match over an ADT: a new branch in the business does not compile in the
 * persona. What never leaves the node (the fact's resources, attribution,
 * versions, PER-18) is never given to it.
 */
export type Projection<outcomes extends Outcomes, events extends Events> = {
  readonly [branch in keyof outcomes]: (fact: z.output<outcomes[branch][1]>) => EventOf<events>
} & {
  readonly rejected: (failures: readonly Failure<outcomes>[]) => EventOf<events>
}

/**
 * A persona's command use case, a leaf of its tree: the business use case it
 * invokes, its own input as declared (`input`, from which the generator
 * writes `<use case>_input`, DOM-25) and its events.
 */
export interface PersonaCommandUseCase<
  use_case extends CommandUseCase<Commands[string]>,
  input extends CommandInput<z.ZodType>,
  events extends Events,
> {
  readonly input: input
  readonly [$UseCase]: { readonly use_case: use_case; readonly events: events }
}

/**
 * A persona's command use case, a leaf (`command_leaf`): apart from the
 * business's builder, since its parts are others. Declared in one argument whose parts have
 * names, in the order of the flow: the business use case, the persona's
 * input, the creator that turns it into the business's input, the persona's
 * events, the projection that turns the business's outcome into them. The
 * projected outcome is the first event and a terminal one (D72.3).
 */
export declare function command_leaf<
  const use_case extends CommandUseCase<Commands[string]>,
  const input extends CommandInput<z.ZodType>,
  const events extends Events,
>(use_case: {
  readonly use_case: use_case
  readonly input: input
  readonly creator: (
    context: Now,
  ) => (input: z.output<SchemaOf<input>>) => z.input<InputOfUseCase<use_case>>
  readonly events: events
  readonly projection: Projection<OutcomesOf<CommandOfUseCase<use_case>>, events>
}): PersonaCommandUseCase<use_case, input, events>

/** The command use cases of a domain, by name. */
export type CommandUseCases = Readonly<Record<string, CommandUseCase<Commands[string]>>>

/** The commands the use cases run, under the use cases' names. */
type CommandsOf<use_cases extends CommandUseCases> = {
  readonly [name in keyof use_cases]: use_cases[name][typeof $UseCase]['command']
}

/**
 * A command use case port: one message in, the stream of its events out
 * (DOM-3). The stream ends after a terminal event; a consumer that stops
 * listening does not cancel the command (D72.2).
 */
export type CommandUseCasePort<use_case> = use_case extends {
  [$UseCase]: { command: infer command }
}
  ? command extends { [$Command]: { input: infer input extends z.ZodType } }
    ? (
        context: CommandContext,
        input: z.input<input>,
      ) => AsyncIterable<CommandOutcome<OutcomesOf<command>>>
    : never
  : never

/**
 * The ports of a set of command use cases over a state adapter for their
 * commands, with the registry where the library finds the paths of their
 * predicates and facts. Curried, so that the use cases fix the types before
 * the adapter is written. The command ports stay inside the library.
 */
export declare function command_use_case_ports<const use_cases extends CommandUseCases>(ports: {
  readonly registry: Registry
  readonly use_cases: use_cases
}): <fragment, write>(
  adapter: StateAdapter<CommandsOf<use_cases>, fragment, write>,
) => { readonly [name in keyof use_cases]: CommandUseCasePort<use_cases[name]> }

/**
 * A read use case: the primary port of one query (DOM-2). One use case per
 * query, always a stream: with no position, its first event is the snapshot
 * (the entries and the position P they were read at, D66), then the events
 * of the stream from P (DOM-17); from a position, the stream alone (a resume).
 * The consumer takes what it needs and stops: the snapshot alone is a read,
 * up to `caught_up` a review, on and on a live view (D72, D72.2). The library
 * composes the read and the stream, so that a live view has no gap and no
 * double. A query the adapter does not stream gives the snapshot alone.
 */
export interface ReadUseCase<query extends Queries[string]> {
  readonly [$UseCase]: { readonly query: query }
}

/** A read use case, declared in one argument whose parts have names (DOM-25). */
export declare function read_use_case<const query extends Queries[string]>(use_case: {
  readonly query: query
}): ReadUseCase<query>

/** The read use cases of a domain, by name. */
export type ReadUseCases = Readonly<Record<string, ReadUseCase<Queries[string]>>>

/** The queries the use cases read, under the use cases' names. */
type QueriesOf<use_cases extends ReadUseCases> = {
  readonly [name in keyof use_cases]: use_cases[name][typeof $UseCase]['query']
}

/** The first event of a read: the entries and the position read at. */
export interface SnapshotEvent<entry> extends Snapshot<entry> {
  readonly event: 'snapshot'
}

/** The events of a read use case that streams: the snapshot, then the stream's (DOM-17). */
export type ReadEvent<envelope, entry, identity> =
  SnapshotEvent<entry> | StreamEvent<envelope, entry, identity>

/**
 * A read use case port, typed by what its adapter gives: with a stream, the
 * input and an optional position in, the snapshot and the stream out, the
 * facts typed by the registry's, the entries by the query's fields, the
 * identity by its field; with none, the input in, the snapshot alone out.
 * `streamed` says which, at runtime and in the type: by subtyping a port that
 * gives the snapshot alone would serve a consumer of every event, so a
 * consumer that needs a live view asks for `streamed: true` (`Streamed`).
 */
export type ReadUseCasePort<query, facts extends Component, streamed extends boolean> =
  QueryParts<query> extends {
    input: infer input extends z.ZodType
    fields: infer fields extends z.ZodObject
    identity: infer identity extends string
  }
    ? streamed extends true
      ? ((
          context: Now,
          input: z.input<input>,
          from?: position,
        ) => AsyncIterable<
          ReadEvent<
            Envelope<facts>,
            z.output<fields>,
            z.output<fields>[identity & keyof z.output<fields>]
          >
        >) &
          Streamed
      : ((
          context: Now,
          input: z.input<input>,
        ) => AsyncIterable<SnapshotEvent<z.output<fields>>>) & { readonly streamed: false }
    : never

/** What a consumer of a live view asks of a read use case port. */
export interface Streamed {
  readonly streamed: true
}

/**
 * The ports of a set of read use cases over a read adapter and the stream
 * strategies it declares, with the registry where the library finds the
 * paths of their selection predicates and of the facts a stream carries (a
 * stream reads the facts of a domain, D64.1). Curried as
 * `command_use_case_ports`.
 */
export declare function read_use_case_ports<
  const registry extends Registry,
  const use_cases extends ReadUseCases,
>(ports: {
  readonly registry: registry
  readonly use_cases: use_cases
}): <
  selection,
  source,
  field,
  const streams extends Streams<QueriesOf<use_cases>, selection, source, field>,
>(
  adapter: ReadAdapter<QueriesOf<use_cases>, selection, source, field> & {
    readonly streams: streams
  },
) => {
  readonly [name in keyof use_cases]: ReadUseCasePort<
    QueriesOf<use_cases>[name],
    FactsIn<registry>,
    name extends keyof streams ? true : false
  >
}
