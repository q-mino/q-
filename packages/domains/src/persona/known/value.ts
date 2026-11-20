import { z } from 'zod'
import { activations } from './_scope_value.ts'

// The values of `known`, the kernel's part, in a bonded face's words (GR-3):
// its own, even where they match the office of the extensions', so that its
// surface stays when the office changes (PER-17).

/** A major of an extension's surface on `known` (PER-17). */
export const major = z.number().int().min(0).max(65_535)

/** The majors of an extension's surface on `known`. */
export const majors = z.array(major).max(64)

/** An extension a side offers the other, with the majors of its surface on `known`: greetings, at major 1. */
export const offered_extension = z.strictObject({
  extension: activations.id.extension_name,
  majors: majors,
})

/** The extensions the asker says its node offers (EXT-8): a claim (F2), each named once. */
export const offered_extensions = z
  .array(offered_extension)
  .max(64)
  .refine(
    (offered) => new Set(offered.map((each) => each.extension)).size === offered.length,
    'an extension named twice',
  )
