// generated

// The commands of `mailbox/deposits` from `command.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `command.ts`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * No deposit has the id the operation gives this one.
 *
 * @see {@link command.the_deposit_is_new}
 */
export const the_deposit_is_new = command.the_deposit_is_new
export type the_deposit_is_new = z.output<typeof the_deposit_is_new>

/**
 * Anna's phone leaves an envelope on Bruno's D (MBX-1): the relay keeps it,
 * with the time it received it, and waits seven days to throw it away
 * (MBX-2). Its id is the operation's (D75.8): a retry of the deposit is the
 * duplicate branch (DOM-11), the same envelope kept once.
 *
 * @see {@link command.deposit_an_envelope}
 */
export const deposit_an_envelope = command.deposit_an_envelope

/**
 * The input of `deposit_an_envelope`, declared inline.
 *
 * @see {@link command.deposit_an_envelope}
 */
export const deposit_an_envelope_input = command.deposit_an_envelope.input
export type deposit_an_envelope_input = z.output<typeof deposit_an_envelope_input>

/**
 * Seven days after its deposit the relay throws the envelope away, whether
 * its holder collected it or not (MBX-2). Invoked only by the return of the
 * deposit's wait: a redelivery is the duplicate branch, one discard.
 *
 * @see {@link command.discard_an_envelope}
 */
export const discard_an_envelope = command.discard_an_envelope

/**
 * The input of `discard_an_envelope`, declared inline.
 *
 * @see {@link command.discard_an_envelope}
 */
export const discard_an_envelope_input = command.discard_an_envelope.input
export type discard_an_envelope_input = z.output<typeof discard_an_envelope_input>
