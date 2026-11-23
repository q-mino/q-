// generated

// The path registry of `business/pings` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity.

import type * as zz from '../../../../domains/src/library/index.ts'
import * as id from './_id.ts'
import * as value from './_value.ts'
import * as fact from './_fact.ts'
import * as predicate from './_predicate.ts'
import * as effect from './_effect.ts'
import * as command from './_command.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'business/pings/id/bond': id.bond,
  'business/pings/id/ping_id': id.ping_id,
  'business/pings/id/pong_id': id.pong_id,
  'business/pings/value/instant': value.instant,
  'business/pings/value/waiting_time': value.waiting_time,
  'business/pings/value/what_came_back': value.what_came_back,
  'business/pings/value/progress': value.progress,
  'business/pings/value/ping': value.ping,
  'business/pings/value/pong': value.pong,
  'business/pings/fact/a_ping_has_been_sent': fact.a_ping_has_been_sent,
  'business/pings/fact/a_pong_has_been_received': fact.a_pong_has_been_received,
  'business/pings/fact/a_ping_has_had_no_response': fact.a_ping_has_had_no_response,
  'business/pings/fact/a_ping_could_not_be_answered': fact.a_ping_could_not_be_answered,
  'business/pings/fact/a_ping_has_been_called_off': fact.a_ping_has_been_called_off,
  'business/pings/fact/a_ping_has_been_answered': fact.a_ping_has_been_answered,
  'business/pings/predicate/a_ping_has_this_id': predicate.a_ping_has_this_id,
  'business/pings/predicate/the_ping_waits': predicate.the_ping_waits,
  'business/pings/predicate/the_pong_came_back': predicate.the_pong_came_back,
  'business/pings/predicate/the_ping_had_no_response': predicate.the_ping_had_no_response,
  'business/pings/predicate/the_peer_cannot_answer': predicate.the_peer_cannot_answer,
  'business/pings/predicate/the_ping_was_called_off': predicate.the_ping_was_called_off,
  'business/pings/predicate/a_pong_has_this_id': predicate.a_pong_has_this_id,
  'business/pings/effect/ask_for_a_pong': effect.ask_for_a_pong,
  'business/pings/command/the_ping_is_new': command.the_ping_is_new,
  'business/pings/command/send_a_ping': command.send_a_ping,
  'business/pings/command/send_a_ping_input': command.send_a_ping_input,
  'business/pings/command/the_ping_waits_and_its_pong_came_back':
    command.the_ping_waits_and_its_pong_came_back,
  'business/pings/command/the_ping_waits_and_had_no_response':
    command.the_ping_waits_and_had_no_response,
  'business/pings/command/the_ping_waits_and_the_peer_cannot_answer':
    command.the_ping_waits_and_the_peer_cannot_answer,
  'business/pings/command/the_ping_waits_and_was_called_off':
    command.the_ping_waits_and_was_called_off,
  'business/pings/command/close_a_ping': command.close_a_ping,
  'business/pings/command/close_a_ping_input': command.close_a_ping_input,
  'business/pings/command/the_pong_is_new': command.the_pong_is_new,
  'business/pings/command/answer_a_ping': command.answer_a_ping,
  'business/pings/command/answer_a_ping_input': command.answer_a_ping_input,
  'business/pings/usecase/send_a_ping': usecase.send_a_ping,
  'business/pings/usecase/close_a_ping': usecase.close_a_ping,
  'business/pings/usecase/answer_a_ping': usecase.answer_a_ping,
  'business/pings/version/pings': version.pings,
} satisfies zz.Registry
