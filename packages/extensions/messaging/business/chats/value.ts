import { z } from 'zod'
import { id } from './_scope_value.ts'

// The values of `chats` (MSG-1..MSG-7, MSG-13; part M2): the text of a
// message, how long it waits for its receipt, the closed set of what comes
// back; the office's records, each message filed in its chat at its place,
// and how far she has read each chat; and what its reads give, a message of
// a chat with its stage, a chat at a glance.

/**
 * An instant, as the node's clock tells it to the office: ISO 8601 in UTC,
 * to the millisecond (`2026-11-26T09:00:00.000Z`), as the library's
 * `date_time`: it tells no zone. Never a duration (MSG-1).
 */
export const instant = z.iso.datetime({ precision: 3 })

/**
 * The text of a message (MSG-4): from 1 to 4 000 UTF-16 code units, a plain
 * string, no refinement (EXT-4), so that a letter never grows past its 32
 * KiB (PST-12). A text of spaces alone is a message, shown as it came.
 */
export const text = z.string().min(1).max(4_000)

/**
 * How long a message waits for its receipt, in seconds (F7, MSG-2): at most
 * the seven days a relay keeps a letter (MBX-2), the most the boundary takes.
 */
export const waiting_time = z.number().int().min(1).max(604_800)

/**
 * Where the office filed a message in its chat (MSG-5): one after another,
 * from 1, as her node recorded them, written or received, by one clock, the
 * node's own; the order of a chat.
 */
export const place = z.number().int().min(1)

/**
 * What came back of a message, the office's own closed set of meanings
 * (EXT-12, D108, MSG-2), never the peer's events: its receipt; no receipt
 * within its wait (never "not received", MSG-12); a peer that cannot
 * receive it (its node closed the request, refused it as malformed or of a
 * version it does not speak, or its office gave no receipt); called off by
 * her own gesture while it waited, messaging deactivated or withdrawn from
 * the bond (EXT-12).
 */
export const what_came_back = z.enum([
  'the_message_was_received',
  'the_message_had_no_receipt',
  'the_peer_cannot_receive_it',
  'the_message_was_called_off',
])

/** Where a message she wrote stands in the office's record: on its way, or closed with what came back, and when her node learned it. */
export const progress = z.discriminatedUnion('stage', [
  z.strictObject({ stage: z.literal('on_its_way') }),
  z.strictObject({ stage: z.literal('closed'), what_came_back, at: instant }),
])

/** A message she wrote on a bond: its text, when, how long it waits for its receipt. */
export const a_message_written = z.strictObject({
  id: id.message_id,
  bond: id.bond,
  text,
  written_at: instant,
  waits: waiting_time,
})

/**
 * A message she received on a bond, with what her node can tell of it
 * (MSG-6): the bond it came on (the persona `known` itself: the signature
 * valid, the bond known; the bond's mailbox, BND-11), the time the letter
 * declares (a claim, F2) and the instant her node received it (its own
 * clock, F2).
 */
export const a_message_received = z.strictObject({
  id: id.message_id,
  bond: id.bond,
  text,
  declared_at: instant,
  received_at: instant,
})

/** A message filed in its chat, at its place: hers, with where it stands, or theirs. */
export const a_message_in_a_chat = z.discriminatedUnion('whose', [
  z.strictObject({
    whose: z.literal('mine'),
    place,
    message: a_message_written,
    progress,
  }),
  z.strictObject({ whose: z.literal('theirs'), place, message: a_message_received }),
])

/** How far she has read a chat (MSG-7): nothing yet, or up to a message, at its place, and when. */
export const reading = z.discriminatedUnion('read', [
  z.strictObject({ read: z.literal('nothing') }),
  z.strictObject({ read: z.literal('up_to'), message_id: id.message_id, place, at: instant }),
])

/** The folder of a bond's chat in the office: how many messages it has filed, and how far she has read it. */
export const a_chat_s_folder = z.strictObject({
  bond: id.bond,
  filed: z.number().int().min(0),
  reading,
})

/**
 * Where a message she wrote stands, as the chat tells it (MSG-13): on its
 * way; closed with what came back, and when her node learned it; or, its
 * delivery a dead letter of the extension's executor, held, and put aside
 * once she discarded it: not facts of the office (a dead letter is the
 * operator's lane, DOM-14), told on the message from the executor's state.
 */
export const stage = z.discriminatedUnion('stage', [
  z.strictObject({ stage: z.literal('on_its_way') }),
  z.strictObject({ stage: z.literal('delivered'), at: instant }),
  z.strictObject({ stage: z.literal('no_receipt'), at: instant }),
  z.strictObject({ stage: z.literal('could_not_be_delivered'), at: instant }),
  z.strictObject({ stage: z.literal('called_off'), at: instant }),
  z.strictObject({ stage: z.literal('held') }),
  z.strictObject({ stage: z.literal('put_aside') }),
])

/** Whose a message of a chat is: hers, with its stage, or theirs, with the time its letter declares. */
export const whose = z.discriminatedUnion('whose', [
  z.strictObject({ whose: z.literal('mine'), stage }),
  z.strictObject({ whose: z.literal('theirs'), declared_at: instant }),
])

/**
 * A message of a chat, as its read gives it (MSG-7): its place, its text,
 * when her node filed it (written, or received), and whose it is.
 */
export const a_message_of_a_chat = z.strictObject({
  message_id: id.message_id,
  bond: id.bond,
  place,
  text,
  at: instant,
  whose,
})

/**
 * A chat at a glance (MSG-7), for the row of her contacts: its last
 * message, and how many of theirs are to read, those received after the
 * last one she read.
 */
export const a_chat_at_a_glance = z.strictObject({
  bond: id.bond,
  the_last_message: a_message_of_a_chat,
  to_read: z.number().int().min(0),
})
