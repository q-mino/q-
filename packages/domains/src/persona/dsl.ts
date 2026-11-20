// The pure functions of the persona base over its values, added at need. DOM-5

import type * as zz from '../library/index.ts'
import type { value } from './_scope_dsl.ts'

/**
 * The face that signed a letter and the mailbox of mine it came to, the key
 * of auth's lookups: Bruno's K_b at D_mb. The user and an anonymous letter
 * have none (D30): no lookup runs, the value is not known.
 */
export const a_face_at_my_mailbox = (context: {
  readonly caller: value.caller
}): zz.Answer<{ readonly face: value.face_key; readonly mailbox: value.deposit_address }> =>
  context.caller.is === 'a_face'
    ? {
        answer: 'known',
        value: { face: context.caller.key, mailbox: context.caller.to_my_mailbox },
      }
    : { answer: 'not_known' }

/** Who asks is the user of this node, from the app: Anna on her phone, never a letter. */
export const the_caller_is_the_user = (context: { readonly caller: value.caller }): boolean =>
  context.caller.is === 'the_user'
