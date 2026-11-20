import { command_use_case, read_use_case, command, effect, query } from './_scope_usecase.ts'

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

/** The user's first start makes her first face. */
export const make_my_first_face = command_use_case({ command: command.make_my_first_face })

/** The address book keeps the key the safe made for a face: by a reaction. */
export const keep_the_key_of_a_face = command_use_case({ command: command.keep_the_key_of_a_face })

/** The user asks for a ticket, to show, to send, or to present. */
export const prepare_a_ticket = command_use_case({ command: command.prepare_a_ticket })

/** The address book keeps the D the safe drew for a ticket's mailbox: by a reaction. */
export const keep_the_mailbox_of_a_ticket = command_use_case({
  command: command.keep_the_mailbox_of_a_ticket,
})

/** 48 hours on, the effect executor comes back: the ticket expires if unused. */
export const let_a_ticket_expire = command_use_case({
  command: command.let_a_ticket_expire,
  returns_from: effect.wait_until_the_ticket_expires,
})

/** The user opens a ticket of someone else's, presenting one of hers. */
export const open_their_ticket = command_use_case({ command: command.open_their_ticket })

/** The node takes an introduction to a ticket of its user's. */
export const accept_their_introduction = command_use_case({
  command: command.accept_their_introduction,
})

/** A ticket of the user's, to show. */
export const my_ticket = read_use_case({ query: query.my_ticket })

/** The ticket an introduction came for, by the mailbox it was deposited on. */
export const the_ticket_at_my_mailbox = read_use_case({ query: query.the_ticket_at_my_mailbox })

/** The mailboxes the phone collects from. */
export const the_mailboxes_i_collect = read_use_case({ query: query.the_mailboxes_i_collect })
