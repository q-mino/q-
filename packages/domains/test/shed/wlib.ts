import * as z from 'zod'

export const date_time_string = z.iso.datetime().brand<'date_time_string'>()
export type date_time_string = z.output<typeof date_time_string>

export interface CommandContext {
  uid: string
  now: date_time_string
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
/** Predicates composed with AND, OR, NOT. DOM-5 */
export interface Composed<parameters> {
  [$Composed]: {
    operator: 'and' | 'or' | 'not'
    operands: readonly Condition[]
    parameters: parameters
  }
}

export type Condition = Predicate | Composed<unknown>

/** The parameters the creator binds to a condition. */
export type ConditionInput<condition extends Condition> = condition extends Predicate
  ? Unpathed<condition>
  : condition extends Composed<infer parameters>
    ? parameters
    : never

type Intersection<union> = (union extends unknown ? (u: union) => void : never) extends (
  i: infer intersection,
) => void
  ? intersection
  : never

type ConditionsInput<conditions extends readonly Condition[]> = Intersection<
  { [k in keyof conditions]: ConditionInput<conditions[k]> }[number]
>

/**
 * All the conditions hold. Every predicate gets a value, with no short-circuit;
 * a rejection names every failed predicate, once. D47.1, D49, D17
 */
export declare function and<
  const conditions extends readonly [Condition, Condition, ...Condition[]],
>(...conditions: conditions): Composed<ConditionsInput<conditions>>

/** At least one condition holds. */
export declare function or<
  const conditions extends readonly [Condition, Condition, ...Condition[]],
>(...conditions: conditions): Composed<ConditionsInput<conditions>>

/** The condition does not hold. */
export declare function not<const condition extends Condition>(
  condition: condition,
): Composed<ConditionInput<condition>>

/** A branch, declared: the condition and the fact it records. DOM-5 */
export type Outcome = readonly [condition: Condition, fact: Fact]
/** The ordered, closed list of a command's branches: at most one applies. DOM-5, DOM-3 */
export type Outcomes = readonly Outcome[]

/**
 * The branches resolved by the creator, in the same order as the outcomes:
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

export declare function command<inputSchema extends z.ZodType, const outcomes extends Outcomes>(
  inputSchema: inputSchema,
  creator: CommandCreator<inputSchema, outcomes>,
  outcomes: outcomes,
): Command<inputSchema, outcomes>
