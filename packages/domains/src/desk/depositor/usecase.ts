import { z } from 'zod'
import { command_use_case_over, value, deposits } from './_scope_usecase.ts'
import * as zz from '../../library/index.ts'

// The use cases of `depositor`, the leaves of its tree (PER-6, PER-19):
// whoever leaves an envelope at the relay, anyone, with no credential. The
// relay knows no sender (F2): the depositor is told only that the envelope
// is kept, and when the relay received it.

/**
 * Anna's phone leaves its letter to Bruno on his D, which their bond gave
 * it: the relay keeps it seven days, and says when it received it. A retry
 * of the same deposit is told the same (DOM-11).
 */
export const deposit_an_envelope = command_use_case_over({
  use_case: deposits.usecase.deposit_an_envelope,
  input: z.strictObject({
    deposit_address: deposits.id.deposit_address,
    envelope: value.envelope,
  }),
  creator: () => (input) => ({
    deposit_address: input.deposit_address,
    envelope: input.envelope,
  }),
  events: {
    the_envelope_is_kept: z.strictObject({ deposited_at: zz.date_time }),
    /** Never in a sound relay: the operation's deposit is new by construction (D75.8). */
    the_envelope_is_not_kept: z.strictObject({}),
  },
  projection: {
    the_deposit_is_new_so_the_envelope_is_kept: (fact) => ({
      event: 'the_envelope_is_kept',
      payload: { deposited_at: fact.new_deposit.deposited_at },
    }),
    rejected: () => ({ event: 'the_envelope_is_not_kept', payload: {} }),
  },
})
