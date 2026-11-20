// generated

// The path registry of `post/requests` (DOM-24): every path with its component,
// in the order of the twins. The configurator gives it to the library, which
// reads it in reverse, from a component to its path, by object identity.

import type * as zz from '../../library/index.ts'
import * as id from './_id.ts'
import * as value from './_value.ts'
import * as fact from './_fact.ts'
import * as predicate from './_predicate.ts'
import * as effect from './_effect.ts'
import * as request_selection from './_request_selection.ts'
import * as command from './_command.ts'
import * as query from './_query.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'post/requests/id/request_id': id.request_id,
  'post/requests/value/waiting_time': value.waiting_time,
  'post/requests/value/deposit': value.deposit,
  'post/requests/value/sending_again': value.sending_again,
  'post/requests/value/waiting_request': value.waiting_request,
  'post/requests/value/answered_request': value.answered_request,
  'post/requests/value/request_with_no_response': value.request_with_no_response,
  'post/requests/value/request': value.request,
  'post/requests/value/answer': value.answer,
  'post/requests/value/request_card': value.request_card,
  'post/requests/fact/a_request_has_been_sent': fact.a_request_has_been_sent,
  'post/requests/fact/a_request_has_been_sent_again': fact.a_request_has_been_sent_again,
  'post/requests/fact/the_time_to_send_again_came_too_late':
    fact.the_time_to_send_again_came_too_late,
  'post/requests/fact/a_request_has_been_answered': fact.a_request_has_been_answered,
  'post/requests/fact/a_request_had_no_response': fact.a_request_had_no_response,
  'post/requests/fact/the_response_came_before_the_time': fact.the_response_came_before_the_time,
  'post/requests/predicate/a_request_has_this_id': predicate.a_request_has_this_id,
  'post/requests/predicate/the_request_is_waiting': predicate.the_request_is_waiting,
  'post/requests/predicate/the_time_of_the_request_is_not_over':
    predicate.the_time_of_the_request_is_not_over,
  'post/requests/predicate/the_request_went_to_this_face': predicate.the_request_went_to_this_face,
  'post/requests/effect/deposit_a_letter': effect.deposit_a_letter,
  'post/requests/effect/wait_to_send_again': effect.wait_to_send_again,
  'post/requests/effect/wait_for_the_response': effect.wait_for_the_response,
  'post/requests/selection/request/the_request_has_this_id':
    request_selection.the_request_has_this_id,
  'post/requests/command/the_request_is_new': command.the_request_is_new,
  'post/requests/command/send_a_request': command.send_a_request,
  'post/requests/command/send_a_request_input': command.send_a_request_input,
  'post/requests/command/the_request_waits_within_its_time':
    command.the_request_waits_within_its_time,
  'post/requests/command/the_request_waits_no_more': command.the_request_waits_no_more,
  'post/requests/command/send_a_request_again': command.send_a_request_again,
  'post/requests/command/send_a_request_again_input': command.send_a_request_again_input,
  'post/requests/command/the_request_is_closed': command.the_request_is_closed,
  'post/requests/command/close_a_request_with_no_response':
    command.close_a_request_with_no_response,
  'post/requests/command/close_a_request_with_no_response_input':
    command.close_a_request_with_no_response_input,
  'post/requests/command/the_request_waits_for_this_face': command.the_request_waits_for_this_face,
  'post/requests/command/take_a_response': command.take_a_response,
  'post/requests/command/take_a_response_input': command.take_a_response_input,
  'post/requests/query/the_answer_to_a_request': query.the_answer_to_a_request,
  'post/requests/query/the_answer_to_a_request_input': query.the_answer_to_a_request_input,
  'post/requests/usecase/send_a_request': usecase.send_a_request,
  'post/requests/usecase/send_a_request_again': usecase.send_a_request_again,
  'post/requests/usecase/close_a_request_with_no_response':
    usecase.close_a_request_with_no_response,
  'post/requests/usecase/take_a_response': usecase.take_a_response,
  'post/requests/usecase/the_answer_to_a_request': usecase.the_answer_to_a_request,
  'post/requests/version/requests': version.requests,
} satisfies zz.Registry
