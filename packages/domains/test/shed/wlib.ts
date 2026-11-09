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

export type Fact = z.ZodObject
export type Predicate = z.ZodObject

/** A branch, declared: the condition and the fact it records. DOM-5 */
export type Outcome = readonly [condition: Predicate, fact: Fact]
/** The ordered, closed list of a command's branches: at most one applies. DOM-5, DOM-3 */
export type Outcomes = readonly Outcome[]

/**
 * The branches resolved by the creator, in the same order as the outcomes:
 * for each, the parameters bound to its condition and the payload of its fact.
 * Inputs, not outputs: the library parses them and puts the brands on.
 */
export type ResolvedOutcomes<outcomes extends Outcomes> = {
  readonly [k in keyof outcomes]: readonly [
    condition: z.input<outcomes[k][0]>,
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

export declare function command<inputSchema extends z.ZodType, const outcomes extends Outcomes>(
  inputSchema: inputSchema,
  creator: CommandCreator<inputSchema, outcomes>,
  outcomes: outcomes,
): Command<inputSchema, outcomes>
