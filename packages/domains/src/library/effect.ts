import type * as z from 'zod'
import type { position } from './format.ts'
import type { Component, PathOf } from './component.ts'
import type { $Command, Outcomes, entry_id } from './command.ts'
import type { Failure, StoredEntry } from './state_adapter.ts'
import type { $UseCase } from './use_case.ts'
import type { ComponentsIn } from './registry.ts'
import type { Discarded, Redelivered } from './reaction_consumer.ts'

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

/** The input of the return of an effect among a domain's return use cases; `never` if it has none. */
type ReturnOf<returns, effect> = {
  [name in keyof returns]: returns[name] extends {
    [$UseCase]: { returns_from?: infer from; command: infer command }
  }
    ? [from] extends [effect]
      ? command extends { [$Command]: { input?: infer input extends z.ZodType } }
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
export type Outbox = (effect: string) => (from: position | undefined) => AsyncIterable<QueuedEntry>

/** An entry as its effect's executor meets it: at its position in the outbox, named by its effect and its id. */
export interface QueuedEntry {
  readonly position: position
  readonly entry: StoredEntry
}

/**
 * A dead letter of the effect executor (DOM-15, D67.3): operational,
 * outside the domains, shown, never a business fact; redelivered after a
 * fix with the same identity, or discarded by an operator, with a trace
 * (`EffectExecutor`). It holds its entry's resources for its effect (D108,
 * SC-53): the later entries of the effect that touch one of them wait
 * behind it (`WaitingEntry`); unless its effect tolerates reordering
 * (`order: 'any'`, SC-56), and then it holds nothing. Its cause, an ADT:
 * - `exhausted`: the delivery gave up; redelivered, the effect runs again;
 * - `rejected`: the return rejected what the world said, kept with its
 *   failures; redelivered, the return runs again with it, never the effect
 *   (D108.4);
 * - `identity_already_used`: the entry came back with another outcome; the
 *   first stands (D108.4).
 */
export interface EffectDeadLetter extends QueuedEntry {
  readonly held: 'dead_letter'
  readonly cause:
    | { readonly cause: 'exhausted'; readonly reason: string }
    | {
        readonly cause: 'rejected'
        readonly returns: unknown
        readonly failures: readonly Failure<Outcomes>[]
      }
    | { readonly cause: 'identity_already_used'; readonly returns: unknown }
}

/**
 * An entry waiting behind a held one (D108, D67.3; SC-53): an entry of the
 * same effect that touches a resource a dead letter, or an entry waiting
 * before it, holds; not delivered, it holds its own resources in turn, so
 * that no later entry of one of them overtakes it. Gianni's notice of the
 * drill's first repair is in a dead letter; his notice of the second waits
 * behind it. Shown with the dead letters: the software informs.
 */
export interface WaitingEntry extends QueuedEntry {
  readonly held: 'waiting'
}

/** An entry an effect holds, an ADT: a dead letter, or an entry waiting behind one. */
export type HeldEntry = EffectDeadLetter | WaitingEntry

/**
 * Where an executor keeps its own state, durable (DOM-14): its position per
 * effect, the entries each effect holds (its dead letters and the entries
 * waiting behind them, SC-53), and the traces of the letters discarded. A
 * held entry is named by its effect and its id, the key (DOM-13): holding
 * one again replaces it, so that an entry met again after a fall is held
 * once, a waiting entry delivered and refused becomes a dead letter in its
 * place, and a letter redelivered and refused again keeps its new cause.
 */
export interface ExecutorState {
  readonly position: (effect: string) => Promise<position | undefined>
  readonly advance: (effect: string) => (to: position) => Promise<void>
  /** The entries an effect holds, in the order of its outbox. */
  readonly held: (effect: string) => Promise<readonly HeldEntry[]>
  readonly hold: (entry: HeldEntry) => Promise<void>
  /** A held entry let go: delivered at last, or its letter discarded. */
  readonly release: (entry: QueuedEntry) => Promise<void>
  readonly discarded: (trace: Discarded<EffectDeadLetter>) => Promise<void>
}

/**
 * A running executor: it stops when asked, after the entry it is
 * delivering; and an operator resolves its dead letters through it (D67.3,
 * SC-53), since a letter's delivery and the entries waiting behind it are
 * its effect's, in its own order:
 * - `redeliver`: the letter's entry again, after a fix, with the same
 *   identity: `exhausted`, the effect runs again; `rejected`, the return
 *   runs again with what the world said, never the effect (D108.4);
 *   `identity_already_used`, the return refuses it again, since the first
 *   outcome stands, and the operator discards it. Delivered, the executor
 *   releases it and delivers the entries that waited behind it, in the
 *   order of the outbox;
 * - `discard`: the letter let go, with a trace (who, why), its entry never
 *   delivered; the entries behind it go on as after a delivery.
 */
export interface EffectExecutor {
  readonly stop: () => Promise<void>
  readonly redeliver: (letter: EffectDeadLetter) => Promise<Redelivered<EffectDeadLetter>>
  readonly discard: (
    letter: EffectDeadLetter,
  ) => (trace: { readonly by: string; readonly reason: string }) => Promise<void>
}
