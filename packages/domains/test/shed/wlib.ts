import * as z from 'zod'

export const date_time_string = z.iso.datetime().brand<'date_time_string'>()
export type date_time_string = z.output<typeof date_time_string>

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
 * The path of a member (DOM-24): its domain, folders, conventional module and
 * name, as in `tools/fact/a_tool_has_been_added`. A folder is never named as a
 * conventional module.
 */
export type Path<module extends string> = `${string}/${module}/${string}`

/**
 * A fact: its schema has a field `$path`, the literal of its path. The author
 * never writes it: `fact.ts` declares the shape, the generator adds the `$path`
 * in `$fact.ts`, and the business code imports the fact from there. The
 * creator does not write it either; the library puts it on. DOM-5, DOM-22, DOM-24
 */
export type Fact = z.ZodObject & { _zod: { output: { $path: Path<'fact'> } } }

/** A predicate of the vocabulary: the schema of its parameters, with its `$path` as a fact (`$predicate.ts`). */
export type Predicate = z.ZodObject & { _zod: { output: { $path: Path<'predicate'> } } }

/** What an author writes for a schema with a `$path`: everything else. */
export type Unpathed<schema extends z.ZodType> = Omit<z.input<schema>, '$path'>

declare const $Composed: unique symbol
/**
 * A condition composed with AND, OR, NOT (DOM-5). It is a zod schema: the
 * schema of its parameters, which the creator binds as an object of its type.
 */
export type Composed<
  parameters extends z.ZodObject = z.ZodObject,
  operands = unknown,
> = parameters & {
  [$Composed]: { operator: 'and' | 'or' | 'not'; operands: operands }
}

export type Condition = Predicate | Composed

/**
 * The schema of a condition's parameters: a predicate's own fields (its
 * `$path` is not a parameter); a composed condition's schema as it is.
 */
export type Parameters<condition extends Condition> =
  condition extends z.ZodObject<infer shape, z.core.$ZodObjectConfig>
    ? z.ZodObject<{ [k in keyof shape as k extends '$path' ? never : k]: shape[k] }, z.core.$strict>
    : never

/** The parameters the creator binds to a condition. */
export type ConditionInput<condition extends Condition> = z.input<Parameters<condition>>

/** The named components of AND, OR: each name is a business phrase (DOM-25). */
export type Components = Readonly<Record<string, Condition>>

/** The schema of named components: one field per component, its parameters. */
export type ComponentsParameters<components extends Components> = z.ZodObject<
  { [k in keyof components]: Parameters<components[k]> },
  z.core.$strict
>

/**
 * All the components hold. Every predicate gets a value, with no
 * short-circuit; a rejection names every failed component, once. D47.1, D49, D17
 */
export declare function and<const components extends Components>(
  components: components,
): Composed<ComponentsParameters<components>, components>

/** At least one component holds. */
export declare function or<const components extends Components>(
  components: components,
): Composed<ComponentsParameters<components>, components>

/** The condition does not hold: its parameters are the condition's. */
export declare function not<const condition extends Condition>(
  condition: condition,
): Composed<Parameters<condition>, condition>

/** A branch, declared: the condition and the fact it records. DOM-5 */
export type Outcome = readonly [condition: Condition, fact: Fact]
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
    fact: Unpathed<outcomes[k][1]>,
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

export declare function command<inputSchema extends z.ZodType, const outcomes extends Outcomes>(
  inputSchema: CommandInput<inputSchema>,
  creator: CommandCreator<inputSchema, outcomes>,
  outcomes: outcomes,
): Command<inputSchema, outcomes>

// ---------------------------------------------------------------------------
// Adapters (LIB-14): typed tools to implement the command port. The library
// derives what an adapter must cover and types the outcome. The algebra of
// fragments below is one way, recommended (ADP-8), not required: the adapter
// implements the port as it wants. No concept of state here.

/** The predicates at the leaves of a condition, own and of other domains (GR-3). */
export type Leaves<condition extends Condition> = condition extends {
  [$Composed]: { operands: infer operands }
}
  ? operands extends Condition
    ? Leaves<operands>
    : operands extends Components
      ? Leaves<operands[keyof operands]>
      : never
  : condition

/** Every predicate a command's branches use. */
export type PredicatesOf<outcomes extends Outcomes> = Leaves<outcomes[keyof outcomes][0]>

/** Every fact a command can record. */
export type FactsOf<outcomes extends Outcomes> = outcomes[keyof outcomes][1]

/** The `$path` of a predicate or of a fact. */
export type PathOf<schema extends Predicate | Fact> = z.output<schema>['$path']

/**
 * The adapter's fragment for each predicate, under its path, from its parsed
 * parameters: a SQL condition, a MongoDB filter, a function over a
 * transaction. Exhaustive: a forgotten predicate does not compile.
 */
export type PredicateFragments<predicates extends Predicate, fragment> = {
  readonly [predicate in predicates as PathOf<predicate>]: (
    parameters: z.output<Parameters<predicate>>,
  ) => fragment
}

/**
 * How the adapter composes its fragments: one per predicate, and the boolean
 * operators. The same algebra serves commands and reads, so a predicate has
 * one translation in an adapter.
 */
export interface Algebra<predicates extends Predicate, fragment> {
  readonly predicate: PredicateFragments<predicates, fragment>
  readonly and: (components: readonly fragment[]) => fragment
  readonly or: (components: readonly fragment[]) => fragment
  readonly not: (operand: fragment) => fragment
}

/**
 * The adapter's write for each fact, under its path: how the fact's values
 * reach the state (DOM-5). Exhaustive, as a match over an ADT.
 */
export type FactWrites<facts extends Fact, write> = {
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
 * The outcome of a command (DOM-7), an ADT: one declared branch applied, with
 * its typed fact; or the rejection, naming every failed predicate (DOM-6).
 */
export type CommandOutcome<outcomes extends Outcomes> =
  | {
      [branch in keyof outcomes & string]: {
        readonly outcome: 'applied'
        readonly branch: branch
        readonly fact: z.output<outcomes[branch][1]>
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
 * The command ports of a set of commands over a state adapter. Curried, so
 * that the commands fix the types before the adapter is written.
 */
export declare function command_ports<const commands extends Commands>(
  commands: commands,
): <fragment, write>(
  adapter: StateAdapter<commands, fragment, write>,
) => { readonly [name in keyof commands]: CommandPort<commands[name]> }

/** The predicates declared in a generated module (`$predicate.ts`), for an adapter's fragments. */
export type PredicatesIn<module> = Extract<module[keyof module], Predicate>

/** The facts declared in a generated module (`$fact.ts`), for an adapter's writes. */
export type FactsIn<module> = Extract<module[keyof module], Fact>
