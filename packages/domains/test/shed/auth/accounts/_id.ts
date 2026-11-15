// generated

// The identities of `accounts`, branded with their path (DOM-24).

import { z } from 'zod'
import * as id from './id.ts'

/**
 * Who signs in: the id of the `Caller`, from verified credentials (PER-4).
 *
 * @see {@link id.account_id}
 */
export const account_id = id.account_id.brand<'auth/accounts/id/account_id'>()
export type account_id = z.output<typeof account_id>

/**
 * An anonymous session: the id of the `Caller` who has not signed in (D78.7,
 * PER-4). Who wears `visitor` with it is a visitor, and nothing more.
 *
 * @see {@link id.session_id}
 */
export const session_id = id.session_id.brand<'auth/accounts/id/session_id'>()
export type session_id = z.output<typeof session_id>

/**
 * A member card of the shed, a value of the hat `member` (PER-1). The persona
 * gives its number to `loans`, as the member of a loan (D33).
 *
 * @see {@link id.card_id}
 */
export const card_id = id.card_id.brand<'auth/accounts/id/card_id'>()
export type card_id = z.output<typeof card_id>
