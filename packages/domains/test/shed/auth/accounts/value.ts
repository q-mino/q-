import { z } from 'zod'
import * as wlib from '../../../../src/library/index.ts'
import { id } from './_scope_value.ts'

// The values of `accounts`: the hats an account may wear and the values of
// the hats that have some (PER-1, PER-7). Data, never decisions (PER-9).

/**
 * The hats an account or a key may wear. Anyone wears `visitor`, which has
 * no node to verify it (PER-7); only a key the shed gave a workshop wears
 * `workshop` (SC-34).
 */
export const hat = z.enum(['member', 'keeper', 'workshop'])

/** The hats of one account: Giorgio keeps the shed and borrows from it. */
export const hats = z.array(hat).readonly()

/** A member card: its number and the last day it is valid. */
export const member_card = z.strictObject({
  id: id.card_id,
  valid_until: wlib.day,
})
