// generated

// The identities of `user/drafts` from `id.ts` (DOM-25): the same objects under
// the same names, branded with their path (DOM-24), each schema with its output
// type under the same name, so that one import gives both. Only this module
// imports `id.ts`.

import { z } from 'zod'
import * as id from './id.ts'

/**
 * A draft, by what it is for: one draft for each (`the_name_i_give_a_bond/<bond>`, `dsl.the_draft_for`).
 *
 * @see {@link id.draft_id}
 */
export const draft_id = id.draft_id.brand<'user/drafts/id/draft_id'>()
export type draft_id = z.output<typeof draft_id>
