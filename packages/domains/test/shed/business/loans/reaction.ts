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
