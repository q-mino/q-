import { z } from 'zod'
import { fact, id, value, _post } from './_scope_fact.ts'

/** A request has been sent (PST-5): its letter deposited on the mailbox of the face it goes to, waiting until its time is over. */
export const a_request_has_been_sent = fact({
  payload: z.strictObject({
    sent_request: value.waiting_request,
  }),
})

/** A request waiting has been sent again (PST-6): the same letter, deposited again. */
export const a_request_has_been_sent_again = fact({
  payload: z.strictObject({
    request_id: id.request_id,
    attempt: z.number().int().min(1),
  }),
})

/** The time to send a request again came after it closed, or after its time (PST-6): nothing was sent. */
export const the_time_to_send_again_came_too_late = fact({
  payload: z.strictObject({
    request_id: id.request_id,
  }),
})

/** A request has been answered (PST-7): the event of the response its face sent. */
export const a_request_has_been_answered = fact({
  payload: z.strictObject({
    request_id: id.request_id,
    event: _post.value.content,
  }),
})

/** A request had no response in its time (PST-7, V18). */
export const a_request_had_no_response = fact({
  payload: z.strictObject({
    request_id: id.request_id,
  }),
})

/** The time of a request came after its response (PST-7): nothing changes. */
export const the_response_came_before_the_time = fact({
  payload: z.strictObject({
    request_id: id.request_id,
  }),
})
