// generated

// The effects of `business/chats` from `effect.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `effect.ts`.

import { z } from 'zod'
import * as effect from './effect.ts'

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
 *
 * @see {@link effect.deliver_a_message}
 */
export const deliver_a_message =
  effect.deliver_a_message.brand<'business/chats/effect/deliver_a_message'>()
export type deliver_a_message = z.output<typeof deliver_a_message>
