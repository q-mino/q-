// generated

// The use cases of `business/pings` from `usecase.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `usecase.ts`.

import * as usecase from './usecase.ts'

/**
 * A ping is sent to a bond, and the bond asked for a pong.
 *
 * @see {@link usecase.send_a_ping}
 */
export const send_a_ping = usecase.send_a_ping

/**
 * A ping is closed with what came back: the return of the request.
 *
 * @see {@link usecase.close_a_ping}
 */
export const close_a_ping = usecase.close_a_ping

/**
 * A bond's ping is answered with a pong.
 *
 * @see {@link usecase.answer_a_ping}
 */
export const answer_a_ping = usecase.answer_a_ping
