import { z } from 'zod'
import { date_time } from '../../library/index.ts'
import { predicate, id, _post } from './_scope_predicate.ts'

// The vocabulary of the conditions. A predicate declares its parameters;
// its value is the adapters', helped by dsl.ts.

/** A request with this identity has been sent, whatever became of it. */
export const a_request_has_this_id = predicate({
  parameters: z.strictObject({
    request_id: id.request_id,
  }),
})

/** This request is waiting for its response: neither answered nor closed with no response. */
export const the_request_is_waiting = predicate({
  parameters: z.strictObject({
    request_id: id.request_id,
  }),
})

/** The time of this request is not over at this instant. */
export const the_time_of_the_request_is_not_over = predicate({
  parameters: z.strictObject({
    request_id: id.request_id,
    now: date_time,
  }),
})

/** This request went to the face of this key: its letter was sealed for it. */
export const the_request_went_to_this_face = predicate({
  parameters: z.strictObject({
    request_id: id.request_id,
    key: _post.value.face_key,
  }),
})
