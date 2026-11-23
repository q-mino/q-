import * as z from 'zod'
import { the_bond } from './contexts.ts'

// The places the kernel's screens offer an extension point (EXT-16): a
// closed set of the boundary's, versioned with it. In stage 1 `a_bond`, the
// screen of a bond, and `the_extension`, its own screen from the list of the
// extensions. Each has its data: what an action gives the leaf it invokes as
// its input, and what a frame placed there is told.

/** A place of the kernel's screens (EXT-16). */
export const place = z.enum(['a_bond', 'the_extension'])
export type place = z.output<typeof place>

/** Each place's data (EXT-16): on a bond, the bond (`{ bond }`); on the extension's own screen, nothing. */
export const the_data_of_a_place = {
  a_bond: the_bond,
  the_extension: z.strictObject({}),
} as const satisfies Readonly<Record<place, z.ZodType>>

/** A place with its data, an ADT by place: what the kernel tells a frame it placed (EXT-2, EXT-16). */
export const a_place_with_its_data = z.discriminatedUnion('place', [
  z.strictObject({ place: z.literal('a_bond'), data: the_data_of_a_place.a_bond }),
  z.strictObject({ place: z.literal('the_extension'), data: the_data_of_a_place.the_extension }),
])
export type a_place_with_its_data = z.output<typeof a_place_with_its_data>
