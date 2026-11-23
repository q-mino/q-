import { z } from 'zod'
import { selection, id } from './_scope_selection.ts'

// The selections over a request, the subject of this file (DOM-18):
// predicates over the request a query looks at, which they do not name.
// Their value is the adapters'.

/** The request has this identity. */
export const the_request_has_this_id = selection({
  subject: 'request',
  parameters: z.strictObject({
    request_id: id.request_id,
  }),
})

/** The request waits for its response. */
export const the_request_is_waiting = selection({
  subject: 'request',
  parameters: z.strictObject({}),
})
