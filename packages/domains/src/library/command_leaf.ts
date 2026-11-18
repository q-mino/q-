import type * as z from 'zod'
import type { position } from './format.ts'
import type { OperationContext } from './context.ts'
import type { Component } from './component.ts'
import type { CommandInput, Commands, OutcomesOf, SchemaOf } from './command.ts'
import type { Refused } from './base_event.ts'
import { $UseCase } from './use_case.ts'
import type { CommandUseCase, FactsByName } from './use_case.ts'
import { mark } from './kind.ts'
import type {
  CommandOfUseCase,
  EventOf,
  Events,
  InputOfUseCase,
  LeavesOfUseCase,
  Projection,
} from './use_case_over.ts'

// A command leaf (PER-6, DOM-3): a use case over a command use case, with its
// own input, events, creator, projection and limits; it may stay open after
// its outcome, following the facts of its chain (`follows`, `ends`).

/**
 * A command use case over another: the use case it invokes, its own input
 * as declared (`input`, from which the generator writes `<use case>_input`,
 * DOM-25), its events, how the nodes above it may close a request
 * (`closes`), which its port adds to its events, the names of its own
 * limits, which its applicability gives (`limits`, SC-33), and the field of
 * its input that names its operation, if it names one (`operation`, SC-34).
 * How it closes, waits and is refused are the types' alone; at runtime it
 * holds its declaration whole, for the library to run (`declared`).
 */
export interface CommandUseCaseOver<
  use_case extends CommandUseCase<Commands[string]>,
  input extends CommandInput<z.ZodType>,
  events extends Events,
  closes,
  waits = never,
  limits extends string = never,
  operation extends string = never,
> {
  readonly input: input
  readonly [$UseCase]: {
    readonly use_case: use_case
    readonly events: events
    readonly declared: object
    readonly closes?: closes
    readonly waits?: waits
    readonly limits?: limits
    readonly operation?: operation
  }
}

/**
 * The fields of an input that may name its operation (SC-34): those that
 * always hold a string, an optional one not, since an operation always has
 * an identity (DOM-11).
 */
type OperationFields<input> = {
  [field in keyof input & string]: [input[field]] extends [string] ? field : never
}[keyof input & string]

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
 * open until `tools` takes it into the workshop. A fact it follows may be a
 * part of a fact (D111), as one a read use case names (DOM-17): each part of
 * the chain under a followed name is projected, in the order of the log
 * (SC-44: Luca's screen follows the loading of his sheet, a step's fact
 * holding the line's part beside the step's).
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
 *
 * The leaf of an actor from outside whose sender names its requests (D91.2,
 * SC-34, C, 18 Nov 2026 (3); A for the shape) says which field of its input
 * names its operation (`operation: { identity: 'notification_id' }`, as a
 * read leaf's `stream.identity` names a field of its entry), checked by type
 * to hold a string: Rossi's system sends notification N-88 again, the same,
 * when the shed does not answer, and its id is in what it sends, not beside
 * it, since the system speaks its own language, not the shed's envelope. The
 * library reads it after the schema (PER-5.3; for a past major, from the
 * current leaf's input, after `to_next`), and the entry gives the scope
 * alone (`OperationScopeContext`). The fingerprint covers it, as the whole
 * input: N-88 with another body is `identity_already_used`.
 */
export type CommandUseCaseOverBuilder<context, closes> = <
  const use_case extends CommandUseCase<Commands[string]>,
  const input extends CommandInput<z.ZodType, context & OperationContext>,
  const events extends Events,
  const limits extends string = never,
  const followed extends Component = never,
  const identity extends OperationFields<z.output<SchemaOf<input>>> = never,
>(
  use_case: {
    readonly use_case: use_case
    readonly input: input
    readonly operation?: { readonly identity: identity }
    readonly is_refused_unless?: Readonly<
      Record<limits, (context: context) => (input: z.output<SchemaOf<input>>) => boolean>
    >
    readonly creator: (
      context: context & OperationContext,
    ) => (input: z.output<SchemaOf<input>>) => InputOfUseCase<use_case>
    readonly events: events
    readonly projection: Projection<
      OutcomesOf<CommandOfUseCase<use_case>>,
      events,
      LeavesOfUseCase<use_case>
    >
  } & LeafFlow<events, followed>,
) => CommandUseCaseOver<
  use_case,
  input,
  events,
  closes | ([limits] extends [never] ? never : Refused<limits>),
  [followed] extends [never] ? never : WaitIsOver,
  limits,
  identity
>

/** Any command leaf, current or of a past major. */
export type AnyCommandLeaf = CommandUseCaseOver<
  CommandUseCase<Commands[string]>,
  CommandInput<z.ZodType>,
  Events,
  unknown,
  unknown,
  string,
  string
>

// The builder's body (part 3.2): a leaf is its input as declared, the use
// case it invokes, its events, the field that names its operation if it
// names one, and its declaration whole.

export const command_use_case_over_builder =
  <context, closes>(): CommandUseCaseOverBuilder<context, closes> =>
  (leaf) =>
    Object.assign(
      {
        input: leaf.input,
        [$UseCase]: {
          use_case: leaf.use_case,
          events: leaf.events,
          declared: leaf,
          ...(leaf.operation === undefined ? {} : { operation: leaf.operation.identity }),
        },
      },
      mark({ kind: 'usecase' }),
    )
