import { command_use_case, read_use_case, command, effect, query } from './_scope_usecase.ts'

// The use cases of the requests, their only entry (DOM-2). No persona tree
// reaches them: the kernel's port of requests (EXT-2, step 12) sends,
// reads, and calls off what the user deactivated or withdrew (EXT-7); the
// kernel's entry gives a response back (EXT-6, step 13); the
// effect executor brings the waits back (DOM-14). Wired by the configurator
// (GR-6).

/** A request is sent on a bond: the call of the port of requests. */
export const send_a_request = command_use_case({ command: command.send_a_request })

/** A request that waits is sent again: the return of the wait. */
export const send_a_request_again = command_use_case({
  command: command.send_a_request_again,
  returns_from: effect.wait_to_send_again,
})

/** A request's time is over: closed with no response if none came. The return of the wait. */
export const close_a_request_with_no_response = command_use_case({
  command: command.close_a_request_with_no_response,
  returns_from: effect.wait_for_the_response,
})

/** A response comes back to the request it names. */
export const take_a_response = command_use_case({ command: command.take_a_response })

/** A request that waits is called off: the kernel's, at a deactivation or a withdrawal. */
export const call_off_a_request = command_use_case({ command: command.call_off_a_request })

/** The requests that wait, for the kernel to call off. */
export const the_requests_waiting = read_use_case({ query: query.the_requests_waiting })

/** The answer the port keeps under a request's identity. */
export const the_answer_to_a_request = read_use_case({ query: query.the_answer_to_a_request })
