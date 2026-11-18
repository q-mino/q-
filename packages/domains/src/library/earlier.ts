import type * as z from 'zod'
import type { Component } from './component.ts'
import type { $Earlier, Earlier } from './version.ts'
import type { Commands, SchemaOf } from './command.ts'
import type { Queries } from './query.ts'
import type { $UseCase, CommandUseCase, ReadUseCase } from './use_case.ts'
import type { EventOutOf, Events } from './use_case_over.ts'
import type { AnyCommandLeaf, CommandUseCaseOver } from './command_leaf.ts'
import type { AnyReadLeaf, FieldsHolding, LeafStream, ReadUseCaseOver } from './read_leaf.ts'

// A leaf of a past major (PER-17, D75.6, A, 16 Nov 2026 (7)): over the leaf
// of the next major, never over the business, which has one version and
// changes under the current leaf alone. A client of the past major sends its
// input, which goes forward to the next one's (`to_next`); what the next leaf
// gives comes back in the past major's words (`from_next`), one step per
// event, exhaustive, so that an event the next major adds does not compile
// here. The nodes' closings and the base events cross as they are. A folder
// once released never changes: a change of the business breaks the current
// leaf's projection, not the past major.

/**
 * The shape a component had in a past major, over the component of the next
 * major, from the scope's `next`: a fact or an effect
 * (`earlier(next.a_tool_has_been_lent)`), its shape and the step to the next
 * one; a leaf of a persona (`earlier(next.borrow_a_tool)`, A, 16 Nov 2026
 * (7)), its input and the step forward, its events or entry and the steps
 * back (`EarlierCommandLeaf`, `EarlierReadLeaf`). A fact's step reads its
 * payload alone, stored data that every reader translates alike (DOM-22); a
 * leaf's steps run at the request and read the context of its point first,
 * once, as a creator (`(context) => (input) => …`, A, 17 Nov 2026, SC-12):
 * Marta's old phone reads her due day as its last instant in the shed's zone
 * (`end_of(context.time_zone)`).
 */
export interface EarlierBuilder<context> {
  <const next extends Component>(
    next: next,
  ): <const payload extends z.ZodObject>(earlier: {
    readonly payload: payload
    readonly to_next: (payload: z.output<payload>) => z.input<next>
  }) => Earlier<next, payload>
  <const next extends AnyCommandLeaf>(
    next: next,
  ): <const input extends z.ZodType, const events extends Events>(earlier: {
    readonly input: input
    readonly to_next: (
      context: context,
    ) => (input: z.output<input>) => z.input<SchemaOf<next['input']>>
    readonly events: events
    readonly from_next: (context: context) => FromNextEvents<EventsOfLeaf<next>, events>
  }) => EarlierCommandLeaf<next, input, events>
  <const next extends AnyReadLeaf>(
    next: next,
  ): <
    const input extends z.ZodType,
    const entry extends z.ZodObject,
    const identity extends FieldsHolding<entry, IdentityOfLeafStream<next>> = never,
    const events extends Events = never,
  >(
    earlier: {
      readonly input: input
      readonly to_next: (
        context: context,
      ) => (input: z.output<input>) => z.input<SchemaOf<next['input']>>
      readonly entry: entry
      readonly from_next: (
        context: context,
      ) => (entry: z.output<EntryOfLeaf<next>>) => z.input<entry>
    } & EarlierStream<next, identity, events, context>,
  ) => EarlierReadLeaf<next, input, entry, identity, events>
}

/**
 * How a read leaf of a past major streams (PER-18, A, 17 Nov 2026): as the
 * next leaf does, which the port follows. If the next streams, the past leaf
 * declares the field of its own entry that names a row (`identity`), checked
 * by type to hold the identity the next leaf's stream gives, as the current
 * leaf declares its own (`read_use_case_over`): an entry of 1.x that names the
 * loan `id`, where 2.0.0 names it `loan_id`, declares `id`, and one with no
 * such field does not compile, instead of a stream whose events are none. Its
 * events of its own, and one step back per event of the next. If the next
 * does not stream, no `stream`.
 */
type EarlierStream<next, identity extends string, events extends Events, context> = [
  IdentityOfLeafStream<next>,
] extends [never]
  ? { readonly stream?: never }
  : {
      readonly stream: {
        readonly identity: identity
        readonly events: events
        readonly from_next: (context: context) => FromNextEvents<StreamEventsOfLeaf<next>, events>
      }
    }

/** The events a command leaf declares. */
type EventsOfLeaf<leaf> = leaf extends { [$UseCase]: { events: infer events extends Events } }
  ? events
  : never

/** The entry a read leaf declares. */
type EntryOfLeaf<leaf> = leaf extends { [$UseCase]: { entry: infer entry extends z.ZodObject } }
  ? entry
  : never

/** The events of its own a read leaf's stream declares; none if it does not stream. */
type StreamEventsOfLeaf<leaf> = leaf extends {
  [$UseCase]: { stream: { events: infer events extends Events } }
}
  ? events
  : never

/** The identity a read leaf's stream gives in its events: the value of the field it declares; none if it does not stream. */
type IdentityOfLeafStream<leaf> = leaf extends {
  [$UseCase]: {
    entry: infer entry extends z.ZodObject
    stream: { identity: infer identity extends string }
  }
}
  ? z.output<entry>[identity & keyof z.output<entry>]
  : never

/** One step back per event of the next major: from its payload to an event of the past one. */
export type FromNextEvents<next_events extends Events, events extends Events> = {
  readonly [name in keyof next_events & string]: (
    payload: z.output<next_events[name]>,
  ) => EventOutOf<events>
}

/** A leaf of a past major, over the leaf of the next major. */
export interface OverTheNext<next> {
  readonly [$Earlier]: { readonly next: next }
}

/** A command leaf of a past major: its own input and events, the next leaf's use case, closings and waits. */
export type EarlierCommandLeaf<
  next,
  input extends z.ZodType,
  events extends Events,
> = next extends {
  readonly [$UseCase]: {
    readonly use_case: infer use_case extends CommandUseCase<Commands[string]>
    readonly closes: infer closes
    readonly waits: infer waits
  }
}
  ? CommandUseCaseOver<use_case, input, events, closes, waits> & OverTheNext<next>
  : never

/**
 * A read leaf of a past major: its own input and entry, the next leaf's use
 * case and closings; if the next leaf streams, the field of its own entry
 * that holds the identity the next one gives (`EarlierStream`), and the
 * events of its own.
 */
export type EarlierReadLeaf<
  next,
  input extends z.ZodType,
  entry extends z.ZodObject,
  identity extends string,
  events extends Events,
> = next extends {
  readonly [$UseCase]: {
    readonly use_case: infer use_case extends ReadUseCase<Queries[string]>
    readonly closes: infer closes
    readonly stream: infer stream
  }
}
  ? ReadUseCaseOver<
      use_case,
      input,
      entry,
      closes,
      stream extends LeafStream
        ? { readonly identity: identity; readonly events: events }
        : undefined
    > &
      OverTheNext<next>
  : never
