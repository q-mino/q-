// q-'s oracle (TST-2, V10, MBX-7): the in-memory state adapter of the
// kernel's domains, one module per domain, over one cell; the reference
// interpreter the other adapters are compared with. Since part 8.2 the
// relay's, `mailbox`; since part 9.2 the safe's, `seals`; since part 11.3 the
// address book's, `bonds`, beside the safe's in the phone's cell; since part
// 10.2 the requests of `post`, likewise; since part 12.4 the extensions'
// partitions and the transport of an extension in process, and the
// kernel's office of the extensions, `extensions`, beside the address book.
// Since part 15.2 the user domain's offices, `user`, beside the kernel's.
// Since part B4 of the assistant the relay's stand, `stand`, beside `mailbox`.

export { cell, position_at, seen_by } from './cell.ts'
export type { Cell, CommandCell, Made, Making, ReadCell, Recorded, Step } from './cell.ts'
export { compare_values, log } from './interpreter.ts'
export type { Strategy } from './interpreter.ts'
export { mailbox_ports, no_deposit } from './mailbox.ts'
export type { MailboxState } from './mailbox.ts'
export { no_invitation, stand_ports } from './stand.ts'
export type { StandState } from './stand.ts'
export { no_secret, seals_ports } from './seals.ts'
export type { SealsState } from './seals.ts'
export { bonds_ports, no_bond } from './bonds.ts'
export type { BondsState, Ticket } from './bonds.ts'
export { no_request, post_ports } from './post.ts'
export { extensions_ports, no_activation } from './extensions.ts'
export type { AnInstalledExtension, ExtensionsState } from './extensions.ts'
export type { PostState } from './post.ts'
export { partitions } from './partitions.ts'
export type { Partitions } from './partitions.ts'
export { nothing_asked, user_ports } from './user.ts'
export type { UserState } from './user.ts'
