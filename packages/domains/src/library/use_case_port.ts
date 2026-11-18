import type * as z from 'zod'
import type { cursor, position } from './format.ts'
import type { CommandRootContext, RootContext } from './context.ts'
import type { Component } from './component.ts'
import type { Envelope, Part } from './envelope.ts'
import type { Commands, OutcomesOf } from './command.ts'
import type { Queries, QueryEntryOf, QueryParts } from './query.ts'
import type { PredicateFragments } from './algebra.ts'
import type { StreamEvent } from './stream.ts'
import type { OutcomeOf } from './state_adapter.ts'
import type { SnapshotEvent } from './base_event.ts'
import type { Applicability, Partly } from './applicability.ts'
import type { $UseCase, CommandUseCase } from './use_case.ts'
import type { CommandOfUseCase, InputOfUseCase, LeavesOfUseCase } from './use_case_over.ts'
import type { ActionsFit } from './read_leaf.ts'
import type { FragmentOf, PredicatesIn, Registry } from './registry.ts'

// The ports of the use cases of a business tree (DOM-2, LIB-14), which the
// library builds over the state adapter: a command use case's, and a read use
// case's, in pages, as a stream, with its actions (SC-33).

/**
 * A command use case port: one message in, the stream of its events out
 * (DOM-3). The stream ends after a terminal event; a consumer that stops
 * listening does not cancel the command (D72.2).
 */
export type CommandUseCasePort<use_case> = use_case extends {
  [$UseCase]: { command: infer command }
}
  ? (
      context: CommandRootContext,
      input: InputOfUseCase<use_case>,
    ) => AsyncIterable<OutcomeOf<command, LeavesOfUseCase<use_case>>>
  : never

/** The events of a read use case that streams: the snapshot, then the stream's (DOM-17). */
export type ReadEvent<envelope, entry, identity> =
  SnapshotEvent<entry> | StreamEvent<envelope, entry, identity>

/**
 * A page asked of a read (SC-22): how many entries at most, and the cursor it
 * starts after, the `next` of the snapshot before it. With no size, every
 * entry; with no cursor, from the first.
 */
export interface Page {
  readonly size?: number
  readonly after?: cursor
}

/**
 * A query read in pages (SC-22): one snapshot per page, read when the
 * consumer asks for the next (pull), each at its own position and with its
 * total, so the pages are not one snapshot (D72.8, D53): a tool added before
 * the cursor is not met going on, one renamed past it comes again. The
 * stream ends after the last page, or when its consumer stops; from the
 * cursor of a page it resumes after it, as a stream from a position (D57).
 * A cursor that does not decode to the query's order key is no page:
 * `invalid_request` at a leaf.
 */
export type Pages<input, entry> = (
  context: RootContext,
  input: input,
  page: Page,
) => AsyncIterable<SnapshotEvent<entry>>

/**
 * A read use case port, typed by what its adapter gives: with a stream, the
 * input and an optional position in, the snapshot and the stream out, the
 * facts typed by the registry's, the entries by the query's entry, the
 * identity by its field; with none, the input in, the snapshot alone out.
 * `streamed` says which, at runtime and in the type: by subtyping a port that
 * gives the snapshot alone would serve a consumer of every event, so a
 * consumer that needs a live view asks for `streamed: true` (`Streamed`).
 * Either way the snapshot is one page, the whole read, and `pages` reads the
 * query in pages (SC-22).
 *
 * Over an adapter that evaluates actions (`applicable`, D110), `with_actions`
 * gives the port again, its entries with the applicability of each action
 * under its name (SC-33): a command use case of the query's domain and, from
 * an entry and the context of the read, its input, flat, the fields the
 * caller gives marked. The library runs, per entry, the same pass as the
 * write (the nodes of its path, then its command's creator), plans the
 * leaves known (`PlannedLeaves`) and composes their values.
 */
export type ReadUseCasePort<
  query,
  facts extends Component,
  streamed extends boolean,
  applicable extends boolean = false,
  actions = never,
> =
  QueryParts<query> extends {
    input: infer input extends z.ZodType
    fields: infer fields extends z.ZodObject
    identity: infer identity extends string
  }
    ? (streamed extends true
        ? ((
            context: RootContext,
            input: z.input<input>,
            from?: position,
          ) => AsyncIterable<
            ReadEvent<
              Envelope<readonly Part<facts>[]>,
              QueryEntryOf<query> & BusinessApplicabilitiesOf<actions>,
              z.output<fields>[identity & keyof z.output<fields>]
            >
          >) &
            Streamed
        : ((
            context: RootContext,
            input: z.input<input>,
          ) => AsyncIterable<
            SnapshotEvent<QueryEntryOf<query> & BusinessApplicabilitiesOf<actions>>
          >) & {
            readonly streamed: false
          }) & {
        readonly pages: Pages<
          z.input<input>,
          QueryEntryOf<query> & BusinessApplicabilitiesOf<actions>
        >
      } & (applicable extends true ? WithActions<query, facts, streamed> : unknown)
    : never

/** A read use case port that gives its entries again with actions (SC-33). */
export interface WithActions<query, facts extends Component, streamed extends boolean> {
  readonly with_actions: <
    const actions extends Readonly<Record<string, Action<QueryEntryOf<query>>>>,
  >(
    actions: actions & ActionsFit<QueryEntryOf<query>, actions>,
  ) => ReadUseCasePort<query, facts, streamed, false, actions>
}

/**
 * An action of a business read (SC-33): a command use case of the query's
 * domain and its input for an entry, in the context of the read: the
 * target the nodes of its path bind and its command's own, flat, a field the
 * caller gives marked.
 */
export interface Action<
  entry,
  use_case extends CommandUseCase<Commands[string]> = CommandUseCase<Commands[string]>,
> {
  readonly use_case: use_case
  readonly input: (context: RootContext) => (entry: entry) => Partly<InputOfUseCase<use_case>>
}

/** The fields that a business read's actions add to an entry: the applicability of each command, no limits. */
type BusinessApplicabilitiesOf<actions> = [actions] extends [never]
  ? unknown
  : {
      readonly [name in keyof actions]: actions[name] extends { readonly use_case: infer use_case }
        ? Applicability<OutcomesOf<CommandOfUseCase<use_case>>, LeavesOfUseCase<use_case>>
        : never
    }

/** What a consumer of a live view asks of a read use case port. */
export interface Streamed {
  readonly streamed: true
}

/**
 * The queries whose entries an adapter gives with actions (SC-33), by name,
 * as its streams: for each, the fragments of its domain's command
 * predicates. A query may have none.
 */
export type Applicabilities<queries extends Queries, registry extends Registry> = {
  readonly [name in keyof queries]?: PredicateFragments<PredicatesIn<registry>, unknown>
}

/** The queries an adapter gives with actions, by name; none with none. */
export type ApplicableNames<applicability> = applicability extends undefined
  ? never
  : keyof applicability

/** The fragment type of an adapter's applicabilities; none with none. */
export type ApplicabilityFragmentOf<applicability> = applicability extends undefined
  ? never
  : FragmentOf<applicability[keyof applicability]>
