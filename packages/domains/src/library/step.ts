import type * as z from 'zod'
import { mark } from './kind.ts'
import type { cursor } from './format.ts'
import type { OperationContext } from './context.ts'
import type { Component, Path, PathOf, Strays } from './component.ts'
import type { Condition, ConditionInput } from './condition.ts'
import { $Command } from './command.ts'
import type { CommandInput, Commands, InputOf, SchemaOf } from './command.ts'
import type { IdentityFields, OneSubject, QueryShape } from './query.ts'

// The step of a process with a cursor (DOM-20, D97, D111, D112): a command for
// whoever invokes it, its path under `command/` (DOM-19). It reads the
// process by its key, chooses the next instance of the process's selection
// after its cursor, and applies to it the transition of another command,
// recording one fact with the step's part and the transition's (D111); or,
// none left, it closes the process. Only a process with a cursor needs it.

export const $Step: unique symbol = Symbol('Step')

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
 * `completes` (`$Command`, the types' alone); for the library its parts, the
 * facts it records among them (`$Step`).
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
    input?: SchemaOf<input>
    outcomes?: {
      readonly advances: readonly [condition: never, fact: outcomes['advances']]
      readonly completes: readonly [condition: never, fact: outcomes['completes']]
    }
  }
  [$Step]: { reads: reads; composes: composes; outcomes: outcomes } & QueryShape<
    fields,
    identity,
    selection
  >
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

// The builder's body (part 3.2): a step is its creator, with its input as
// declared and its parts, the facts it records among them; its branches as
// a command's are the types' alone.

export const cursor_step_builder =
  <context>(): CursorStepBuilder<context> =>
  (step) =>
    Object.assign(
      (context: context & OperationContext) => step.creator(context),
      {
        input: step.input,
        [$Command]: {},
        [$Step]: {
          reads: step.reads,
          composes: step.composes,
          outcomes: step.outcomes,
          fields: step.fields,
          identity: step.identity,
          selection: step.selection,
          order: step.order,
        },
      },
      mark({ kind: 'command' }),
    )
