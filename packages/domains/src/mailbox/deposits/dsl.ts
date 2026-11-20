// The domain's pure functions over its values, added at need: usable by the
// adapters, the interface and the client. Not concepts of the library. DOM-5

import { date_time } from '../../library/index.ts'
import type { value } from './_scope_dsl.ts'

/** How long the relay keeps an envelope (MBX-2): seven days of 24 hours, by its clock. */
const seven_days_in_milliseconds = 7 * 24 * 60 * 60 * 1000

/** When the seven days of an envelope deposited at this time are over (MBX-2), told in UTC. */
export const seven_days_after = (deposited_at: date_time): date_time =>
  date_time.parse(new Date(Date.parse(deposited_at) + seven_days_in_milliseconds).toISOString())

export const a_deposit_is_there = (
  the_deposit: value.deposit | undefined,
): the_deposit is value.deposit => the_deposit !== undefined

export const the_envelope_is_kept = (the_deposit: value.deposit | undefined): boolean =>
  the_deposit?.status === 'kept'
