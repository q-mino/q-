import * as z from 'zod'
import { the_bond } from './contexts.ts'

// The places the kernel's screens offer an extension point (EXT-16): a
// closed set of the boundary's, versioned with it. In stage 1 `a_bond`, the
// screen of a bond, and `the_extension`, its own screen from the list of the
// extensions; with messaging (MSG-15, K-13) `a_bond_in_my_contacts`, the row
// of a bond in her contacts, the home. Each has its data: what an action
// gives the leaf it invokes as its input, and what a part placed there is
// told.

/**
 * A place of the kernel's screens (EXT-16). `a_bond_in_my_contacts` [Q, C,
 * high impact: A to discuss] (26–27 Nov 2026, part M4 of messaging; MSG-15):
 * the row of a bond in her contacts, told the bond as `a_bond` is, so that
 * what is new on a bond is seen from the home (UI-5). Rejected: what is new
 * drawn by the kernel from an extension's read (a vocabulary of the
 * kernel's for one extension's data, EXT-16's discarded form).
 */
export const place = z.enum(['a_bond', 'a_bond_in_my_contacts', 'the_extension'])
export type place = z.output<typeof place>

/**
 * The places an action is drawn in (EXT-16): a bond's screen and the
 * extension's own, not a row of her contacts [Q, C, high impact: A to
 * discuss] (part M4): a row holds slots only, compact, its own gesture the
 * kernel's (to the contact), so that the home does not grow a gesture of
 * every extension on every row. Rejected: an action on every row (the home
 * a wall of extensions' gestures, each tap one she could take for the
 * row's); a check at composition (the manifest would parse and still not
 * compose: the schema says it once).
 */
export const a_place_of_an_action = z.enum(['a_bond', 'the_extension'])
export type a_place_of_an_action = z.output<typeof a_place_of_an_action>

/** Each place's data (EXT-16): on a bond, on its screen or on its row, the bond (`{ bond }`); on the extension's own screen, nothing. */
export const the_data_of_a_place = {
  a_bond: the_bond,
  a_bond_in_my_contacts: the_bond,
  the_extension: z.strictObject({}),
} as const satisfies Readonly<Record<place, z.ZodType>>

/** A place with its data, an ADT by place: what the kernel tells a part it placed (EXT-2, EXT-16). */
export const a_place_with_its_data = z.discriminatedUnion('place', [
  z.strictObject({ place: z.literal('a_bond'), data: the_data_of_a_place.a_bond }),
  z.strictObject({
    place: z.literal('a_bond_in_my_contacts'),
    data: the_data_of_a_place.a_bond_in_my_contacts,
  }),
  z.strictObject({ place: z.literal('the_extension'), data: the_data_of_a_place.the_extension }),
])
export type a_place_with_its_data = z.output<typeof a_place_with_its_data>
