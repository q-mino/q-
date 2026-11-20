// generated

// The path registry of `auth/acquaintances` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity.

import type * as zz from '../../library/index.ts'
import * as id from './_id.ts'
import * as value from './_value.ts'
import * as lookup from './_lookup.ts'

export const registry = {
  'auth/acquaintances/id/bond_id': id.bond_id,
  'auth/acquaintances/id/face_id': id.face_id,
  'auth/acquaintances/value/face_key': value.face_key,
  'auth/acquaintances/value/deposit_address': value.deposit_address,
  'auth/acquaintances/value/extension_name': value.extension_name,
  'auth/acquaintances/value/major': value.major,
  'auth/acquaintances/value/bond_name': value.bond_name,
  'auth/acquaintances/value/a_face_at_my_mailbox': value.a_face_at_my_mailbox,
  'auth/acquaintances/value/bond_of_a_face': value.bond_of_a_face,
  'auth/acquaintances/value/ticket_a_face_presents': value.ticket_a_face_presents,
  'auth/acquaintances/value/extensions_offered': value.extensions_offered,
  'auth/acquaintances/lookup/the_bond_of_a_face_at_my_mailbox':
    lookup.the_bond_of_a_face_at_my_mailbox,
  'auth/acquaintances/lookup/the_ticket_a_face_presents_at_my_mailbox':
    lookup.the_ticket_a_face_presents_at_my_mailbox,
  'auth/acquaintances/lookup/the_extensions_offered_to_the_bond_of_a_key':
    lookup.the_extensions_offered_to_the_bond_of_a_key,
} satisfies zz.Registry
