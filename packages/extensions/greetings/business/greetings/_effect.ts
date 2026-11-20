// generated

// The effects of `business/greetings` from `effect.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `effect.ts`.

import { z } from 'zod'
import * as effect from './effect.ts'

/**
 * Ask the bond for a greeting back (EXT-12, F7): a request to the peer's
 * `greet` on `known`, its delivery the extension's (`adapter/`), which
 * calls the kernel's port of requests and maps what it answers onto the
 * business's closed set, the input of its return, `close_a_greeting`. Its
 * key is the greeting. Its deliveries are in flight together, none waiting
 * for another's response (F7, SC-56): a dead letter holds none behind it.
 *
 * @see {@link effect.ask_for_a_greeting_back}
 */
export const ask_for_a_greeting_back =
  effect.ask_for_a_greeting_back.brand<'business/greetings/effect/ask_for_a_greeting_back'>()
export type ask_for_a_greeting_back = z.output<typeof ask_for_a_greeting_back>
