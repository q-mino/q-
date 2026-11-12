import * as wlib from '../../wlib.ts'
import * as command from './command.ts'

// The use cases of `loans`, its only entry (DOM-2): every persona, reaction
// and effect executor reaches the loans and the reservations through them.
// Each runs one command (DOM-4); in the trivial case it declares only the
// command. Who the member is comes from the persona (step 6), not from here.

/** A member borrows a tool: Marta takes the drill home. */
export const borrow_a_tool = wlib.command_use_case({ command: command.borrow_a_tool })

/** A member books a tool for a day ahead: the ladder for Saturday. */
export const reserve_a_tool = wlib.command_use_case({ command: command.reserve_a_tool })

/** A member brings a tool back, in good condition or damaged. */
export const return_a_tool = wlib.command_use_case({ command: command.return_a_tool })
