// generated

// The door of `business/loans` (DOM-25): what the folder exposes to whoever is
// outside it, flat, under the components' names. A business domain's door
// exposes its use cases and its identities only, by the architecture's rule
// (DOM-2, GR-1): from outside, its commands and queries cannot even be named.
// Inside the folder the files import the twins, never the door.

export {
  borrow_a_tool,
  reserve_a_tool,
  return_a_tool,
  the_ongoing_loans_of_a_member,
  the_reservations_of_a_member,
} from './_usecase.ts'
export { loan_id, member_id, reservation_id } from './_id.ts'
