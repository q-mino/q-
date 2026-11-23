import { z } from 'zod'
import { effect, id, value } from './_scope_effect.ts'

/**
 * Ask the bond for a pong (EXT-12, F7): a request to the peer's `ping` on
 * `known`, its delivery the extension's (`adapter/`), which calls the
 * kernel's port of requests and maps what it answers onto the business's
 * closed set, the input of its return, `close_a_ping`. Its key is the
 * ping. Its deliveries are in flight together, none waiting for another's
 * response (F7, SC-56): Carla's ping does not wait behind Bruno's, and a
 * dead letter holds none behind it.
 */
export const ask_for_a_pong = effect({
  payload: z.strictObject({
    ping_id: id.ping_id,
    bond: id.bond,
    waits: value.waiting_time,
  }),
  order: 'any',
})
