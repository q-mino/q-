import type * as zz from '@q-mino/domains/library'
import type { registry as address_book_registry } from '@q-mino/domains/bonds/address_book/_registry.ts'
import type * as address_book from '@q-mino/domains/bonds/address_book/_usecase.ts'
import type { registry as activations_registry } from '@q-mino/domains/extensions/activations/_registry.ts'
import type * as activations from '@q-mino/domains/extensions/activations/_usecase.ts'
import type { registry as requests_registry } from '@q-mino/domains/post/requests/_registry.ts'
import type * as requests from '@q-mino/domains/post/requests/_usecase.ts'
import type { registry as safe_registry } from '@q-mino/domains/seals/safe/_registry.ts'
import type * as safe from '@q-mino/domains/seals/safe/_usecase.ts'
import type { registry as activities_registry } from '@q-mino/domains/user/activities/_registry.ts'
import type * as activities from '@q-mino/domains/user/activities/_usecase.ts'
import type { registry as choices_registry } from '@q-mino/domains/user/choices/_registry.ts'
import type * as choices from '@q-mino/domains/user/choices/_usecase.ts'
import type { registry as drafts_registry } from '@q-mino/domains/user/drafts/_registry.ts'
import type * as drafts from '@q-mino/domains/user/drafts/_usecase.ts'

/** The ports of these command use cases, as `zz.command_use_case_ports` gives them. */
type CommandPorts<use_cases extends zz.CommandUseCases> = {
  readonly [name in keyof use_cases]: zz.CommandUseCasePort<use_cases[name]>
}

/** The ports of these read use cases of a domain, as `zz.read_use_case_ports` gives them with no stream and no action: a storage of the kernel's (WEB-16). */
type ReadPorts<of extends zz.Registry, use_cases extends zz.ReadUseCases> = {
  readonly [name in keyof use_cases]: zz.ReadUseCasePort<
    zz.QueriesOf<use_cases>[name],
    zz.FactsIn<of>,
    false
  >
}

/** The safe's ports (`seals/safe`, SEA-6), whatever the storage that gives them: the oracle's or IndexedDB's (WEB-16, CFG-5). */
export type TheSafesPorts = CommandPorts<{
  readonly make_a_face_from_a_new_seed: typeof safe.make_a_face_from_a_new_seed
  readonly keep_a_new_seed_and_its_face: typeof safe.keep_a_new_seed_and_its_face
  readonly draw_a_mailbox_key: typeof safe.draw_a_mailbox_key
  readonly keep_a_mailbox_key: typeof safe.keep_a_mailbox_key
}> &
  ReadPorts<
    typeof safe_registry,
    {
      readonly a_content_signed_by_a_face: typeof safe.a_content_signed_by_a_face
      readonly a_sealed_content_opened_by_a_face: typeof safe.a_sealed_content_opened_by_a_face
      readonly the_key_of_a_mailbox: typeof safe.the_key_of_a_mailbox
    }
  >

/** The post's ports (`post/requests`), whatever the storage that gives them (WEB-16, CFG-5). */
export type ThePostsPorts = CommandPorts<{
  readonly send_a_request: typeof requests.send_a_request
  readonly call_off_a_request: typeof requests.call_off_a_request
  readonly send_a_request_again: typeof requests.send_a_request_again
  readonly close_a_request_with_no_response: typeof requests.close_a_request_with_no_response
  readonly take_a_response: typeof requests.take_a_response
}> &
  ReadPorts<
    typeof requests_registry,
    {
      readonly the_answer_to_a_request: typeof requests.the_answer_to_a_request
      readonly the_requests_waiting: typeof requests.the_requests_waiting
    }
  >

/** The address book's ports (`bonds/address_book`), whatever the storage that gives them (WEB-16, CFG-5). */
export type TheAddressBooksPorts = CommandPorts<{
  readonly rename_a_bond: typeof address_book.rename_a_bond
  readonly remove_a_bond: typeof address_book.remove_a_bond
  readonly make_my_first_face: typeof address_book.make_my_first_face
  readonly keep_the_key_of_a_face: typeof address_book.keep_the_key_of_a_face
  readonly prepare_a_ticket: typeof address_book.prepare_a_ticket
  readonly keep_the_mailbox_of_a_ticket: typeof address_book.keep_the_mailbox_of_a_ticket
  readonly let_a_ticket_expire: typeof address_book.let_a_ticket_expire
  readonly open_their_ticket: typeof address_book.open_their_ticket
  readonly accept_their_introduction: typeof address_book.accept_their_introduction
}> &
  ReadPorts<
    typeof address_book_registry,
    {
      readonly my_faces: typeof address_book.my_faces
      readonly my_bonds: typeof address_book.my_bonds
      readonly a_bond: typeof address_book.a_bond
      readonly the_bond_at_my_mailbox: typeof address_book.the_bond_at_my_mailbox
      readonly the_mailboxes_i_collect: typeof address_book.the_mailboxes_i_collect
      readonly my_ticket: typeof address_book.my_ticket
      readonly the_ticket_at_my_mailbox: typeof address_book.the_ticket_at_my_mailbox
    }
  >

/** The office's ports (`extensions/activations`, EXT-7), whatever the storage that gives them (WEB-16, CFG-5). */
export type TheOfficesPorts = CommandPorts<{
  readonly activate_an_extension: typeof activations.activate_an_extension
  readonly deactivate_an_extension: typeof activations.deactivate_an_extension
  readonly withdraw_the_offer_from_a_bond: typeof activations.withdraw_the_offer_from_a_bond
  readonly offer_an_extension_to_a_bond: typeof activations.offer_an_extension_to_a_bond
  readonly ask_a_bond_for_the_extensions_in_common: typeof activations.ask_a_bond_for_the_extensions_in_common
  readonly learn_the_extensions_in_common: typeof activations.learn_the_extensions_in_common
}> &
  ReadPorts<
    typeof activations_registry,
    {
      readonly an_extension: typeof activations.an_extension
      readonly the_extensions_offered_to_a_bond: typeof activations.the_extensions_offered_to_a_bond
      readonly the_extensions_in_common: typeof activations.the_extensions_in_common
      readonly the_questions_asked_of_a_bond: typeof activations.the_questions_asked_of_a_bond
    }
  >

/** The ports of `user`'s three offices (USR-1..USR-6), whatever the storage that gives them (WEB-16, CFG-5). */
export type TheUsersOfficesPorts = CommandPorts<{
  readonly ask_for_an_activity: typeof activities.ask_for_an_activity
  readonly end_an_activity: typeof activities.end_an_activity
  readonly keep_a_draft: typeof drafts.keep_a_draft
  readonly drop_a_draft: typeof drafts.drop_a_draft
  readonly change_face: typeof choices.change_face
}> &
  ReadPorts<
    typeof activities_registry,
    {
      readonly an_activity: typeof activities.an_activity
      readonly the_activities_in_progress: typeof activities.the_activities_in_progress
    }
  > &
  ReadPorts<typeof drafts_registry, { readonly a_draft: typeof drafts.a_draft }> &
  ReadPorts<typeof choices_registry, { readonly the_active_face: typeof choices.the_active_face }>
