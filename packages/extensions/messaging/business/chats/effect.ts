import { z } from 'zod'
import { effect, id, value } from './_scope_effect.ts'

/**
 * Deliver a message on its bond (F4, MSG-2, MSG-11): a request to the
 * peer's `message` on `known`, its delivery the extension's (`adapter/`),
 * which calls the kernel's port of requests and maps what it answers onto
 * the office's closed set, the input of its return, `close_a_message`. Its
 * key is the message, from which the kernel composes the request's
 * identity (F7: "the identity of the letter is the message id"). Its
 * deliveries are in flight together, none waiting for another's receipt
 * (F7, SC-56): her message to Carla does not wait behind Bruno's, and a dead
 * letter holds none behind it.
 */
export const deliver_a_message = effect({
  payload: z.strictObject({
    message_id: id.message_id,
    bond: id.bond,
    text: value.text,
    waits: value.waiting_time,
  }),
  order: 'any',
})
