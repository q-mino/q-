import { z } from 'zod'
import { predicate, id } from './_scope_predicate.ts'

// The vocabulary of the conditions. A predicate declares its parameters;
// its value is the adapters', helped by dsl.ts.

/** A face with this id is in the address book, being made or made. */
export const a_face_has_this_id = predicate({
  parameters: z.strictObject({
    face_id: id.face_id,
  }),
})

/** This face is made: it has its public key, and can be bonded (BND-1). */
export const the_face_is_made = predicate({
  parameters: z.strictObject({
    face_id: id.face_id,
  }),
})

/** A bond with this id is in the address book, kept or removed. */
export const a_bond_has_this_id = predicate({
  parameters: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/** This bond is in the user's list. */
export const the_bond_is_kept = predicate({
  parameters: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/** The user removed this bond. */
export const the_bond_is_removed = predicate({
  parameters: z.strictObject({
    bond_id: id.bond_id,
  }),
})
