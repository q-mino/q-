import { z } from 'zod'
import { id } from './_scope_value.ts'

// The values of `pings` (PNG-1, PNG-2, EXT-12; part 14.1): how long a ping
// waits for its pong, the closed set of what comes back, and the office's
// records of the pings it sent and of the pongs it gave back.

/**
 * An instant, as the node's clock tells it to the office: ISO 8601 in UTC,
 * to the millisecond (`2026-11-20T09:00:00.000Z`), as the library's
 * `date_time` (A, 23 Nov 2026): it tells no zone.
 */
export const instant = z.iso.datetime({ precision: 3 })

/**
 * How long a ping waits for its pong, in seconds (F7, EXT-12): a value of
 * the business, at most the seven days a relay keeps a letter (MBX-2).
 */
export const waiting_time = z.number().int().min(1).max(604_800)

/**
 * What came back of a ping, the business's own closed set of meanings
 * (EXT-12, D108), never the peer's events: its pong; no response within its
 * time; a peer that cannot answer it (its node closed the request, refused
 * it as malformed or of a version it does not speak, or its office gave no
 * pong); called off by the user's own gesture while it waited, ping pong
 * deactivated or withdrawn from the bond (EXT-12, F7; A, 21 Nov 2026).
 */
export const what_came_back = z.enum([
  'the_pong_came_back',
  'the_ping_had_no_response',
  'the_peer_cannot_answer',
  'the_ping_was_called_off',
])

/** Where a ping the node sent stands: waiting for what comes back, or closed with it, and when. */
export const progress = z.discriminatedUnion('stage', [
  z.strictObject({ stage: z.literal('waiting') }),
  z.strictObject({ stage: z.literal('closed'), what_came_back, at: instant }),
])

/** A ping the node sent to a bond: when it was sent, how long it waits, where it stands. */
export const ping = z.strictObject({
  id: id.ping_id,
  bond: id.bond,
  sent_at: instant,
  waits: waiting_time,
  progress,
})

/** A pong the node gave back to a bond that pinged it, and when. */
export const pong = z.strictObject({
  id: id.pong_id,
  bond: id.bond,
  at: instant,
})
