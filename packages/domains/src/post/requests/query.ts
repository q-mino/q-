import { z } from 'zod'
import { query, request_selection, id, value } from './_scope_query.ts'

/**
 * The answer the port keeps under a request's identity (F7, PST-8): still
 * waiting, the response's event, or no response. A delivery that meets its
 * request again, after a fall, reads it, never sending again for an answer
 * already given. No entry for an identity the port never sent.
 */
export const the_answer_to_a_request = query({
  input: z.strictObject({
    request_id: id.request_id,
  }),
  fields: value.request_card,
  identity: 'id',
  selection: request_selection.the_request_has_this_id,
  order: { id: 'ascending' },
  creator: () => (input) => ({
    selection: { request_id: input.request_id },
  }),
})

/**
 * The requests that wait for their response (F7, EXT-7): what each invokes,
 * the face that signs it and the key of the face it went to, so that the
 * kernel calls off those of an extension the user deactivated, or withdrew
 * from their bond (the port of requests, step 12).
 */
export const the_requests_waiting = query({
  input: z.strictObject({}),
  fields: value.waiting_request_card,
  identity: 'id',
  selection: request_selection.the_request_is_waiting,
  order: { id: 'ascending' },
  creator: () => () => ({
    selection: {},
  }),
})
