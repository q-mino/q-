// The pure functions and the constants of `chats` (DOM-5): how long a
// message waits, the meanings of its predicates for the adapters, how the
// office files a message in its chat, and how its reads tell a message and
// a chat at a glance (MSG-5, MSG-7, MSG-13).

import type { value } from './_scope_dsl.ts'

/**
 * How long a message waits for its receipt: seven days, 604 800 seconds
 * (MSG-2): the most the boundary takes, the relay's keeping (MBX-2, PST-5),
 * so that a phone off for a weekend is not "no receipt".
 */
export const a_message_waits = 604_800

/** A chat's folder before its first message: nothing filed, nothing read. */
export const an_empty_folder = (bond: value.a_chat_s_folder['bond']): value.a_chat_s_folder => ({
  bond,
  filed: 0,
  reading: { read: 'nothing' },
})

/** The place of the next message filed in a chat: after the last one (MSG-5). */
export const the_next_place = (folder: value.a_chat_s_folder): number => folder.filed + 1

/** The folder with one more message filed. */
export const with_one_more = (folder: value.a_chat_s_folder): value.a_chat_s_folder => ({
  ...folder,
  filed: folder.filed + 1,
})

/** A message with this identity is filed in the chat, written or received. */
export const a_message_is_there = (
  the_message: value.a_message_in_a_chat | undefined,
): the_message is value.a_message_in_a_chat => the_message !== undefined

/** The message is hers and on its way: written, not closed. */
export const the_message_waits = (the_message: value.a_message_in_a_chat | undefined): boolean =>
  the_message?.whose === 'mine' && the_message.progress.stage === 'on_its_way'

/** What came back is this meaning: the value of the four predicates over what came back. */
export const what_came_back_is =
  (meaning: value.what_came_back) =>
  (what_came_back: value.what_came_back): boolean =>
    what_came_back === meaning

/** A message of hers closed with what came back, when her node learned it; theirs unchanged. */
export const closed_with =
  (what_came_back: value.what_came_back, at: value.instant) =>
  (the_message: value.a_message_in_a_chat): value.a_message_in_a_chat =>
    the_message.whose === 'mine'
      ? { ...the_message, progress: { stage: 'closed', what_came_back, at } }
      : the_message

/** The chat is read up to this message, or a later one: its place is at or before the reading's. */
export const it_is_read_up_to = (
  folder: value.a_chat_s_folder | undefined,
  the_message: value.a_message_in_a_chat | undefined,
): boolean =>
  folder?.reading.read === 'up_to' &&
  the_message !== undefined &&
  the_message.place <= folder.reading.place

/** The chat read up to a message, at its place, at this instant. */
export const read_up_to =
  (the_message: value.a_message_in_a_chat, at: value.instant) =>
  (folder: value.a_chat_s_folder): value.a_chat_s_folder => ({
    ...folder,
    reading: { read: 'up_to', message_id: the_message.message.id, place: the_message.place, at },
  })

/** Where her message stands in the office, as the chat tells it (MSG-13), before what the executor holds. */
const the_stage_closed: Readonly<Record<value.what_came_back, (at: value.instant) => value.stage>> =
  {
    the_message_was_received: (at) => ({ stage: 'delivered', at }),
    the_message_had_no_receipt: (at) => ({ stage: 'no_receipt', at }),
    the_peer_cannot_receive_it: (at) => ({ stage: 'could_not_be_delivered', at }),
    the_message_was_called_off: (at) => ({ stage: 'called_off', at }),
  }

/**
 * What the extension's executor holds of a message's delivery (MSG-13):
 * nothing, its dead letter, or that letter discarded. Not the office's:
 * its adapter reads it from the executor's state.
 */
export type what_the_executor_holds = 'nothing' | 'its_dead_letter' | 'its_letter_discarded'

/**
 * The stage of a message she wrote (MSG-13): closed, as what came back says;
 * on its way, unless its delivery is held, or was put aside. A message
 * closed is closed, whatever the executor kept of it.
 */
export const the_stage_of = (
  progress: value.progress,
  held: what_the_executor_holds,
): value.stage =>
  progress.stage === 'closed'
    ? the_stage_closed[progress.what_came_back](progress.at)
    : held === 'its_dead_letter'
      ? { stage: 'held' }
      : held === 'its_letter_discarded'
        ? { stage: 'put_aside' }
        : { stage: 'on_its_way' }

/** A message of a chat as its read gives it (MSG-7), her stage told with what the executor holds. */
export const as_a_message_of_a_chat =
  (held: (message_id: value.a_message_written['id']) => what_the_executor_holds) =>
  (filed: value.a_message_in_a_chat): value.a_message_of_a_chat =>
    filed.whose === 'mine'
      ? {
          message_id: filed.message.id,
          bond: filed.message.bond,
          place: filed.place,
          text: filed.message.text,
          at: filed.message.written_at,
          whose: { whose: 'mine', stage: the_stage_of(filed.progress, held(filed.message.id)) },
        }
      : {
          message_id: filed.message.id,
          bond: filed.message.bond,
          place: filed.place,
          text: filed.message.text,
          at: filed.message.received_at,
          whose: { whose: 'theirs', declared_at: filed.message.declared_at },
        }

/**
 * How many of a chat's messages are to read (MSG-7): theirs, filed after
 * the one she read last; every one of theirs, when she has read nothing.
 */
export const to_read = (
  folder: value.a_chat_s_folder,
  messages: readonly value.a_message_in_a_chat[],
): number =>
  messages.filter(
    (each) =>
      each.whose === 'theirs' &&
      (folder.reading.read === 'nothing' || each.place > folder.reading.place),
  ).length

/** The last message of a chat: the one at the highest place, none in an empty chat. */
export const the_last_of = (
  messages: readonly value.a_message_in_a_chat[],
): value.a_message_in_a_chat | undefined =>
  messages.reduce<value.a_message_in_a_chat | undefined>(
    (last, each) => (last === undefined || each.place > last.place ? each : last),
    undefined,
  )
