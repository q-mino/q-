// generated

// The path registry of `persona/self` (DOM-24): every path with its component,
// in the order of the twins. The configurator gives it to the library, which
// reads it in reverse, from a component to its path, by object identity.

import type * as zz from '../../library/index.ts'
import * as value from './_value.ts'
import * as node from './_node.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'persona/self/value/face_name': value.face_name,
  'persona/self/value/bond_name': value.bond_name,
  'persona/self/value/face_key': value.face_key,
  'persona/self/value/face_position': value.face_position,
  'persona/self/value/relay_address': value.relay_address,
  'persona/self/value/relays': value.relays,
  'persona/self/value/deposit_address': value.deposit_address,
  'persona/self/value/mailbox': value.mailbox,
  'persona/self/value/ticket_secret': value.ticket_secret,
  'persona/self/value/their_ticket': value.their_ticket,
  'persona/self/value/their_face': value.their_face,
  'persona/self/value/handshake_way': value.handshake_way,
  'persona/self/value/handshake': value.handshake,
  'persona/self/value/confirmation': value.confirmation,
  'persona/self/value/a_name': value.a_name,
  'persona/self/value/extension_version': value.extension_version,
  'persona/self/value/major': value.major,
  'persona/self/value/majors': value.majors,
  'persona/self/value/a_leaf': value.a_leaf,
  'persona/self/value/extension_point': value.extension_point,
  'persona/self/value/manifest': value.manifest,
  'persona/self/value/more_asked': value.more_asked,
  'persona/self/value/extension_state': value.extension_state,
  'persona/self/value/offered_extension': value.offered_extension,
  'persona/self/value/offered_extensions': value.offered_extensions,
  'persona/self/value/the_answer_about_the_extensions_in_common':
    value.the_answer_about_the_extensions_in_common,
  'persona/self/value/a_question_asked': value.a_question_asked,
  'persona/self/node/self': node.self,
  'persona/self/usecase/make_my_first_face': usecase.make_my_first_face,
  'persona/self/usecase/make_my_first_face_input': usecase.make_my_first_face_input,
  'persona/self/usecase/prepare_a_ticket': usecase.prepare_a_ticket,
  'persona/self/usecase/prepare_a_ticket_input': usecase.prepare_a_ticket_input,
  'persona/self/usecase/open_their_ticket': usecase.open_their_ticket,
  'persona/self/usecase/open_their_ticket_input': usecase.open_their_ticket_input,
  'persona/self/usecase/rename_a_bond': usecase.rename_a_bond,
  'persona/self/usecase/rename_a_bond_input': usecase.rename_a_bond_input,
  'persona/self/usecase/remove_a_bond': usecase.remove_a_bond,
  'persona/self/usecase/remove_a_bond_input': usecase.remove_a_bond_input,
  'persona/self/usecase/activate_an_extension': usecase.activate_an_extension,
  'persona/self/usecase/activate_an_extension_input': usecase.activate_an_extension_input,
  'persona/self/usecase/deactivate_an_extension': usecase.deactivate_an_extension,
  'persona/self/usecase/deactivate_an_extension_input': usecase.deactivate_an_extension_input,
  'persona/self/usecase/withdraw_the_offer_from_a_bond': usecase.withdraw_the_offer_from_a_bond,
  'persona/self/usecase/withdraw_the_offer_from_a_bond_input':
    usecase.withdraw_the_offer_from_a_bond_input,
  'persona/self/usecase/offer_an_extension_to_a_bond': usecase.offer_an_extension_to_a_bond,
  'persona/self/usecase/offer_an_extension_to_a_bond_input':
    usecase.offer_an_extension_to_a_bond_input,
  'persona/self/usecase/ask_a_bond_for_the_extensions_in_common':
    usecase.ask_a_bond_for_the_extensions_in_common,
  'persona/self/usecase/ask_a_bond_for_the_extensions_in_common_input':
    usecase.ask_a_bond_for_the_extensions_in_common_input,
  'persona/self/usecase/my_faces': usecase.my_faces,
  'persona/self/usecase/my_faces_input': usecase.my_faces_input,
  'persona/self/usecase/my_bonds': usecase.my_bonds,
  'persona/self/usecase/my_bonds_input': usecase.my_bonds_input,
  'persona/self/usecase/a_bond': usecase.a_bond,
  'persona/self/usecase/a_bond_input': usecase.a_bond_input,
  'persona/self/usecase/my_ticket': usecase.my_ticket,
  'persona/self/usecase/my_ticket_input': usecase.my_ticket_input,
  'persona/self/usecase/an_extension': usecase.an_extension,
  'persona/self/usecase/an_extension_input': usecase.an_extension_input,
  'persona/self/usecase/the_questions_asked_of_a_bond': usecase.the_questions_asked_of_a_bond,
  'persona/self/usecase/the_questions_asked_of_a_bond_input':
    usecase.the_questions_asked_of_a_bond_input,
  'persona/self/usecase/the_extensions_offered_to_a_bond': usecase.the_extensions_offered_to_a_bond,
  'persona/self/usecase/the_extensions_offered_to_a_bond_input':
    usecase.the_extensions_offered_to_a_bond_input,
  'persona/self/version/self': version.self,
} satisfies zz.Registry
