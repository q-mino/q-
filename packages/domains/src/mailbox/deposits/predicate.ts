import { z } from 'zod'
import { predicate, id } from './_scope_predicate.ts'

// The vocabulary of the conditions. A predicate declares its parameters;
// its value is the adapters', helped by dsl.ts.

/** A deposit with this id is in the relay's hands, kept or discarded. */
export const a_deposit_has_this_id = predicate({
  parameters: z.strictObject({
    deposit_id: id.deposit_id,
  }),
})

/** The envelope of this deposit is still on its mailbox: its seven days are running. */
export const the_envelope_is_kept = predicate({
  parameters: z.strictObject({
    deposit_id: id.deposit_id,
  }),
})
