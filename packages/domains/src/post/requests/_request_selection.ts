// generated

// The selection predicates of `post/requests` from `request_selection.ts`
// (DOM-25): the same objects under the same names, branded with their path
// (DOM-24), each schema with its output type under the same name, so that one
// import gives both. Only this module imports `request_selection.ts`.

import { z } from 'zod'
import * as selection from './request_selection.ts'

/**
 * The request has this identity.
 *
 * @see {@link selection.the_request_has_this_id}
 */
export const the_request_has_this_id =
  selection.the_request_has_this_id.brand<'post/requests/selection/request/the_request_has_this_id'>()
export type the_request_has_this_id = z.output<typeof the_request_has_this_id>

/**
 * The request waits for its response.
 *
 * @see {@link selection.the_request_is_waiting}
 */
export const the_request_is_waiting =
  selection.the_request_is_waiting.brand<'post/requests/selection/request/the_request_is_waiting'>()
export type the_request_is_waiting = z.output<typeof the_request_is_waiting>
