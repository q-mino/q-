import type * as z from 'zod'
import type { position } from './format.ts'
import type { RootContext } from './context.ts'
import type { Component } from './component.ts'
import type { OutcomesOf, SchemaOf } from './command.ts'
import type { Queries, QueryEntryOf, QueryInput, QueryParts } from './query.ts'
import type { InvalidRequest, Refused, SnapshotEvent, VersionNotSupported } from './base_event.ts'
import type { Applicability, Partly } from './applicability.ts'
import { $UseCase } from './use_case.ts'
import type { FactsByName, ReadUseCase } from './use_case.ts'
import { mark } from './kind.ts'
import type { CommandOfUseCase, EventOf, Events, LeavesOfUseCase } from './use_case_over.ts'
import type { AnyCommandLeaf } from './command_leaf.ts'

// A read leaf (PER-18, DOM-17): a use case over a read use case, with its own
// input, entry and projection; it streams when it declares how, names the
// facts its clients read, and lists the actions of its entries (SC-33).

/** The query a read use case reads. */
type QueryOfUseCase<use_case> = use_case extends { [$UseCase]: { query: infer query } }
  ? query
  : never

/**
 * How a read use case over another streams (`stream`): the field of its own
 * entry that names it (`identity`), which holds the identity of the query's
 * entry, as it is; the events of its own that the facts it names become
 * (`events`, none with none). Grows with its cases: an identity of its own,
 * translated from the query's (A, 13 Nov 2026 (2)).
 */
export interface LeafStream {
  readonly identity: string
  readonly events: Events
}

/** The facts a read use case names, by name. */
type FactsOfUseCase<use_case> = use_case extends {
  [$UseCase]: { facts: readonly (infer facts extends Component)[] }
}
  ? FactsByName<facts>
  : never

/**
 * The projection of the facts that a read use case names into the events of
 * the stream of a use case over it (D45, D72.6): one function for each fact
 * it chooses among them, from the fact's payload. Partial: a fact it does
 * not choose, or that the read use case does not name, goes out as `fact`,
 * the entry it leaves, so that a new fact of the business adds no event to
 * the surface (PER-17, D75.6). A named fact may be a part of a fact (D111):
 * the library projects the part it names among those that touch the entry
 * (DOM-17: the entry's identity among the part's resources), which it finds
 * from the envelope and the query's identity, so that the stream's event
 * stays as the adapter gives it; the step's part of the round of notices
 * does not touch Gianni's R8, the notice does (A, 16 Nov 2026 (6)). Two
 * named parts touching one entry come with their case.
 */
export type FactProjection<
  facts extends Readonly<Record<string, Component>>,
  events extends Events,
> = {
  readonly [name in keyof facts]?: (fact: z.output<facts[name]>) => EventOf<events>
}

/** The names of the events a set of events holds. */
type EventNames<events> = events extends { readonly event: infer name extends string }
  ? name
  : never

/**
 * The events of its own a read leaf's stream may declare: none named as an
 * event of the stream, of the snapshot, of a node that closes the request,
 * or as a base event, which the port gives beside them.
 */
type StreamEvents<closes> = Events &
  Partial<
    Readonly<
      Record<
        | EventNames<
            | LeafStreamEvent<unknown, unknown>
            | SnapshotEvent<unknown>
            | InvalidRequest
            | VersionNotSupported
          >
        | EventNames<closes>,
        never
      >
    >
  >

/**
 * A read use case over another (DOM-2, D45): the read use case it invokes,
 * its own input as declared (`input`, from which the generator writes
 * `<use case>_input`, DOM-25), the schema of its own entries, and how it
 * streams, if it does (`stream`: the field that names an entry and the
 * events of its own), and the command leaves it lists as actions, by name
 * (`actions`, SC-33). How it closes and streams are the types' alone; at
 * runtime it holds its declaration whole, for the library to run
 * (`declared`).
 */
export interface ReadUseCaseOver<
  use_case extends ReadUseCase<Queries[string]>,
  input extends QueryInput<z.ZodType>,
  entry extends z.ZodObject,
  closes,
  stream extends LeafStream | undefined = undefined,
  actions = never,
> {
  readonly input: input
  readonly [$UseCase]: {
    readonly use_case: use_case
    readonly entry: entry
    readonly declared: object
    readonly closes?: closes
    readonly stream?: stream
    readonly actions?: actions
  }
}

/** The command leaves a read leaf lists as its actions, by name (SC-33, D47.4). */
export type Actions = Readonly<Record<string, AnyCommandLeaf>>

/** The input of a command leaf, as parsed: values read from an entry, already parsed, keep their brands. */
type CommandLeafInput<leaf> = leaf extends { readonly input: infer input }
  ? z.output<SchemaOf<input>>
  : never

/** The applicability a command leaf gives on an entry: its business command's, with its own limits. */
export type ApplicabilityOfLeaf<leaf> = leaf extends {
  [$UseCase]: { use_case: infer use_case; events: unknown; limits?: infer limits extends string }
}
  ? Applicability<OutcomesOf<CommandOfUseCase<use_case>>, LeavesOfUseCase<use_case>, limits>
  : never

/** The fields that actions add to an entry, under their names: none with none. */
export type ApplicabilitiesOf<actions> = [actions] extends [never]
  ? unknown
  : { readonly [name in keyof actions]: ApplicabilityOfLeaf<actions[name]> }

/**
 * What a read leaf's creator binds for its actions (SC-33): for each, from
 * an entry of the query, the input of its leaf, from the entry, the context
 * or, marked, the caller (`given_by_the_caller`). None with none.
 */
export type ActionBinding<entry, actions> = [actions] extends [never]
  ? { readonly actions?: never }
  : {
      readonly actions: {
        readonly [name in keyof actions]: (entry: entry) => Partly<CommandLeafInput<actions[name]>>
      }
    }

/**
 * The actions of a read that fit its entry are themselves; others ask for a
 * field no read has, whose name says why and whose type lists the culprits:
 * a name a field of the entry, read or calculated, already has (SC-33).
 */
export type ActionsFit<entry, actions> = [actions] extends [never]
  ? unknown
  : [keyof actions & keyof entry] extends [never]
    ? unknown
    : {
        readonly 'an action gives a field of its own, not one the query reads (SC-33)': keyof actions &
          keyof entry
      }

/** The identity of a query's entry, as parsed: the value of its `identity` field. */
type IdentityOfQuery<query> =
  QueryParts<query> extends {
    fields: infer fields extends z.ZodObject
    identity: infer identity extends string
  }
    ? z.output<fields>[identity & keyof z.output<fields>]
    : never

/** The fields of an entry whose value is exactly a given identity. */
export type FieldsHolding<entry extends z.ZodObject, identity> = {
  [field in keyof z.output<entry> & string]: [z.output<entry>[field]] extends [identity]
    ? [identity] extends [z.output<entry>[field]]
      ? field
      : never
    : never
}[keyof z.output<entry> & string]

/** The input of the query a read use case reads, as its creator gives it. */
type QueryInputOfUseCase<use_case> =
  QueryParts<QueryOfUseCase<use_case>> extends {
    fields: unknown
    input?: infer input extends z.ZodType
  }
    ? z.input<input>
    : never

/**
 * What a read leaf's creator binds, by part, as a query's creator does since
 * SC-21: the input of the query it reads and, if it reads in pages, their
 * size (SC-22), a whole number from 1, which may come from its own input,
 * bounded by its schema (D50.3, D72.8: the node declares the page). With no
 * page, one page: every entry, one snapshot. A leaf that streams reads
 * whole: its creator binds no page, until a case asks for both (LIB-3).
 */
export type ReadBinding<input, streams extends boolean> = {
  readonly query: input
} & (streams extends true
  ? { readonly page?: never }
  : { readonly page?: { readonly size: number } })

/**
 * A read use case over another, declared in one argument whose parts have
 * names, in the order of the flow: the read use case it invokes, its input,
 * the creator that turns it into the invoked one's input and the page, by
 * part (`{ query, page }`, SC-22), its entry, the
 * projection that builds an entry of its own from one of the invoked one,
 * field by field (D45): a field it does not write never leaves (PER-18); and
 * last, if it streams, how (`stream`). Its creator reads the context of its
 * point of the tree.
 *
 * With no `stream` it gives the snapshot alone, and its port is not
 * `Streamed`, so that no live view can take it (D24, D77). With `stream`, its
 * port is `Streamed`: every entry of the stream (`fact`, `entered`, `changed`) is
 * projected as in the snapshot, and `left` names the entry by the field of its
 * own entry that `stream.identity` declares, which must hold the identity of
 * the query's entry, as it is (A, 13 Nov 2026 (2)). Among the facts the read
 * use case names, it chooses those its clients read by a name of its own
 * (`stream.events`, `stream.facts`, D72.6): the fact goes out as its event,
 * with the entry it leaves and the payload projected from the fact; every
 * other fact as `fact`, the entry alone (A, 14 Nov 2026).
 *
 * A read may list, by names of its own, command leaves of its folder as
 * actions (`actions`, SC-33, D47.4, D51.1; A for the shape, 18 Nov 2026
 * (2)): the nodes above them are its own, already passed. Its creator binds
 * each, by part (`actions`), from an entry of the query to the leaf's input,
 * a field the caller gives marked (`given_by_the_caller`); the library
 * evaluates, on every entry, in its snapshot, the leaf's limits and, by the
 * same pass as the write, the nodes and the command of the business below,
 * and gives the projection, under the action's name, its applicability
 * (`Applicability`), which the projection writes in the persona's words. An
 * action's command is of the query's domain, read in the same store; one of
 * another domain comes with its case. Its port needs an adapter that
 * evaluates actions (D110): a leaf that lists some over one that does not is
 * a fault at wiring (CFG-2).
 *
 * A read leaf may hold limits of its own (`is_refused_unless`, SC-32, D80,
 * C, 18 Nov 2026 (3)), as a command leaf: pure, over the context of its
 * point and the input, run after the nodes of its path and before the read
 * (PER-5.5); the failed ones close the request with `refused`, their names
 * the reasons, before any snapshot. A limit that holds for some wearers and
 * not for others, by their values (PER-1, D77): Marta follows the shelf live
 * while her card is valid; with it expired she is refused, told why, and
 * reads the catalogue once, as anyone. It never filters a row: a constraint
 * that takes rows away is a perimeter (D80, on reads). Evaluated at the
 * request: a stream opened before the card expires stays open, and the next
 * request, a resume too, is refused.
 */
export type ReadUseCaseOverBuilder<context, closes> = <
  const use_case extends ReadUseCase<Queries[string]>,
  const input extends QueryInput<z.ZodType, RootContext>,
  const entry extends z.ZodObject,
  const identity extends FieldsHolding<entry, IdentityOfQuery<QueryOfUseCase<use_case>>> = never,
  const events extends StreamEvents<closes | ([limits] extends [never] ? never : Refused<limits>)> =
    never,
  const actions extends Actions = never,
  const limits extends string = never,
>(
  use_case: {
    readonly use_case: use_case
    readonly input: input
    readonly actions?: actions
    readonly is_refused_unless?: Readonly<
      Record<limits, (context: context) => (input: z.output<SchemaOf<input>>) => boolean>
    >
  } & {
    readonly actions?: ActionsFit<QueryEntryOf<QueryOfUseCase<use_case>>, actions>
    readonly creator: (
      context: context,
    ) => (
      input: z.output<SchemaOf<input>>,
    ) => ReadBinding<QueryInputOfUseCase<use_case>, [identity] extends [never] ? false : true> &
      ActionBinding<QueryEntryOf<QueryOfUseCase<use_case>>, NoInfer<actions>>
    readonly entry: entry
    readonly projection: (
      entry: QueryEntryOf<QueryOfUseCase<use_case>> & ApplicabilitiesOf<NoInfer<actions>>,
    ) => z.input<entry>
    readonly stream?: {
      readonly identity: identity
      readonly events?: events
      readonly facts?: FactProjection<FactsOfUseCase<use_case>, events>
    }
  },
) => ReadUseCaseOver<
  use_case,
  input,
  entry,
  closes | ([limits] extends [never] ? never : Refused<limits>),
  [identity] extends [never]
    ? undefined
    : {
        readonly identity: identity
        readonly events: events
      },
  actions
>

/** Any read leaf, current or of a past major. */
export type AnyReadLeaf = ReadUseCaseOver<
  ReadUseCase<Queries[string]>,
  QueryInput<z.ZodType>,
  z.ZodObject,
  unknown,
  LeafStream | undefined,
  unknown
>

/**
 * The events of the stream of a read leaf, as its port gives them (D72.5, A,
 * 13 Nov 2026 (2)): those of `StreamEvent`, every entry projected as in the
 * snapshot, its identity the field of the leaf's own entry that names it
 * (`stream.identity`), typed as that field so that an identity of its own
 * can come without changing the port. A fact the leaf names goes out as its
 * own event (`events`), with the entry it leaves and its payload, projected
 * from the fact (D72.6, A, 14 Nov 2026), or from its part that touches the
 * entry (A, 16 Nov 2026 (6)); any other, as `fact`, with the entry and not
 * the fact. An entry `changed` by a fact that did not touch it goes out as
 * `fact` too, the row alone: Marta's client updates the row of the drill
 * renamed by `tools`, with no event the persona must add (PER-17, SC-19).
 * The position goes out as it is, opaque (D72.6);
 * the envelope and its resources never (PER-18, D107.4).
 */
export type LeafStreamEvent<entry, identity, events extends Events = never> =
  | NamedFactEvent<entry, identity, events>
  | {
      readonly event: 'fact'
      readonly position: position
      readonly identity: identity
      readonly entry: entry
    }
  | {
      readonly event: 'entered'
      readonly position: position
      readonly identity: identity
      readonly entry: entry
    }
  | { readonly event: 'left'; readonly position: position; readonly identity: identity }
  | { readonly event: 'caught_up'; readonly position: position }
  | { readonly event: 'position_unavailable' }

/** A fact the leaf names, as its port gives it: its own event, with the entry and the payload; none with no events. */
type NamedFactEvent<entry, identity, events extends Events> = [events] extends [never]
  ? never
  : {
      [name in keyof events & string]: {
        readonly event: name
        readonly position: position
        readonly identity: identity
        readonly entry: entry
        readonly payload: z.output<events[name]>
      }
    }[keyof events & string]

// The builder's body (part 3.2): a leaf is its input as declared, the use
// case it invokes, its entry, the actions it lists if it lists some, and its
// declaration whole.

export const read_use_case_over_builder =
  <context, closes>(): ReadUseCaseOverBuilder<context, closes> =>
  (leaf) =>
    Object.assign(
      {
        input: leaf.input,
        [$UseCase]: {
          use_case: leaf.use_case,
          entry: leaf.entry,
          declared: leaf,
          ...(leaf.actions === undefined ? {} : { actions: leaf.actions }),
        },
      },
      mark({ kind: 'usecase' }),
    )
