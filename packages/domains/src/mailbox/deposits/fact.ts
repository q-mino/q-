import { z } from 'zod'
import { fact, value } from './_scope_fact.ts'

/**
 * An envelope has been left on a mailbox (MBX-1): the whole deposit, kept,
 * with the time the relay received it. Carries the change of state (DOM-5,
 * V9); its resources are the deposit and its address (DOM-10).
 */
export const an_envelope_has_been_deposited = fact({
  payload: z.strictObject({
    new_deposit: value.kept_deposit,
  }),
})

/**
 * Seven days after its deposit the relay has thrown the envelope away,
 * collected or not (MBX-2): a partial value, the deposit's id, its status
 * and when. The envelope is no longer the relay's to keep.
 */
export const an_envelope_has_been_discarded = fact({
  payload: z.strictObject({
    discarded_deposit: value.discarded_deposit.pick({ id: true, status: true, discarded_at: true }),
  }),
})
