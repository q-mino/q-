// generated

// The door of `business/loans` (DOM-25): what the folder exposes to whoever is
// outside it, flat, under the components' names. A business domain's door
// exposes its use cases, its identities and its facts, by the architecture's
// rule (DOM-2, GR-1): from outside, its commands and queries cannot even be
// named. Its facts are its published contract (D101): a reaction names the
// one it reacts to (DOM-16), and a fact gives no one access to the log.
// A return use case is not in it: its entry is the effect executor (D92.1),
// which reaches it from the configurator, so that no persona can send a
// reminder, or stamp a loan overdue, with a payload of its choice. Inside the folder the files import
// the twins, never the door.

export {
  borrow_a_tool,
  reserve_a_tool,
  return_a_tool,
  cancel_the_reservations_of_a_tool,
  the_ongoing_loans_of_a_member,
  the_reservations_of_a_member,
} from './_usecase.ts'
export { loan_id, member_id, reservation_id } from './_id.ts'
export {
  a_tool_has_been_lent,
  the_member_already_has_the_tool,
  a_tool_has_been_booked,
  the_member_already_booked_the_tool,
  a_tool_has_been_returned,
  the_loan_was_already_returned,
  the_member_has_been_reminded_of_the_due_date,
  the_loan_was_returned_before_the_reminder,
  the_due_date_came_before_the_reminder,
  a_loan_has_become_overdue,
  the_loan_was_returned_before_it_became_overdue,
  the_cancellation_of_the_reservations_of_a_tool_has_begun,
} from './_fact.ts'
