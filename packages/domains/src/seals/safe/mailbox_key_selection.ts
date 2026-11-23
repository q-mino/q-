import { z } from 'zod'
import { selection, id } from './_scope_selection.ts'

// The selections over a mailbox key, the subject of this file (DOM-18).
// Their value is the adapters'.

/** The mailbox key has this id. */
export const the_mailbox_key_has_this_id = selection({
  subject: 'mailbox_key',
  parameters: z.strictObject({
    mailbox_key_id: id.mailbox_key_id,
  }),
})

/** The mailbox key is drawn: it has its R and its D. */
export const the_mailbox_key_is_drawn = selection({
  subject: 'mailbox_key',
  parameters: z.strictObject({}),
})
