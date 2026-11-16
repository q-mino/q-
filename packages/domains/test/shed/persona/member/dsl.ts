// The pure functions of `member` over its values, added at need. DOM-5

import type { date_time, day } from '../../wlib.ts'
import type { loans } from './_scope_dsl.ts'

/** A card is valid up to its last day, included, on the calendar day of the instant. */
export const the_card_is_valid_on =
  (now: date_time) =>
  (card: { readonly valid_until: day }): boolean =>
    now.slice(0, 10) <= card.valid_until

/** The member brought the tool back damaged: the workshop will take it in. */
export const the_tool_came_back_damaged = (
  the_return: loans.fact.a_tool_has_been_returned,
): boolean => the_return.returned_loan.progress.condition === 'damaged'
