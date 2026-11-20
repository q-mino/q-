import { z } from 'zod'
import {
  command,
  identity_of,
  pick,
  NOT,
  dsl,
  effect,
  fact,
  id,
  predicate,
  value,
} from './_scope_command.ts'

/** No deposit has the id the operation gives this one. */
export const the_deposit_is_new = NOT(predicate.a_deposit_has_this_id)

/**
 * Anna's phone leaves an envelope on Bruno's D (MBX-1): the relay keeps it,
 * with the time it received it, and waits seven days to throw it away
 * (MBX-2). Its id is the operation's (D75.8): a retry of the deposit is the
 * duplicate branch (DOM-11), the same envelope kept once.
 */
export const deposit_an_envelope = command({
  input: z.strictObject({
    deposit_address: id.deposit_address,
    envelope: value.envelope,
  }),
  outcomes: {
    the_deposit_is_new_so_the_envelope_is_kept: [
      the_deposit_is_new,
      fact.an_envelope_has_been_deposited,
      pick(effect, 'wait_seven_days_from_the_deposit'),
    ],
  },
  creator: (context) => (input) => {
    const deposit_id = identity_of(id.deposit_id)(context.operation)
    return {
      the_deposit_is_new_so_the_envelope_is_kept: [
        { deposit_id: deposit_id },
        {
          new_deposit: {
            id: deposit_id,
            deposit_address: input.deposit_address,
            deposited_at: context.now,
            status: 'kept',
            envelope: input.envelope,
          },
        },
        {
          wait_seven_days_from_the_deposit: {
            id: deposit_id,
            payload: { deposit_id: deposit_id },
            not_before: dsl.seven_days_after(context.now),
          },
        },
      ],
    }
  },
})

/**
 * Seven days after its deposit the relay throws the envelope away, whether
 * its holder collected it or not (MBX-2). Invoked only by the return of the
 * deposit's wait: a redelivery is the duplicate branch, one discard.
 */
export const discard_an_envelope = command({
  input: z.strictObject({
    deposit_id: id.deposit_id,
  }),
  outcomes: {
    the_seven_days_are_over_so_the_envelope_is_discarded: [
      predicate.the_envelope_is_kept,
      fact.an_envelope_has_been_discarded,
    ],
  },
  creator: (context) => (input) => ({
    the_seven_days_are_over_so_the_envelope_is_discarded: [
      { deposit_id: input.deposit_id },
      {
        discarded_deposit: {
          id: input.deposit_id,
          status: 'discarded',
          discarded_at: context.now,
        },
      },
    ],
  }),
})
