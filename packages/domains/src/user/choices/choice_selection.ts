import { z } from 'zod'
import { selection, id } from './_scope_selection.ts'

// The selection predicates of the choices (DOM-18).

/** The choice is this one. */
export const the_choice_is_this_one = selection({
  subject: 'choice',
  parameters: z.strictObject({
    choice: id.choice,
  }),
})
