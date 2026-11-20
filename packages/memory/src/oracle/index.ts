// q-'s oracle (TST-2, V10, MBX-7): the in-memory state adapter of the
// kernel's domains, one module per domain, over one cell; the reference
// interpreter the other adapters are compared with. Since part 8.2 the
// relay's, `mailbox`.

export { cell, position_at } from './cell.ts'
export type { Cell, CommandCell, Made, Making, ReadCell, Recorded, Step } from './cell.ts'
export { compare_values, log } from './interpreter.ts'
export type { Strategy } from './interpreter.ts'
export { mailbox_ports, no_deposit } from './mailbox.ts'
export type { MailboxState } from './mailbox.ts'
