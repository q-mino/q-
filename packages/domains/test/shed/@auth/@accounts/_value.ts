// generated

// The value schemas of `accounts` under their names, with their output types
// under the same names: one import gives both.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * The hats an account may wear. Who may wear `visitor` is the interface's (step 6).
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
