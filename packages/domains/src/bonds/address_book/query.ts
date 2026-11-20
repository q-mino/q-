import { z } from 'zod'
import { query, AND, face_selection, bond_selection, id, value } from './_scope_query.ts'

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
