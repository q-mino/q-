import { z } from 'zod'
import { selection, id } from './_scope_selection.ts'

// The selections over an invitation, the subject of this file (DOM-18):
// predicates over the invitation a query looks at, which they do not name.
// Their value is the adapters'.

/** The invitation was left on this stand. */
export const the_invitation_is_on_this_stand = selection({
  subject: 'invitation',
  parameters: z.strictObject({
    stand: id.stand,
  }),
})

/** The invitation is on its stand still: neither taken nor taken away. */
export const the_invitation_can_be_taken = selection({
  subject: 'invitation',
  parameters: z.strictObject({}),
})

/** The invitation was taken by this take. */
export const the_invitation_was_taken_by = selection({
  subject: 'invitation',
  parameters: z.strictObject({
    take_id: id.take_id,
  }),
})
