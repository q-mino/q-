// The pure functions and the constants of `pings` (DOM-5): how long a ping
// waits, the meanings of its predicates for the adapters.

import type { value } from './_scope_dsl.ts'

/** How long a ping waits for its pong: 60 seconds (F7). */
export const a_ping_waits = 60

/** A ping with this identity is in the record, whatever came back. */
export const a_ping_is_there = (the_ping: value.ping | undefined): the_ping is value.ping =>
  the_ping !== undefined

/** The ping waits for what comes back. */
export const the_ping_waits = (the_ping: value.ping | undefined): boolean =>
  the_ping?.progress.stage === 'waiting'

/** What came back is this meaning: the value of `the_pong_came_back`, `the_ping_had_no_response`, `the_peer_cannot_answer`. */
export const what_came_back_is =
  (meaning: value.what_came_back) =>
  (what_came_back: value.what_came_back): boolean =>
    what_came_back === meaning

/** The record of a ping closed with what came back, at that time. */
export const closed_with =
  (what_came_back: value.what_came_back, at: value.ping['sent_at']) =>
  (the_ping: value.ping): value.ping => ({
    ...the_ping,
    progress: { stage: 'closed', what_came_back, at },
  })
