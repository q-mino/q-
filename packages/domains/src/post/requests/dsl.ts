// The requests' pure functions over their values (DOM-5): the meanings of
// the predicates, for the oracle and the adapters, and the times of a
// request.

import { date_time } from '../../library/index.ts'
import type { id, value } from './_scope_dsl.ts'

/** A request with this identity is in the record, whatever became of it. */
export const a_request_is_there = (
  the_request: value.request | undefined,
): the_request is value.request => the_request !== undefined

/** The request waits for its response. */
export const the_request_is_waiting = (the_request: value.request | undefined): boolean =>
  the_request?.status === 'waiting'

/** The request's time is not over at this instant. */
export const the_time_of_the_request_is_not_over =
  (now: date_time) =>
  (the_request: value.request | undefined): boolean =>
    the_request !== undefined && Date.parse(now) < Date.parse(the_request.until)

/** The request went to the face of this key: its letter was sealed for it. */
export const the_request_went_to_this_face =
  (key: string) =>
  (the_request: value.request | undefined): boolean =>
    the_request?.deposit.their_key === key

/** The answer a request has now, as the port keeps it (PST-8). */
export const the_answer_of = (the_request: value.request): value.answer => {
  switch (the_request.status) {
    case 'waiting':
      return { status: 'waiting' }
    case 'answered':
      return { status: 'answered', event: the_request.event }
    case 'no_response':
      return { status: 'no_response' }
  }
}

/** The instant a request's time is over, from the instant it is sent and the seconds it waits. */
export const the_end_of_a_time = (now: date_time, waits: value.waiting_time): date_time =>
  date_time.parse(new Date(Date.parse(now) + waits * 1000).toISOString())

/** How many parts a request's time is cut into for its sendings (PST-6): sent, then again at each quarter. */
export const the_parts_of_a_time = 4

/** The instant of a request's sending, by its attempt: the first at its declared time, the next at each quarter of its time. */
export const the_instant_of_a_sending = (
  sent_at: date_time,
  until: date_time,
  attempt: number,
): date_time => {
  const start = Date.parse(sent_at)
  const quarter = (Date.parse(until) - start) / the_parts_of_a_time
  return date_time.parse(new Date(start + Math.round(attempt * quarter)).toISOString())
}

/** The key of a request's sending, unique per effect (DOM-13): the request's identity and the attempt. */
export const the_key_of_a_sending = (request_id: id.request_id, attempt: number): string =>
  `${request_id}/${String(attempt)}`
