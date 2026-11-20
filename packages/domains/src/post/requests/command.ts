import { z } from 'zod'
import {
  command,
  AND,
  NOT,
  pick,
  dsl,
  effect,
  fact,
  id,
  predicate,
  value,
  safe,
  _post,
} from './_scope_command.ts'

/** No request has this identity: the port has not sent it. */
export const the_request_is_new = NOT(predicate.a_request_has_this_id)

/**
 * Anna's ping pong asks Bruno for a pong (F7, PST-5): the kernel's port of
 * requests sends the request on their bond, its identity the one the kernel
 * composed (`dsl.the_identity_of_a_request` of the post), from Anna's face
 * to Bruno's mailbox, for the time her extension waits. The letter is
 * deposited, sent again at each quarter of its time while it waits, and
 * closed with no response when its time is over. Called again under its
 * identity, after a fall, it is the recorded fact (DOM-11): the time stays
 * the one of the first call.
 */
export const send_a_request = command({
  input: z.strictObject({
    request_id: id.request_id,
    from: z.strictObject({ face_id: safe.id.face_id, key: _post.value.face_key }),
    to: z.strictObject({ key: _post.value.face_key, mailbox: _post.value.mailbox }),
    invokes: _post.value.invocation,
    input: _post.value.content,
    waits: value.waiting_time,
  }),
  outcomes: {
    the_request_is_new_so_it_is_sent: [
      the_request_is_new,
      fact.a_request_has_been_sent,
      pick(effect, 'deposit_a_letter', 'wait_to_send_again', 'wait_for_the_response'),
    ],
  },
  creator: (context) => (input) => {
    const until = dsl.the_end_of_a_time(context.now, input.waits)
    const deposit = {
      letter: {
        is: 'a_request' as const,
        schema: 1 as const,
        identity: input.request_id,
        from: input.from.key,
        to: input.to.mailbox.deposit_address,
        declared_at: context.now,
        invokes: input.invokes,
        input: input.input,
      },
      face_id: input.from.face_id,
      their_key: input.to.key,
      relays: input.to.mailbox.relays,
    }
    return {
      the_request_is_new_so_it_is_sent: [
        { request_id: input.request_id },
        {
          sent_request: { id: input.request_id, status: 'waiting', deposit: deposit, until: until },
        },
        {
          deposit_a_letter: {
            id: dsl.the_key_of_a_sending(input.request_id, 0),
            payload: deposit,
          },
          wait_to_send_again: {
            id: dsl.the_key_of_a_sending(input.request_id, 1),
            payload: { request_id: input.request_id, attempt: 1, until: until, deposit: deposit },
            not_before: dsl.the_instant_of_a_sending(context.now, until, 1),
          },
          wait_for_the_response: {
            id: input.request_id,
            payload: { request_id: input.request_id },
            not_before: until,
          },
        },
      ],
    }
  },
})

/** The request waits for its response, and its time is not over. */
export const the_request_waits_within_its_time = AND({
  the_request_is_waiting: predicate.the_request_is_waiting,
  its_time_is_not_over: predicate.the_time_of_the_request_is_not_over,
})

/** The request waits no more: it closed, or its time is over. */
export const the_request_waits_no_more = NOT(the_request_waits_within_its_time)

/**
 * A quarter of the request's time has passed with no response (PST-6): the
 * post deposits the same letter again, under the same identity, so that a
 * response lost on its way comes again (F7: the peer answers from its
 * recorded fact), and waits for the next quarter. Closed, or its time over,
 * nothing is sent. Its input is the payload of the wait; its operation is
 * the entry's (DOM-14).
 */
export const send_a_request_again = command({
  input: z.strictObject({ ...value.sending_again.shape }),
  outcomes: {
    the_request_waits_so_it_is_sent_again: [
      the_request_waits_within_its_time,
      fact.a_request_has_been_sent_again,
      pick(effect, 'deposit_a_letter', 'wait_to_send_again'),
    ],
    the_request_waits_no_more_so_nothing_is_sent: [
      the_request_waits_no_more,
      fact.the_time_to_send_again_came_too_late,
    ],
  },
  creator: (context) => (input) => {
    const checked = {
      the_request_is_waiting: { request_id: input.request_id },
      its_time_is_not_over: { request_id: input.request_id, now: context.now },
    }
    return {
      the_request_waits_so_it_is_sent_again: [
        checked,
        { request_id: input.request_id, attempt: input.attempt },
        {
          deposit_a_letter: {
            id: dsl.the_key_of_a_sending(input.request_id, input.attempt),
            payload: input.deposit,
          },
          wait_to_send_again: {
            id: dsl.the_key_of_a_sending(input.request_id, input.attempt + 1),
            payload: { ...input, attempt: input.attempt + 1 },
            not_before: dsl.the_instant_of_a_sending(
              input.deposit.letter.declared_at,
              input.until,
              input.attempt + 1,
            ),
          },
        },
      ],
      the_request_waits_no_more_so_nothing_is_sent: [checked, { request_id: input.request_id }],
    }
  },
})

/** The request is closed: answered, since only this command closes it otherwise. */
export const the_request_is_closed = NOT(predicate.the_request_is_waiting)

/**
 * Bruno's phone stayed off for the 60 seconds of Anna's ping (PST-7, V18):
 * her request's time is over with no response, which the port gives the
 * delivery as `no_response`. A response came first: nothing changes. Its
 * input is the payload of the wait; its operation is the entry's (DOM-14).
 */
export const close_a_request_with_no_response = command({
  input: z.strictObject({
    request_id: id.request_id,
  }),
  outcomes: {
    the_request_is_waiting_so_it_had_no_response: [
      predicate.the_request_is_waiting,
      fact.a_request_had_no_response,
    ],
    the_request_is_closed_so_nothing_changes: [
      the_request_is_closed,
      fact.the_response_came_before_the_time,
    ],
  },
  creator: () => (input) => ({
    the_request_is_waiting_so_it_had_no_response: [
      { request_id: input.request_id },
      { request_id: input.request_id },
    ],
    the_request_is_closed_so_nothing_changes: [
      { request_id: input.request_id },
      { request_id: input.request_id },
    ],
  }),
})

/** The request waits, and it went to the face that answers. */
export const the_request_waits_for_this_face = AND({
  the_request_is_waiting: predicate.the_request_is_waiting,
  it_went_to_this_face: predicate.the_request_went_to_this_face,
})

/**
 * Bruno's pong comes back to Anna's phone (F7, PST-7): a response from the
 * face her request went to, while it waits, answers it with its event,
 * which the port gives the delivery. The kernel's entry invokes it with an
 * opened response signed by a face (`a_face`), under the response's
 * identity: the same response again is the recorded fact (DOM-11). A second
 * response that differs, a late one, one to no request of the node's or
 * from another face is refused, and the kernel's trace keeps it (EXT-6): no
 * fact of the feature (F2, F6).
 */
export const take_a_response = command({
  input: z.strictObject({
    request_id: id.request_id,
    from: _post.value.face_key,
    event: _post.value.content,
  }),
  outcomes: {
    the_request_waits_for_this_face_so_it_is_answered: [
      the_request_waits_for_this_face,
      fact.a_request_has_been_answered,
    ],
  },
  creator: () => (input) => ({
    the_request_waits_for_this_face_so_it_is_answered: [
      {
        the_request_is_waiting: { request_id: input.request_id },
        it_went_to_this_face: { request_id: input.request_id, key: input.from },
      },
      { request_id: input.request_id, event: input.event },
    ],
  }),
})
