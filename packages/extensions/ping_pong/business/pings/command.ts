import { z } from 'zod'
import {
  command,
  identity_of,
  AND,
  NOT,
  pick,
  dsl,
  effect,
  fact,
  id,
  predicate,
  value,
} from './_scope_command.ts'

/** No ping has this identity: the node has not sent it. */
export const the_ping_is_new = NOT(predicate.a_ping_has_this_id)

/**
 * Anna pings her bond with Bruno (PNG-2, EXT-16): from the action on their
 * bond's screen, which gives the bond alone, the office sends her ping,
 * named by the operation that sends it, and asks Bruno's node for a pong,
 * waiting 60 seconds. Asked again under the same operation, it is the
 * recorded fact (DOM-11).
 */
export const send_a_ping = command({
  input: z.strictObject({
    bond: id.bond,
  }),
  outcomes: {
    the_ping_is_new_so_it_is_sent: [
      the_ping_is_new,
      fact.a_ping_has_been_sent,
      pick(effect, 'ask_for_a_pong'),
    ],
  },
  creator: (context) => (input) => {
    const ping_id = identity_of(id.ping_id)(context.operation)
    return {
      the_ping_is_new_so_it_is_sent: [
        { ping_id },
        {
          ping: {
            id: ping_id,
            bond: input.bond,
            sent_at: context.now,
            waits: dsl.a_ping_waits,
            progress: { stage: 'waiting' },
          },
        },
        {
          ask_for_a_pong: {
            id: ping_id,
            payload: { ping_id, bond: input.bond, waits: dsl.a_ping_waits },
          },
        },
      ],
    }
  },
})

/** The ping waits, and its pong came back. */
export const the_ping_waits_and_its_pong_came_back = AND({
  the_ping_waits: predicate.the_ping_waits,
  the_pong_came_back: predicate.the_pong_came_back,
})

/** The ping waits, and it had no response within its time. */
export const the_ping_waits_and_had_no_response = AND({
  the_ping_waits: predicate.the_ping_waits,
  it_had_no_response: predicate.the_ping_had_no_response,
})

/** The ping waits, and the peer cannot answer it. */
export const the_ping_waits_and_the_peer_cannot_answer = AND({
  the_ping_waits: predicate.the_ping_waits,
  the_peer_cannot_answer: predicate.the_peer_cannot_answer,
})

/**
 * What came back of Anna's ping closes it (PNG-2, EXT-12, DOM-13): Bruno's
 * pong; no response within its 60 seconds; or a peer that cannot answer
 * it, each a happening of its own. The return of `ask_for_a_pong`, its
 * input the business's closed set; the branch is chosen by what came back,
 * a predicate over the input, as the office of the extensions learns or
 * has no answer (EXT-8). A ping that waits no more (closed, or never sent)
 * is refused: a dead letter of the executor, shown.
 */
export const close_a_ping = command({
  input: z.strictObject({
    ping_id: id.ping_id,
    what_came_back: value.what_came_back,
  }),
  outcomes: {
    the_pong_came_back_so_it_is_received: [
      the_ping_waits_and_its_pong_came_back,
      fact.a_pong_has_been_received,
    ],
    no_response_came_so_the_ping_had_none: [
      the_ping_waits_and_had_no_response,
      fact.a_ping_has_had_no_response,
    ],
    the_peer_cannot_answer_so_the_ping_could_not_be_answered: [
      the_ping_waits_and_the_peer_cannot_answer,
      fact.a_ping_could_not_be_answered,
    ],
  },
  creator: (context) => (input) => {
    const the_ping_waits = { ping_id: input.ping_id }
    const what_came_back = { what_came_back: input.what_came_back }
    const closed = { ping_id: input.ping_id, at: context.now }
    return {
      the_pong_came_back_so_it_is_received: [
        { the_ping_waits, the_pong_came_back: what_came_back },
        closed,
      ],
      no_response_came_so_the_ping_had_none: [
        { the_ping_waits, it_had_no_response: what_came_back },
        closed,
      ],
      the_peer_cannot_answer_so_the_ping_could_not_be_answered: [
        { the_ping_waits, the_peer_cannot_answer: what_came_back },
        closed,
      ],
    }
  },
})

/** No pong has this identity: the node has not answered this request. */
export const the_pong_is_new = NOT(predicate.a_pong_has_this_id)

/**
 * Bruno's node answers Anna's ping with a pong (PNG-3, F7): her ping came
 * on their bond, and the office gives back its pong, named by the
 * operation of her request. Her request sent again is the same operation:
 * the recorded fact, the same pong (DOM-11).
 */
export const answer_a_ping = command({
  input: z.strictObject({
    bond: id.bond,
  }),
  outcomes: {
    the_pong_is_new_so_it_is_given_back: [the_pong_is_new, fact.a_ping_has_been_answered],
  },
  creator: (context) => (input) => {
    const pong_id = identity_of(id.pong_id)(context.operation)
    return {
      the_pong_is_new_so_it_is_given_back: [
        { pong_id },
        { pong: { id: pong_id, bond: input.bond, at: context.now } },
      ],
    }
  },
})
