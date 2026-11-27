// The module of `bonds/address_book` on the node's database (IndexedDB, SQLite) (part 21.2, WEB-8, WEB-9):
// the oracle's module (TST-2) over the domain's store. Its records sit under
// `['state', kind, id]`, a face or a bond as `_value.ts` gives it; its
// predicates read the records they name by key, or a kind's by range, and
// judge them with the domain's `dsl` (DOM-5), as the oracle judges its
// state; its writes set the records of the domain's own store (DOM-8); its
// reads select a range's records in memory, with no index (WEB-8). The
// secret of a ticket is verified over the primitives port, with the safe's
// pure function (BND-9, SEA-6), as the oracle does.

import type { TheAddressBooksPorts } from '../../ports/index.ts'
import * as zz from '@q-mino/domains/library'
import { registry } from '@q-mino/domains/bonds/address_book/_registry.ts'
import type * as address_book_fact from '@q-mino/domains/bonds/address_book/_fact.ts'
import type * as address_book_predicate from '@q-mino/domains/bonds/address_book/_predicate.ts'
import type * as address_book_query from '@q-mino/domains/bonds/address_book/_query.ts'
import type * as bond_selections from '@q-mino/domains/bonds/address_book/_bond_selection.ts'
import type * as face_selections from '@q-mino/domains/bonds/address_book/_face_selection.ts'
import type * as ticket_selections from '@q-mino/domains/bonds/address_book/_ticket_selection.ts'
import type { bond_id, face_id } from '@q-mino/domains/bonds/address_book/_id.ts'
import { bond, face } from '@q-mino/domains/bonds/address_book/_value.ts'
import {
  a_bond_is_there,
  a_face_is_there,
  i_opened_their_ticket_within_the_window_of_a_crossing_of,
  my_introduction_is_sent,
  the_bond_is_kept,
  the_bond_is_removed,
  the_confirmation_is_received,
  the_content_a_ticket_s_secret_signs,
  the_face_is_being_made,
  the_face_is_made,
  the_ticket_has_expired,
  the_ticket_is_being_prepared,
  the_ticket_is_ready,
  their_introduction_is_declared_within_the_window_of_a_crossing_of,
} from '@q-mino/domains/bonds/address_book/_dsl.ts'
import {
  a_bond,
  accept_their_introduction,
  keep_the_key_of_a_face,
  keep_the_mailbox_of_a_ticket,
  let_a_ticket_expire,
  make_my_first_face,
  my_bonds,
  my_faces,
  my_ticket,
  open_their_ticket,
  prepare_a_ticket,
  remove_a_bond,
  rename_a_bond,
  the_bond_at_my_mailbox,
  the_mailboxes_i_collect,
  the_ticket_at_my_mailbox,
} from '@q-mino/domains/bonds/address_book/_usecase.ts'
import { the_signature_holds, type Primitives } from '@q-mino/domains/seals/safe/_dsl.ts'
import {
  execute_in,
  recorded_in,
  the_operators,
  type AKey,
  type Fragment,
  type Write,
} from '../command.ts'
import type { TheNodesStorage } from '../node.ts'
import {
  after,
  reads_in,
  selection_operators,
  type Field,
  type Selection,
  type Source,
} from '../reads.ts'
import {
  every_parsed,
  on_a_record,
  on_the_records,
  parsed,
  set,
  the_records_of_a_domain,
} from '../records.ts'

/** The address book's records (WEB-8): `['state', 'face', face_id]` a face, `['state', 'bond', bond_id]` a bond; read by `extensions` too (GR-3). */
export const the_address_book_s_records = the_records_of_a_domain('bonds/address_book')

/** A ticket to show, as the subject `ticket` reads it (BND-11): the bond, with the face it is for. */
interface Ticket {
  readonly bond: bond
  readonly face: face
}

const a_face_s_key = (id: face_id) => the_address_book_s_records.a('face', id)
const a_bond_s_key = (id: bond_id) => the_address_book_s_records.a('bond', id)
const every_face = the_address_book_s_records.every('face')
const every_bond = the_address_book_s_records.every('bond')

const on_a_face = on_a_record(face)
const on_a_bond = on_a_record(bond)

/** The D of my mailbox of a bond: none while the safe draws its key (BND-8). */
const my_deposit_address = (of_mine: bond | undefined): string | undefined =>
  of_mine !== undefined && 'deposit_address' in of_mine.my_mailbox
    ? of_mine.my_mailbox.deposit_address
    : undefined

/**
 * The secret is the ticket's (BND-9): the signature of the ticket's face over
 * the content its mailbox's D makes holds, by the face's public key. The face
 * is the bond's, known once the bond is read: so the fragment reads the bond
 * by its key and every face by range, the user's few (one in stage 1).
 */
const the_secret_holds =
  (primitives: Primitives) =>
  (id: bond_id, secret: string): Fragment => ({
    reads: [a_bond_s_key(id), every_face],
    holds: (records) => {
      const of_the_bond = parsed(bond)(records.of(a_bond_s_key(id)))
      const deposit_address = my_deposit_address(of_the_bond)
      const public_key = every_parsed(face)(records, every_face).find(
        (of_mine) => of_mine.id === of_the_bond?.my_face_id,
      )?.public_key
      return (
        deposit_address !== undefined &&
        public_key !== undefined &&
        the_signature_holds(primitives)(
          public_key,
          the_content_a_ticket_s_secret_signs(deposit_address),
          secret,
        )
      )
    },
  })

const bonds_fragments = (
  primitives: Primitives,
): zz.PredicateFragments<zz.PredicatesIn<typeof address_book_predicate>, Fragment> => ({
  'bonds/address_book/predicate/a_face_has_this_id': (p) =>
    on_a_face(a_face_s_key(p.face_id), a_face_is_there),
  'bonds/address_book/predicate/the_face_is_made': (p) =>
    on_a_face(a_face_s_key(p.face_id), the_face_is_made),
  'bonds/address_book/predicate/a_bond_has_this_id': (p) =>
    on_a_bond(a_bond_s_key(p.bond_id), a_bond_is_there),
  'bonds/address_book/predicate/the_bond_is_kept': (p) =>
    on_a_bond(a_bond_s_key(p.bond_id), the_bond_is_kept),
  'bonds/address_book/predicate/the_bond_is_removed': (p) =>
    on_a_bond(a_bond_s_key(p.bond_id), the_bond_is_removed),
  'bonds/address_book/predicate/the_user_has_a_face': () =>
    on_the_records(face)(every_face, (faces) => faces.length > 0),
  'bonds/address_book/predicate/the_face_is_being_made': (p) =>
    on_a_face(a_face_s_key(p.face_id), the_face_is_being_made),
  'bonds/address_book/predicate/the_ticket_is_being_prepared': (p) =>
    on_a_bond(a_bond_s_key(p.bond_id), the_ticket_is_being_prepared),
  'bonds/address_book/predicate/the_ticket_is_ready': (p) =>
    on_a_bond(a_bond_s_key(p.bond_id), the_ticket_is_ready),
  'bonds/address_book/predicate/the_ticket_has_expired': (p) =>
    on_a_bond(a_bond_s_key(p.bond_id), the_ticket_has_expired),
  'bonds/address_book/predicate/the_secret_is_the_ticket_s': (p) =>
    the_secret_holds(primitives)(p.bond_id, p.secret),
  'bonds/address_book/predicate/the_bond_is_with_this_face': (p) =>
    on_a_bond(a_bond_s_key(p.bond_id), (of_mine) => of_mine?.their_face?.key === p.key),
  'bonds/address_book/predicate/my_introduction_is_sent': (p) =>
    on_a_bond(a_bond_s_key(p.bond_id), my_introduction_is_sent),
  'bonds/address_book/predicate/the_confirmation_is_received': (p) =>
    on_a_bond(a_bond_s_key(p.bond_id), the_confirmation_is_received),
  'bonds/address_book/predicate/i_opened_their_ticket_within_the_window_of_a_crossing_of': (p) =>
    on_a_bond(
      a_bond_s_key(p.bond_id),
      i_opened_their_ticket_within_the_window_of_a_crossing_of(p.declared_at),
    ),
  'bonds/address_book/predicate/their_introduction_is_declared_within_the_window_of_a_crossing_of':
    (p) =>
      on_a_bond(
        a_bond_s_key(p.bond_id),
        their_introduction_is_declared_within_the_window_of_a_crossing_of(p.now),
      ),
})

// The reads of the subject `bonds/address_book/selection/face`: a face of the user's.

const face_selection: zz.Algebra<zz.SelectionsIn<typeof face_selections>, Selection<face>> = {
  ...selection_operators<face>(),
  predicate: {
    'bonds/address_book/selection/face/the_face_is_made': () => () => (of_mine) =>
      the_face_is_made(of_mine),
  },
}

// The reads of the subject `bonds/address_book/selection/bond`: a bond of the user's.

const bond_selection: zz.Algebra<zz.SelectionsIn<typeof bond_selections>, Selection<bond>> = {
  ...selection_operators<bond>(),
  predicate: {
    'bonds/address_book/selection/bond/the_bond_has_this_id': (p) => () => (of_mine) =>
      of_mine.id === p.bond_id,
    'bonds/address_book/selection/bond/the_bond_is_kept': () => () => (of_mine) =>
      the_bond_is_kept(of_mine),
    'bonds/address_book/selection/bond/my_mailbox_of_the_bond_is_at_this_address':
      (p) => () => (of_mine) =>
        my_deposit_address(of_mine) === p.deposit_address,
    'bonds/address_book/selection/bond/its_ticket_is_ready': () => () => (of_mine) =>
      the_ticket_is_ready(of_mine),
  },
}

// The reads of the subject `bonds/address_book/selection/ticket`: a ticket with its face.

const ticket_selection: zz.Algebra<zz.SelectionsIn<typeof ticket_selections>, Selection<Ticket>> = {
  ...selection_operators<Ticket>(),
  predicate: {
    'bonds/address_book/selection/ticket/the_ticket_has_this_id': (p) => () => (ticket) =>
      ticket.bond.id === p.bond_id,
    'bonds/address_book/selection/ticket/the_ticket_is_ready': () => () => (ticket) =>
      the_ticket_is_ready(ticket.bond),
    'bonds/address_book/selection/ticket/the_ticket_s_mailbox_is_at_this_address':
      (p) => () => (ticket) =>
        my_deposit_address(ticket.bond) === p.deposit_address,
  },
}

const the_faces: Source<face> = {
  reads: [every_face],
  candidates: (records) => every_parsed(face)(records, every_face),
}

const the_bonds: Source<bond> = {
  reads: [every_bond],
  candidates: (records) => every_parsed(bond)(records, every_bond),
}

/** The tickets: every bond with the face it is for, the two ranges read in one snapshot. */
const the_tickets: Source<Ticket> = {
  reads: [every_bond, every_face],
  candidates: (records) => {
    const faces = new Map(the_faces.candidates(records).map((of_mine) => [of_mine.id, of_mine]))
    return the_bonds.candidates(records).flatMap((of_mine) => {
      const its_face = faces.get(of_mine.my_face_id)
      return its_face === undefined ? [] : [{ bond: of_mine, face: its_face }]
    })
  },
}

const face_sources: {
  readonly my_faces: zz.QuerySource<
    zz.FieldsOf<typeof address_book_query.my_faces>,
    Source<face>,
    Field<face>
  >
} = {
  my_faces: {
    from: the_faces,
    fields: {
      id: () => (of_mine) => of_mine.id,
      name: () => (of_mine) => of_mine.name,
      position: () => (of_mine) => of_mine.position,
      public_key: () => (of_mine) => of_mine.public_key,
    },
  },
}

const a_bond_s = {
  id: () => (of_mine: bond) => of_mine.id,
  name: () => (of_mine: bond) => of_mine.name,
  my_face_id: () => (of_mine: bond) => of_mine.my_face_id,
  their_face: () => (of_mine: bond) => of_mine.their_face,
  their_mailbox: () => (of_mine: bond) => of_mine.their_mailbox,
  my_mailbox: () => (of_mine: bond) => of_mine.my_mailbox,
  handshake: () => (of_mine: bond) => of_mine.handshake,
  confirmation: () => (of_mine: bond) => of_mine.confirmation,
}

const bond_sources: {
  readonly my_bonds: zz.QuerySource<
    zz.FieldsOf<typeof address_book_query.my_bonds>,
    Source<bond>,
    Field<bond>
  >
  readonly a_bond: zz.QuerySource<
    zz.FieldsOf<typeof address_book_query.a_bond>,
    Source<bond>,
    Field<bond>
  >
  readonly the_bond_at_my_mailbox: zz.QuerySource<
    zz.FieldsOf<typeof address_book_query.the_bond_at_my_mailbox>,
    Source<bond>,
    Field<bond>
  >
  readonly the_mailboxes_i_collect: zz.QuerySource<
    zz.FieldsOf<typeof address_book_query.the_mailboxes_i_collect>,
    Source<bond>,
    Field<bond>
  >
} = {
  my_bonds: {
    from: the_bonds,
    fields: {
      id: a_bond_s.id,
      name: a_bond_s.name,
      my_face_id: a_bond_s.my_face_id,
      their_face: a_bond_s.their_face,
      confirmation: a_bond_s.confirmation,
    },
  },
  a_bond: { from: the_bonds, fields: a_bond_s },
  the_bond_at_my_mailbox: {
    from: the_bonds,
    fields: {
      id: a_bond_s.id,
      my_face_id: a_bond_s.my_face_id,
      their_face: a_bond_s.their_face,
    },
  },
  the_mailboxes_i_collect: {
    from: the_bonds,
    fields: { id: a_bond_s.id, my_mailbox: a_bond_s.my_mailbox },
  },
}

const ticket_sources: {
  readonly my_ticket: zz.QuerySource<
    zz.FieldsOf<typeof address_book_query.my_ticket>,
    Source<Ticket>,
    Field<Ticket>
  >
  readonly the_ticket_at_my_mailbox: zz.QuerySource<
    zz.FieldsOf<typeof address_book_query.the_ticket_at_my_mailbox>,
    Source<Ticket>,
    Field<Ticket>
  >
} = {
  my_ticket: {
    from: the_tickets,
    fields: {
      id: () => (ticket) => ticket.bond.id,
      my_face_id: () => (ticket) => ticket.bond.my_face_id,
      key: () => (ticket) => ticket.face.public_key,
      introduced_as: () => (ticket) => ticket.face.name,
      my_mailbox: () => (ticket) => ticket.bond.my_mailbox,
      expires_at: () => (ticket) => ticket.bond.expires_at,
    },
  },
  the_ticket_at_my_mailbox: {
    from: the_tickets,
    fields: {
      id: () => (ticket) => ticket.bond.id,
      my_face_id: () => (ticket) => ticket.bond.my_face_id,
    },
  },
}

/**
 * A face after a fact's change: the face as it was, read by its key (those
 * of the fact's earlier parts laid over it, DOM-10), the change over it,
 * parsed as a face of the address book, as the oracle parses it; none
 * there, nothing written.
 */
const with_the_face = (id: face_id, change: Partial<face>): Write => ({
  reads: [a_face_s_key(id)],
  puts: (records) => {
    const before = parsed(face)(records.of(a_face_s_key(id)))
    return before === undefined ? [] : [set(a_face_s_key(id), face.parse({ ...before, ...change }))]
  },
})

/** A bond after a change made from it, parsed as a bond of the address book, likewise. */
const the_bond_after = (id: bond_id, change: (before: bond) => Partial<bond>): Write => ({
  reads: [a_bond_s_key(id)],
  puts: (records) => {
    const before = parsed(bond)(records.of(a_bond_s_key(id)))
    return before === undefined
      ? []
      : [set(a_bond_s_key(id), bond.parse({ ...before, ...change(before) }))]
  },
})

/** A bond after a fact's change. */
const with_the_bond = (id: bond_id, change: Partial<bond>): Write =>
  the_bond_after(id, () => change)

/** A record new: the value the fact carries, under its key. */
const a_new = (key: AKey, value: face | bond): Write => ({
  reads: [],
  puts: () => [set(key, value)],
})

/** A fact that changes nothing (DOM-6). */
const nothing: Write = { reads: [], puts: () => [] }

const bonds_writes: zz.FactWrites<zz.FactsIn<typeof address_book_fact>, Write> = {
  'bonds/address_book/fact/a_bond_has_been_renamed': ({ renamed_bond }) =>
    with_the_bond(renamed_bond.id, renamed_bond),
  'bonds/address_book/fact/a_bond_has_been_removed': ({ removed_bond }) =>
    with_the_bond(removed_bond.id, removed_bond),
  'bonds/address_book/fact/a_bond_has_been_removed_again': () => nothing,
  'bonds/address_book/fact/a_first_face_has_been_asked_for': ({ face_being_made }) =>
    a_new(a_face_s_key(face_being_made.id), face_being_made),
  'bonds/address_book/fact/a_face_has_been_made': ({ made_face }) =>
    with_the_face(made_face.id, made_face),
  'bonds/address_book/fact/a_ticket_has_been_asked_for': ({ ticket_being_prepared }) =>
    a_new(a_bond_s_key(ticket_being_prepared.id), ticket_being_prepared),
  // Not a pick (BND-8): the D of the ticket's mailbox beside its relays, and the ticket ready.
  'bonds/address_book/fact/a_ticket_has_been_prepared': ({ bond_id, deposit_address }) =>
    the_bond_after(bond_id, (before) => ({
      status: 'ticket_ready',
      my_mailbox: { relays: before.my_mailbox.relays, deposit_address },
    })),
  'bonds/address_book/fact/a_mailbox_has_come_for_an_expired_ticket': () => nothing,
  'bonds/address_book/fact/a_ticket_has_expired': ({ expired_ticket }) =>
    with_the_bond(expired_ticket.id, expired_ticket),
  'bonds/address_book/fact/the_ticket_was_used_before_it_expired': () => nothing,
  'bonds/address_book/fact/a_bond_has_been_made_by_opening_their_ticket': ({ opened_bond }) =>
    with_the_bond(opened_bond.id, opened_bond),
  'bonds/address_book/fact/their_ticket_has_been_opened_in_person': ({ met_bond }) =>
    with_the_bond(met_bond.id, met_bond),
  'bonds/address_book/fact/their_ticket_has_been_opened_after_their_introduction': ({
    introduced_bond,
  }) => with_the_bond(introduced_bond.id, introduced_bond),
  'bonds/address_book/fact/their_ticket_has_been_opened_again': () => nothing,
  'bonds/address_book/fact/a_bond_has_been_made_by_their_introduction': ({ introduced_bond }) =>
    with_the_bond(introduced_bond.id, introduced_bond),
  'bonds/address_book/fact/their_introduction_has_come_in_person': ({ met_bond }) =>
    with_the_bond(met_bond.id, met_bond),
  'bonds/address_book/fact/their_introduction_has_come': ({ confirmed_bond }) =>
    with_the_bond(confirmed_bond.id, confirmed_bond),
  'bonds/address_book/fact/their_introduction_has_come_again': () => nothing,
}

/** The command use cases of `address_book`, as the oracle's: the user's, the node's entry's, the reactions' and the executor's. */
const bonds_command_use_cases = {
  rename_a_bond,
  remove_a_bond,
  make_my_first_face,
  keep_the_key_of_a_face,
  prepare_a_ticket,
  keep_the_mailbox_of_a_ticket,
  let_a_ticket_expire,
  open_their_ticket,
  accept_their_introduction,
}

/**
 * The ports of `bonds/address_book` on the node's database: its commands, one
 * transaction each (WEB-9), and its reads, by subject, each in one snapshot
 * (WEB-8). No read streams, as the oracle's.
 */
export const bonds_ports_on_the_node_s_database =
  (node: Pick<TheNodesStorage, 'domain'>, primitives: Primitives) =>
  (versions: zz.Versions): TheAddressBooksPorts => {
    const storage = node.domain('bonds/address_book')
    const { read, page } = reads_in(storage)
    return {
      ...zz.command_use_case_ports({
        registry,
        versions,
        use_cases: bonds_command_use_cases,
      })({
        algebra: { predicate: bonds_fragments(primitives), ...the_operators },
        write: bonds_writes,
        execute: execute_in(storage),
        recorded: recorded_in(storage),
      }),
      ...zz.read_use_case_ports({
        registry,
        versions,
        use_cases: { my_faces },
      })({
        algebra: { ...face_selection, after },
        sources: face_sources,
        read,
        page,
        streams: {},
      }),
      ...zz.read_use_case_ports({
        registry,
        versions,
        use_cases: { my_bonds, a_bond, the_bond_at_my_mailbox, the_mailboxes_i_collect },
      })({
        algebra: { ...bond_selection, after },
        sources: bond_sources,
        read,
        page,
        streams: {},
      }),
      ...zz.read_use_case_ports({
        registry,
        versions,
        use_cases: { my_ticket, the_ticket_at_my_mailbox },
      })({
        algebra: { ...ticket_selection, after },
        sources: ticket_sources,
        read,
        page,
        streams: {},
      }),
    }
  }
