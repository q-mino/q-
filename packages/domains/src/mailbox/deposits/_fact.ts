// generated

// The facts of `mailbox/deposits` from `fact.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `fact.ts`.

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * An envelope has been left on a mailbox (MBX-1): the whole deposit, kept,
 * with the time the relay received it. Carries the change of state (DOM-5,
 * V9); its resources are the deposit and its address (DOM-10).
 *
 * @see {@link fact.an_envelope_has_been_deposited}
 */
export const an_envelope_has_been_deposited =
  fact.an_envelope_has_been_deposited.brand<'mailbox/deposits/fact/an_envelope_has_been_deposited'>()
export type an_envelope_has_been_deposited = z.output<typeof an_envelope_has_been_deposited>

/**
 * Seven days after its deposit the relay has thrown the envelope away,
 * collected or not (MBX-2): a partial value, the deposit's id, its status
 * and when. The envelope is no longer the relay's to keep.
 *
 * @see {@link fact.an_envelope_has_been_discarded}
 */
export const an_envelope_has_been_discarded =
  fact.an_envelope_has_been_discarded.brand<'mailbox/deposits/fact/an_envelope_has_been_discarded'>()
export type an_envelope_has_been_discarded = z.output<typeof an_envelope_has_been_discarded>
