// generated

// The values of `business/chats` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * An instant, as the node's clock tells it to the office: ISO 8601 in UTC,
 * to the millisecond (`2026-11-26T09:00:00.000Z`), as the library's
 * `date_time`: it tells no zone. Never a duration (MSG-1).
 *
 * @see {@link value.instant}
 */
export const instant = value.instant
export type instant = z.output<typeof instant>

/**
 * The text of a message (MSG-4): from 1 to 4 000 UTF-16 code units, a plain
 * string, no refinement (EXT-4), so that a letter never grows past its 32
 * KiB (PST-12). A text of spaces alone is a message, shown as it came.
 *
 * @see {@link value.text}
 */
export const text = value.text
export type text = z.output<typeof text>

/**
 * How long a message waits for its receipt, in seconds (F7, MSG-2): at most
 * the seven days a relay keeps a letter (MBX-2), the most the boundary takes.
 *
 * @see {@link value.waiting_time}
 */
export const waiting_time = value.waiting_time
export type waiting_time = z.output<typeof waiting_time>

/**
 * Where the office filed a message in its chat (MSG-5): one after another,
 * from 1, as her node recorded them, written or received, by one clock, the
 * node's own; the order of a chat.
 *
 * @see {@link value.place}
 */
export const place = value.place
export type place = z.output<typeof place>

/**
 * What came back of a message, the office's own closed set of meanings
 * (EXT-12, D108, MSG-2), never the peer's events: its receipt; no receipt
 * within its wait (never "not received", MSG-12); a peer that cannot
 * receive it (its node closed the request, refused it as malformed or of a
 * version it does not speak, or its office gave no receipt); called off by
 * her own gesture while it waited, messaging deactivated or withdrawn from
 * the bond (EXT-12).
 *
 * @see {@link value.what_came_back}
 */
export const what_came_back = value.what_came_back
export type what_came_back = z.output<typeof what_came_back>

/**
 * Where a message she wrote stands in the office's record: on its way, or closed with what came back, and when her node learned it.
 *
 * @see {@link value.progress}
 */
export const progress = value.progress
export type progress = z.output<typeof progress>

/**
 * A message she wrote on a bond: its text, when, how long it waits for its receipt.
 *
 * @see {@link value.a_message_written}
 */
export const a_message_written = value.a_message_written
export type a_message_written = z.output<typeof a_message_written>

/**
 * A message she received on a bond, with what her node can tell of it
 * (MSG-6): the bond it came on (the persona `known` itself: the signature
 * valid, the bond known; the bond's mailbox, BND-11), the time the letter
 * declares (a claim, F2) and the instant her node received it (its own
 * clock, F2).
 *
 * @see {@link value.a_message_received}
 */
export const a_message_received = value.a_message_received
export type a_message_received = z.output<typeof a_message_received>

/**
 * A message filed in its chat, at its place: hers, with where it stands, or theirs.
 *
 * @see {@link value.a_message_in_a_chat}
 */
export const a_message_in_a_chat = value.a_message_in_a_chat
export type a_message_in_a_chat = z.output<typeof a_message_in_a_chat>

/**
 * How far she has read a chat (MSG-7): nothing yet, or up to a message, at its place, and when.
 *
 * @see {@link value.reading}
 */
export const reading = value.reading
export type reading = z.output<typeof reading>

/**
 * The folder of a bond's chat in the office: how many messages it has filed, and how far she has read it.
 *
 * @see {@link value.a_chat_s_folder}
 */
export const a_chat_s_folder = value.a_chat_s_folder
export type a_chat_s_folder = z.output<typeof a_chat_s_folder>

/**
 * Where a message she wrote stands, as the chat tells it (MSG-13): on its
 * way; closed with what came back, and when her node learned it; or, its
 * delivery a dead letter of the extension's executor, held, and put aside
 * once she discarded it: not facts of the office (a dead letter is the
 * operator's lane, DOM-14), told on the message from the executor's state.
 *
 * @see {@link value.stage}
 */
export const stage = value.stage
export type stage = z.output<typeof stage>

/**
 * Whose a message of a chat is: hers, with its stage, or theirs, with the time its letter declares.
 *
 * @see {@link value.whose}
 */
export const whose = value.whose
export type whose = z.output<typeof whose>

/**
 * A message of a chat, as its read gives it (MSG-7): its place, its text,
 * when her node filed it (written, or received), and whose it is.
 *
 * @see {@link value.a_message_of_a_chat}
 */
export const a_message_of_a_chat = value.a_message_of_a_chat
export type a_message_of_a_chat = z.output<typeof a_message_of_a_chat>

/**
 * A chat at a glance (MSG-7), for the row of her contacts: its last
 * message, and how many of theirs are to read, those received after the
 * last one she read.
 *
 * @see {@link value.a_chat_at_a_glance}
 */
export const a_chat_at_a_glance = value.a_chat_at_a_glance
export type a_chat_at_a_glance = z.output<typeof a_chat_at_a_glance>
