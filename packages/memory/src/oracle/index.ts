// q-'s oracle (TST-2, V10, MBX-7): the in-memory state adapter of the
// kernel's domains, one module per domain, over one cell; the reference
// interpreter the other adapters are compared with. Since part 8.2 the
// relay's, `mailbox`; since part 9.2 the safe's, `seals`; since part 11.3 the
// address book's, `bonds`, beside the safe's in the phone's cell; since part
// 10.2 the requests of `post`, likewise.

export { cell, position_at, seen_by } from './cell.ts'
export type { Cell, CommandCell, Made, Making, ReadCell, Recorded, Step } from './cell.ts'
export { compare_values, log } from './interpreter.ts'
export type { Strategy } from './interpreter.ts'
export { mailbox_ports, no_deposit } from './mailbox.ts'
export type { MailboxState } from './mailbox.ts'
export { no_secret, seals_ports } from './seals.ts'
export type { SealsState } from './seals.ts'
export { bonds_ports, no_bond } from './bonds.ts'
export type { BondsState, Ticket } from './bonds.ts'
export { no_request, post_ports } from './post.ts'
export type { PostState } from './post.ts'
