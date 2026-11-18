import { command_use_case, command } from './_scope_usecase.ts'

// The use cases on an ongoing loan (D105, SC-31): each invoked with the loan
// the node binds beside its command's input, flat (`loan_id` with the rest);
// the node's condition holds for every branch of its command.

/** A member keeps a tool longer: Marta, the drill, two more weeks. */
export const extend_the_loan = command_use_case({ command: command.extend_the_loan })

/** The keeper corrects the tool on a loan's card: Luca handed Marta the sander, not the drill. */
export const correct_the_tool_of_a_loan = command_use_case({
  command: command.correct_the_tool_of_a_loan,
})
