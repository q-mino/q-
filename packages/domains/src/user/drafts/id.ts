import { z } from 'zod'
import { id } from './_scope_id.ts'

// The identities of the drafts (USR-5, DOM-24).

/** A draft, by what it is for: one draft for each (`the_name_i_give_a_bond/<bond>`, `dsl.the_draft_for`). */
export const draft_id = id({ format: z.string().min(1).max(256) })
