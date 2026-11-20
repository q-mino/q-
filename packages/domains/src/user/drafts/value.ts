import { z } from 'zod'
import { date_time } from '../../library/index.ts'
import { _user, id } from './_scope_value.ts'

// The values of the drafts (USR-5): a text she started, kept until she uses
// or drops it, so that a phone that closes the app loses nothing of it (D40).

/** What a draft is for, an ADT: the texts the screens of stage 1 ask her to type. */
export const what_it_is_for = z.discriminatedUnion('for', [
  /** The name of her first face, at the first start. */
  z.strictObject({ for: z.literal('the_name_of_my_first_face') }),
  /** The name she gives a bond, when she opens their ticket or renames it. */
  z.strictObject({ for: z.literal('the_name_i_give_a_bond'), bond: _user.value.a_bond }),
])

/** The text of a draft. */
export const a_text = z.string().max(1024)

/** A draft, as the screens read it. */
export const a_draft = z.strictObject({
  draft_id: id.draft_id,
  for: what_it_is_for,
  text: a_text,
  kept_at: date_time,
})
