// The pure functions of `member` over its values, added at need. DOM-5

import { day_of, type RootContext, type day, type Truth } from '../../../../src/library/index.ts'
import type { loans, value } from './_scope_dsl.ts'

/** A card is valid up to its last day, included: today, the day of the context's `now` in the shed's zone (SC-12). */
export const the_card_is_valid_today =
  (context: Pick<RootContext, 'now' | 'time_zone'>) =>
  (card: { readonly valid_until: day }): boolean =>
    day_of(context.time_zone)(context.now) <= card.valid_until

/** The member brought the tool back damaged: the workshop will take it in. */
export const the_tool_came_back_damaged = (
  the_return: loans.fact.a_tool_has_been_returned,
): boolean => the_return.returned_loan.progress.condition === 'damaged'

/**
 * Only someone else's booking stands in the way of an extension: every
 * failure names it, whether of a rejection (SC-31) or of a row (SC-33).
 */
export const only_a_booking_stands_in_the_way = (
  failures: readonly { readonly predicate: string }[],
): boolean =>
  failures.every(
    (failure) => failure.predicate === 'business/loans/predicate/the_tool_is_booked_on_a_day_up_to',
  )

/** The failures of an applicability: its leaves that do not hold, as a rejection names them (SC-33). */
export const the_failures_of = <leaf extends { readonly holds: Truth }>(applicability: {
  readonly leaves: readonly leaf[]
}): readonly leaf[] => applicability.leaves.filter((leaf) => leaf.holds === false)

/**
 * The return on a row of "my loans" (SC-33): possible, not known before the
 * member scans the tool they bring (D51.7), unless it is false.
 */
export const the_return_on_the_row = (the_return: {
  readonly value: Truth
}): value.return_on_the_row =>
  the_return.value === false ? 'not_this_loan' : 'scan_the_tool_you_bring'

/**
 * The extension on a row of "my loans" (SC-33): the card first, a limit of
 * the member's, told whatever the loan (D80); then the loan, possible unless
 * false, a booking told apart as when it is refused (SC-31).
 */
export const the_extension_on_the_row = (extension: {
  readonly value: Truth
  readonly leaves: readonly { readonly predicate: string; readonly holds: Truth }[]
  readonly limits: { readonly the_member_card_is_valid_today: Truth }
}): value.extension_on_the_row =>
  extension.limits.the_member_card_is_valid_today === false
    ? 'your_card_is_not_valid'
    : extension.value !== false
      ? 'you_may'
      : only_a_booking_stands_in_the_way(the_failures_of(extension))
        ? 'someone_booked_the_tool'
        : 'not_this_loan'
