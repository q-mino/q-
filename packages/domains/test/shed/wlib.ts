import * as z from 'zod'

export const date_time_string = z.string()
.check(
  z.regex(/iso_date_regexp/)
)
.brand(Symbol('iso_date'))
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
export type Outcome = readonly [Predicate, Fact]
export type Outcomes = readonly Outcome[]
export declare const $Command: unique symbol
export type Command<
  inputSchema extends z.ZodType,
  payloadSchema extends z.ZodType,
  outcomes extends Outcomes,
> = CommandCreator<inputSchema, payloadSchema> & {
  [$Command]: {
    outcomes:outcomes
  }
}

type CommandCreator<inputSchema extends z.ZodType, payloadSchema extends z.ZodType> = (input: z.output<inputSchema>) => z.output<payloadSchema>

export declare function command<
  inputSchema extends z.ZodType,
  payloadSchema extends z.ZodType,
  outcomes extends Outcomes,
>(
  inputSchema: inputSchema,
  creator: (commandContext: CommandContext) => CommandCreator<inputSchema, payloadSchema>,
  outcomes: outcomes,
): Command<  inputSchema , payloadSchema  ,outcomes>
