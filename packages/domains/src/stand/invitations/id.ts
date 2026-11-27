import { z } from 'zod'
import { id } from './_scope_id.ts'

// The identities of `invitations`: the values that name an instance (DOM-24).
// Their shape only: the generator brands them with their path in `_id.ts`.

/**
 * A stand of the relay, by its name: `assistente`, the assistant's (INV-1,
 * INV-6). The relay's configuration names the stands it has and their
 * inviters; the office keeps the invitations of any stand named.
 */
export const stand = id({ format: z.string().regex(/^[a-z_]{1,32}$/) })

/**
 * An invitation left on a stand: the one the assistant left at 9:00. Chosen
 * by `invitations` from the operation that leaves it (D75.8, `identity_of`):
 * an inviter names no invitation, and a leave sent again is the same one.
 */
export const invitation_id = id({ format: z.string().min(1) })

/**
 * A take of an invitation: Bea's press of the button at 10:12. Chosen by
 * `invitations` from the take's operation (D75.8), which the page draws at
 * random (INV-3), so that only the one who took the invitation can name its
 * take, and read the ticket it took (INV-3).
 */
export const take_id = id({ format: z.string().min(1) })
