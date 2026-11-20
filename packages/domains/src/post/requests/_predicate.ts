// generated

// The predicates of `post/requests` from `predicate.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `predicate.ts`.

import { z } from 'zod'
import * as predicate from './predicate.ts'

/**
 * A request with this identity has been sent, whatever became of it.
 *
 * @see {@link predicate.a_request_has_this_id}
 */
export const a_request_has_this_id =
  predicate.a_request_has_this_id.brand<'post/requests/predicate/a_request_has_this_id'>()
export type a_request_has_this_id = z.output<typeof a_request_has_this_id>

/**
 * This request is waiting for its response: neither answered nor closed with no response.
 *
 * @see {@link predicate.the_request_is_waiting}
 */
export const the_request_is_waiting =
  predicate.the_request_is_waiting.brand<'post/requests/predicate/the_request_is_waiting'>()
export type the_request_is_waiting = z.output<typeof the_request_is_waiting>

/**
 * The time of this request is not over at this instant.
 *
 * @see {@link predicate.the_time_of_the_request_is_not_over}
 */
export const the_time_of_the_request_is_not_over =
  predicate.the_time_of_the_request_is_not_over.brand<'post/requests/predicate/the_time_of_the_request_is_not_over'>()
export type the_time_of_the_request_is_not_over = z.output<
  typeof the_time_of_the_request_is_not_over
>

/**
 * This request went to the face of this key: its letter was sealed for it.
 *
 * @see {@link predicate.the_request_went_to_this_face}
 */
export const the_request_went_to_this_face =
  predicate.the_request_went_to_this_face.brand<'post/requests/predicate/the_request_went_to_this_face'>()
export type the_request_went_to_this_face = z.output<typeof the_request_went_to_this_face>
