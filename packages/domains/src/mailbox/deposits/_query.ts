// generated

// The queries of `mailbox/deposits` from `query.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `query.ts`.

import { z } from 'zod'
import * as query from './query.ts'

/**
 * The envelope was left on the mailbox and is still kept.
 *
 * @see {@link query.the_envelope_is_waiting_in_the_mailbox}
 */
export const the_envelope_is_waiting_in_the_mailbox = query.the_envelope_is_waiting_in_the_mailbox
export type the_envelope_is_waiting_in_the_mailbox = z.output<
  typeof the_envelope_is_waiting_in_the_mailbox
>

/**
 * The envelopes kept on a mailbox, the oldest first; the deposit's id, the
 * entry's identity, closes the order (LIB-9). Collected as a stream from a
 * position (F5, DOM-17): a collect takes nothing away (MBX-3).
 *
 * @see {@link query.the_envelopes_in_a_mailbox}
 */
export const the_envelopes_in_a_mailbox = query.the_envelopes_in_a_mailbox

/**
 * The input of `the_envelopes_in_a_mailbox`, declared inline.
 *
 * @see {@link query.the_envelopes_in_a_mailbox}
 */
export const the_envelopes_in_a_mailbox_input = query.the_envelopes_in_a_mailbox.input
export type the_envelopes_in_a_mailbox_input = z.output<typeof the_envelopes_in_a_mailbox_input>
