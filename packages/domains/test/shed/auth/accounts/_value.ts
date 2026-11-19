// generated

// The values of `auth/accounts` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * The hats an account or a key may wear. Anyone wears `visitor`, which has
 * no node to verify it (PER-7); only a key the shed gave a workshop wears
 * `workshop` (SC-34).
 *
 * @see {@link value.hat}
 */
export const hat = value.hat
export type hat = z.output<typeof hat>

/**
 * The hats of one account: Giorgio keeps the shed and borrows from it.
 *
 * @see {@link value.hats}
 */
export const hats = value.hats
export type hats = z.output<typeof hats>

/**
 * A member card: its number and the last day it is valid.
 *
 * @see {@link value.member_card}
 */
export const member_card = value.member_card
export type member_card = z.output<typeof member_card>
