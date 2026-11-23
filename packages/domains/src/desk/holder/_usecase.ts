// generated

// The use cases of `desk/holder` from `usecase.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `usecase.ts`.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * Bruno's phone collects his mailbox from where it left off (F5, DOM-17):
 * with no position, the envelopes kept on his D and the position they are
 * at, then each one deposited after it, live; from a position, the stream
 * alone. The phone keeps the last position it read, and compares positions
 * only by order. An envelope discarded after its seven days leaves the
 * mailbox. The address is the one the phone names, and the secret it shows
 * must be that mailbox's: with another one's R, refused.
 *
 * @see {@link usecase.collect_the_envelopes}
 */
export const collect_the_envelopes = usecase.collect_the_envelopes

/**
 * The input of `collect_the_envelopes`, declared inline.
 *
 * @see {@link usecase.collect_the_envelopes}
 */
export const collect_the_envelopes_input = usecase.collect_the_envelopes.input
export type collect_the_envelopes_input = z.output<typeof collect_the_envelopes_input>
