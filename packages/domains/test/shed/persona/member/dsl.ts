// The pure functions of `member` over its values, added at need. DOM-5

import type { date_time_string, day } from '../../wlib.ts'

/** A card is valid up to its last day, included, on the calendar day of the instant. */
export const the_card_is_valid_on =
  (now: date_time_string) =>
  (card: { readonly valid_until: day }): boolean =>
    now.slice(0, 10) <= card.valid_until
