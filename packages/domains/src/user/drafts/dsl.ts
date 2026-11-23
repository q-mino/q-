// The pure functions of the drafts (DOM-5): the key of a draft, from what it is for.

import type { value } from './_scope_dsl.ts'

/** The key of the draft for this: one draft for each thing it is for. */
export const the_draft_for = (purpose: value.what_it_is_for): string =>
  purpose.for === 'the_name_of_my_first_face'
    ? 'the_name_of_my_first_face'
    : `the_name_i_give_a_bond/${purpose.bond}`
