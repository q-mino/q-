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
import * as effect from './_effect.ts'
import * as bond_selection from './_bond_selection.ts'
import * as face_selection from './_face_selection.ts'
import * as ticket_selection from './_ticket_selection.ts'
import * as command from './_command.ts'
import * as query from './_query.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'bonds/address_book/id/face_id': id.face_id,
  'bonds/address_book/id/bond_id': id.bond_id,
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
  'bonds/address_book/value/my_mailbox_being_drawn': value.my_mailbox_being_drawn,
  'bonds/address_book/value/ticket_secret': value.ticket_secret,
  'bonds/address_book/value/their_ticket': value.their_ticket,
  'bonds/address_book/value/bond_name': value.bond_name,
  'bonds/address_book/value/handshake_way': value.handshake_way,
  'bonds/address_book/value/handshake': value.handshake,
  'bonds/address_book/value/confirmation': value.confirmation,
  'bonds/address_book/value/my_introduction': value.my_introduction,
  'bonds/address_book/value/bond_status': value.bond_status,
  'bonds/address_book/value/ticket_being_prepared': value.ticket_being_prepared,
  'bonds/address_book/value/ticket_ready': value.ticket_ready,
  'bonds/address_book/value/ticket_expired': value.ticket_expired,
  'bonds/address_book/value/kept_bond': value.kept_bond,
  'bonds/address_book/value/removed_bond': value.removed_bond,
  'bonds/address_book/value/bond': value.bond,
  'bonds/address_book/value/bond_in_the_list': value.bond_in_the_list,
  'bonds/address_book/value/bond_card': value.bond_card,
  'bonds/address_book/value/bond_at_my_mailbox': value.bond_at_my_mailbox,
  'bonds/address_book/value/ticket_to_show': value.ticket_to_show,
  'bonds/address_book/value/ticket_at_my_mailbox': value.ticket_at_my_mailbox,
  'bonds/address_book/value/mailbox_to_collect': value.mailbox_to_collect,
  'bonds/address_book/fact/a_bond_has_been_renamed': fact.a_bond_has_been_renamed,
  'bonds/address_book/fact/a_bond_has_been_removed': fact.a_bond_has_been_removed,
  'bonds/address_book/fact/a_bond_has_been_removed_again': fact.a_bond_has_been_removed_again,
  'bonds/address_book/fact/a_first_face_has_been_asked_for': fact.a_first_face_has_been_asked_for,
  'bonds/address_book/fact/a_face_has_been_made': fact.a_face_has_been_made,
  'bonds/address_book/fact/a_ticket_has_been_asked_for': fact.a_ticket_has_been_asked_for,
  'bonds/address_book/fact/a_ticket_has_been_prepared': fact.a_ticket_has_been_prepared,
  'bonds/address_book/fact/a_mailbox_has_come_for_an_expired_ticket':
    fact.a_mailbox_has_come_for_an_expired_ticket,
  'bonds/address_book/fact/a_ticket_has_expired': fact.a_ticket_has_expired,
  'bonds/address_book/fact/the_ticket_was_used_before_it_expired':
    fact.the_ticket_was_used_before_it_expired,
  'bonds/address_book/fact/a_bond_has_been_made_by_opening_their_ticket':
    fact.a_bond_has_been_made_by_opening_their_ticket,
  'bonds/address_book/fact/their_ticket_has_been_opened_in_person':
    fact.their_ticket_has_been_opened_in_person,
  'bonds/address_book/fact/their_ticket_has_been_opened_after_their_introduction':
    fact.their_ticket_has_been_opened_after_their_introduction,
  'bonds/address_book/fact/their_ticket_has_been_opened_again':
    fact.their_ticket_has_been_opened_again,
  'bonds/address_book/fact/a_bond_has_been_made_by_their_introduction':
    fact.a_bond_has_been_made_by_their_introduction,
  'bonds/address_book/fact/their_introduction_has_come_in_person':
    fact.their_introduction_has_come_in_person,
  'bonds/address_book/fact/their_introduction_has_come': fact.their_introduction_has_come,
  'bonds/address_book/fact/their_introduction_has_come_again':
    fact.their_introduction_has_come_again,
  'bonds/address_book/predicate/a_face_has_this_id': predicate.a_face_has_this_id,
  'bonds/address_book/predicate/the_face_is_made': predicate.the_face_is_made,
  'bonds/address_book/predicate/a_bond_has_this_id': predicate.a_bond_has_this_id,
  'bonds/address_book/predicate/the_bond_is_kept': predicate.the_bond_is_kept,
  'bonds/address_book/predicate/the_bond_is_removed': predicate.the_bond_is_removed,
  'bonds/address_book/predicate/the_user_has_a_face': predicate.the_user_has_a_face,
  'bonds/address_book/predicate/the_face_is_being_made': predicate.the_face_is_being_made,
  'bonds/address_book/predicate/the_ticket_is_being_prepared':
    predicate.the_ticket_is_being_prepared,
  'bonds/address_book/predicate/the_ticket_is_ready': predicate.the_ticket_is_ready,
  'bonds/address_book/predicate/the_ticket_has_expired': predicate.the_ticket_has_expired,
  'bonds/address_book/predicate/the_secret_is_the_ticket_s': predicate.the_secret_is_the_ticket_s,
  'bonds/address_book/predicate/the_bond_is_with_this_face': predicate.the_bond_is_with_this_face,
  'bonds/address_book/predicate/my_introduction_is_sent': predicate.my_introduction_is_sent,
  'bonds/address_book/predicate/the_confirmation_is_received':
    predicate.the_confirmation_is_received,
  'bonds/address_book/predicate/the_handshake_began_within_two_minutes_of':
    predicate.the_handshake_began_within_two_minutes_of,
  'bonds/address_book/effect/wait_until_the_ticket_expires': effect.wait_until_the_ticket_expires,
  'bonds/address_book/effect/send_my_introduction': effect.send_my_introduction,
  'bonds/address_book/selection/bond/the_bond_has_this_id': bond_selection.the_bond_has_this_id,
  'bonds/address_book/selection/bond/the_bond_is_kept': bond_selection.the_bond_is_kept,
  'bonds/address_book/selection/bond/my_mailbox_of_the_bond_is_at_this_address':
    bond_selection.my_mailbox_of_the_bond_is_at_this_address,
  'bonds/address_book/selection/bond/its_ticket_is_ready': bond_selection.its_ticket_is_ready,
  'bonds/address_book/selection/face/the_face_is_made': face_selection.the_face_is_made,
  'bonds/address_book/selection/ticket/the_ticket_has_this_id':
    ticket_selection.the_ticket_has_this_id,
  'bonds/address_book/selection/ticket/the_ticket_is_ready': ticket_selection.the_ticket_is_ready,
  'bonds/address_book/selection/ticket/the_ticket_s_mailbox_is_at_this_address':
    ticket_selection.the_ticket_s_mailbox_is_at_this_address,
  'bonds/address_book/command/rename_a_bond': command.rename_a_bond,
  'bonds/address_book/command/rename_a_bond_input': command.rename_a_bond_input,
  'bonds/address_book/command/remove_a_bond': command.remove_a_bond,
  'bonds/address_book/command/remove_a_bond_input': command.remove_a_bond_input,
  'bonds/address_book/command/make_my_first_face': command.make_my_first_face,
  'bonds/address_book/command/make_my_first_face_input': command.make_my_first_face_input,
  'bonds/address_book/command/keep_the_key_of_a_face': command.keep_the_key_of_a_face,
  'bonds/address_book/command/keep_the_key_of_a_face_input': command.keep_the_key_of_a_face_input,
  'bonds/address_book/command/a_ticket_can_be_prepared': command.a_ticket_can_be_prepared,
  'bonds/address_book/command/prepare_a_ticket': command.prepare_a_ticket,
  'bonds/address_book/command/prepare_a_ticket_input': command.prepare_a_ticket_input,
  'bonds/address_book/command/keep_the_mailbox_of_a_ticket': command.keep_the_mailbox_of_a_ticket,
  'bonds/address_book/command/keep_the_mailbox_of_a_ticket_input':
    command.keep_the_mailbox_of_a_ticket_input,
  'bonds/address_book/command/the_ticket_is_unused': command.the_ticket_is_unused,
  'bonds/address_book/command/the_ticket_made_its_bond': command.the_ticket_made_its_bond,
  'bonds/address_book/command/let_a_ticket_expire': command.let_a_ticket_expire,
  'bonds/address_book/command/let_a_ticket_expire_input': command.let_a_ticket_expire_input,
  'bonds/address_book/command/their_introduction_came_first': command.their_introduction_came_first,
  'bonds/address_book/command/their_introduction_came_first_within_two_minutes':
    command.their_introduction_came_first_within_two_minutes,
  'bonds/address_book/command/their_introduction_came_first_earlier':
    command.their_introduction_came_first_earlier,
  'bonds/address_book/command/my_introduction_was_sent_already':
    command.my_introduction_was_sent_already,
  'bonds/address_book/command/open_their_ticket': command.open_their_ticket,
  'bonds/address_book/command/open_their_ticket_input': command.open_their_ticket_input,
  'bonds/address_book/command/my_ticket_is_ready_with_its_secret':
    command.my_ticket_is_ready_with_its_secret,
  'bonds/address_book/command/i_opened_their_ticket_first': command.i_opened_their_ticket_first,
  'bonds/address_book/command/i_opened_their_ticket_first_within_two_minutes':
    command.i_opened_their_ticket_first_within_two_minutes,
  'bonds/address_book/command/i_opened_their_ticket_first_earlier':
    command.i_opened_their_ticket_first_earlier,
  'bonds/address_book/command/their_introduction_came_already':
    command.their_introduction_came_already,
  'bonds/address_book/command/accept_their_introduction': command.accept_their_introduction,
  'bonds/address_book/command/accept_their_introduction_input':
    command.accept_their_introduction_input,
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
  'bonds/address_book/query/the_ticket_is_ready_under_this_id':
    query.the_ticket_is_ready_under_this_id,
  'bonds/address_book/query/the_ticket_is_ready_at_my_mailbox':
    query.the_ticket_is_ready_at_my_mailbox,
  'bonds/address_book/query/my_ticket': query.my_ticket,
  'bonds/address_book/query/my_ticket_input': query.my_ticket_input,
  'bonds/address_book/query/the_ticket_at_my_mailbox': query.the_ticket_at_my_mailbox,
  'bonds/address_book/query/the_ticket_at_my_mailbox_input': query.the_ticket_at_my_mailbox_input,
  'bonds/address_book/query/my_mailbox_of_the_bond_is_collected':
    query.my_mailbox_of_the_bond_is_collected,
  'bonds/address_book/query/the_mailboxes_i_collect': query.the_mailboxes_i_collect,
  'bonds/address_book/query/the_mailboxes_i_collect_input': query.the_mailboxes_i_collect_input,
  'bonds/address_book/usecase/rename_a_bond': usecase.rename_a_bond,
  'bonds/address_book/usecase/remove_a_bond': usecase.remove_a_bond,
  'bonds/address_book/usecase/my_faces': usecase.my_faces,
  'bonds/address_book/usecase/my_bonds': usecase.my_bonds,
  'bonds/address_book/usecase/a_bond': usecase.a_bond,
  'bonds/address_book/usecase/the_bond_at_my_mailbox': usecase.the_bond_at_my_mailbox,
  'bonds/address_book/usecase/make_my_first_face': usecase.make_my_first_face,
  'bonds/address_book/usecase/keep_the_key_of_a_face': usecase.keep_the_key_of_a_face,
  'bonds/address_book/usecase/prepare_a_ticket': usecase.prepare_a_ticket,
  'bonds/address_book/usecase/keep_the_mailbox_of_a_ticket': usecase.keep_the_mailbox_of_a_ticket,
  'bonds/address_book/usecase/let_a_ticket_expire': usecase.let_a_ticket_expire,
  'bonds/address_book/usecase/open_their_ticket': usecase.open_their_ticket,
  'bonds/address_book/usecase/accept_their_introduction': usecase.accept_their_introduction,
  'bonds/address_book/usecase/my_ticket': usecase.my_ticket,
  'bonds/address_book/usecase/the_ticket_at_my_mailbox': usecase.the_ticket_at_my_mailbox,
  'bonds/address_book/usecase/the_mailboxes_i_collect': usecase.the_mailboxes_i_collect,
  'bonds/address_book/version/address_book': version.address_book,
} satisfies zz.Registry
