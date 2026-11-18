import type { date_time, position } from './format.ts'
import type { StoredEnvelope } from './envelope.ts'
import type { Outcomes } from './command.ts'
import type { FactLog } from './stream.ts'
import type { Failure, ReadFailure } from './state_adapter.ts'
import type { $Reaction, ReactionPaths } from './reaction.ts'
import type { CommandUseCasePort } from './use_case_port.ts'

// The consumers of reactions (DOM-16, D89.6): a durable consumer per
// reaction, with its position, its dead letters and the parts waiting behind
// them (SC-42), and how an operator resolves a letter, which the effect
// executor shares (SC-53).

/**
 * A part of a fact as a reaction's consumer meets it (D89.6, D113.3): the
 * fact, at its position, and the part, by its position in the fact. Named by
 * the fact's operation and the part, as the reaction's operation is
 * (`reaction_operation`), whatever position an adapter gives it.
 */
export interface ReactionPart {
  readonly reaction: string
  readonly position: position
  readonly fact: StoredEnvelope
  readonly part: number
}

/**
 * A dead letter of a reaction (D89.7, D67.3): the part it reacted to, and
 * why. Operational, outside the domains, shown, never a business fact. It
 * holds its part's resources (D94.7): the later parts of the reaction that
 * touch one of them wait behind it (`WaitingPart`). An operator redelivers
 * it after a fix, with the same operation, the command evaluated again (a
 * refusal leaves no fact, D79.2), or discards it, with a trace
 * (`ReactionConsumers`). Its cause, an ADT:
 * - `rejected`: the command refused, its failures (a step's, its read);
 * - `identity_already_used`: the operation came back with another
 *   fingerprint; the first outcome stands.
 */
export interface ReactionDeadLetter extends ReactionPart {
  readonly held: 'dead_letter'
  readonly cause:
    | {
        readonly cause: 'rejected'
        readonly failures: readonly (Failure<Outcomes> | ReadFailure)[]
      }
    | { readonly cause: 'identity_already_used' }
}

/**
 * A part waiting behind a held one (D94.7, D67.3; SC-42): it touches a
 * resource that a dead letter, or a part waiting before it, holds, so it is
 * not delivered, and it holds its own resources in turn, so that no later
 * part of one of them overtakes it (the order per resource, D64.4). Marta's
 * damaged return of the drill is in a dead letter; Gianni's, two days on,
 * waits behind it, and holds Gianni too. Shown with the dead letters: the
 * software informs.
 */
export interface WaitingPart extends ReactionPart {
  readonly held: 'waiting'
}

/** A part a reaction holds, an ADT: a dead letter, or a part waiting behind one. */
export type HeldPart = ReactionDeadLetter | WaitingPart

/**
 * The trace of a dead letter discarded (D67.3): the letter, a reaction's or
 * an effect's (SC-53), who discarded it, why, and when, by the clock of its
 * consumer.
 */
export interface Discarded<letter = ReactionDeadLetter> {
  readonly letter: letter
  readonly by: string
  readonly reason: string
  readonly at: date_time
}

/**
 * Where the consumers of reactions keep their own state, durable (D89.6):
 * a position per reaction (none before its first fact), the parts it holds
 * (D94.7: its dead letters and the parts waiting behind them), and the
 * traces of the letters discarded. A held part is named by its fact's
 * operation and its part (`ReactionPart`): holding one again replaces it,
 * so that a part met again after a fall is held once, a waiting part
 * delivered and rejected becomes a dead letter in its place, and a letter
 * redelivered and rejected again keeps its new failures. SC-42
 */
export interface ReactionState {
  readonly position: (reaction: string) => Promise<position | undefined>
  readonly advance: (reaction: string) => (to: position) => Promise<void>
  /** The parts a reaction holds, in the order of its log (position, then part). */
  readonly held: (reaction: string) => Promise<readonly HeldPart[]>
  readonly hold: (part: HeldPart) => Promise<void>
  /** A held part let go: delivered at last, or its letter discarded. */
  readonly release: (part: ReactionPart) => Promise<void>
  readonly discarded: (trace: Discarded) => Promise<void>
}

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

/**
 * What a dead letter redelivered gives (D67.3), an ADT, a reaction's or an
 * effect's (SC-53): `delivered`, its command applied (or nothing to invoke,
 * D88.2; for an effect, the world answered and the return applied), and the
 * parts or entries waiting behind it go on; `dead_letter`, refused or
 * exhausted again, still holding, with what was said this time; `not_held`,
 * the letter no longer held (redelivered or discarded before).
 */
export type Redelivered<letter = ReactionDeadLetter> =
  | { readonly outcome: 'delivered' }
  | { readonly outcome: 'dead_letter'; readonly letter: letter }
  | { readonly outcome: 'not_held' }

/**
 * The running consumers of a set of reactions: they stop when asked, after
 * the fact they are delivering; and an operator resolves their dead letters
 * through them (D67.3), since a letter's delivery and the parts waiting
 * behind it are the consumer's, in its own order (SC-42):
 * - `redeliver`: the letter's part again, with the same operation, after a
 *   fix; delivered, the consumer releases it and delivers the parts that
 *   waited behind it, in the order of the log;
 * - `discard`: the letter let go, with a trace (who, why), its part never
 *   delivered; the parts behind it go on as after a delivery.
 * Dead letters are operational: no domain sees them, and correcting a
 * domain's data stays a command of a persona (D67.3).
 */
export interface ReactionConsumers {
  readonly stop: () => Promise<void>
  readonly redeliver: (letter: ReactionDeadLetter) => Promise<Redelivered>
  readonly discard: (
    letter: ReactionDeadLetter,
  ) => (trace: { readonly by: string; readonly reason: string }) => Promise<void>
}
