// generated

// The path registry of `business/chats` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity.

import type * as zz from '../../../../domains/src/library/index.ts'
import * as id from './_id.ts'
import * as value from './_value.ts'
import * as fact from './_fact.ts'
import * as predicate from './_predicate.ts'
import * as effect from './_effect.ts'
import * as chat_selection from './_chat_selection.ts'
import * as message_selection from './_message_selection.ts'
import * as command from './_command.ts'
import * as query from './_query.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'business/chats/id/bond': id.bond,
  'business/chats/id/message_id': id.message_id,
  'business/chats/value/instant': value.instant,
  'business/chats/value/text': value.text,
  'business/chats/value/waiting_time': value.waiting_time,
  'business/chats/value/place': value.place,
  'business/chats/value/what_came_back': value.what_came_back,
  'business/chats/value/progress': value.progress,
  'business/chats/value/a_message_written': value.a_message_written,
  'business/chats/value/a_message_received': value.a_message_received,
  'business/chats/value/a_message_in_a_chat': value.a_message_in_a_chat,
  'business/chats/value/reading': value.reading,
  'business/chats/value/a_chat_s_folder': value.a_chat_s_folder,
  'business/chats/value/stage': value.stage,
  'business/chats/value/whose': value.whose,
  'business/chats/value/a_message_of_a_chat': value.a_message_of_a_chat,
  'business/chats/value/a_chat_at_a_glance': value.a_chat_at_a_glance,
  'business/chats/fact/a_message_has_been_written': fact.a_message_has_been_written,
  'business/chats/fact/a_message_has_been_delivered': fact.a_message_has_been_delivered,
  'business/chats/fact/a_message_has_had_no_receipt': fact.a_message_has_had_no_receipt,
  'business/chats/fact/a_message_could_not_be_delivered': fact.a_message_could_not_be_delivered,
  'business/chats/fact/a_message_has_been_called_off': fact.a_message_has_been_called_off,
  'business/chats/fact/a_message_has_been_received': fact.a_message_has_been_received,
  'business/chats/fact/a_chat_has_been_read': fact.a_chat_has_been_read,
  'business/chats/fact/a_chat_has_been_read_again': fact.a_chat_has_been_read_again,
  'business/chats/predicate/a_message_has_this_id': predicate.a_message_has_this_id,
  'business/chats/predicate/the_message_waits': predicate.the_message_waits,
  'business/chats/predicate/the_message_was_received': predicate.the_message_was_received,
  'business/chats/predicate/the_message_had_no_receipt': predicate.the_message_had_no_receipt,
  'business/chats/predicate/the_peer_cannot_receive_it': predicate.the_peer_cannot_receive_it,
  'business/chats/predicate/the_message_was_called_off': predicate.the_message_was_called_off,
  'business/chats/predicate/the_chat_is_read_up_to_it': predicate.the_chat_is_read_up_to_it,
  'business/chats/effect/deliver_a_message': effect.deliver_a_message,
  'business/chats/selection/chat/the_chat_is_of_this_bond': chat_selection.the_chat_is_of_this_bond,
  'business/chats/selection/message/the_message_is_of_this_chat':
    message_selection.the_message_is_of_this_chat,
  'business/chats/command/the_message_is_new': command.the_message_is_new,
  'business/chats/command/write_a_message': command.write_a_message,
  'business/chats/command/write_a_message_input': command.write_a_message_input,
  'business/chats/command/the_message_waits_and_was_received':
    command.the_message_waits_and_was_received,
  'business/chats/command/the_message_waits_and_had_no_receipt':
    command.the_message_waits_and_had_no_receipt,
  'business/chats/command/the_message_waits_and_the_peer_cannot_receive_it':
    command.the_message_waits_and_the_peer_cannot_receive_it,
  'business/chats/command/the_message_waits_and_was_called_off':
    command.the_message_waits_and_was_called_off,
  'business/chats/command/close_a_message': command.close_a_message,
  'business/chats/command/close_a_message_input': command.close_a_message_input,
  'business/chats/command/receive_a_message': command.receive_a_message,
  'business/chats/command/receive_a_message_input': command.receive_a_message_input,
  'business/chats/command/the_message_is_after_what_she_read':
    command.the_message_is_after_what_she_read,
  'business/chats/command/the_chat_is_read_up_to_it_already':
    command.the_chat_is_read_up_to_it_already,
  'business/chats/command/read_a_chat': command.read_a_chat,
  'business/chats/command/read_a_chat_input': command.read_a_chat_input,
  'business/chats/query/a_chat': query.a_chat,
  'business/chats/query/a_chat_input': query.a_chat_input,
  'business/chats/query/a_chat_at_a_glance': query.a_chat_at_a_glance,
  'business/chats/query/a_chat_at_a_glance_input': query.a_chat_at_a_glance_input,
  'business/chats/usecase/write_a_message': usecase.write_a_message,
  'business/chats/usecase/close_a_message': usecase.close_a_message,
  'business/chats/usecase/receive_a_message': usecase.receive_a_message,
  'business/chats/usecase/read_a_chat': usecase.read_a_chat,
  'business/chats/usecase/a_chat': usecase.a_chat,
  'business/chats/usecase/a_chat_at_a_glance': usecase.a_chat_at_a_glance,
  'business/chats/version/chats': version.chats,
} satisfies zz.Registry
