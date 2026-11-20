import { z } from 'zod'
import { effect, id, value } from './_scope_effect.ts'

/**
 * Ask the bond for a greeting back (EXT-12, F7): a request to the peer's
 * `greet` on `known`, its delivery the extension's (`adapter/`), which
 * calls the kernel's port of requests and maps what it answers onto the
 * business's closed set, the input of its return, `close_a_greeting`. Its
 * key is the greeting. Its deliveries are in flight together, none waiting
 * for another's response (F7, SC-56): a dead letter holds none behind it.
 */
export const ask_for_a_greeting_back = effect({
  payload: z.strictObject({
    greeting_id: id.greeting_id,
    bond: id.bond,
    words: value.words,
    waits: value.waiting_time,
  }),
  order: 'any',
})
