// The module of `bonds` in q-'s oracle (TST-2, MBX-7): the state of
// `bonds/address_book`, its predicates and selections as functions of that
// state, its sources and its writes, the meaning from the domain's `dsl`
// (DOM-5); and the domain's command and read ports over a cell
// (BND-1..BND-12). The secret of a ticket is verified over the primitives
// port the oracle is given, with the safe's pure function (BND-9, SEA-6):
// the configurator's, a fake in the stories, libsodium from step 18.

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
  my_introduction_is_sent,
  the_bond_is_kept,
  the_bond_is_removed,
  the_confirmation_is_received,
  the_content_a_ticket_s_secret_signs,
  the_face_is_being_made,
  the_face_is_made,
  the_handshake_began_within_two_minutes_of,
  the_ticket_has_expired,
  the_ticket_is_being_prepared,
  the_ticket_is_ready,
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
import type { CommandCell, ReadCell } from './cell.ts'
import {
  after,
  algebra,
  execute,
  page,
  read,
  recorded,
  selection_operators,
  type Field,
  type Selection,
  type Source,
} from './interpreter.ts'

/**
 * The node's address book (BND-1): its user's faces and her bonds, by id,
 * under the domain's name, so that it sits beside the safe's state in the
 * phone's cell (the safe has faces of its own, SEA-1).
 */
export interface BondsState {
  readonly address_book: {
    readonly faces: ReadonlyMap<face_id, face>
    readonly bonds: ReadonlyMap<bond_id, bond>
  }
}

/** An address book that holds nothing yet: a phone before its first start. */
export const no_bond: BondsState = {
  address_book: { faces: new Map(), bonds: new Map() },
}

/** A ticket to show, as the subject `ticket` reads it (BND-11): the bond, its ticket ready, with the face it is for. */
export interface Ticket {
  readonly bond: bond
  readonly face: face
}

const the_face = (state: BondsState, id: face_id | undefined): face | undefined =>
  id === undefined ? undefined : state.address_book.faces.get(id)

const the_bond = (state: BondsState, id: bond_id): bond | undefined =>
  state.address_book.bonds.get(id)

/** The D of my mailbox of a bond: none while the safe draws its key (BND-8). */
const my_deposit_address = (of_mine: bond | undefined): string | undefined =>
  of_mine !== undefined && 'deposit_address' in of_mine.my_mailbox
    ? of_mine.my_mailbox.deposit_address
    : undefined

/**
 * The secret is the ticket's (BND-9): the signature of the ticket's face over
 * the content its mailbox's D makes holds, by the face's public key. A
 * ticket being prepared has no D, a face being made no key: no secret holds.
 */
const the_secret_holds =
  (primitives: Primitives) =>
  (state: BondsState, id: bond_id, secret: string): boolean => {
    const of_the_bond = the_bond(state, id)
    const deposit_address = my_deposit_address(of_the_bond)
    const public_key = the_face(state, of_the_bond?.my_face_id)?.public_key
    return (
      deposit_address !== undefined &&
      public_key !== undefined &&
      the_signature_holds(primitives)(
        public_key,
        the_content_a_ticket_s_secret_signs(deposit_address),
        secret,
      )
    )
  }

export const bonds_fragments = (
  primitives: Primitives,
): zz.PredicateFragments<
  zz.PredicatesIn<typeof address_book_predicate>,
  (state: BondsState) => boolean
> => ({
  'bonds/address_book/predicate/a_face_has_this_id': (p) => (state) =>
    a_face_is_there(the_face(state, p.face_id)),
  'bonds/address_book/predicate/the_face_is_made': (p) => (state) =>
    the_face_is_made(the_face(state, p.face_id)),
  'bonds/address_book/predicate/a_bond_has_this_id': (p) => (state) =>
    a_bond_is_there(the_bond(state, p.bond_id)),
  'bonds/address_book/predicate/the_bond_is_kept': (p) => (state) =>
    the_bond_is_kept(the_bond(state, p.bond_id)),
  'bonds/address_book/predicate/the_bond_is_removed': (p) => (state) =>
    the_bond_is_removed(the_bond(state, p.bond_id)),
  'bonds/address_book/predicate/the_user_has_a_face': () => (state) =>
    state.address_book.faces.size > 0,
  'bonds/address_book/predicate/the_face_is_being_made': (p) => (state) =>
    the_face_is_being_made(the_face(state, p.face_id)),
  'bonds/address_book/predicate/the_ticket_is_being_prepared': (p) => (state) =>
    the_ticket_is_being_prepared(the_bond(state, p.bond_id)),
  'bonds/address_book/predicate/the_ticket_is_ready': (p) => (state) =>
    the_ticket_is_ready(the_bond(state, p.bond_id)),
  'bonds/address_book/predicate/the_ticket_has_expired': (p) => (state) =>
    the_ticket_has_expired(the_bond(state, p.bond_id)),
  'bonds/address_book/predicate/the_secret_is_the_ticket_s': (p) => (state) =>
    the_secret_holds(primitives)(state, p.bond_id, p.secret),
  'bonds/address_book/predicate/the_bond_is_with_this_face': (p) => (state) =>
    the_bond(state, p.bond_id)?.their_face?.key === p.key,
  'bonds/address_book/predicate/my_introduction_is_sent': (p) => (state) =>
    my_introduction_is_sent(the_bond(state, p.bond_id)),
  'bonds/address_book/predicate/the_confirmation_is_received': (p) => (state) =>
    the_confirmation_is_received(the_bond(state, p.bond_id)),
  'bonds/address_book/predicate/the_handshake_began_within_two_minutes_of': (p) => (state) =>
    the_handshake_began_within_two_minutes_of(p.now)(the_bond(state, p.bond_id)),
})

// The reads of the subject `bonds/address_book/selection/face`: a face of the user's.

export const face_selection: zz.Algebra<
  zz.SelectionsIn<typeof face_selections>,
  Selection<BondsState, face>
> = {
  ...selection_operators<BondsState, face>(),
  predicate: {
    'bonds/address_book/selection/face/the_face_is_made': () => () => (of_mine) =>
      the_face_is_made(of_mine),
  },
}

// The reads of the subject `bonds/address_book/selection/bond`: a bond of the user's.

export const bond_selection: zz.Algebra<
  zz.SelectionsIn<typeof bond_selections>,
  Selection<BondsState, bond>
> = {
  ...selection_operators<BondsState, bond>(),
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

export const ticket_selection: zz.Algebra<
  zz.SelectionsIn<typeof ticket_selections>,
  Selection<BondsState, Ticket>
> = {
  ...selection_operators<BondsState, Ticket>(),
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

const the_faces: Source<BondsState, face> = (state) => [...state.address_book.faces.values()]

const the_bonds: Source<BondsState, bond> = (state) => [...state.address_book.bonds.values()]

/** The tickets: every bond with the face it is for, which the address book keeps beside it. */
const the_tickets: Source<BondsState, Ticket> = (state) =>
  the_bonds(state).flatMap((of_mine) => {
    const its_face = the_face(state, of_mine.my_face_id)
    return its_face === undefined ? [] : [{ bond: of_mine, face: its_face }]
  })

export const face_sources: {
  readonly my_faces: zz.QuerySource<
    zz.FieldsOf<typeof address_book_query.my_faces>,
    Source<BondsState, face>,
    Field<BondsState, face>
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

export const bond_sources: {
  readonly my_bonds: zz.QuerySource<
    zz.FieldsOf<typeof address_book_query.my_bonds>,
    Source<BondsState, bond>,
    Field<BondsState, bond>
  >
  readonly a_bond: zz.QuerySource<
    zz.FieldsOf<typeof address_book_query.a_bond>,
    Source<BondsState, bond>,
    Field<BondsState, bond>
  >
  readonly the_bond_at_my_mailbox: zz.QuerySource<
    zz.FieldsOf<typeof address_book_query.the_bond_at_my_mailbox>,
    Source<BondsState, bond>,
    Field<BondsState, bond>
  >
  readonly the_mailboxes_i_collect: zz.QuerySource<
    zz.FieldsOf<typeof address_book_query.the_mailboxes_i_collect>,
    Source<BondsState, bond>,
    Field<BondsState, bond>
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

export const ticket_sources: {
  readonly my_ticket: zz.QuerySource<
    zz.FieldsOf<typeof address_book_query.my_ticket>,
    Source<BondsState, Ticket>,
    Field<BondsState, Ticket>
  >
  readonly the_ticket_at_my_mailbox: zz.QuerySource<
    zz.FieldsOf<typeof address_book_query.the_ticket_at_my_mailbox>,
    Source<BondsState, Ticket>,
    Field<BondsState, Ticket>
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
 * A face after a fact's change: the face as it was, the change over it,
 * parsed as a face of the address book, so that a fact that leaves a face
 * in no state of the domain's fails the story (an interpreter rule).
 */
const with_the_face =
  (id: face_id, change: Partial<face>) =>
  (state: BondsState): Partial<BondsState> => {
    const before = the_face(state, id)
    return before === undefined
      ? {}
      : {
          address_book: {
            ...state.address_book,
            faces: new Map(state.address_book.faces).set(id, face.parse({ ...before, ...change })),
          },
        }
  }

/** A bond after a fact's change, parsed as a bond of the address book, likewise. */
const with_the_bond =
  (id: bond_id, change: Partial<bond>) =>
  (state: BondsState): Partial<BondsState> => {
    const before = the_bond(state, id)
    return before === undefined
      ? {}
      : {
          address_book: {
            ...state.address_book,
            bonds: new Map(state.address_book.bonds).set(id, bond.parse({ ...before, ...change })),
          },
        }
  }

/** A fact that changes nothing (DOM-6). */
const nothing = (): Partial<BondsState> => ({})

export const bonds_writes: zz.FactWrites<
  zz.FactsIn<typeof address_book_fact>,
  (state: BondsState) => Partial<BondsState>
> = {
  'bonds/address_book/fact/a_bond_has_been_renamed': ({ renamed_bond }) =>
    with_the_bond(renamed_bond.id, renamed_bond),
  'bonds/address_book/fact/a_bond_has_been_removed': ({ removed_bond }) =>
    with_the_bond(removed_bond.id, removed_bond),
  'bonds/address_book/fact/a_bond_has_been_removed_again': () => nothing,
  'bonds/address_book/fact/a_first_face_has_been_asked_for':
    ({ face_being_made }) =>
    (state) => ({
      address_book: {
        ...state.address_book,
        faces: new Map(state.address_book.faces).set(face_being_made.id, face_being_made),
      },
    }),
  'bonds/address_book/fact/a_face_has_been_made': ({ made_face }) =>
    with_the_face(made_face.id, made_face),
  'bonds/address_book/fact/a_ticket_has_been_asked_for':
    ({ ticket_being_prepared }) =>
    (state) => ({
      address_book: {
        ...state.address_book,
        bonds: new Map(state.address_book.bonds).set(
          ticket_being_prepared.id,
          ticket_being_prepared,
        ),
      },
    }),
  // Not a pick (BND-8): the D of the ticket's mailbox beside its relays, and the ticket ready.
  'bonds/address_book/fact/a_ticket_has_been_prepared':
    ({ bond_id, deposit_address }) =>
    (state) => {
      const before = the_bond(state, bond_id)
      return before === undefined
        ? {}
        : with_the_bond(bond_id, {
            status: 'ticket_ready',
            my_mailbox: { relays: before.my_mailbox.relays, deposit_address },
          })(state)
    },
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

/** The command use cases of `address_book`, whose ports the oracle builds: the user's (`self`, step 13), the node's entry's (`unknown`, step 13), the reactions' and the executor's (PER-21). */
export const bonds_command_use_cases = {
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

/** The oracle's state adapter for the commands of `address_book` (TST-2): fragments, writes, the execution. */
export const bonds_command_adapter = (cell: CommandCell<BondsState>, primitives: Primitives) => {
  const fragments = bonds_fragments(primitives)
  return {
    algebra: algebra<BondsState, typeof fragments>(fragments),
    write: bonds_writes,
    execute: execute(cell),
    recorded: recorded(cell),
  }
}

/**
 * The ports of `bonds/address_book` over the oracle (TST-2): its commands,
 * and its reads, by subject. No read streams: the phone's screens of step
 * 16 ask for them when they need them.
 */
export const bonds_ports =
  (cell: CommandCell<BondsState> & ReadCell<BondsState>, primitives: Primitives) =>
  (versions: zz.Versions) => ({
    ...zz.command_use_case_ports({
      registry,
      versions,
      use_cases: bonds_command_use_cases,
    })(bonds_command_adapter(cell, primitives)),
    ...zz.read_use_case_ports({
      registry,
      versions,
      use_cases: { my_faces },
    })({
      algebra: { ...face_selection, after },
      sources: face_sources,
      read: read(cell),
      page: page(cell),
      streams: {},
    }),
    ...zz.read_use_case_ports({
      registry,
      versions,
      use_cases: { my_bonds, a_bond, the_bond_at_my_mailbox, the_mailboxes_i_collect },
    })({
      algebra: { ...bond_selection, after },
      sources: bond_sources,
      read: read(cell),
      page: page(cell),
      streams: {},
    }),
    ...zz.read_use_case_ports({
      registry,
      versions,
      use_cases: { my_ticket, the_ticket_at_my_mailbox },
    })({
      algebra: { ...ticket_selection, after },
      sources: ticket_sources,
      read: read(cell),
      page: page(cell),
      streams: {},
    }),
  })
