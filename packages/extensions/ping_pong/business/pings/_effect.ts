// generated

// The effects of `business/pings` from `effect.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `effect.ts`.

import { z } from 'zod'
import * as effect from './effect.ts'

/**
 * Ask the bond for a pong (EXT-12, F7): a request to the peer's `ping` on
 * `known`, its delivery the extension's (`adapter/`), which calls the
 * kernel's port of requests and maps what it answers onto the business's
 * closed set, the input of its return, `close_a_ping`. Its key is the
 * ping. Its deliveries are in flight together, none waiting for another's
 * response (F7, SC-56): Carla's ping does not wait behind Bruno's, and a
 * dead letter holds none behind it.
 *
 * @see {@link effect.ask_for_a_pong}
 */
export const ask_for_a_pong = effect.ask_for_a_pong.brand<'business/pings/effect/ask_for_a_pong'>()
export type ask_for_a_pong = z.output<typeof ask_for_a_pong>
