import { z } from 'zod'
import {
  query,
  AND,
  OR,
  face_selection,
  bond_selection,
  ticket_selection,
  id,
  value,
} from './_scope_query.ts'

/** The bond is the one named, and in the list. */
export const the_bond_is_kept_under_this_id = AND({
  the_bond_has_the_id: bond_selection.the_bond_has_this_id,
  the_bond_is_kept: bond_selection.the_bond_is_kept,
})

/** The bond is in the list, and my mailbox of it is at the address named. */
export const the_bond_is_kept_at_my_mailbox = AND({
  my_mailbox_is_at_the_address: bond_selection.my_mailbox_of_the_bond_is_at_this_address,
  the_bond_is_kept: bond_selection.the_bond_is_kept,
})

/**
 * Anna's faces (BND-3), each with its name, its place in her tree and its
 * key, by name: in stage 1 the one she made at the first start. A face
 * being made is not one yet.
 */
export const my_faces = query({
  input: z.strictObject({}),
  fields: value.face_of_mine,
  identity: 'id',
  selection: face_selection.the_face_is_made,
  order: { name: 'ascending' },
  creator: () => () => ({
    selection: {},
  }),
})

/**
 * Anna's list of bonds (BND-6): Bruno, Carla, by the name she gives each,
 * with the face of hers each belongs to and whether they have her yet. A
 * bond she removed is not in it.
 */
export const my_bonds = query({
  input: z.strictObject({}),
  fields: value.bond_in_the_list,
  identity: 'id',
  selection: bond_selection.the_bond_is_kept,
  order: { name: 'ascending' },
  creator: () => () => ({
    selection: {},
  }),
})

/**
 * Bruno's card on Anna's phone (BND-1): every value of the bond, the name she
 * gives him and the one he is introduced as, his face and his mailbox, hers,
 * the handshake and the confirmation. No entry for a bond removed.
 */
export const a_bond = query({
  input: z.strictObject({
    bond_id: id.bond_id,
  }),
  fields: value.bond_card,
  identity: 'id',
  selection: the_bond_is_kept_under_this_id,
  order: { id: 'ascending' },
  creator: () => (input) => ({
    selection: {
      the_bond_has_the_id: { bond_id: input.bond_id },
      the_bond_is_kept: {},
    },
  }),
})

/**
 * A letter Anna's phone collected from one of her mailboxes (BND-4): the
 * bond it came on, which face of hers opens it, and the key it should be
 * signed by. No entry for an address of no bond in her list.
 */
export const the_bond_at_my_mailbox = query({
  input: z.strictObject({
    deposit_address: value.deposit_address,
  }),
  fields: value.bond_at_my_mailbox,
  identity: 'id',
  selection: the_bond_is_kept_at_my_mailbox,
  order: { id: 'ascending' },
  creator: () => (input) => ({
    selection: {
      my_mailbox_is_at_the_address: { deposit_address: input.deposit_address },
      the_bond_is_kept: {},
    },
  }),
})

/** The ticket is the one named, and ready. */
export const the_ticket_is_ready_under_this_id = AND({
  the_ticket_has_the_id: ticket_selection.the_ticket_has_this_id,
  the_ticket_is_ready: ticket_selection.the_ticket_is_ready,
})

/** The ticket is ready, and its mailbox is at the address named. */
export const the_ticket_is_ready_at_my_mailbox = AND({
  its_mailbox_is_at_the_address: ticket_selection.the_ticket_s_mailbox_is_at_this_address,
  the_ticket_is_ready: ticket_selection.the_ticket_is_ready,
})

/**
 * The ticket Anna shows Bruno, or sends Carla in a link (BND-8): her face's
 * key and the name it is introduced as, her mailbox for the bond to be,
 * until when it holds. Its secret is the safe's signature, joined where the
 * ticket is drawn (BND-9). No entry for a ticket being prepared, used or
 * expired.
 */
export const my_ticket = query({
  input: z.strictObject({
    bond_id: id.bond_id,
  }),
  fields: value.ticket_to_show,
  identity: 'id',
  selection: the_ticket_is_ready_under_this_id,
  order: { id: 'ascending' },
  creator: () => (input) => ({
    selection: {
      the_ticket_has_the_id: { bond_id: input.bond_id },
      the_ticket_is_ready: {},
    },
  }),
})

/**
 * An introduction Carla's phone collected from a mailbox of hers (BND-10):
 * the ticket it came for, ready, and her face it is for. No entry for an
 * address of no ready ticket; a bond made already is `the_bond_at_my_mailbox`'s.
 */
export const the_ticket_at_my_mailbox = query({
  input: z.strictObject({
    deposit_address: value.deposit_address,
  }),
  fields: value.ticket_at_my_mailbox,
  identity: 'id',
  selection: the_ticket_is_ready_at_my_mailbox,
  order: { id: 'ascending' },
  creator: () => (input) => ({
    selection: {
      its_mailbox_is_at_the_address: { deposit_address: input.deposit_address },
      the_ticket_is_ready: {},
    },
  }),
})

/** The bond is kept, or its ticket is ready. */
export const my_mailbox_of_the_bond_is_collected = OR({
  the_bond_is_kept: bond_selection.the_bond_is_kept,
  its_ticket_is_ready: bond_selection.its_ticket_is_ready,
})

/**
 * The mailboxes Anna's phone collects from (BND-11): those of her ready
 * tickets, where introductions come, and those of her kept bonds, where
 * their letters come. A ticket expired and a bond removed are not among
 * them.
 */
export const the_mailboxes_i_collect = query({
  input: z.strictObject({}),
  fields: value.mailbox_to_collect,
  identity: 'id',
  selection: my_mailbox_of_the_bond_is_collected,
  order: { id: 'ascending' },
  creator: () => () => ({
    selection: {
      the_bond_is_kept: {},
      its_ticket_is_ready: {},
    },
  }),
})
