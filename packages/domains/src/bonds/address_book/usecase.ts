import { command_use_case, read_use_case, command, query } from './_scope_usecase.ts'

// The use cases of the address book, its only entry (DOM-2). The user keeps
// her bonds through `self` (step 13); `post` and auth read the bond of a
// letter through their ports (GR-4, GR-6). The faces and the bonds are made
// by the first start and the introduction (step 11.2).

/** The user gives a bond a name of hers. */
export const rename_a_bond = command_use_case({ command: command.rename_a_bond })

/** The user removes a bond from her list. */
export const remove_a_bond = command_use_case({ command: command.remove_a_bond })

/** The user's faces. */
export const my_faces = read_use_case({ query: query.my_faces })

/** The user's list of bonds. */
export const my_bonds = read_use_case({ query: query.my_bonds })

/** A bond of the user's, whole. */
export const a_bond = read_use_case({ query: query.a_bond })

/** The bond a letter came for, by the mailbox of mine it was deposited on. */
export const the_bond_at_my_mailbox = read_use_case({ query: query.the_bond_at_my_mailbox })
