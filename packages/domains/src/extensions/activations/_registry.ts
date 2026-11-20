// generated

// The path registry of `extensions/activations` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity.

import type * as zz from '../../library/index.ts'
import * as id from './_id.ts'
import * as value from './_value.ts'
import * as fact from './_fact.ts'
import * as predicate from './_predicate.ts'
import * as effect from './_effect.ts'
import * as extension_selection from './_extension_selection.ts'
import * as command from './_command.ts'
import * as query from './_query.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'extensions/activations/id/extension_name': id.extension_name,
  'extensions/activations/id/question_id': id.question_id,
  'extensions/activations/value/a_name': value.a_name,
  'extensions/activations/value/extension_version': value.extension_version,
  'extensions/activations/value/major': value.major,
  'extensions/activations/value/a_leaf': value.a_leaf,
  'extensions/activations/value/extension_point': value.extension_point,
  'extensions/activations/value/manifest': value.manifest,
  'extensions/activations/value/more_asked': value.more_asked,
  'extensions/activations/value/activated_extension': value.activated_extension,
  'extensions/activations/value/deactivated_extension': value.deactivated_extension,
  'extensions/activations/value/activation': value.activation,
  'extensions/activations/value/extension_state': value.extension_state,
  'extensions/activations/value/extension_card': value.extension_card,
  'extensions/activations/value/withdrawn_offer': value.withdrawn_offer,
  'extensions/activations/value/offered_extension': value.offered_extension,
  'extensions/activations/value/offered_extensions': value.offered_extensions,
  'extensions/activations/value/waiting_time': value.waiting_time,
  'extensions/activations/value/no_answer': value.no_answer,
  'extensions/activations/value/what_came_back': value.what_came_back,
  'extensions/activations/value/question_progress': value.question_progress,
  'extensions/activations/value/question': value.question,
  'extensions/activations/fact/an_extension_has_been_activated':
    fact.an_extension_has_been_activated,
  'extensions/activations/fact/an_extension_has_been_activated_again':
    fact.an_extension_has_been_activated_again,
  'extensions/activations/fact/an_extension_has_been_deactivated':
    fact.an_extension_has_been_deactivated,
  'extensions/activations/fact/an_extension_has_been_deactivated_again':
    fact.an_extension_has_been_deactivated_again,
  'extensions/activations/fact/the_offer_of_an_extension_has_been_withdrawn_from_a_bond':
    fact.the_offer_of_an_extension_has_been_withdrawn_from_a_bond,
  'extensions/activations/fact/the_offer_of_an_extension_has_been_withdrawn_from_a_bond_again':
    fact.the_offer_of_an_extension_has_been_withdrawn_from_a_bond_again,
  'extensions/activations/fact/an_extension_has_been_offered_to_a_bond':
    fact.an_extension_has_been_offered_to_a_bond,
  'extensions/activations/fact/an_extension_has_been_offered_to_a_bond_again':
    fact.an_extension_has_been_offered_to_a_bond_again,
  'extensions/activations/fact/a_bond_has_been_asked_for_the_extensions_in_common':
    fact.a_bond_has_been_asked_for_the_extensions_in_common,
  'extensions/activations/fact/the_extensions_in_common_with_a_bond_have_been_learned':
    fact.the_extensions_in_common_with_a_bond_have_been_learned,
  'extensions/activations/fact/a_question_about_the_extensions_in_common_had_no_answer':
    fact.a_question_about_the_extensions_in_common_had_no_answer,
  'extensions/activations/predicate/the_extension_is_installed':
    predicate.the_extension_is_installed,
  'extensions/activations/predicate/the_extension_is_installed_with_this_manifest':
    predicate.the_extension_is_installed_with_this_manifest,
  'extensions/activations/predicate/the_extension_is_activated':
    predicate.the_extension_is_activated,
  'extensions/activations/predicate/the_extension_is_activated_with_this_manifest':
    predicate.the_extension_is_activated_with_this_manifest,
  'extensions/activations/predicate/the_bond_exists': predicate.the_bond_exists,
  'extensions/activations/predicate/the_offer_is_withdrawn_from_the_bond':
    predicate.the_offer_is_withdrawn_from_the_bond,
  'extensions/activations/predicate/these_extensions_are_offered_to_the_bond':
    predicate.these_extensions_are_offered_to_the_bond,
  'extensions/activations/predicate/a_question_has_this_id': predicate.a_question_has_this_id,
  'extensions/activations/predicate/the_question_waits': predicate.the_question_waits,
  'extensions/activations/predicate/the_extensions_in_common_came_back':
    predicate.the_extensions_in_common_came_back,
  'extensions/activations/effect/ask_for_the_extensions_in_common':
    effect.ask_for_the_extensions_in_common,
  'extensions/activations/selection/extension/the_extension_has_this_name':
    extension_selection.the_extension_has_this_name,
  'extensions/activations/selection/extension/the_extension_is_offered_to_this_bond':
    extension_selection.the_extension_is_offered_to_this_bond,
  'extensions/activations/selection/extension/the_extension_is_one_of_these':
    extension_selection.the_extension_is_one_of_these,
  'extensions/activations/command/the_manifest_shown_is_new': command.the_manifest_shown_is_new,
  'extensions/activations/command/the_manifest_shown_is_accepted_already':
    command.the_manifest_shown_is_accepted_already,
  'extensions/activations/command/activate_an_extension': command.activate_an_extension,
  'extensions/activations/command/activate_an_extension_input': command.activate_an_extension_input,
  'extensions/activations/command/the_extension_is_not_activated':
    command.the_extension_is_not_activated,
  'extensions/activations/command/deactivate_an_extension': command.deactivate_an_extension,
  'extensions/activations/command/deactivate_an_extension_input':
    command.deactivate_an_extension_input,
  'extensions/activations/command/the_extension_is_offered_to_the_bond':
    command.the_extension_is_offered_to_the_bond,
  'extensions/activations/command/the_offer_is_withdrawn_from_the_bond':
    command.the_offer_is_withdrawn_from_the_bond,
  'extensions/activations/command/withdraw_the_offer_from_a_bond':
    command.withdraw_the_offer_from_a_bond,
  'extensions/activations/command/withdraw_the_offer_from_a_bond_input':
    command.withdraw_the_offer_from_a_bond_input,
  'extensions/activations/command/offer_an_extension_to_a_bond':
    command.offer_an_extension_to_a_bond,
  'extensions/activations/command/offer_an_extension_to_a_bond_input':
    command.offer_an_extension_to_a_bond_input,
  'extensions/activations/command/the_question_can_be_asked': command.the_question_can_be_asked,
  'extensions/activations/command/ask_a_bond_for_the_extensions_in_common':
    command.ask_a_bond_for_the_extensions_in_common,
  'extensions/activations/command/ask_a_bond_for_the_extensions_in_common_input':
    command.ask_a_bond_for_the_extensions_in_common_input,
  'extensions/activations/command/the_question_waits_and_they_came_back':
    command.the_question_waits_and_they_came_back,
  'extensions/activations/command/the_question_waits_and_no_answer_came_back':
    command.the_question_waits_and_no_answer_came_back,
  'extensions/activations/command/learn_the_extensions_in_common':
    command.learn_the_extensions_in_common,
  'extensions/activations/command/learn_the_extensions_in_common_input':
    command.learn_the_extensions_in_common_input,
  'extensions/activations/query/an_extension': query.an_extension,
  'extensions/activations/query/an_extension_input': query.an_extension_input,
  'extensions/activations/query/the_extensions_offered_to_a_bond':
    query.the_extensions_offered_to_a_bond,
  'extensions/activations/query/the_extensions_offered_to_a_bond_input':
    query.the_extensions_offered_to_a_bond_input,
  'extensions/activations/query/it_is_offered_back': query.it_is_offered_back,
  'extensions/activations/query/the_extensions_in_common': query.the_extensions_in_common,
  'extensions/activations/query/the_extensions_in_common_input':
    query.the_extensions_in_common_input,
  'extensions/activations/usecase/activate_an_extension': usecase.activate_an_extension,
  'extensions/activations/usecase/deactivate_an_extension': usecase.deactivate_an_extension,
  'extensions/activations/usecase/withdraw_the_offer_from_a_bond':
    usecase.withdraw_the_offer_from_a_bond,
  'extensions/activations/usecase/offer_an_extension_to_a_bond':
    usecase.offer_an_extension_to_a_bond,
  'extensions/activations/usecase/ask_a_bond_for_the_extensions_in_common':
    usecase.ask_a_bond_for_the_extensions_in_common,
  'extensions/activations/usecase/learn_the_extensions_in_common':
    usecase.learn_the_extensions_in_common,
  'extensions/activations/usecase/an_extension': usecase.an_extension,
  'extensions/activations/usecase/the_extensions_offered_to_a_bond':
    usecase.the_extensions_offered_to_a_bond,
  'extensions/activations/usecase/the_extensions_in_common': usecase.the_extensions_in_common,
  'extensions/activations/version/activations': version.activations,
} satisfies zz.Registry
