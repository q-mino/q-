// generated

// The path registry of `bonds/address_book` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity.

import type * as zz from '../../library/index.ts'
import * as id from './_id.ts'
import * as value from './_value.ts'
import * as fact from './_fact.ts'
import * as predicate from './_predicate.ts'
import * as bond_selection from './_bond_selection.ts'
import * as face_selection from './_face_selection.ts'
import * as command from './_command.ts'
import * as query from './_query.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'bonds/address_book/id/face_id': id.face_id,
  'bonds/address_book/id/bond_id': id.bond_id,
  'bonds/address_book/id/mailbox_id': id.mailbox_id,
  'bonds/address_book/value/face_key': value.face_key,
  'bonds/address_book/value/face_name': value.face_name,
  'bonds/address_book/value/face_position': value.face_position,
  'bonds/address_book/value/face_status': value.face_status,
  'bonds/address_book/value/face_being_made': value.face_being_made,
  'bonds/address_book/value/made_face': value.made_face,
  'bonds/address_book/value/face': value.face,
  'bonds/address_book/value/face_of_mine': value.face_of_mine,
  'bonds/address_book/value/relay_address': value.relay_address,
  'bonds/address_book/value/relays': value.relays,
  'bonds/address_book/value/deposit_address': value.deposit_address,
  'bonds/address_book/value/their_face': value.their_face,
  'bonds/address_book/value/their_mailbox': value.their_mailbox,
  'bonds/address_book/value/my_mailbox': value.my_mailbox,
  'bonds/address_book/value/bond_name': value.bond_name,
  'bonds/address_book/value/handshake_way': value.handshake_way,
  'bonds/address_book/value/handshake': value.handshake,
  'bonds/address_book/value/confirmation': value.confirmation,
  'bonds/address_book/value/bond_status': value.bond_status,
  'bonds/address_book/value/kept_bond': value.kept_bond,
  'bonds/address_book/value/removed_bond': value.removed_bond,
  'bonds/address_book/value/bond': value.bond,
  'bonds/address_book/value/bond_in_the_list': value.bond_in_the_list,
  'bonds/address_book/value/bond_card': value.bond_card,
  'bonds/address_book/value/bond_at_my_mailbox': value.bond_at_my_mailbox,
  'bonds/address_book/fact/a_bond_has_been_renamed': fact.a_bond_has_been_renamed,
  'bonds/address_book/fact/a_bond_has_been_removed': fact.a_bond_has_been_removed,
  'bonds/address_book/fact/a_bond_has_been_removed_again': fact.a_bond_has_been_removed_again,
  'bonds/address_book/predicate/a_face_has_this_id': predicate.a_face_has_this_id,
  'bonds/address_book/predicate/the_face_is_made': predicate.the_face_is_made,
  'bonds/address_book/predicate/a_bond_has_this_id': predicate.a_bond_has_this_id,
  'bonds/address_book/predicate/the_bond_is_kept': predicate.the_bond_is_kept,
  'bonds/address_book/predicate/the_bond_is_removed': predicate.the_bond_is_removed,
  'bonds/address_book/selection/bond/the_bond_has_this_id': bond_selection.the_bond_has_this_id,
  'bonds/address_book/selection/bond/the_bond_is_kept': bond_selection.the_bond_is_kept,
  'bonds/address_book/selection/bond/my_mailbox_of_the_bond_is_at_this_address':
    bond_selection.my_mailbox_of_the_bond_is_at_this_address,
  'bonds/address_book/selection/face/the_face_is_made': face_selection.the_face_is_made,
  'bonds/address_book/command/rename_a_bond': command.rename_a_bond,
  'bonds/address_book/command/rename_a_bond_input': command.rename_a_bond_input,
  'bonds/address_book/command/remove_a_bond': command.remove_a_bond,
  'bonds/address_book/command/remove_a_bond_input': command.remove_a_bond_input,
  'bonds/address_book/query/the_bond_is_kept_under_this_id': query.the_bond_is_kept_under_this_id,
  'bonds/address_book/query/the_bond_is_kept_at_my_mailbox': query.the_bond_is_kept_at_my_mailbox,
  'bonds/address_book/query/my_faces': query.my_faces,
  'bonds/address_book/query/my_faces_input': query.my_faces_input,
  'bonds/address_book/query/my_bonds': query.my_bonds,
  'bonds/address_book/query/my_bonds_input': query.my_bonds_input,
  'bonds/address_book/query/a_bond': query.a_bond,
  'bonds/address_book/query/a_bond_input': query.a_bond_input,
  'bonds/address_book/query/the_bond_at_my_mailbox': query.the_bond_at_my_mailbox,
  'bonds/address_book/query/the_bond_at_my_mailbox_input': query.the_bond_at_my_mailbox_input,
  'bonds/address_book/usecase/rename_a_bond': usecase.rename_a_bond,
  'bonds/address_book/usecase/remove_a_bond': usecase.remove_a_bond,
  'bonds/address_book/usecase/my_faces': usecase.my_faces,
  'bonds/address_book/usecase/my_bonds': usecase.my_bonds,
  'bonds/address_book/usecase/a_bond': usecase.a_bond,
  'bonds/address_book/usecase/the_bond_at_my_mailbox': usecase.the_bond_at_my_mailbox,
  'bonds/address_book/version/address_book': version.address_book,
} satisfies zz.Registry
