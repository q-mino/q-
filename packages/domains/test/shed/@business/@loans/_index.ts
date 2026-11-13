// generated

// The door of `business/loans` (DOM-25): what the folder exposes to whoever is
// outside it, flat, under the components' names. A business domain's door
// exposes its use cases and its identities only, by the architecture's rule
// (DOM-2, GR-1): from outside, its commands and queries cannot even be named.
// A return use case is not in it: its entry is the effect executor (D92.1),
// which reaches it from the configurator, so that no persona can send a
// reminder, or stamp a loan overdue, with a payload of its choice. Inside the folder the files import
// the twins, never the door.

export {
  borrow_a_tool,
  reserve_a_tool,
  return_a_tool,
  the_ongoing_loans_of_a_member,
  the_reservations_of_a_member,
} from './_usecase.ts'
export { loan_id, member_id, reservation_id } from './_id.ts'
