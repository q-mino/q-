// generated

// The identities of `business/loans` from `id.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `id.ts`.

import { z } from 'zod'
import * as id from './id.ts'

/**
 * @see {@link id.loan_id}
 */
export const loan_id = id.loan_id.brand<'business/loans/id/loan_id'>()
export type loan_id = z.output<typeof loan_id>

/**
 * A member of the shed. Who may act as one is the persona's (step 6), not this domain's.
 *
 * @see {@link id.member_id}
 */
export const member_id = id.member_id.brand<'business/loans/id/member_id'>()
export type member_id = z.output<typeof member_id>

/**
 * @see {@link id.reservation_id}
 */
export const reservation_id = id.reservation_id.brand<'business/loans/id/reservation_id'>()
export type reservation_id = z.output<typeof reservation_id>
