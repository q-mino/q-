// generated

// The predicates of `bonds/address_book` from `predicate.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `predicate.ts`.

import { z } from 'zod'
import * as predicate from './predicate.ts'

/**
 * A face with this id is in the address book, being made or made.
 *
 * @see {@link predicate.a_face_has_this_id}
 */
export const a_face_has_this_id =
  predicate.a_face_has_this_id.brand<'bonds/address_book/predicate/a_face_has_this_id'>()
export type a_face_has_this_id = z.output<typeof a_face_has_this_id>

/**
 * This face is made: it has its public key, and can be bonded (BND-1).
 *
 * @see {@link predicate.the_face_is_made}
 */
export const the_face_is_made =
  predicate.the_face_is_made.brand<'bonds/address_book/predicate/the_face_is_made'>()
export type the_face_is_made = z.output<typeof the_face_is_made>

/**
 * A bond with this id is in the address book, kept or removed.
 *
 * @see {@link predicate.a_bond_has_this_id}
 */
export const a_bond_has_this_id =
  predicate.a_bond_has_this_id.brand<'bonds/address_book/predicate/a_bond_has_this_id'>()
export type a_bond_has_this_id = z.output<typeof a_bond_has_this_id>

/**
 * This bond is in the user's list.
 *
 * @see {@link predicate.the_bond_is_kept}
 */
export const the_bond_is_kept =
  predicate.the_bond_is_kept.brand<'bonds/address_book/predicate/the_bond_is_kept'>()
export type the_bond_is_kept = z.output<typeof the_bond_is_kept>

/**
 * The user removed this bond.
 *
 * @see {@link predicate.the_bond_is_removed}
 */
export const the_bond_is_removed =
  predicate.the_bond_is_removed.brand<'bonds/address_book/predicate/the_bond_is_removed'>()
export type the_bond_is_removed = z.output<typeof the_bond_is_removed>
