import * as wlib from '../../wlib.ts'
import * as command from './command.ts'
import * as query from './query.ts'

// The use cases of `loans`, its only entry (DOM-2): every persona, reaction
// and effect executor reaches the loans and the reservations through them.
// A command use case runs one command (DOM-4), a read use case reads one
// query; in the trivial case each declares only its command or its query.
// Who the member is comes from the persona (step 6), not from here.

/** A member borrows a tool: Marta takes the drill home. */
export const borrow_a_tool = wlib.command_use_case({ command: command.borrow_a_tool })

/** A member books a tool for a day ahead: the ladder for Saturday. */
export const reserve_a_tool = wlib.command_use_case({ command: command.reserve_a_tool })

/** A member brings a tool back, in good condition or damaged. */
export const return_a_tool = wlib.command_use_case({ command: command.return_a_tool })

/**
 * A member sees the tools they have: Marta opens "my loans", reads the list,
 * then follows it live; a loan appears, a return takes it away.
 */
export const the_ongoing_loans_of_a_member = wlib.read_use_case({
  query: query.the_ongoing_loans_of_a_member,
})

/** A member sees their reservations from today on. */
export const the_reservations_of_a_member = wlib.read_use_case({
  query: query.the_reservations_of_a_member,
})
