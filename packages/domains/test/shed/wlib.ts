import * as z from 'zod'

// Formats (DOM-24): branded values with no word of a domain. A format's brand
// is its name: no domain path is a bare name, so it meets no domain's brand.

/** An instant, ISO 8601 with the time zone. */
export const date_time = z.iso.datetime().brand<'date_time'>()
export type date_time = z.output<typeof date_time>

/** A calendar day, `YYYY-MM-DD`. */
export const day = z.iso.date().brand<'day'>()
export type day = z.output<typeof day>

/**
 * The context every root of a tree takes, given by the entry (PER-6): the
 * instant of the request, from a trusted frame (D99.4), one for the request,
 * so that the library's mechanisms and the domain's creators read the same.
 * The application extends it (declaration merging) with what every root has
 * and every invocation carries over; what only one tree's entry gives goes in
 * the context its root node takes. A node extends the context of its point,
 * never rewrites it, and one context serves everything below it (commands,
 * queries, use cases); a construct declares only the part it reads (`Now`),
 * so that it serves any context that has it. When a leaf invokes another
 * tree, the library gives its root this context, copied, and nothing else
 * (D105.1).
 */
export interface RootContext {
  readonly now: date_time
}

/** The part of the context a construct that reads only the time declares. */
export type Now = Pick<RootContext, 'now'>

/** An operation's identity (DOM-11, DOM-12): created before the first attempt, kept on a retry. */
export const operation_id = z.string().min(1).brand<'operation_id'>()
export type operation_id = z.output<typeof operation_id>

/**
 * The operation of a command (DOM-11): its identity and the scope it is
 * unique in, which the entry composes (in the paper, `Caller` + hat) and the
 * library does not read. The duplicate branch is keyed on both.
 */
export interface Operation {
  readonly id: operation_id
  readonly scope: string
}

/**
 * What the library adds to the context of a command, at its point of the
 * tree, for its own mechanisms: its operation. A read has none.
 */
export interface OperationContext {
  readonly operation: Operation
}

/**
 * The correlation of a chain of facts born of one intention (DOM-10, D56, §
 * "La busta e la pila"): created at the origin, by the client if it gives
 * one (D72.7), else by the entry; neither a secret nor a permission. Every
 * fact, outbox entry and event derived from a fact keeps it: a reaction
 * invokes with the correlation of the fact it reacts to, the executor
 * returns with the entry's, which is the fact's that queued it. Not part of
 * the operation's identity (DOM-11): a retry keeps both. A, 16 Nov 2026 (5)
 */
export const correlation = z.string().min(1).brand<'correlation'>()
export type correlation = z.output<typeof correlation>

/**
 * What the library adds to the context of a command's port, beside its
 * operation: its correlation, which it writes into the envelope. A creator
 * never sees it: no business decides on it.
 */
export interface CorrelationContext {
  readonly correlation: correlation
}

/** The context of a command at the root of its tree: what its port takes. */
export type CommandRootContext = RootContext & OperationContext & CorrelationContext

/**
 * The path of a component (DOM-24, DOM-25): its folders from the root, the
 * kind of its construct, which its builder gives, and its export's name, as
 * in `business/tools/fact/a_tool_has_been_added`; the file it sits in is not
 * in it. No folder is named as a kind.
 */
export type Path<kind extends string> = `${string}/${kind}/${string}`

// ---------------------------------------------------------------------------
// The builders of the components (DOM-25): an export built by a builder of the
// library is a component, and its builder gives the kind of its construct,
// the segment of its path after its folders; an exported zod schema is a value
// (DOM-21); the rest (the functions of `dsl`, helpers) the library ignores. The
// generator imports the authored files, which are pure, and finds the
// components by their builder: the files are named and grouped as the author
// likes. Each returns what it is given, for the generator to brand. None is
// exported: the authored files reach them through `Builders`, from the scope
// of their kind (`_scope_fact.ts`, `fact`).

/** An identity (DOM-24): the format of the values that name an instance. */
export type IdBuilder = <const format extends z.ZodType>(id: { readonly format: format }) => format

/**
 * The identity of the instance an operation opens, derived from the
 * operation (D75.8: the domain chooses a resource's id per operation): one
 * operation records one fact (DOM-11), so it opens one instance, and a retry
 * or a redelivery, the duplicate branch, gives back the same. It serves a
 * command whose caller cannot name the instance: a reaction, whose
 * translation reads only the fact (the repair a damaged return opens), and
 * a keeper's client alike (the repair of a drill found broken on the shelf).
 * A stable function of the library, in the stability corpus (LIB-10): the
 * operation's scope and id, in the identity's format. A string format only,
 * until a case asks for another. A, 16 Nov 2026 (4)
 */
export declare const identity_of: <identity extends z.ZodType<string>>(
  identity: identity,
) => (operation: Operation) => z.output<identity>

/** A fact (DOM-5): its payload, at least every value its change writes. */
export type FactBuilder = <const payload extends z.ZodObject>(fact: {
  readonly payload: payload
}) => payload

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

/**
 * An effect (DOM-13, D108.1): what the domain asks of the world, named by a
 * business phrase, and its payload, what the delivery needs. A branch queues
 * it with its fact; the domain never runs it (D12).
 */
export type EffectBuilder = <const payload extends z.ZodObject>(effect: {
  readonly payload: payload
}) => payload

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
export type AndBuilder = <const components extends Components>(
  components: components & OneKind<components>,
) => Composed<ComponentsParameters<components>, components, Leaves<components[keyof components]>>

/** At least one component holds. Its leaves are of one kind (`OneKind`). */
export type OrBuilder = <const components extends Components>(
  components: components & OneKind<components>,
) => Composed<ComponentsParameters<components>, components, Leaves<components[keyof components]>>

/** The condition does not hold: its parameters are the condition's. */
export type NotBuilder = <const condition extends Condition>(
  condition: condition,
) => Composed<condition, condition, Leaves<condition>>

/**
 * The outbox entries of a branch, by name (DOM-5, DOM-13): each an effect,
 * queued with the branch's fact, in the same atomic step (D12).
 */
export type Entries = Readonly<Record<string, Component>>

/**
 * Some members of a namespace, under their own names: the outbox entries of a
 * branch are its effects by name, `pick(effect, 'wait_until_the_due_date')`
 * for `{ wait_until_the_due_date: effect.wait_until_the_due_date }`. A name
 * the namespace does not export does not compile. Not a builder: it builds no
 * component, it names some.
 */
export declare function pick<
  const namespace extends object,
  const names extends readonly (keyof namespace & string)[],
>(namespace: namespace, ...names: names): { readonly [name in names[number]]: namespace[name] }

/**
 * A branch, declared: the condition, the fact it records and, if it asks
 * the world for something, its outbox entries. DOM-5
 */
export type Outcome =
  | readonly [condition: Condition, fact: Component]
  | readonly [condition: Condition, fact: Component, entries: Entries]
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
  readonly [k in keyof outcomes]: outcomes[k] extends readonly [
    Condition,
    Component,
    infer entries extends Entries,
  ]
    ? readonly [
        condition: ConditionInput<outcomes[k][0]>,
        fact: z.input<outcomes[k][1]>,
        entries: ResolvedEntries<entries>,
      ]
    : readonly [condition: ConditionInput<outcomes[k][0]>, fact: z.input<outcomes[k][1]>]
}

/** The identity of an outbox entry (DOM-13, D48): written by the domain, the key sent outside with its effect. */
export const entry_id = z.string().min(1).brand<'entry_id'>()
export type entry_id = z.output<typeof entry_id>

/**
 * A branch's outbox entries as the creator resolves them, under the same
 * names (DOM-13, D108.1): the entry's id, from the domain's values, so that
 * the pair (effect, id) is the key sent outside and the identity of the
 * return's operation (DOM-14); its payload; and, if it waits, the instant it
 * may go at the earliest, `not_before`, which the creator computes with the
 * clock as a parameter (D48): after a downtime the entry goes late, never
 * skipped. The paper leaves the form of the delay open (A, 13 Nov 2026 (3)).
 */
export type ResolvedEntries<entries extends Entries> = {
  readonly [name in keyof entries]: {
    readonly id: z.input<typeof entry_id>
    readonly payload: z.input<entries[name]>
    readonly not_before?: z.input<typeof date_time>
  }
}

/**
 * A command's creator: from the part of the context it declares, which the
 * tree must give at the command's point (the generator checks it), and the
 * input, the resolved branches.
 */
export type CommandCreator<
  inputSchema extends z.ZodType,
  outcomes extends Outcomes,
  context = never,
> = (context: context) => (input: z.output<inputSchema>) => ResolvedOutcomes<outcomes>

/**
 * A command's input: a schema, or a function of the part of the context its
 * validation needs (a static rule over `now`). The library builds it before
 * parsing. DOM-21
 */
export type CommandInput<inputSchema extends z.ZodType, context = never> =
  inputSchema | ((context: context) => inputSchema)

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
  context,
> = CommandCreator<SchemaOf<input>, outcomes, context> & {
  readonly input: input
  [$Command]: {
    input: SchemaOf<input>
    outcomes: outcomes
  }
}

/**
 * Branches whose conditions are made of predicates, whose facts are facts
 * and whose entries are effects are themselves; others ask for a field no
 * command has, whose name says why and whose type lists the paths of the
 * strays. DOM-24
 */
export type PredicatesAndFacts<outcomes extends Outcomes> = [
  | Strays<PredicatesOf<outcomes>, Path<'predicate'>>
  | Strays<FactsOf<outcomes>, Path<'fact'>>
  | Strays<EffectsOf<outcomes>, Path<'effect'>>,
] extends [never]
  ? unknown
  : {
      readonly 'a condition is made of predicates, a branch records a fact and queues effects (DOM-24)': PathOf<
        | Strays<PredicatesOf<outcomes>, Path<'predicate'>>
        | Strays<FactsOf<outcomes>, Path<'fact'>>
        | Strays<EffectsOf<outcomes>, Path<'effect'>>
      >
    }

/**
 * A command, declared in one argument whose parts have names: the input,
 * declared inline, the branches, and last the creator that binds them. DOM-25.
 * Its conditions are made of predicates and its facts are facts, checked by
 * type. Its creator and its input read the context of its point of the tree
 * with its operation (`command`, `Builders`).
 */
export type CommandBuilder<context> = <
  const input extends CommandInput<z.ZodType, context & OperationContext>,
  const outcomes extends Outcomes,
>(command: {
  readonly input: input
  readonly outcomes: outcomes & PredicatesAndFacts<outcomes>
  readonly creator: CommandCreator<SchemaOf<input>, outcomes, context & OperationContext>
}) => Command<input, outcomes, context & OperationContext>

// ---------------------------------------------------------------------------
// The step of a process with a cursor (DOM-20, D97, D111, D112): a command for
// whoever invokes it, its path under `command/` (DOM-19). It reads the
// process by its key, chooses the next instance of the process's selection
// after its cursor, and applies to it the transition of another command,
// recording one fact with the step's part and the transition's (D111); or,
// none left, it closes the process. Only a process with a cursor needs it.

export declare const $Step: unique symbol

/**
 * The facts of a step, under the library's names, since every step has
 * these two (D112.2): `advances`, the step's part beside the transition's,
 * which keeps the cursor at the instance handled, a field of its own that the
 * library writes (the order key, D109); and `completes`, the closing. The
 * author writes no condition: the library adds to the choice the comparison
 * with the cursor and the conditions of the composed transition, and closes
 * when no instance is left.
 */
export interface StepOutcomes {
  readonly advances: Component
  readonly completes: Component
}

/** The input schema of a command. */
type InputOf<command> = command extends { [$Command]: { input: infer input extends z.ZodType } }
  ? input
  : never

/** The fields of a payload whose value is a cursor: where a step's part keeps it. */
type CursorFields<payload> = {
  [field in keyof payload]-?: payload[field] extends cursor ? field : never
}[keyof payload]

/**
 * What a step's creator resolves from the process it read: the parameters of
 * the selection (D97.1); the input of the composed transition from the
 * instance chosen (`composes`); the payload of each fact, under its name,
 * the step's part without its cursor, which the library writes (DOM-20). A
 * mapped type over the facts, so that their literals keep their types.
 */
export type ResolvedStep<
  selection extends Condition,
  fields extends z.ZodObject,
  composes,
  outcomes extends StepOutcomes,
> = {
  readonly selection: ConditionInput<selection>
  readonly composes: (instance: z.output<fields>) => z.input<InputOf<composes>>
} & {
  readonly [fact in keyof outcomes]: fact extends 'advances'
    ? Omit<z.input<outcomes[fact]>, CursorFields<z.output<outcomes[fact]>>>
    : z.input<outcomes[fact]>
}

/**
 * A step's creator: from the part of the context it declares, the input and
 * the process it read (`reads`), what it resolves. The library reads the
 * cursor in the process by its brand, and writes the next in the step's
 * part: the author never builds it.
 */
export type StepCreator<
  inputSchema extends z.ZodType,
  reads extends z.ZodType,
  selection extends Condition,
  fields extends z.ZodObject,
  composes,
  outcomes extends StepOutcomes,
  context = never,
> = (
  context: context,
) => (
  input: z.output<inputSchema>,
) => (read: z.output<reads>) => ResolvedStep<selection, fields, composes, outcomes>

/**
 * A step: for whoever invokes it a command whose branches are `advances` and
 * `completes` (`$Command`); for the library its parts (`$Step`).
 */
export type CursorStep<
  input extends CommandInput<z.ZodType>,
  reads extends z.ZodType,
  fields extends z.ZodObject,
  identity extends string,
  selection extends Condition,
  composes extends Commands[string],
  outcomes extends StepOutcomes,
  context,
> = StepCreator<SchemaOf<input>, reads, selection, fields, composes, outcomes, context> & {
  readonly input: input
  [$Command]: {
    input: SchemaOf<input>
    outcomes: {
      readonly advances: readonly [condition: never, fact: outcomes['advances']]
      readonly completes: readonly [condition: never, fact: outcomes['completes']]
    }
  }
  [$Step]: { reads: reads; composes: composes } & QueryShape<fields, identity, selection>
}

/**
 * The facts of a step are facts, and its part keeps the cursor; others ask
 * for a field no step has, whose name says why and whose type lists the
 * paths of the strays, or the part's. DOM-24, DOM-20
 */
export type StepFacts<outcomes extends StepOutcomes> = [
  Strays<outcomes[keyof outcomes], Path<'fact'>>,
] extends [never]
  ? [CursorFields<z.output<outcomes['advances']>>] extends [never]
    ? {
        readonly 'the part of a step keeps the cursor, a field of its own (DOM-20)': PathOf<
          outcomes['advances']
        >
      }
    : unknown
  : {
      readonly 'a step records facts (DOM-24)': PathOf<
        Strays<outcomes[keyof outcomes], Path<'fact'>>
      >
    }

/**
 * A step, declared in one argument whose parts have names (DOM-25): its
 * input, declared inline; what it reads (`reads`): the process by its key
 * from the input, in the stage that steps, which holds the cursor (the
 * generator checks it holds one); the instances it walks, as a query
 * declares them (`fields`, `identity`, `selection`, `order`: the order
 * closed by the identity, D109); the transition it applies to each
 * (`composes`, D111: a command, with no use case of its own if no one else
 * invokes it); its facts (`outcomes`); last the creator. Its selection is of
 * one subject and its facts are facts, checked by type.
 *
 * One message: the adapter reads, chooses and writes in one transaction,
 * the plan carrying the pure functions of the read and of the choice (A,
 * 16 Nov 2026). A process not found in the stage the step reads (none, or
 * closed) is no expected occurrence: the step is rejected, naming the read.
 */
export type CursorStepBuilder<context> = <
  const input extends CommandInput<z.ZodType, context & OperationContext>,
  const reads extends z.ZodType,
  fields extends z.ZodObject,
  const identity extends IdentityFields<fields>,
  const selection extends Condition,
  const composes extends Commands[string],
  const outcomes extends StepOutcomes,
>(
  step: { readonly input: input; readonly reads: reads } & QueryShape<
    fields,
    identity,
    selection
  > & {
      readonly selection: OneSubject<selection>
      readonly composes: composes
      readonly outcomes: outcomes & StepFacts<outcomes>
      readonly creator: StepCreator<
        SchemaOf<input>,
        reads,
        selection,
        fields,
        composes,
        outcomes,
        context & OperationContext
      >
    },
) => CursorStep<
  input,
  reads,
  fields,
  identity,
  selection,
  composes,
  outcomes,
  context & OperationContext
>

// ---------------------------------------------------------------------------
// Adapters (LIB-14): typed tools to implement the command port. The library
// derives what an adapter must cover and types the outcome. The algebra of
// fragments below is one way, recommended (ADP-8), not required: the adapter
// implements the port as it wants. No concept of state here.

/** Every predicate a command's branches use. */
export type PredicatesOf<outcomes extends Outcomes> = Leaves<outcomes[keyof outcomes][0]>

/** Every fact a command can record. */
export type FactsOf<outcomes extends Outcomes> = outcomes[keyof outcomes][1]

/** The effects of a branch's entries, none if it has no entries. */
type EffectsOfOutcome<outcome> = outcome extends readonly [
  Condition,
  Component,
  infer entries extends Entries,
]
  ? entries[keyof entries]
  : never

/** Every effect a command can queue. */
export type EffectsOf<outcomes extends Outcomes> = EffectsOfOutcome<outcomes[keyof outcomes]>

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
 * What a branch writes: its writes, one per part of its fact, in the order
 * of the parts (a command's one; a step's two, the step's part, then the
 * composed transition's, DOM-10), its fact in its envelope and its outbox
 * entries, which the adapter records with the writes, atomically (DOM-8,
 * D12), for the streams (DOM-17) and the effect executor (DOM-14) to read.
 */
export interface PlannedWrite<write> {
  readonly writes: readonly write[]
  readonly fact: StoredEnvelope
  readonly entries: readonly StoredEntry[]
}

/**
 * A branch ready to execute, in the order of the branches: its condition
 * composed, each leaf apart (to name the failures), and what it writes.
 */
export interface PlannedBranch<fragment, write> extends PlannedWrite<write> {
  readonly condition: fragment
  readonly leaves: readonly fragment[]
}

/**
 * An outbox entry as an adapter stores it (DOM-13): the path of its effect,
 * its id, its payload (the library parses it by the path) and the instant it
 * may go at the earliest.
 */
export interface StoredEntry {
  readonly effect: string
  readonly id: entry_id
  readonly payload: unknown
  readonly not_before?: date_time
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

/**
 * A field of the order key after which a step chooses (DOM-20, D109): the
 * adapter's fragment of the field, its direction, and its value, which the
 * library decodes from the cursor (D114).
 */
export interface OrderKeyValue<field> {
  readonly field: field
  readonly direction: Direction
  readonly value: unknown
}

/**
 * The operators of the selection of a step's instances: a query's, and the
 * comparison with the cursor (`after`): the instances after the order key,
 * its fields then the identity, lexicographic, a descending field reversed,
 * in the value order of LIB-9.
 */
export interface StepAlgebra<predicates extends Component, selection, field> extends Algebra<
  predicates,
  selection
> {
  readonly after: (key: readonly OrderKeyValue<field>[]) => selection
}

/**
 * The choice of a step (D112.2), an ADT: the process not found in the stage
 * the step reads, nothing to write (the library names the read); or the walk
 * over the instances, in the order closed by the identity (D109):
 * - `instances`: the selection's instances after the cursor (every one,
 *   before the first step);
 * - `advances`: for an instance as read (its fields), the branches of the
 *   composed transition, each with the step's part, its cursor at the
 *   instance, before the transition's;
 * - `passing_over`: the instances after one on which no branch of the
 *   transition holds, which the choice passes over: the conditions of the
 *   transition are part of the choice (D112.2, A, 16 Nov 2026 (3));
 * - `completes`: none left, the closing.
 */
export type StepChoice<fragment, write, selection, source, field> =
  | { readonly choice: 'not_found' }
  | {
      readonly choice: 'walk'
      readonly instances: PlannedQuery<selection, source, field>
      readonly advances: (instance: unknown) => readonly PlannedBranch<fragment, write>[]
      readonly passing_over: (instance: unknown) => PlannedQuery<selection, source, field>
      readonly completes: PlannedWrite<write>
    }

/**
 * A step ready to execute (DOM-20), in one transaction of the adapter (one
 * message, A, 16 Nov 2026): the read of its process (`read`), whose result,
 * as stored or none, the adapter gives to `choose`, pure, the library's: it
 * parses the process with the read's schema, runs the creator and plans the
 * choice.
 */
export interface PlannedStep<fragment, write, read, selection, source, field> {
  readonly read: read
  readonly choose: (process: unknown) => StepChoice<fragment, write, selection, source, field>
}

/**
 * What the adapter's execution of a step tells the library: it advanced, at
 * an instance as read, the index of the transition's branch applied and the
 * position of its fact; it completed, at its position; or the process was
 * not found in the stage the step reads.
 */
export type StepExecution =
  | {
      readonly outcome: 'advanced'
      readonly instance: unknown
      readonly branch: number
      readonly position: position
    }
  | { readonly outcome: 'completed'; readonly position: position }
  | { readonly outcome: 'not_found' }

/**
 * The execution of a planned step, in one consistent step of the adapter:
 * it reads the process; not found, nothing writes; else, the instances in
 * order, the first on which a branch of the transition holds writes that
 * branch, the instances before it passed over; none left, the closing
 * writes. The oracle filters; SQL reads one instance at a time (`limit 1`),
 * then the next past one passed over, in the same transaction.
 */
export type ExecuteStep<fragment, write, read, selection, source, field> = (
  plan: PlannedStep<fragment, write, read, selection, source, field>,
) => Promise<StepExecution>

/** A failed predicate, where it stands: its branch, its components' names, its path. */
export interface Failure<outcomes extends Outcomes> {
  readonly branch: keyof outcomes & string
  readonly components: readonly string[]
  readonly predicate: PathOf<PredicatesOf<outcomes>>
}

/**
 * A part of a fact (DOM-10): its path apart from its payload, as in the paper
 * (D56, D101.2), and its resources. Whoever consumes facts matches on the
 * path of each part, exhaustively as on an ADT (a `switch` on `path` with a
 * `never` check, or a record by path as `FactWrites`), and never reads the
 * payload to know the fact (D107).
 */
export type Part<facts extends Component> = facts extends unknown
  ? {
      readonly path: PathOf<facts>
      readonly payload: z.output<facts>
      readonly resources: readonly Resource[]
    }
  : never

/**
 * A fact in its event envelope (DOM-10): its parts, one per branch applied
 * (D111), in order; a command records one, a step two (the step's, then the
 * composed transition's), and every consumer reads them alike (A, 16 Nov
 * 2026 (2)). A part is named by its position in the fact. The operation that
 * recorded the fact is its identity: one operation in its scope records one
 * fact (DOM-11), and it travels with the fact through any adapter, where a
 * position may be renumbered; a reaction derives its own operation from it
 * and the part (LIB-10, A, 16 Nov 2026). Its correlation is the chain's
 * (`correlation`), kept by every fact derived from it, so that Marta's
 * return follows the repair it opens (A, 16 Nov 2026 (5)). The other fields
 * of the envelope come with their cases.
 */
export interface Envelope<parts extends readonly StoredPart[]> {
  readonly parts: parts
  readonly operation: Operation
  readonly correlation: correlation
}

/**
 * A resource of a fact (DOM-10): an identity in its payload, by its path and
 * value (`business/loans/id/loan_id`, `L7`). The library derives a fact's resources
 * from its schema, finding the identities in the registry; nobody writes
 * them. In the paper they come from the mutation primitives (D107); in q-
 * the fact carries the change (V9), so they come from the fact.
 */
export interface Resource {
  readonly path: string
  readonly value: unknown
}

/** A part of a fact as an adapter stores it: the library parses the payload by the path. */
export interface StoredPart {
  readonly path: string
  readonly payload: unknown
  readonly resources: readonly Resource[]
}

/** A fact's envelope as an adapter stores it. */
export type StoredEnvelope = Envelope<readonly StoredPart[]>

/**
 * The outcome of a command (DOM-7), an ADT: one declared branch applied, with
 * its typed fact in its envelope and its position; the rejection, naming
 * every failed predicate (DOM-6); or, from the duplicate branch, the identity
 * of the operation already used with another fingerprint (DOM-11, D79.4),
 * which no projection sees: it crosses a use case over another as it is.
 */
export type CommandOutcome<outcomes extends Outcomes> =
  | {
      [branch in keyof outcomes & string]: {
        readonly outcome: 'applied'
        readonly branch: branch
        readonly position: position
        readonly fact: Envelope<readonly [Part<outcomes[branch][1]>]>
      }
    }[keyof outcomes & string]
  | { readonly outcome: 'rejected'; readonly failures: readonly Failure<outcomes>[] }
  | { readonly outcome: 'identity_already_used' }

/**
 * A step's rejection (DOM-20): the process is not in the stage the step
 * reads, named by the read's path, which the library finds in the registry
 * (a value carries no path of its own in its type).
 */
export interface ReadFailure {
  readonly read: string
}

/**
 * The outcome of a step (DOM-20), an ADT: it advanced, its fact composite,
 * the step's part, then the part of the composed command's applied branch
 * (DOM-10, D111); it completed, the closing part alone; it was rejected, the
 * process not in the stage the step reads; or, from the duplicate branch,
 * the identity of the operation was already used (DOM-11).
 */
export type StepOutcome<step> = step extends {
  [$Command]: {
    outcomes: {
      advances: readonly [never, infer advances extends Component]
      completes: readonly [never, infer completes extends Component]
    }
  }
  [$Step]: { composes: infer composes }
}
  ? | {
        readonly outcome: 'applied'
        readonly branch: 'advances'
        readonly position: position
        readonly fact: Envelope<readonly [Part<advances>, Part<FactsOf<OutcomesOf<composes>>>]>
      }
    | {
        readonly outcome: 'applied'
        readonly branch: 'completes'
        readonly position: position
        readonly fact: Envelope<readonly [Part<completes>]>
      }
    | { readonly outcome: 'rejected'; readonly failures: readonly ReadFailure[] }
    | { readonly outcome: 'identity_already_used' }
  : never

/** The outcome of a command, or of a step when the command is one. */
export type OutcomeOf<command> = command extends { [$Step]: unknown }
  ? StepOutcome<command>
  : CommandOutcome<OutcomesOf<command>>

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

/** A command and, for a step, the transition it composes (D111): an adapter covers both. */
type WithComposed<command> =
  command | (command extends { [$Step]: { composes: infer composes } } ? composes : never)

/** The predicates of each command of a union, one by one. */
type PredicatesOfEach<command> = command extends unknown ? PredicatesOf<OutcomesOf<command>> : never

/** The facts of each command of a union, one by one. */
type FactsOfEach<command> = command extends unknown ? FactsOf<OutcomesOf<command>> : never

/**
 * Every predicate of a set of commands, and of the transitions their steps
 * compose, command by command: the outcomes of two commands are two
 * records, whose common keys would be none.
 */
type AllPredicates<commands extends Commands> = {
  [name in keyof commands]: PredicatesOfEach<WithComposed<commands[name]>>
}[keyof commands]

/** Every fact of a set of commands, and of the transitions their steps compose, command by command. */
type AllFacts<commands extends Commands> = {
  [name in keyof commands]: FactsOfEach<WithComposed<commands[name]>>
}[keyof commands]

/** The steps among a set of commands, by name (DOM-20). */
type StepsAmong<commands extends Commands> = {
  readonly [
    name in keyof commands as commands[name] extends { [$Step]: unknown } ? name : never
  ]: commands[name]
}

/** The parts of a step for the library: what it reads, composes, and walks. */
type StepParts<step> = step extends { [$Step]: infer parts } ? parts : never

/** The schema of the instances a step walks, as a query's entries. */
type StepFieldsOf<step> =
  StepParts<step> extends { fields: infer fields extends z.ZodObject } ? fields : never

/** Every selection predicate the selections of a set of steps use. */
type StepSelections<steps extends Commands> =
  StepParts<steps[keyof steps]> extends { selection: infer selection extends Condition }
    ? Leaves<selection>
    : never

/**
 * Where a step finds what it reads (DOM-20): its process, by its key from
 * the step's input (`reads`), as stored, which the library parses with the
 * read's schema (none, or in another stage, is the step's rejection); its
 * instances, as a query's candidates (`from`, `fields`).
 */
export interface StepSource<step, read, source, field> extends QuerySource<
  StepFieldsOf<step>,
  source,
  field
> {
  readonly reads: (input: z.output<InputOf<step>>) => read
}

/**
 * What a state adapter gives for the steps among its commands (DOM-20): the
 * operators of the selection of their instances, with the comparison with
 * the cursor; where each finds its process and its instances, under the
 * step's name; the execution. Its fragments of reads are of three types, as
 * a read adapter's (`ReadAdapter`), and one more, the read of a process.
 */
export interface StepAdapter<
  steps extends Commands,
  fragment,
  write,
  read,
  selection,
  source,
  field,
> {
  readonly selection: StepAlgebra<StepSelections<steps>, selection, field>
  readonly sources: {
    readonly [name in keyof steps]: StepSource<steps[name], read, source, field>
  }
  readonly execute: ExecuteStep<fragment, write, read, selection, source, field>
}

/**
 * What a state adapter gives for a set of commands, of one or more domains:
 * the predicates and the facts of the commands and of the transitions their
 * steps compose; and, if there are steps among them, what they read.
 */
export type StateAdapter<
  commands extends Commands,
  fragment,
  write,
  read = never,
  selection = never,
  source = never,
  field = never,
> = {
  readonly algebra: Algebra<AllPredicates<commands>, fragment>
  readonly write: FactWrites<AllFacts<commands>, write>
  readonly execute: Execute<fragment, write>
} & ([keyof StepsAmong<commands>] extends [never]
  ? unknown
  : {
      readonly steps: StepAdapter<
        StepsAmong<commands>,
        fragment,
        write,
        read,
        selection,
        source,
        field
      >
    })

/**
 * A domain's path registry (DOM-24), generated in `_registry.ts`: every path
 * with its component, the map of the domain: identities, values, facts,
 * predicates, named conditions, commands and their inputs, selection
 * predicates, queries and their inputs, use cases, lookups, reactions. The configurator gives
 * the library the registries of the domains it composes; the library reads
 * them in reverse, from a component to its path, by object identity. One
 * object, one path.
 */
export type Registry = Readonly<Record<string, RegistryEntry>>

/**
 * What a registry maps a path to: a schema, an input that is a function of
 * the context (DOM-21), a command, a query, a use case, a lookup.
 */
export type RegistryEntry =
  | z.ZodType
  | CommandInput<z.ZodType>
  | Commands[string]
  | Queries[string]
  | CommandUseCase<Commands[string]>
  | ReadUseCase<Queries[string]>
  | CommandUseCaseOver<
      CommandUseCase<Commands[string]>,
      CommandInput<z.ZodType>,
      Events,
      unknown,
      unknown
    >
  | ReadUseCaseOver<
      ReadUseCase<Queries[string]>,
      QueryInput<z.ZodType>,
      z.ZodObject,
      unknown,
      LeafStream | undefined
    >
  | Lookup<z.ZodType, z.ZodType>
  | Node<unknown, RootContext, unknown>
  | Reaction<Component, CommandUseCase<Commands[string]>>

/** The components of a generated module of one kind. */
type ComponentsIn<module, kind extends string> = {
  [name in keyof module]: module[name] extends Component
    ? PathOf<module[name]> extends Path<kind>
      ? module[name]
      : never
    : never
}[keyof module]

/** The predicates declared in a generated module (`_predicate.ts`), for an adapter's fragments. */
export type PredicatesIn<module> = ComponentsIn<module, 'predicate'>

/** The selection predicates of a generated module (`_loan_selection.ts`, one subject in Shed), for an adapter's fragments. */
export type SelectionsIn<module> = ComponentsIn<module, 'selection'>

/** The facts declared in a generated module (`_fact.ts`), for an adapter's writes. */
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
 * after the kind `selection`, the subject its builder declares
 * (`business/loans/selection/loan`). No folder is named `selection`, as no
 * folder is named as a kind (DOM-24). The library knows the subject only by this
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
export type QueryInput<inputSchema extends z.ZodType, context = never> =
  inputSchema | ((context: context) => inputSchema)

/**
 * From the part of the context it declares, which the tree must give at the
 * query's point, and the input, the parameters bound to the selection.
 */
export type QueryCreator<
  inputSchema extends z.ZodType,
  selection extends Condition,
  context = never,
> = (context: context) => (input: z.output<inputSchema>) => ConditionInput<selection>

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
  context,
> = QueryCreator<SchemaOf<input>, selection, context> & {
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
export type QueryBuilder<context> = <
  const input extends QueryInput<z.ZodType, context>,
  fields extends z.ZodObject,
  const identity extends IdentityFields<fields>,
  const selection extends Condition,
>(
  query: { readonly input: input } & QueryShape<fields, identity, selection> & {
      readonly selection: OneSubject<selection>
      readonly creator: QueryCreator<SchemaOf<input>, selection, context>
    },
) => Query<input, fields, identity, selection, context>

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

/**
 * The cursor of a process with a cursor (DOM-20, D112.1): the order key of
 * the last instance handled, the values of the selection's order fields and
 * its identity (D109), encoded by the library (D114). Opaque to the business,
 * ordered and comparable: the library writes it in the step's own mutation,
 * the author only declares where the process keeps it. The default: a
 * business that must read it declares its own, the order key's fields, which
 * the library derives from the order, checks by type and writes the same way
 * (A, 16 Nov 2026), with its case.
 */
export const cursor = z.string().min(1).brand<'cursor'>()
export type cursor = z.output<typeof cursor>

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
 * recorded; from the first it keeps, with no position. The library reads
 * it to compose streams and to deliver facts to reactions (DOM-16).
 */
export type FactLog = (from: position | undefined) => AsyncIterable<LogEvent>

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
 * A query with no strategy is only read. Either way a query's stream sees
 * only the facts of its domain, as if each had a log of its own (DOM-8,
 * D64.3): the native stream by the adapter, the composed one by the library,
 * which skips a fact whose paths are not in the domain's registry, so that a
 * fact of `loans` holding the drill's id touches no entry of `tools`'
 * catalogue (A, 16 Nov 2026 (6)).
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
export interface CommandUseCase<command extends Commands[string], returns_from = unknown> {
  readonly [$UseCase]: { readonly command: command; readonly returns_from: returns_from }
}

/**
 * A command use case, declared in one argument whose parts have names
 * (DOM-25). A return use case (DOM-13, D108.1) names the effect it comes
 * back from (`returns_from`): the effect executor invokes it with what the
 * world said, which the effect's delivery maps onto its input. The paper
 * puts the return in the entry; here the use case names the effect, since a
 * command that queues an effect and a use case over a command would import
 * each other (A, 13 Nov 2026 (3)). An effect has one return at most, which
 * the generator checks.
 */
export type CommandUseCaseBuilder = <
  const command extends Commands[string],
  const returns_from extends Component | undefined = undefined,
>(use_case: {
  readonly command: command
  readonly returns_from?: returns_from
}) => CommandUseCase<command, returns_from>

// ---------------------------------------------------------------------------
// A use case over another (DOM-2, D105): it runs no command of its own, it
// invokes another domain's command use case, with parts of its own: its
// input, its events, the creator and the projection that translate them. The
// library knows no kind of domain (LIB-1, DOM-25): who uses it, and with
// which rules, is the architecture's. In Shed a persona's leaves are always
// in this form (PER-6), so that the persona keeps its contract when the
// business changes (PER-17, D75.6, GR-3).

/**
 * The events of a use case with parts of its own, by name: each a phrase of
 * its domain's language, its payload a schema (D72.1). A closed set (DOM-3).
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

/** The command a command use case runs. */
type CommandOfUseCase<use_case> = use_case extends { [$UseCase]: { command: infer command } }
  ? command
  : never

/** The input schema of the command a command use case runs. */
type InputOfUseCase<use_case> =
  CommandOfUseCase<use_case> extends { [$Command]: { input: infer input extends z.ZodType } }
    ? input
    : never

/**
 * The projection of the invoked use case's outcome into the events of the
 * use case over it (D45): one function per branch, from its fact's payload,
 * and one for the rejection, from its failures. Exhaustive, as a match over
 * an ADT: a new branch below does not compile above. What never leaves the
 * node (the fact's resources, attribution, versions, PER-18) is never given
 * to it. The branches exclude `rejected` from their keys: while the
 * outcomes are still generic, a mapped type may hold any key, and `rejected`
 * would get two signatures and lose its parameter's type (A, 13 Nov 2026).
 */
export type Projection<outcomes extends Outcomes, events extends Events> = {
  readonly [branch in Exclude<keyof outcomes, 'rejected'>]: (
    fact: z.output<outcomes[branch][1]>,
  ) => EventOf<events>
} & {
  readonly rejected: (failures: readonly Failure<outcomes>[]) => EventOf<events>
}

/**
 * A command use case over another: the use case it invokes, its own input
 * as declared (`input`, from which the generator writes `<use case>_input`,
 * DOM-25), its events, and how the nodes above it may close a request
 * (`closes`), which its port adds to its events.
 */
export interface CommandUseCaseOver<
  use_case extends CommandUseCase<Commands[string]>,
  input extends CommandInput<z.ZodType>,
  events extends Events,
  closes,
  waits = never,
> {
  readonly input: input
  readonly [$UseCase]: {
    readonly use_case: use_case
    readonly events: events
    readonly closes: closes
    readonly waits: waits
  }
}

/**
 * The base event of a leaf that follows (D58.2, § "Il caso d'uso resta
 * attivo"): its wait is over, at the position of its outcome's fact, from
 * which a client may follow again by correlation (D72.8). It closes the
 * flow, not the operation nor the process, records nothing, and is no
 * outcome: no business result may be read in it.
 */
export interface WaitIsOver {
  readonly event: 'the_wait_is_over'
  readonly position: position
}

/**
 * What a command leaf follows after an outcome that does not end its flow
 * (D58.2, A, 16 Nov 2026 (5)): the facts it waits for (`facts`), of any
 * domain its folder sees, those of the chain of its outcome, with its
 * correlation, from the position of its outcome's fact on (D72.8); their
 * projection into its events, by the name in their path, exhaustive; how
 * long it waits at most (`at_most`, in milliseconds), after which
 * `the_wait_is_over`. Marta returns the drill damaged; her screen stays
 * open until `tools` takes it into the workshop.
 */
export interface Follows<events extends Events, followed extends Component> {
  readonly facts: readonly followed[]
  readonly projection: {
    readonly [name in keyof FactsByName<followed>]: (
      fact: z.output<FactsByName<followed>[name]>,
    ) => EventOf<events>
  }
  readonly at_most: number
}

/**
 * The flow of a command leaf (DOM-3, D72.1): with no `ends` and no
 * `follows`, every event ends it, the outcome's projection is the last;
 * else it declares which of its events end it (`ends`), and an event of its
 * outcome among the others keeps it open, on what it `follows`. Declared
 * with the events, not by each projection, so that the closed set and its
 * terminals read without running.
 */
export type LeafFlow<events extends Events, followed extends Component> =
  | { readonly ends?: never; readonly follows?: never }
  | {
      readonly ends: readonly (keyof events & string)[]
      readonly follows: Follows<events, followed>
    }

/**
 * A command use case over another, declared in one argument whose parts have
 * names, in the order of the flow: the use case it invokes, its input, the
 * limits it `is_refused_unless`, the creator that turns the input into the
 * invoked one's, its events, the projection that turns the invoked one's
 * outcome into them. The projected outcome is the first event and a terminal
 * one (D72.3). Apart from `command_use_case`, since its parts are others. Its
 * creator reads the context of its point of the tree with its operation.
 *
 * A limit of the leaf is one that holds for it and not for every leaf of its
 * folder (a card expired blocks borrowing, not reading nor returning: A,
 * 13 Nov 2026 (2)): pure, over the context of its point and the input,
 * named by what must hold, run after the nodes of its path and before the
 * creator (PER-5.5); every limit is evaluated, and the failed ones close the
 * request with `refused`, their names the reasons, which the leaf adds to how
 * the nodes above close (`closes`).
 */
export type CommandUseCaseOverBuilder<context, closes> = <
  const use_case extends CommandUseCase<Commands[string]>,
  const input extends CommandInput<z.ZodType, context & OperationContext>,
  const events extends Events,
  const limits extends string = never,
  const followed extends Component = never,
>(
  use_case: {
    readonly use_case: use_case
    readonly input: input
    readonly is_refused_unless?: Readonly<
      Record<limits, (context: context) => (input: z.output<SchemaOf<input>>) => boolean>
    >
    readonly creator: (
      context: context & OperationContext,
    ) => (input: z.output<SchemaOf<input>>) => z.input<InputOfUseCase<use_case>>
    readonly events: events
    readonly projection: Projection<OutcomesOf<CommandOfUseCase<use_case>>, events>
  } & LeafFlow<events, followed>,
) => CommandUseCaseOver<
  use_case,
  input,
  events,
  closes | ([limits] extends [never] ? never : Refused<limits>),
  [followed] extends [never] ? never : WaitIsOver
>

/** The query a read use case reads. */
type QueryOfUseCase<use_case> = use_case extends { [$UseCase]: { query: infer query } }
  ? query
  : never

/**
 * How a read use case over another streams (`stream`): the field of its own
 * entry that names it (`identity`), which holds the identity of the query's
 * entry, as it is; the events of its own that the facts it names become
 * (`events`, none with none). Grows with its cases: an identity of its own,
 * translated from the query's (A, 13 Nov 2026 (2)).
 */
export interface LeafStream {
  readonly identity: string
  readonly events: Events
}

/** The facts a read use case names, by name. */
type FactsOfUseCase<use_case> = use_case extends {
  [$UseCase]: { facts: infer facts extends Readonly<Record<string, Component>> }
}
  ? facts
  : never

/**
 * The projection of the facts that a read use case names into the events of
 * the stream of a use case over it (D45, D72.6): one function for each fact
 * it chooses among them, from the fact's payload. Partial: a fact it does
 * not choose, or that the read use case does not name, goes out as `fact`,
 * the entry it leaves, so that a new fact of the business adds no event to
 * the surface (PER-17, D75.6). A named fact may be a part of a fact (D111):
 * the library projects the part it names among those that touch the entry
 * (DOM-17: the entry's identity among the part's resources), which it finds
 * from the envelope and the query's identity, so that the stream's event
 * stays as the adapter gives it; the step's part of the round of notices
 * does not touch Gianni's R8, the notice does (A, 16 Nov 2026 (6)). Two
 * named parts touching one entry come with their case.
 */
export type FactProjection<
  facts extends Readonly<Record<string, Component>>,
  events extends Events,
> = {
  readonly [name in keyof facts]?: (fact: z.output<facts[name]>) => EventOf<events>
}

/** The names of the events a set of events holds. */
type EventNames<events> = events extends { readonly event: infer name extends string }
  ? name
  : never

/**
 * The events of its own a read leaf's stream may declare: none named as an
 * event of the stream, of the snapshot, of a node that closes the request,
 * or as a base event, which the port gives beside them.
 */
type StreamEvents<closes> = Events &
  Partial<
    Readonly<
      Record<
        | EventNames<LeafStreamEvent<unknown, unknown> | SnapshotEvent<unknown> | InvalidRequest>
        | EventNames<closes>,
        never
      >
    >
  >

/**
 * A read use case over another (DOM-2, D45): the read use case it invokes,
 * its own input as declared (`input`, from which the generator writes
 * `<use case>_input`, DOM-25), the schema of its own entries, and how it
 * streams, if it does (`stream`: the field that names an entry and the
 * events of its own).
 */
export interface ReadUseCaseOver<
  use_case extends ReadUseCase<Queries[string]>,
  input extends QueryInput<z.ZodType>,
  entry extends z.ZodObject,
  closes,
  stream extends LeafStream | undefined = undefined,
> {
  readonly input: input
  readonly [$UseCase]: {
    readonly use_case: use_case
    readonly entry: entry
    readonly closes: closes
    readonly stream: stream
  }
}

/** The identity of a query's entry, as parsed: the value of its `identity` field. */
type IdentityOfQuery<query> =
  QueryParts<query> extends {
    fields: infer fields extends z.ZodObject
    identity: infer identity extends string
  }
    ? z.output<fields>[identity & keyof z.output<fields>]
    : never

/** The fields of an entry whose value is exactly a given identity. */
type FieldsHolding<entry extends z.ZodObject, identity> = {
  [field in keyof z.output<entry> & string]: [z.output<entry>[field]] extends [identity]
    ? [identity] extends [z.output<entry>[field]]
      ? field
      : never
    : never
}[keyof z.output<entry> & string]

/**
 * A read use case over another, declared in one argument whose parts have
 * names, in the order of the flow: the read use case it invokes, its input,
 * the creator that turns it into the invoked one's input, its entry, the
 * projection that builds an entry of its own from one of the invoked one,
 * field by field (D45): a field it does not write never leaves (PER-18); and
 * last, if it streams, how (`stream`). Its creator reads the context of its
 * point of the tree.
 *
 * With no `stream` it gives the snapshot alone, and its port is not
 * `Streamed`, so that no live view can take it (D24, D77). With `stream`, its
 * port is `Streamed`: every entry of the stream (`fact`, `entered`) is
 * projected as in the snapshot, and `left` names the entry by the field of its
 * own entry that `stream.identity` declares, which must hold the identity of
 * the query's entry, as it is (A, 13 Nov 2026 (2)). Among the facts the read
 * use case names, it chooses those its clients read by a name of its own
 * (`stream.events`, `stream.facts`, D72.6): the fact goes out as its event,
 * with the entry it leaves and the payload projected from the fact; every
 * other fact as `fact`, the entry alone (A, 14 Nov 2026).
 */
export type ReadUseCaseOverBuilder<context, closes> = <
  const use_case extends ReadUseCase<Queries[string]>,
  const input extends QueryInput<z.ZodType, context>,
  const entry extends z.ZodObject,
  const identity extends FieldsHolding<entry, IdentityOfQuery<QueryOfUseCase<use_case>>> = never,
  const events extends StreamEvents<closes> = never,
>(use_case: {
  readonly use_case: use_case
  readonly input: input
  readonly creator: (
    context: context,
  ) => (
    input: z.output<SchemaOf<input>>,
  ) => z.input<
    QueryParts<QueryOfUseCase<use_case>> extends { input: infer i extends z.ZodType } ? i : never
  >
  readonly entry: entry
  readonly projection: (entry: z.output<FieldsOf<QueryOfUseCase<use_case>>>) => z.input<entry>
  readonly stream?: {
    readonly identity: identity
    readonly events?: events
    readonly facts?: FactProjection<FactsOfUseCase<use_case>, events>
  }
}) => ReadUseCaseOver<
  use_case,
  input,
  entry,
  closes,
  [identity] extends [never]
    ? undefined
    : {
        readonly identity: identity
        readonly events: events
      }
>

// ---------------------------------------------------------------------------
// Builders at a point of the tree (PER-6, DOM-25): the context of a creator
// comes from where it sits, not from its annotation.

/**
 * Every builder of the components, at a point of the tree: the authored files
 * build only with them, never with the library directly. The generator writes
 * in each folder of the tree `_scope.ts`, the scope of the folder, which
 * exports by name these builders, with the context the nodes above give at its
 * point (`RootContext` with none) and their `closes` (`never` with none); and
 * beside it one scope per kind (`_scope_command.ts`), which exports by name
 * the builders of its kind, taken from the folder's, and as namespaces the
 * components of the folder in the layers below the kind, its ancestors and
 * the doors the map opens to it. An authored file imports one scope, the one
 * of the kind it builds (`command`, `fact.a_tool_has_been_retired`). The
 * folder's scope is the one door to the builders, the place where a builder
 * could be added.
 *
 * Those whose creators read the context are bound to the context of the point
 * and to how the nodes above it may close a request (`closes`), which the
 * leaves built there carry: a creator gets the context with no annotation;
 * one that asks for more than the point gives does not compile. A command,
 * and a use case over one, add their operation (`OperationContext`). The
 * others are the same at every point.
 */
export interface Builders<context extends RootContext, closes> {
  readonly id: IdBuilder
  readonly fact: FactBuilder
  readonly predicate: PredicateBuilder
  readonly selection: SelectionBuilder
  readonly effect: EffectBuilder
  readonly AND: AndBuilder
  readonly OR: OrBuilder
  readonly NOT: NotBuilder
  readonly command: CommandBuilder<context>
  readonly cursor_step: CursorStepBuilder<context>
  readonly query: QueryBuilder<context>
  readonly command_use_case: CommandUseCaseBuilder
  readonly read_use_case: ReadUseCaseBuilder
  readonly command_use_case_over: CommandUseCaseOverBuilder<context, closes>
  readonly read_use_case_over: ReadUseCaseOverBuilder<context, closes>
  readonly lookup: LookupBuilder
  readonly reaction: ReactionBuilder
  readonly node: NodeBuilder<context, closes>
}

/** The kinds of construct, the segment of a path after its folders (DOM-24, DOM-25). */
export type ConstructKind =
  | 'id'
  | 'value'
  | 'fact'
  | 'predicate'
  | 'selection'
  | 'effect'
  | 'command'
  | 'query'
  | 'usecase'
  | 'lookup'
  | 'node'
  | 'reaction'

/**
 * What a folder of the tree sees of the others (LIB-1, DOM-25): for the
 * folders under a first segment (`business`), the kinds of construct they see
 * of each folder under another (`business: { business: ['id'] }`). The
 * architecture's rule, given to the generator as data: the library knows
 * folders and kinds of construct, never kinds of domain. The generator writes
 * into the scopes of a folder every folder it sees, under its name, with those
 * namespaces only (`tools.id.tool_id`); what is not listed is not seen, and
 * does not compile.
 */
export type Sight = Readonly<Record<string, Readonly<Record<string, readonly ConstructKind[]>>>>

/**
 * The builders bound to the context of a point of the tree, for its
 * `_scope.ts`. A folder with a node has two points: the point above, whose
 * builder of the node the generator writes in `_scope_node.ts`, and the
 * context the node gives, in `_scope.ts`, from which the scope of the leaves
 * takes its builders (`_scope_usecase.ts`); so that no import goes round.
 */
export declare function builders_at<context extends RootContext, closes = never>(): Builders<
  context,
  closes
>

// ---------------------------------------------------------------------------
// Nodes (PER-6, PER-14): at most one in a folder, met by the library as it
// walks a path down, whatever the tree. A node is a function of the context,
// not of the request: it sees no input, since it sits above every leaf of
// its folder. It runs its lookups, its only I/O, then its perimeters, its
// limits and its bindings, pure, in the order of PER-5 (perimeter, then
// limit); it extends the context, never rewrites it (D105.2); once per
// request, for everything below it. It reads as sentences, its name the
// subject: `member` looks up …, is found only if …, is refused unless …,
// gives … (A, 13 Nov 2026).

export declare const $Node: unique symbol

/**
 * A node: the context it takes, the context it gives, and how it and the
 * nodes above it may close a request (`closes`, a union of `NodeEvent`s), for
 * the leaves below it to carry.
 */
export interface Node<taken, gives extends RootContext, closes> {
  readonly [$Node]: { readonly takes: taken; readonly gives: gives; readonly closes: closes }
}

/** The context a node gives, for the `_scope.ts` of its folder. */
export type ContextOf<node> = node extends { [$Node]: { gives: infer context extends RootContext } }
  ? context
  : never

/** How a node and the nodes above it may close a request, for the `_scope.ts` of its folder. */
export type ClosesOf<node> = node extends { [$Node]: { closes: infer closes } } ? closes : never

/** What the entry gives the node at the top of a tree: the root's context and what the node takes. */
export type EntryOf<node> = node extends { [$Node]: { takes: infer taken } } ? taken : never

/**
 * A lookup a node runs: the lookup, the key it runs `of`, from the context
 * the node takes, and what "not known" does. The key is an answer (D30): a
 * key not known (a caller with no account) runs no lookup, and the value is
 * not known. The key is typed as parsed, branded, so that another identity
 * (a session for an account) does not compile. `not_found` closes the
 * request as a perimeter (PER-14, D87.5), so that the value goes on known;
 * "not known" as a value comes with its case.
 */
export interface NodeLookup<context, key extends z.ZodType, value extends z.ZodType> {
  readonly lookup: Lookup<key, value>
  readonly of: (context: context) => Answer<z.output<key>>
  readonly when_not_known: 'not_found'
}

/** The lookups of a node, by name: each a phrase, the value it looks up. */
export type NodeLookups = Readonly<
  Record<string, { readonly lookup: Lookup<z.ZodType, z.ZodType> }>
>

/** The lookups of a node, each checked against the lookup it runs: its key, its value. */
type NodeLookupsOf<context, lookups> = {
  readonly [name in keyof lookups]: lookups[name] extends { readonly lookup: infer lookup }
    ? NodeLookup<context, LookupParts<lookup>['key'], LookupParts<lookup>['value']>
    : never
}

/** The values the lookups of a node found, by name, known. */
export type Found<lookups> = {
  readonly [name in keyof lookups]: z.output<
    LookupParts<lookups[name] extends { lookup: infer lookup } ? lookup : never>['value']
  >
}

/** The context a node takes: the point's, and at the top of a tree what its entry gives (`takes`). */
type Taken<context, takes> = takes extends z.ZodObject ? context & z.output<takes> : context

/** The conditions of a node, by name: each pure, over the context and what its lookups found. */
type NodeConditions<name extends string, context, lookups> = Readonly<
  Record<name, (context: context) => (found: Found<lookups>) => boolean>
>

/**
 * A node, declared in one argument whose parts have names, in the order of
 * its run, so that it reads as sentences with its name as the subject (A,
 * 13 Nov 2026): what the entry gives at the top of a tree (`takes`, only
 * there); what it `looks_up`; the perimeters, as what it `is_found_only_if`;
 * the limits, as what it `is_refused_unless`; what it `gives`, last. Every
 * part may be left out. A condition is named by what must hold: a perimeter
 * that fails closes with `not_found`, with no reason; a limit that fails
 * with `refused`, its name the reason the caller reads (PER-14); every limit
 * is evaluated, every failure named. The node adds to how the nodes above
 * close (`closes`) what it may close with: `not_found` if it looks up or
 * holds perimeters, `refused` with the names of its limits if it has some.
 */
export type NodeBuilder<context, closes> = <
  const takes extends z.ZodObject | undefined = undefined,
  const lookups extends NodeLookups = NoLookups,
  const perimeters extends string = never,
  const limits extends string = never,
  const gives extends Readonly<Record<string, unknown>> | undefined = undefined,
>(node: {
  readonly takes?: takes
  readonly looks_up?: lookups & NodeLookupsOf<Taken<context, takes>, lookups>
  readonly is_found_only_if?: NodeConditions<perimeters, Taken<context, takes>, lookups>
  readonly is_refused_unless?: NodeConditions<limits, Taken<context, takes>, lookups>
  readonly gives?: (context: Taken<context, takes>) => (found: Found<lookups>) => gives
}) => Node<
  Taken<context, takes>,
  Taken<context, takes> & Given<gives> & RootContext,
  closes | ClosesBy<lookups, perimeters, limits>
>

/** The lookups of a node that runs none: nothing is found, and no name reads. */
type NoLookups = Readonly<Record<string, never>>

/** What a node gives: its bindings, or nothing more when it has none. */
type Given<gives> = gives extends undefined ? unknown : gives

/** How one node may close a request, by the names of what it declares. */
type ClosesBy<lookups, perimeters extends string, limits extends string> =
  | ([lookups] extends [NoLookups] ? ([perimeters] extends [never] ? never : NotFound) : NotFound)
  | ([limits] extends [never] ? never : Refused<limits>)

/** A lookup that finds nothing, or a perimeter that fails: no reason (PER-14, D87.5). */
export interface NotFound {
  readonly event: 'not_found'
}

/** Failed limits: the name of each, the reasons the caller reads (PER-14, D80). */
export interface Refused<reason extends string> {
  readonly event: 'refused'
  readonly reasons: readonly reason[]
}

/**
 * The events of a node that closes a request (PER-14, D80), in the union of
 * every leaf below it, which no leaf declares; terminal. In the paper they
 * are of the node's declared union, not base events (D72).
 */
export type NodeEvent<reason extends string> = NotFound | Refused<reason>

// ---------------------------------------------------------------------------
// The ports of a tree (PER-6, DOM-11, D106): a request enters a tree from a
// leaf. The library walks its path down from the node at the top, which takes
// what the entry gives, runs the nodes it meets, then the leaf, which invokes
// another tree's use case. Its events are the leaf's own, how the nodes of
// its path may close it, and the base events, which no leaf declares.

/**
 * A base event (D106.3), in the union of every leaf: at the entry of the
 * tree, the path is not a leaf (an inner node, none at that version), or the
 * input is not in its schema. A formal reason: the contract is public, so it
 * tells nothing more. Terminal.
 */
export interface InvalidRequest {
  readonly event: 'invalid_request'
  readonly reason: 'not_a_leaf' | 'input_not_in_schema'
}

/**
 * A base event (DOM-11, D79.4), in the union of every command leaf: the
 * operation's identity, in its scope, was used with another fingerprint. It
 * comes from the duplicate branch of the command port and crosses the leaf
 * unprojected. Terminal.
 */
export interface IdentityAlreadyUsed {
  readonly event: 'identity_already_used'
}

/** One of the events of a use case, as its port gives it: its name and its payload, parsed. */
export type EventOutOf<events extends Events> = {
  [name in keyof events & string]: {
    readonly event: name
    readonly payload: z.output<events[name]>
  }
}[keyof events & string]

/** The events of a command leaf: its own, how its path may close it, the base events. */
export type CommandLeafEvent<leaf> = leaf extends {
  [$UseCase]: { events: infer events extends Events; closes: infer closes; waits: infer waits }
}
  ? EventOutOf<events> | closes | waits | InvalidRequest | IdentityAlreadyUsed
  : never

/**
 * The port of a command leaf: what the entry gives the top of its tree, with
 * the operation (its id and its scope, which the entry composes, DOM-11), and
 * the leaf's input in; its events out. The library computes the operation's
 * fingerprint at the leaf, over its path and its input as sent, after the
 * schema (D100), and gives it with the operation to the command port, which
 * compares it (D79.5). The entry gives the correlation too, the client's or
 * a new one (D72.7), which the leaf follows, if it follows (`Follows`).
 */
export type CommandLeafPort<entry, leaf> = leaf extends { readonly input: infer input }
  ? (
      context: entry & OperationContext & CorrelationContext,
      input: z.input<SchemaOf<input>>,
    ) => AsyncIterable<CommandLeafEvent<leaf>>
  : never

/**
 * The events of the stream of a read leaf, as its port gives them (D72.5, A,
 * 13 Nov 2026 (2)): those of `StreamEvent`, every entry projected as in the
 * snapshot, its identity the field of the leaf's own entry that names it
 * (`stream.identity`), typed as that field so that an identity of its own
 * can come without changing the port. A fact the leaf names goes out as its
 * own event (`events`), with the entry it leaves and its payload, projected
 * from the fact (D72.6, A, 14 Nov 2026), or from its part that touches the
 * entry (A, 16 Nov 2026 (6)); any other, as `fact`, with the entry and not
 * the fact. The position goes out as it is, opaque (D72.6);
 * the envelope and its resources never (PER-18, D107.4).
 */
export type LeafStreamEvent<entry, identity, events extends Events = never> =
  | NamedFactEvent<entry, identity, events>
  | {
      readonly event: 'fact'
      readonly position: position
      readonly identity: identity
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

/** A fact the leaf names, as its port gives it: its own event, with the entry and the payload; none with no events. */
type NamedFactEvent<entry, identity, events extends Events> = [events] extends [never]
  ? never
  : {
      [name in keyof events & string]: {
        readonly event: name
        readonly position: position
        readonly identity: identity
        readonly entry: entry
        readonly payload: z.output<events[name]>
      }
    }[keyof events & string]

/**
 * The events of a read leaf: the snapshot of its own entries, then, if it
 * streams, the events of its stream; how its path may close it; the base
 * event of a request (no operation, so no `identity_already_used`).
 */
export type ReadLeafEvent<leaf> = leaf extends {
  [$UseCase]: { entry: infer entry extends z.ZodObject; closes: infer closes; stream: infer stream }
}
  ? | SnapshotEvent<z.output<entry>>
    | (stream extends {
        identity: infer identity extends keyof z.output<entry>
        events: infer events extends Events
      }
        ? LeafStreamEvent<z.output<entry>, z.output<entry>[identity], events>
        : never)
    | closes
    | InvalidRequest
  : never

/**
 * The port of a read leaf: what the entry gives the top of its tree, with no
 * operation (a read has none), the leaf's input, and, if it streams, a
 * position to resume from, as the stream gave it; its events out. With
 * `stream` it is `Streamed`; a stream over a port of the invoked tree that
 * does not stream is a composition fault, stopped at wiring (CFG-2).
 */
export type ReadLeafPort<entry, leaf> = leaf extends {
  readonly input: infer input
  readonly [$UseCase]: { stream: infer stream }
}
  ? stream extends LeafStream
    ? ((
        context: entry,
        input: z.input<SchemaOf<input>>,
        from?: position,
      ) => AsyncIterable<ReadLeafEvent<leaf>>) &
        Streamed
    : ((context: entry, input: z.input<SchemaOf<input>>) => AsyncIterable<ReadLeafEvent<leaf>>) & {
        readonly streamed: false
      }
  : never

/** The leaves of a tree, by name: command and read use cases over another. */
export type TreeLeaves = Readonly<
  Record<
    string,
    | CommandUseCaseOver<
        CommandUseCase<Commands[string]>,
        CommandInput<z.ZodType>,
        Events,
        unknown,
        unknown
      >
    | ReadUseCaseOver<
        ReadUseCase<Queries[string]>,
        QueryInput<z.ZodType>,
        z.ZodObject,
        unknown,
        LeafStream | undefined
      >
  >
>

/** The port of a leaf, by its kind: a read leaf declares its entry, a command leaf its events. */
export type LeafPort<entry, leaf> = leaf extends { [$UseCase]: { entry: z.ZodObject } }
  ? ReadLeafPort<entry, leaf>
  : CommandLeafPort<entry, leaf>

/**
 * The ports that a tree invokes, by the path of their folder
 * (`business/loans`, `auth/accounts`), as their adapters give them: the
 * library finds a use case's or a lookup's port by its path, in the
 * registries, and stops at wiring if one is missing.
 */
export type Invoked = Readonly<Record<string, Readonly<Record<string, unknown>>>>

/**
 * The ports of the leaves of a tree (PER-6): the registry where the library
 * finds the nodes and the leaves by path, the node at the top, which takes
 * what the entry gives, and the leaves, command and read. Curried as
 * `command_use_case_ports`: then the ports the tree invokes, and the fact
 * log a leaf that follows reads, by correlation (`Follows`).
 */
export declare function tree_ports<const top, const use_cases extends TreeLeaves>(ports: {
  readonly registry: Registry
  readonly top: top
  readonly use_cases: use_cases
}): (wired: { readonly invoked: Invoked; readonly log: FactLog }) => {
  readonly [name in keyof use_cases]: LeafPort<EntryOf<top>, use_cases[name]>
}

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
    ? (context: CommandRootContext, input: z.input<input>) => AsyncIterable<OutcomeOf<command>>
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
}): <fragment, write, read, selection, source, field>(
  adapter: StateAdapter<CommandsOf<use_cases>, fragment, write, read, selection, source, field>,
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
 *
 * It names the facts that a use case over it may name in its stream
 * (`facts`, the facts themselves, as a command names its own: D64.2,
 * D101.4): the notices the domain sends with its register, its choice (A,
 * 14 Nov 2026). A fact is named when it touches an entry and leaves it in
 * the selection (one that takes it out comes as `left`, its identity only),
 * tells a reader something the entry does not, an occurrence rather than a
 * state ("has just fallen overdue", not "is overdue"), and a reader uses it
 * (LIB-3). A fact it does not name reaches the use cases over it as the
 * entry it leaves. A use case over it names a fact by the name in its path.
 */
export interface ReadUseCase<
  query extends Queries[string],
  facts extends Readonly<Record<string, Component>> = Readonly<Record<string, Component>>,
> {
  readonly [$UseCase]: { readonly query: query; readonly facts: facts }
}

/** The name of a fact, the last part of its path. */
type FactName<path> = path extends `${string}/fact/${infer name}` ? name : never

/** Facts by the name in their path. */
type FactsByName<facts extends Component> = {
  readonly [fact in facts as FactName<PathOf<fact>>]: fact
}

/**
 * A read use case, declared in one argument whose parts have names (DOM-25):
 * its query and the facts it names, which must be facts.
 */
export type ReadUseCaseBuilder = <
  const query extends Queries[string],
  const facts extends Component = never,
>(
  use_case: {
    readonly query: query
    readonly facts?: readonly facts[]
  } & ([Strays<facts, Path<'fact'>>] extends [never]
    ? unknown
    : { readonly 'a read use case names facts (DOM-17)': PathOf<Strays<facts, Path<'fact'>>> }),
) => ReadUseCase<query, FactsByName<facts>>

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
          context: RootContext,
          input: z.input<input>,
          from?: position,
        ) => AsyncIterable<
          ReadEvent<
            Envelope<readonly Part<facts>[]>,
            z.output<fields>,
            z.output<fields>[identity & keyof z.output<fields>]
          >
        >) &
          Streamed
      : ((
          context: RootContext,
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

// ---------------------------------------------------------------------------
// Effects (DOM-13, DOM-14, DOM-15): a branch queues outbox entries with its
// fact; the effect executor, an internal entry and not a persona (PER-12),
// delivers them through an adapter per effect and brings what the world said
// back through the effect's return use case, if it has one.

/** The effects of a generated module (`_effect.ts`) or of a registry, for the deliveries. */
export type EffectsIn<module> = ComponentsIn<module, 'effect'>

/**
 * What a delivery tells the executor (DOM-15, D108.2), an ADT:
 * - `delivered`: the world answered; with a return use case, what it said,
 *   as the return's input (a definitive outcome with a meaning is one of
 *   them, D67.2); with none, nothing;
 * - `transient`: retried later; the domain never sees it;
 * - `exhausted`: to the dead letter, with its reason; never a business fact.
 */
export type Delivered<returned> =
  | ([returned] extends [never]
      ? { readonly outcome: 'delivered' }
      : { readonly outcome: 'delivered'; readonly returns: returned })
  | { readonly outcome: 'transient' }
  | { readonly outcome: 'exhausted'; readonly reason: string }

/**
 * The delivery of one effect, an adapter (DOM-14): from an entry, its id
 * (the key sent outside, with the effect) and its payload, what the world
 * said, typed by the input of the effect's return, if any.
 */
export type Delivery<effect extends Component, returned> = (entry: {
  readonly id: entry_id
  readonly payload: z.output<effect>
}) => Promise<Delivered<returned>>

/**
 * The library's delivery of an effect with no world (a wait: the eve of a
 * due date): the payload back, as the return's input. The executor waits
 * for `not_before` for every effect, so this one only answers: never
 * transient nor exhausted. It fits an effect whose payload is its return's
 * input. A timer is not a construct (A, 13 Nov 2026 (3)).
 */
export declare const returns_the_payload: <payload>(entry: {
  readonly id: entry_id
  readonly payload: payload
}) => Promise<{ readonly outcome: 'delivered'; readonly returns: payload }>

/** The input of the return of an effect among a domain's return use cases; `never` if it has none. */
type ReturnOf<returns, effect> = {
  [name in keyof returns]: returns[name] extends {
    [$UseCase]: { returns_from: infer from; command: infer command }
  }
    ? [from] extends [effect]
      ? command extends { [$Command]: { input: infer input extends z.ZodType } }
        ? z.input<input>
        : never
      : never
    : never
}[keyof returns]

/**
 * The deliveries of a domain's effects, by path: exhaustive, so that an
 * effect with no delivery does not compile, each typed by its return.
 */
export type Deliveries<registry, returns> = {
  readonly [effect in EffectsIn<registry> as PathOf<effect>]: Delivery<
    effect,
    ReturnOf<returns, effect>
  >
}

/**
 * The outbox of a store, effect by effect (DOM-14): the entries of one
 * effect from a position on, inclusive (from the first with none), in the
 * order they were recorded, then each new one as it is recorded.
 */
export type Outbox = (
  effect: string,
) => (
  from: position | undefined,
) => AsyncIterable<{ readonly position: position; readonly entry: StoredEntry }>

/**
 * A dead letter of the effect executor (DOM-15, D67.3): operational,
 * outside the domains, shown, never a business fact; redelivered after a
 * fix with the same identity, or discarded by an operator, with a trace.
 * Its cause, an ADT:
 * - `exhausted`: the delivery gave up; redelivered, the effect runs again;
 * - `rejected`: the return rejected what the world said, kept with its
 *   failures; redelivered, the return runs again with it, never the effect
 *   (D108.4);
 * - `identity_already_used`: the entry came back with another outcome; the
 *   first stands (D108.4).
 */
export interface DeadLetter {
  readonly entry: StoredEntry
  readonly cause:
    | { readonly cause: 'exhausted'; readonly reason: string }
    | {
        readonly cause: 'rejected'
        readonly returns: unknown
        readonly failures: readonly Failure<Outcomes>[]
      }
    | { readonly cause: 'identity_already_used'; readonly returns: unknown }
}

/** Where an executor keeps its own state, durable (DOM-14): its position per effect, its dead letters. */
export interface ExecutorState {
  readonly position: (effect: string) => Promise<position | undefined>
  readonly advance: (effect: string) => (to: position) => Promise<void>
  readonly dead_letter: (letter: DeadLetter) => Promise<void>
}

/** A running executor: it stops when asked, after the entry it is delivering. */
export interface EffectExecutor {
  readonly stop: () => Promise<void>
}

/**
 * The effect executor of a domain (DOM-14, PER-12): an internal entry, a
 * durable consumer of its outbox, one delivery unit per effect, with its own
 * position, order and dead letters. For each entry it waits for
 * `not_before` by its clock, delivers it at least once, and, if the world
 * answered and the effect has a return, invokes the return's port as
 * "system · executor of effect E" (D91.3): the scope is the effect's path,
 * the operation's id the entry's, so that a double report is the duplicate
 * branch (DOM-11) and the fingerprint covers the entry and what the world
 * said (D108.3); the context's `now` is the clock's. Curried as
 * `command_use_case_ports`: the registry and the domain's return use cases,
 * where it finds each effect's return; then the deliveries; then its ports.
 */
export declare function effect_executor<
  const registry extends Registry,
  const returns extends CommandUseCases,
>(executor: {
  readonly registry: registry
  readonly returns: returns
}): (
  deliveries: Deliveries<registry, returns>,
) => (ports: {
  readonly outbox: Outbox
  readonly returns: { readonly [name in keyof returns]: CommandUseCasePort<returns[name]> }
  readonly state: ExecutorState
  readonly clock: () => date_time
}) => EffectExecutor

// ---------------------------------------------------------------------------
// Reactions (DOM-16, PER-12): "when fact E, command C", a standing order
// between two offices. Its module sits above the domains, which never import
// it (GR-9, D88.6): it speaks the language of the fact it reads and of the
// use case it invokes, and the configurator wires it. In Shed the folders
// under `reaction/` are procedures, the business occurrences that move more
// than one office (`retirement/`), the author's choice (A, 15 Nov 2026).

export declare const $Reaction: unique symbol

/**
 * What a reaction's translation gives when its fact asks for no command
 * (D88.2): a value of the library, so that "no command" is never an input
 * of the invoked one. Not a builder: it builds no component.
 */
export declare const nothing: unique symbol

/**
 * A reaction: the fact it reacts to and the command use case it invokes.
 * Its path is its identity, stable across releases (D89.5): the scope of its
 * operations ("system · reaction R", D91.3) and its delivery unit, with its
 * own position, order and dead letters (D89.6).
 */
export interface Reaction<
  fact extends Component,
  use_case extends CommandUseCase<Commands[string]>,
> {
  readonly [$Reaction]: { readonly when: fact; readonly invokes: use_case }
}

/**
 * A reaction, declared in one argument whose parts have names: the fact it
 * reacts to (`when`), the command use case it invokes (`invokes`), through a
 * domain's door, and the pure translation from the fact's payload to the
 * invoked one's input (`translation`, D89.3), or to `nothing` (D88.2): Paolo
 * returns the ladder whole, Marta the drill damaged, and only the drill goes
 * to repair; for a fact translated to nothing the consumer invokes no
 * command and goes on to the next part (A, 16 Nov 2026 (4)). It reads no
 * state and has no context: the command's `now` is the clock of the entry,
 * as for the effect executor.
 */
export type ReactionBuilder = <
  const fact extends Component,
  const use_case extends CommandUseCase<Commands[string]>,
>(
  reaction: {
    readonly when: fact
    readonly invokes: use_case
    readonly translation: (
      fact: z.output<fact>,
    ) => z.input<InputOfUseCase<use_case>> | typeof nothing
  } & ([Strays<fact, Path<'fact'>>] extends [never]
    ? unknown
    : { readonly 'a reaction reacts to a fact (DOM-16)': PathOf<Strays<fact, Path<'fact'>>> }),
) => Reaction<fact, use_case>

/**
 * A reaction's operation (DOM-16, D91.3, LIB-10): its scope the reaction's
 * path ("system · reaction R"), its id a stable function of the library over
 * that path, the operation that recorded the fact (DOM-10) and the part the
 * reaction reacts to, by its position in the fact (D113.3), so that a fact
 * delivered again is the duplicate branch (DOM-11): Luca retires the ladder,
 * the consumer falls before saving its position, the fact comes again, one
 * work sheet (TST-4). In the stability corpus: it never changes once
 * released.
 */
export declare const reaction_operation: (
  reaction: string,
) => (delivered: { readonly operation: Operation; readonly part: number }) => Operation

/**
 * A dead letter of a reaction (D89.7, D67.3): the fact, at its position, the
 * part it reacted to, and why. Operational, outside the domains, shown, never
 * a business fact; redelivered after a fix with the same operation, the
 * command evaluated again (a refusal leaves no fact, D79.2), or discarded by
 * an operator, with a trace. Its cause, an ADT:
 * - `rejected`: the command refused, its failures (a step's, its read);
 * - `identity_already_used`: the operation came back with another
 *   fingerprint; the first outcome stands.
 */
export interface ReactionDeadLetter {
  readonly reaction: string
  readonly position: position
  readonly fact: StoredEnvelope
  readonly part: number
  readonly cause:
    | {
        readonly cause: 'rejected'
        readonly failures: readonly (Failure<Outcomes> | ReadFailure)[]
      }
    | { readonly cause: 'identity_already_used' }
}

/**
 * Where the consumers of reactions keep their own state, durable (D89.6):
 * a position per reaction (none before its first fact), its dead letters.
 */
export interface ReactionState {
  readonly position: (reaction: string) => Promise<position | undefined>
  readonly advance: (reaction: string) => (to: position) => Promise<void>
  readonly dead_letter: (letter: ReactionDeadLetter) => Promise<void>
}

/** The paths of the reactions of a registry. */
type ReactionPaths<registry> = {
  [path in keyof registry & string]: registry[path] extends { [$Reaction]: unknown } ? path : never
}[keyof registry & string]

/**
 * What a reaction is wired to: the fact log of the store of its fact's
 * domain (DOM-17), and the port of the use case it invokes.
 */
export type ReactionWiring<reaction> = reaction extends {
  [$Reaction]: { invokes: infer use_case }
}
  ? { readonly log: FactLog; readonly invokes: CommandUseCasePort<use_case> }
  : never

/** The wirings of the reactions of a registry, by path: exhaustive, so that a reaction not wired does not compile. */
export type ReactionWirings<registry> = {
  readonly [path in ReactionPaths<registry>]: ReactionWiring<registry[path]>
}

/** The running consumers of a set of reactions: they stop when asked, after the fact they are delivering. */
export interface ReactionConsumers {
  readonly stop: () => Promise<void>
}

/**
 * The consumers of a set of reactions (DOM-16, PER-12, D89.6): internal
 * entries, not personas, one durable consumer per reaction, its own delivery
 * unit, with its own position and dead letters. Each reads its fact log from
 * its position (the first fact the log keeps, with none: in Shed every
 * reaction is there from the start; where a reaction added later starts is
 * the deployment's, D64.3), in the order of the log, so in order per
 * resource; skips the parts of other paths; for each part of its path, in
 * the order of the parts (DOM-16: at most one command per part), translates
 * it purely (D89.3) and invokes its use case with `reaction_operation` over
 * the fact's operation and the part, and the clock's `now`; a part
 * translated to `nothing` invokes nothing (D88.2). Then, by the outcome of
 * each:
 * - applied (an exact duplicate too, the recorded fact): the next part;
 * - rejected, identity already used: to its dead letter, then the next part;
 * - a technical abort (the port fails, the process falls): it does not
 *   advance, and delivers the fact again from its position (D65.6), the
 *   duplicate branch covering the parts already applied.
 * After the last part it advances.
 * Holding the later facts of a dead-lettered fact's resources (D94.7) comes
 * with its case. The contract is the order per resource, not a total one: a
 * consumer may deliver facts of disjoint resources in parallel (partitions
 * by resource, one consumer active per partition at a time, else two
 * instances may swap two facts of one tool), its position then the
 * partition's: the library's and the adapter's, not the domain's (A, 16
 * Nov 2026). Curried as `effect_executor`: the registry of the
 * reactions; their wirings; the state and the clock.
 */
export declare function reaction_consumers<const registry extends Registry>(reactions: {
  readonly registry: registry
}): (
  wirings: ReactionWirings<registry>,
) => (ports: {
  readonly state: ReactionState
  readonly clock: () => date_time
}) => ReactionConsumers

// ---------------------------------------------------------------------------
// Lookups (PER-9): a read of one key, which gives its value or "not known",
// with no list and no stream. A node runs its lookups, then its conditions
// and bindings, pure (PER-6). Whose lookups a node may run is the
// architecture's (auth's, D43, D77.3), not the library's (LIB-1). A lookup
// is implemented by an adapter: a token, a table, an identity provider (D43).

export declare const $Lookup: unique symbol

/** A lookup: the schema of its key and of its value. */
export interface Lookup<key extends z.ZodType, value extends z.ZodType> {
  readonly [$Lookup]: { readonly key: key; readonly value: value }
}

/** A lookup, declared in one argument whose parts have names (DOM-25). */
export type LookupBuilder = <const key extends z.ZodType, const value extends z.ZodType>(lookup: {
  readonly key: key
  readonly value: value
}) => Lookup<key, value>

/** The answer of a lookup: its value, or "not known"; absence is a value, never `null` (D30). */
export type Answer<value> =
  { readonly answer: 'known'; readonly value: value } | { readonly answer: 'not_known' }

/** The lookups of a domain, by name. */
export type Lookups = Readonly<Record<string, Lookup<z.ZodType, z.ZodType>>>

/** The key and the value schemas of a lookup. */
type LookupParts<lookup> = lookup extends {
  [$Lookup]: { key: infer key extends z.ZodType; value: infer value extends z.ZodType }
}
  ? { readonly key: key; readonly value: value }
  : never

/**
 * What an adapter gives for a set of lookups: for each, under its name, a
 * function from the parsed key to the answer, whose value the library
 * parses. Exhaustive: a forgotten lookup does not compile.
 */
export type LookupAdapter<lookups extends Lookups> = {
  readonly [name in keyof lookups]: (
    key: z.output<LookupParts<lookups[name]>['key']>,
  ) => Promise<Answer<z.input<LookupParts<lookups[name]>['value']>>>
}

/** A lookup port: the key in, the answer out, its value parsed. */
export type LookupPort<lookup> = (
  key: z.input<LookupParts<lookup>['key']>,
) => Promise<Answer<z.output<LookupParts<lookup>['value']>>>

/**
 * The ports of a set of lookups over an adapter, with the registry where the
 * library finds their paths. Curried as `command_use_case_ports`.
 */
export declare function lookup_ports<const lookups extends Lookups>(ports: {
  readonly registry: Registry
  readonly lookups: lookups
}): (adapter: LookupAdapter<lookups>) => {
  readonly [name in keyof lookups]: LookupPort<lookups[name]>
}
