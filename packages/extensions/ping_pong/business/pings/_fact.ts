// generated

// The facts of `business/pings` from `fact.ts` (DOM-25): the same objects under
// the same names, branded with their path (DOM-24), each schema with its output
// type under the same name, so that one import gives both. Only this module
// imports `fact.ts`.

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * A ping has been sent to a bond (F7): waiting for its pong.
 *
 * @see {@link fact.a_ping_has_been_sent}
 */
export const a_ping_has_been_sent =
  fact.a_ping_has_been_sent.brand<'business/pings/fact/a_ping_has_been_sent'>()
export type a_ping_has_been_sent = z.output<typeof a_ping_has_been_sent>

/**
 * The pong of a ping has been received: the bond answered, within the ping's time.
 *
 * @see {@link fact.a_pong_has_been_received}
 */
export const a_pong_has_been_received =
  fact.a_pong_has_been_received.brand<'business/pings/fact/a_pong_has_been_received'>()
export type a_pong_has_been_received = z.output<typeof a_pong_has_been_received>

/**
 * A ping has had no response within its time: the bond's node was off, did not have ping pong for it, or a letter was lost (F8).
 *
 * @see {@link fact.a_ping_has_had_no_response}
 */
export const a_ping_has_had_no_response =
  fact.a_ping_has_had_no_response.brand<'business/pings/fact/a_ping_has_had_no_response'>()
export type a_ping_has_had_no_response = z.output<typeof a_ping_has_had_no_response>

/**
 * A ping could not be answered: the bond's node answered with no pong (it does not know the bond, or speaks no version of the ping).
 *
 * @see {@link fact.a_ping_could_not_be_answered}
 */
export const a_ping_could_not_be_answered =
  fact.a_ping_could_not_be_answered.brand<'business/pings/fact/a_ping_could_not_be_answered'>()
export type a_ping_could_not_be_answered = z.output<typeof a_ping_could_not_be_answered>

/**
 * A ping has been called off: the user deactivated ping pong, or withdrew it from the bond, while it waited (EXT-12, F7).
 *
 * @see {@link fact.a_ping_has_been_called_off}
 */
export const a_ping_has_been_called_off =
  fact.a_ping_has_been_called_off.brand<'business/pings/fact/a_ping_has_been_called_off'>()
export type a_ping_has_been_called_off = z.output<typeof a_ping_has_been_called_off>

/**
 * A bond's ping has been answered with a pong.
 *
 * @see {@link fact.a_ping_has_been_answered}
 */
export const a_ping_has_been_answered =
  fact.a_ping_has_been_answered.brand<'business/pings/fact/a_ping_has_been_answered'>()
export type a_ping_has_been_answered = z.output<typeof a_ping_has_been_answered>
