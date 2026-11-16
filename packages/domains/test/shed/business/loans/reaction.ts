import { reaction, fact, usecase } from './_scope_reaction.ts'

// The desk's own standing orders: the work sheet of a tool's reservations
// moves itself on, one step a reservation, until it closes (DOM-16, DOM-20).
// They move no other office, so they live with the process (DOM-23): the
// reactions between offices live above them (GR-9).

/**
 * When the desk opens its work sheet, it takes up the first reservation:
 * Luca retired the ladder, the sheet is open, Marta's Saturday comes first.
 * With no reservation ahead, the first step closes the sheet.
 */
export const the_first_reservation_on_the_sheet_is_taken_up = reaction({
  when: fact.the_cancellation_of_the_reservations_of_a_tool_has_begun,
  invokes: usecase.continue_the_cancellation_of_reservations,
  translation: (fact) => ({ tool_id: fact.new_cancellation.tool_id }),
})

/**
 * When the desk has gone one reservation further, it takes up the next:
 * Marta's Saturday is cancelled, Gianni's Sunday comes next; after it, the
 * step closes the sheet, and no one reacts to the closing.
 */
export const the_next_reservation_on_the_sheet_is_taken_up = reaction({
  when: fact.the_cancellation_has_advanced,
  invokes: usecase.continue_the_cancellation_of_reservations,
  translation: (fact) => ({ tool_id: fact.tool_id }),
})

// The round of the notices of a repair moves itself on the same way.

/**
 * When the desk begins its round of the notices of a repair, it notifies
 * the first member: the drill went to repair on Tuesday, Gianni, booked for
 * Thursday, comes first. With no reservation ahead, the first step closes
 * the round.
 */
export const the_first_member_on_the_round_is_notified = reaction({
  when: fact.a_repair_notice_round_has_begun,
  invokes: usecase.continue_the_repair_notice_round,
  translation: (fact) => ({ repair_id: fact.new_round.repair_id }),
})

/**
 * When the desk has gone one member further on the round, it notifies the
 * next: Gianni is notified, Paolo comes next; after Paolo, the step closes the
 * round, and no one reacts to the closing.
 */
export const the_next_member_on_the_round_is_notified = reaction({
  when: fact.the_repair_notice_round_has_advanced,
  invokes: usecase.continue_the_repair_notice_round,
  translation: (fact) => ({ repair_id: fact.repair_id }),
})
