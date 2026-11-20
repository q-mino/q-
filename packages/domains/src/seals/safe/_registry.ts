// generated

// The path registry of `seals/safe` (DOM-24): every path with its component, in
// the order of the twins. The configurator gives it to the library, which reads
// it in reverse, from a component to its path, by object identity.

import type * as zz from '../../library/index.ts'
import * as id from './_id.ts'
import * as value from './_value.ts'
import * as fact from './_fact.ts'
import * as predicate from './_predicate.ts'
import * as effect from './_effect.ts'
import * as face_selection from './_face_selection.ts'
import * as mailbox_key_selection from './_mailbox_key_selection.ts'
import * as face_calculation from './_face_calculation.ts'
import * as command from './_command.ts'
import * as query from './_query.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'seals/safe/id/seed_id': id.seed_id,
  'seals/safe/id/face_id': id.face_id,
  'seals/safe/id/mailbox_key_id': id.mailbox_key_id,
  'seals/safe/value/seed_secret': value.seed_secret,
  'seals/safe/value/seed_scheme': value.seed_scheme,
  'seals/safe/value/face_index': value.face_index,
  'seals/safe/value/next_index': value.next_index,
  'seals/safe/value/public_key': value.public_key,
  'seals/safe/value/private_key': value.private_key,
  'seals/safe/value/chain_code': value.chain_code,
  'seals/safe/value/face_keys': value.face_keys,
  'seals/safe/value/signature': value.signature,
  'seals/safe/value/content': value.content,
  'seals/safe/value/sealed_content': value.sealed_content,
  'seals/safe/value/opening': value.opening,
  'seals/safe/value/collect_secret': value.collect_secret,
  'seals/safe/value/deposit_address': value.deposit_address,
  'seals/safe/value/seed': value.seed,
  'seals/safe/value/face_status': value.face_status,
  'seals/safe/value/face_being_made': value.face_being_made,
  'seals/safe/value/made_face': value.made_face,
  'seals/safe/value/face': value.face,
  'seals/safe/value/face_of_mine': value.face_of_mine,
  'seals/safe/value/mailbox_key_status': value.mailbox_key_status,
  'seals/safe/value/mailbox_key_being_drawn': value.mailbox_key_being_drawn,
  'seals/safe/value/drawn_mailbox_key': value.drawn_mailbox_key,
  'seals/safe/value/mailbox_key': value.mailbox_key,
  'seals/safe/value/key_shown_to_the_relay': value.key_shown_to_the_relay,
  'seals/safe/fact/a_face_has_been_asked_for': fact.a_face_has_been_asked_for,
  'seals/safe/fact/a_face_has_been_made_from_a_new_seed': fact.a_face_has_been_made_from_a_new_seed,
  'seals/safe/fact/a_mailbox_key_has_been_asked_for': fact.a_mailbox_key_has_been_asked_for,
  'seals/safe/fact/a_mailbox_key_has_been_drawn': fact.a_mailbox_key_has_been_drawn,
  'seals/safe/predicate/a_face_has_this_id': predicate.a_face_has_this_id,
  'seals/safe/predicate/the_face_is_being_made': predicate.the_face_is_being_made,
  'seals/safe/predicate/a_mailbox_key_has_this_id': predicate.a_mailbox_key_has_this_id,
  'seals/safe/predicate/the_mailbox_key_is_being_drawn': predicate.the_mailbox_key_is_being_drawn,
  'seals/safe/effect/draw_a_seed_for_the_face': effect.draw_a_seed_for_the_face,
  'seals/safe/effect/draw_the_mailbox_key': effect.draw_the_mailbox_key,
  'seals/safe/selection/face/the_face_has_this_id': face_selection.the_face_has_this_id,
  'seals/safe/selection/face/the_face_is_made': face_selection.the_face_is_made,
  'seals/safe/selection/mailbox_key/the_mailbox_key_has_this_id':
    mailbox_key_selection.the_mailbox_key_has_this_id,
  'seals/safe/selection/mailbox_key/the_mailbox_key_is_drawn':
    mailbox_key_selection.the_mailbox_key_is_drawn,
  'seals/safe/calculation/face/the_signature_of_a_content':
    face_calculation.the_signature_of_a_content,
  'seals/safe/calculation/face/the_sealed_content_opened':
    face_calculation.the_sealed_content_opened,
  'seals/safe/command/the_face_is_new': command.the_face_is_new,
  'seals/safe/command/the_mailbox_key_is_new': command.the_mailbox_key_is_new,
  'seals/safe/command/make_a_face_from_a_new_seed': command.make_a_face_from_a_new_seed,
  'seals/safe/command/make_a_face_from_a_new_seed_input': command.make_a_face_from_a_new_seed_input,
  'seals/safe/command/keep_a_new_seed_and_its_face': command.keep_a_new_seed_and_its_face,
  'seals/safe/command/keep_a_new_seed_and_its_face_input':
    command.keep_a_new_seed_and_its_face_input,
  'seals/safe/command/draw_a_mailbox_key': command.draw_a_mailbox_key,
  'seals/safe/command/draw_a_mailbox_key_input': command.draw_a_mailbox_key_input,
  'seals/safe/command/keep_a_mailbox_key': command.keep_a_mailbox_key,
  'seals/safe/command/keep_a_mailbox_key_input': command.keep_a_mailbox_key_input,
  'seals/safe/query/the_face_is_made_under_this_id': query.the_face_is_made_under_this_id,
  'seals/safe/query/the_mailbox_key_is_drawn_under_this_id':
    query.the_mailbox_key_is_drawn_under_this_id,
  'seals/safe/query/a_content_signed_by_a_face': query.a_content_signed_by_a_face,
  'seals/safe/query/a_content_signed_by_a_face_input': query.a_content_signed_by_a_face_input,
  'seals/safe/query/a_sealed_content_opened_by_a_face': query.a_sealed_content_opened_by_a_face,
  'seals/safe/query/a_sealed_content_opened_by_a_face_input':
    query.a_sealed_content_opened_by_a_face_input,
  'seals/safe/query/the_key_of_a_mailbox': query.the_key_of_a_mailbox,
  'seals/safe/query/the_key_of_a_mailbox_input': query.the_key_of_a_mailbox_input,
  'seals/safe/usecase/make_a_face_from_a_new_seed': usecase.make_a_face_from_a_new_seed,
  'seals/safe/usecase/keep_a_new_seed_and_its_face': usecase.keep_a_new_seed_and_its_face,
  'seals/safe/usecase/draw_a_mailbox_key': usecase.draw_a_mailbox_key,
  'seals/safe/usecase/keep_a_mailbox_key': usecase.keep_a_mailbox_key,
  'seals/safe/usecase/a_content_signed_by_a_face': usecase.a_content_signed_by_a_face,
  'seals/safe/usecase/a_sealed_content_opened_by_a_face': usecase.a_sealed_content_opened_by_a_face,
  'seals/safe/usecase/the_key_of_a_mailbox': usecase.the_key_of_a_mailbox,
  'seals/safe/version/safe': version.safe,
} satisfies zz.Registry
