// The address book's pure functions over its values (DOM-5), added at need:
// usable by the adapters, the interface and the client.

import type { value } from './_scope_dsl.ts'

/** A face with this id is in the address book, being made or made. */
export const a_face_is_there = (the_face: value.face | undefined): the_face is value.face =>
  the_face !== undefined

/** The face is made: it has its public key. */
export const the_face_is_made = (the_face: value.face | undefined): boolean =>
  the_face?.status === 'made'

/** A bond with this id is in the address book, kept or removed. */
export const a_bond_is_there = (the_bond: value.bond | undefined): the_bond is value.bond =>
  the_bond !== undefined

/** The bond is in the user's list. */
export const the_bond_is_kept = (the_bond: value.bond | undefined): boolean =>
  the_bond?.status === 'kept'

/** The user removed the bond. */
export const the_bond_is_removed = (the_bond: value.bond | undefined): boolean =>
  the_bond?.status === 'removed'
