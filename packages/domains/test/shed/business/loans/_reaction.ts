// generated

// The reactions of `business/loans` from `reaction.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `reaction.ts`.

import * as reaction from './reaction.ts'

/**
 * When the desk opens its work sheet, it takes up the first reservation:
 * Luca retired the ladder, the sheet is open, Marta's Saturday comes first.
 * With no reservation ahead, the first step closes the sheet.
 *
 * @see {@link reaction.the_first_reservation_on_the_sheet_is_taken_up}
 */
export const the_first_reservation_on_the_sheet_is_taken_up =
  reaction.the_first_reservation_on_the_sheet_is_taken_up

/**
 * When the desk has gone one reservation further, it takes up the next:
 * Marta's Saturday is cancelled, Gianni's Sunday comes next; after it, the
 * step closes the sheet, and no one reacts to the closing.
 *
 * @see {@link reaction.the_next_reservation_on_the_sheet_is_taken_up}
 */
export const the_next_reservation_on_the_sheet_is_taken_up =
  reaction.the_next_reservation_on_the_sheet_is_taken_up

/**
 * When the desk begins its round of the notices of a repair, it notifies
 * the first member: the drill went to repair on Tuesday, Gianni, booked for
 * Thursday, comes first. With no reservation ahead, the first step closes
 * the round.
 *
 * @see {@link reaction.the_first_member_on_the_round_is_notified}
 */
export const the_first_member_on_the_round_is_notified =
  reaction.the_first_member_on_the_round_is_notified

/**
 * When the desk has gone one member further on the round, it notifies the
 * next: Gianni is notified, Paolo comes next; after Paolo, the step closes the
 * round, and no one reacts to the closing.
 *
 * @see {@link reaction.the_next_member_on_the_round_is_notified}
 */
export const the_next_member_on_the_round_is_notified =
  reaction.the_next_member_on_the_round_is_notified
