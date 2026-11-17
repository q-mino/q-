import { command_use_case, read_use_case, command, effect, fact, query } from './_scope_usecase.ts'

// The use cases of `loans`, its only entry (DOM-2): every persona, reaction
// and effect executor reaches the loans and the reservations through them.
// A command use case runs one command (DOM-4), a read use case reads one
// query; in the trivial case each declares only its command or its query.
// Who the member is comes from the persona (step 6), not from here.

/** A member borrows a tool: Marta takes the drill home. */
export const borrow_a_tool = command_use_case({ command: command.borrow_a_tool })

/** A member books a tool for a day ahead: the ladder for Saturday. */
export const reserve_a_tool = command_use_case({ command: command.reserve_a_tool })

/** A member brings a tool back, in good condition or damaged. */
export const return_a_tool = command_use_case({ command: command.return_a_tool })

/**
 * On the eve of the due date the effect executor comes back (DOM-13): Marta
 * is reminded if she still has the drill. The return of the wait queued by
 * a loan.
 */
export const remind_the_member_of_the_due_date = command_use_case({
  command: command.remind_the_member_of_the_due_date,
  returns_from: effect.wait_until_the_eve_of_the_due_date,
})

/**
 * On the due date the effect executor comes back (DOM-13): Marta's loan of
 * the drill is stamped overdue if she still has it. The return of the wait
 * queued by a loan.
 */
export const declare_the_loan_overdue = command_use_case({
  command: command.declare_the_loan_overdue,
  returns_from: effect.wait_until_the_due_date,
})

/**
 * The reservations desk cancels the reservations of a tool that can no
 * longer be lent: the ladder is retired, and Marta's Saturday and Gianni's
 * Sunday go. Invoked by a reaction to the retirement (DOM-16).
 */
export const cancel_the_reservations_of_a_tool = command_use_case({
  command: command.cancel_the_reservations_of_a_tool,
})

/**
 * The desk goes one reservation further on its work sheet, or closes it: a
 * step of the cancellation of a tool's reservations (DOM-20). Invoked by the
 * desk's own standing orders (DOM-16): when the sheet opens, and after each
 * step that advanced it.
 */
export const continue_the_cancellation_of_reservations = command_use_case({
  command: command.continue_the_cancellation_of_reservations,
})

/**
 * A member sees the tools they have: Marta opens "my loans", reads the list,
 * then follows it live; a loan appears, falls overdue, a return takes it
 * away. With the register goes one notice by name: a loan has fallen overdue
 * (D64.2, D101.4).
 */
export const the_ongoing_loans_of_a_member = read_use_case({
  query: query.the_ongoing_loans_of_a_member,
  facts: [fact.a_loan_has_become_overdue],
})

/**
 * A member sees their reservations from today on: Gianni opens "my
 * reservations", reads the list, then follows it live; a booking appears, a
 * cancellation takes one away. With the register goes one notice by name:
 * the desk has notified the member that the tool they booked is in repair, a
 * part of a step of its round (D111, A, 16 Nov 2026 (6)).
 */
export const the_reservations_of_a_member = read_use_case({
  query: query.the_reservations_of_a_member,
  facts: [fact.a_member_has_been_notified_of_the_repair],
})

/**
 * The desk begins its round of the notices of a repair: the drill is in the
 * workshop, and Gianni and Paolo, who booked it, will hear of it. Invoked by
 * a reaction to the repair (DOM-16).
 */
export const notify_the_members_of_a_repair = command_use_case({
  command: command.notify_the_members_of_a_repair,
})

/**
 * The desk goes one member further on its round of the notices of a repair,
 * or closes it: a step of the round (DOM-20). Invoked by the desk's own
 * standing orders (DOM-16): when the round begins, and after each step that
 * advanced it.
 */
export const continue_the_repair_notice_round = command_use_case({
  command: command.continue_the_repair_notice_round,
})
