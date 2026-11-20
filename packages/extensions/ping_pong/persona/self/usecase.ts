import { z } from 'zod'
import { command_use_case_over, pings } from './_scope_usecase.ts'

// The use cases of `self`, the leaves ping pong adds to the local user's
// persona (EXT-1, EXT-16), below the kernel's node, which gives the root's
// context alone (EXT-11).

/**
 * Anna taps "Ping" on the screen of her bond with Bruno (PNG-4, EXT-16):
 * the action invokes this leaf with the place's data, the bond, and her
 * ping goes. Her screen follows it to what comes back (DOM-3, F7): Bruno's
 * pong, no response within its time, or a peer that cannot answer, each a
 * fact the return records with the correlation of her ping; or, after 70
 * seconds, the wait over, which records nothing (the ping's own 60 seconds
 * and the executor's delivery before them).
 */
export const send_a_ping = command_use_case_over({
  use_case: pings.usecase.send_a_ping,
  input: z.strictObject({ bond: pings.id.bond }),
  creator: () => (input) => ({ bond: input.bond }),
  events: {
    the_ping_is_sent: z.strictObject({ ping_id: pings.id.ping_id }),
    /** Never in ping pong: a ping is named by its operation; a leaf still names its rejection. */
    the_ping_cannot_be_sent: z.strictObject({}),
    pong: z.strictObject({ ping_id: pings.id.ping_id }),
    no_response: z.strictObject({ ping_id: pings.id.ping_id }),
    the_peer_cannot_answer: z.strictObject({ ping_id: pings.id.ping_id }),
  },
  ends: ['the_ping_cannot_be_sent', 'pong', 'no_response', 'the_peer_cannot_answer'],
  projection: {
    the_ping_is_new_so_it_is_sent: (fact) => ({
      event: 'the_ping_is_sent',
      payload: { ping_id: fact.ping.id },
    }),
    rejected: () => ({ event: 'the_ping_cannot_be_sent', payload: {} }),
  },
  follows: {
    facts: [
      pings.fact.a_pong_has_been_received,
      pings.fact.a_ping_has_had_no_response,
      pings.fact.a_ping_could_not_be_answered,
    ],
    projection: {
      a_pong_has_been_received: (fact) => ({
        event: 'pong',
        payload: { ping_id: fact.ping_id },
      }),
      a_ping_has_had_no_response: (fact) => ({
        event: 'no_response',
        payload: { ping_id: fact.ping_id },
      }),
      a_ping_could_not_be_answered: (fact) => ({
        event: 'the_peer_cannot_answer',
        payload: { ping_id: fact.ping_id },
      }),
    },
    at_most: 70_000,
  },
})
