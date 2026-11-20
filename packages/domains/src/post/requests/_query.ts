// generated

// The queries of `post/requests` from `query.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `query.ts`.

import { z } from 'zod'
import * as query from './query.ts'

/**
 * The answer the port keeps under a request's identity (F7, PST-8): still
 * waiting, the response's event, or no response. A delivery that meets its
 * request again, after a fall, reads it, never sending again for an answer
 * already given. No entry for an identity the port never sent.
 *
 * @see {@link query.the_answer_to_a_request}
 */
export const the_answer_to_a_request = query.the_answer_to_a_request

/**
 * The input of `the_answer_to_a_request`, declared inline.
 *
 * @see {@link query.the_answer_to_a_request}
 */
export const the_answer_to_a_request_input = query.the_answer_to_a_request.input
export type the_answer_to_a_request_input = z.output<typeof the_answer_to_a_request_input>
