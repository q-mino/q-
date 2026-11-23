import { z } from 'zod'
import { id } from './_scope_value.ts'

// The values of `greetings` (EXT-12): the words of a greeting, how long it
// waits for its greeting back, the closed set of what comes back, and the
// office's records of the greetings it sent and those it returned.

/** The words of a greeting, as a face writes them: what the peer's user reads. */
export const words = z.string().min(1).max(280)

/**
 * How long a greeting waits for its greeting back, in seconds (F7, EXT-12):
 * a value of the business, at most the seven days a relay keeps a letter
 * (MBX-2).
 */
export const waiting_time = z.number().int().min(1).max(604_800)

/**
 * What came back of a greeting, the business's own closed set of meanings
 * (EXT-12, D108), never the peer's events: its greeting back, with its
 * words; no response within its time; a peer that cannot answer it (its
 * node closed the request, or refused it as malformed or of a version it
 * does not speak); called off by the user's own gesture, the extension
 * deactivated or withdrawn from the bond while it waited (EXT-12, F7).
 */
export const outcome = z.discriminatedUnion('outcome', [
  z.strictObject({ outcome: z.literal('the_greeting_came_back'), words }),
  z.strictObject({ outcome: z.literal('the_greeting_had_no_response') }),
  z.strictObject({ outcome: z.literal('the_peer_cannot_answer') }),
  z.strictObject({ outcome: z.literal('the_greeting_was_called_off') }),
])

/** Where a greeting the node sent stands: waiting for what comes back, or closed with it. */
export const progress = z.discriminatedUnion('stage', [
  z.strictObject({ stage: z.literal('waiting') }),
  z.strictObject({ stage: z.literal('closed'), outcome }),
])

/** A greeting the node sent to a bond, with its words and where it stands. */
export const greeting = z.strictObject({
  id: id.greeting_id,
  bond: id.bond,
  words,
  progress,
})

/** A greeting back the node sent to a bond that greeted it: their words and its own. */
export const greeting_back = z.strictObject({
  id: id.greeting_back_id,
  bond: id.bond,
  their_words: words,
  words,
})
