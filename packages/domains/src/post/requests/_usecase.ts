// generated

// The use cases of `post/requests` from `usecase.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `usecase.ts`.

import * as usecase from './usecase.ts'

/**
 * A request is sent on a bond: the call of the port of requests.
 *
 * @see {@link usecase.send_a_request}
 */
export const send_a_request = usecase.send_a_request

/**
 * A request that waits is sent again: the return of the wait.
 *
 * @see {@link usecase.send_a_request_again}
 */
export const send_a_request_again = usecase.send_a_request_again

/**
 * A request's time is over: closed with no response if none came. The return of the wait.
 *
 * @see {@link usecase.close_a_request_with_no_response}
 */
export const close_a_request_with_no_response = usecase.close_a_request_with_no_response

/**
 * A response comes back to the request it names.
 *
 * @see {@link usecase.take_a_response}
 */
export const take_a_response = usecase.take_a_response

/**
 * The answer the port keeps under a request's identity.
 *
 * @see {@link usecase.the_answer_to_a_request}
 */
export const the_answer_to_a_request = usecase.the_answer_to_a_request
