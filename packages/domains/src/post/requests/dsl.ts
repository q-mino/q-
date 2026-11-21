// The requests' pure functions over their values (DOM-5): the meanings of
// the predicates, for the oracle and the adapters, the times of a request,
// and the delivery of its deposits (PST-10).

import { date_time, type Delivered } from '../../library/index.ts'
import { _post, type id, type value } from './_scope_dsl.ts'

/** A request with this identity is in the record, whatever became of it. */
export const a_request_is_there = (
  the_request: value.request | undefined,
): the_request is value.request => the_request !== undefined

/** The request waits for its response. */
export const the_request_is_waiting = (the_request: value.request | undefined): boolean =>
  the_request?.status === 'waiting'

/** The request has been answered by a response of its face. */
export const the_request_has_been_answered = (the_request: value.request | undefined): boolean =>
  the_request?.status === 'answered'

/** The request has been called off while it waited (F7, EXT-7). */
export const the_request_has_been_called_off = (the_request: value.request | undefined): boolean =>
  the_request?.status === 'called_off'

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
    case 'called_off':
      return { status: 'called_off', why: the_request.why }
  }
}

/** A request that waits, as the kernel reads it to call it off (F7, EXT-7). */
export const the_card_of_a_waiting_request = (
  the_request: value.request,
): value.waiting_request_card => ({
  id: the_request.id,
  invokes: the_request.deposit.letter.invokes,
  face_id: the_request.deposit.face_id,
  their_key: the_request.deposit.their_key,
})

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

/**
 * Why a deposit of a request is a dead letter (DOM-15, F6): the key of the
 * face it goes to takes no seal (SEA-5, a claim of theirs, F2), or the relay
 * refused the envelope (MBX-1's limits), with what it said.
 */
export const the_reasons_of_a_dead_deposit = {
  their_key_takes_no_seal: 'their_key_takes_no_seal',
  the_relay_refused_the_envelope: 'the_relay_refused_the_envelope',
} as const

/**
 * The delivery of `deposit_a_letter` (PST-10, ADP-1): the letter put in an
 * envelope by the machine of the face that signs it, for the key of the
 * face it goes to, and deposited through the post's mailbox port under the
 * sending's operation, so that the same sending tried again is the same
 * deposit at the relay. Told as the executor reads it (DOM-15): kept, or
 * kept already by an earlier attempt, delivered; refused by the relay, or
 * not sealed, exhausted with why; no answer, transient. An abort of the
 * transport throws, and the executor stops the effect (DOM-14). The
 * configurator gives the machine of a face (PST-3) and the port (GR-6).
 */
export const the_deposit_of_a_letter =
  (
    machine_of: (face_id: value.deposit['face_id']) => _post.dsl.Machine,
    mailbox: _post.dsl.MailboxPort,
  ) =>
  async (entry: {
    readonly id: string
    readonly payload: value.deposit
  }): Promise<Delivered<never>> => {
    const machine = machine_of(entry.payload.face_id)
    const sealed = await _post.dsl.a_letter_in_an_envelope(machine)(
      entry.payload.letter,
      entry.payload.their_key,
    )
    if (sealed.outcome === 'not_sealed')
      return { outcome: 'exhausted', reason: the_reasons_of_a_dead_deposit.their_key_takes_no_seal }
    const deposited = await mailbox.deposit({
      operation: _post.dsl.the_operation_of_a_deposit(machine)(entry.id, entry.payload.letter.to),
      deposit_address: entry.payload.letter.to,
      relays: entry.payload.relays,
      envelope: sealed.envelope,
    })
    switch (deposited.outcome) {
      case 'kept':
      case 'kept_already':
        return { outcome: 'delivered' }
      case 'refused':
        return {
          outcome: 'exhausted',
          reason: `${the_reasons_of_a_dead_deposit.the_relay_refused_the_envelope}: ${deposited.why}`,
        }
      case 'unreachable':
        return { outcome: 'transient' }
    }
  }
