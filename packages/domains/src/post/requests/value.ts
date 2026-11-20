import { z } from 'zod'
import { date_time } from '../../library/index.ts'
import { _post, id, safe } from './_scope_value.ts'

// The values of the requests (PST-5..PST-8): the record of the port of
// requests, a request as it was sent and how it closed.

/**
 * How long a request waits for its response, in seconds (F7, V18): the
 * asker's, a value of its business (ping pong's 60 seconds); at most the
 * seven days a relay keeps its letter (MBX-2).
 */
export const waiting_time = z.number().int().min(1).max(604_800)

/**
 * A letter to deposit (PST-6): the letter, the face of the node's user that
 * signs it, the key of the face it is sealed for, and the relays of the
 * mailbox it is for. All a deposit needs, since a creator reads no state:
 * the same letter every time it is sent.
 */
export const deposit = z.strictObject({
  letter: _post.value.request,
  face_id: safe.id.face_id,
  their_key: _post.value.face_key,
  relays: _post.value.relays,
})

/**
 * The next sending of a request that waits (PST-6): the attempt it is, the
 * instant its time is over, and the letter to deposit again.
 */
export const sending_again = z.strictObject({
  request_id: id.request_id,
  attempt: z.number().int().min(1),
  until: date_time,
  deposit: deposit,
})

/** A request as it was sent: its letter and where it went, and the instant its time is over. */
const as_sent = {
  id: id.request_id,
  deposit: deposit,
  until: date_time,
}

/** A request waiting for its response (PST-5): sent, sent again while it waits within its time. */
export const waiting_request = z.strictObject({
  ...as_sent,
  status: z.literal('waiting'),
})

/** A request answered (PST-7): the event of the response its face sent, the first that came. */
export const answered_request = z.strictObject({
  ...as_sent,
  status: z.literal('answered'),
  event: _post.value.content,
})

/** A request whose time was over with no response (PST-7, V18). */
export const request_with_no_response = z.strictObject({
  ...as_sent,
  status: z.literal('no_response'),
})

/** A request of the port, in its states. */
export const request = z.discriminatedUnion('status', [
  waiting_request,
  answered_request,
  request_with_no_response,
])

/**
 * The answer the port keeps under a request's identity (F7, PST-8): still
 * waiting, the response's event, or no response; kept as long as the
 * request, forever in the prototype (DOM-11).
 */
export const answer = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('waiting') }),
  z.strictObject({ status: z.literal('answered'), event: _post.value.content }),
  z.strictObject({ status: z.literal('no_response') }),
])

/** A request as the port reads it: its identity and its answer. */
export const request_card = z.strictObject({
  id: id.request_id,
  answer: answer,
})
