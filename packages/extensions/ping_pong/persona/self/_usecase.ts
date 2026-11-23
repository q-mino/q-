// generated

// The use cases of `persona/self` from `usecase.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `usecase.ts`.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * Anna taps "Ping" on the screen of her bond with Bruno (PNG-4, EXT-16):
 * the action invokes this leaf with the place's data, the bond, and her
 * ping goes. Her screen follows it to what comes back (DOM-3, F7): Bruno's
 * pong, no response within its time, a peer that cannot answer, or her
 * own calling off (ping pong deactivated or withdrawn from the bond while
 * it waited), each a fact the return records with the correlation of her
 * ping; or, 70 seconds after her tap, the wait over, which records nothing
 * (the ping's own 60 seconds and the executor's delivery before them).
 * A flaw, declared (PNG-4): the ping's 60 seconds run from its delivery, so
 * an outcome later than the 70 (a slow delivery, the app closed or asleep,
 * with no push) is recorded but shown on no screen, until the slot of a
 * bond's pings.
 *
 * @see {@link usecase.send_a_ping}
 */
export const send_a_ping = usecase.send_a_ping

/**
 * The input of `send_a_ping`, declared inline.
 *
 * @see {@link usecase.send_a_ping}
 */
export const send_a_ping_input = usecase.send_a_ping.input
export type send_a_ping_input = z.output<typeof send_a_ping_input>
