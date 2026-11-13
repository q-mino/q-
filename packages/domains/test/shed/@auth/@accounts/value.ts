import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import { card_id } from './_id.ts'

// The values of `accounts`: the hats an account may wear and the values of
// the hats that have some (PER-1, PER-7). Data, never decisions (PER-9).

/** The hats an account may wear. Anyone wears `visitor`, which has no node to verify it (PER-7). */
export const hat = z.enum(['member', 'keeper'])

/** The hats of one account: Giorgio keeps the shed and borrows from it. */
export const hats = z.array(hat).readonly()

/** A member card: its number and the last day it is valid. */
export const member_card = z.strictObject({
  id: card_id,
  valid_until: wlib.day,
})
