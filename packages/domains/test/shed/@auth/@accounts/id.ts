import { z } from 'zod'
import * as wlib from '../../wlib.ts'

// The identities of `accounts`, auth's (D35, D43): who signs in, and the
// member cards. No business domain knows them (PER-10): a persona reads them
// through the lookups and gives the business the values it asks (D33).

/** Who signs in: the id of the `Caller`, from verified credentials (PER-4). */
export const account_id = wlib.id({ format: z.string().min(1) })

/**
 * An anonymous session: the id of the `Caller` who has not signed in (D78.7,
 * PER-4). Who wears `visitor` with it is a visitor, and nothing more.
 */
export const session_id = wlib.id({ format: z.string().min(1) })

/**
 * A member card of the shed, a value of the hat `member` (PER-1). The persona
 * gives its number to `loans`, as the member of a loan (D33).
 */
export const card_id = wlib.id({ format: z.string().min(1) })
