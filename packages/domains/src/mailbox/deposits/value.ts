import { z } from 'zod'
import { date_time } from '../../library/index.ts'
import { id } from './_scope_value.ts'

/**
 * An envelope as the relay keeps it: sealed, so opaque to it (F2), in
 * base64url, at most 64 KiB once decoded (87 382 characters). The relay
 * neither opens it nor reads who sent it.
 */
export const envelope = z
  .string()
  .regex(/^[A-Za-z0-9_-]+$/)
  .max(87_382)

/** Kept, the holder collects it; discarded, seven days after its deposit, for good (MBX-2). */
export const deposit_status = z.enum(['kept', 'discarded'])

/** A field a state does not have: in the type, `?: undefined`; in the data, absent. */
const absent = z.undefined().optional()

/** Every field of every state of a deposit. Not a state: each state subtracts from it. */
const every_deposit_field = z.strictObject({
  id: id.deposit_id,
  deposit_address: id.deposit_address,
  deposited_at: date_time,
  status: deposit_status,
  envelope: envelope,
  discarded_at: date_time,
})

/** An envelope on its mailbox, as the relay received it, at the time it received it, by its clock. */
export const kept_deposit = every_deposit_field.extend({
  status: z.literal(deposit_status.enum.kept),
  discarded_at: absent,
})

/** An envelope the relay threw away: what is left of the deposit, its envelope gone. */
export const discarded_deposit = every_deposit_field.extend({
  status: z.literal(deposit_status.enum.discarded),
  envelope: absent,
})

/** A deposit on a mailbox: its states share every field, so any field reads without narrowing. */
export const deposit = z.discriminatedUnion('status', [kept_deposit, discarded_deposit])

/** What the holder collects of a deposit: which one, when the relay received it, and the envelope. */
export const collected_envelope = kept_deposit.pick({
  id: true,
  deposited_at: true,
  envelope: true,
})
