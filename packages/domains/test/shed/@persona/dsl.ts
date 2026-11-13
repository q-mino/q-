// The pure functions of the persona base over its values, added at need. DOM-5

import type * as wlib from '../wlib.ts'
import type { account_id } from '../@auth/@accounts/_index.ts'
import type { caller } from './_value.ts'

/** The account of who asks, if they signed in: an anonymous session has none (D30). */
export const the_account_of_the_caller = (context: {
  readonly caller: caller
}): wlib.Answer<account_id> =>
  context.caller.identified_by === 'account'
    ? { answer: 'known', value: context.caller.id }
    : { answer: 'not_known' }
