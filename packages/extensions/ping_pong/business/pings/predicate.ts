import { z } from 'zod'
import { predicate, id, value } from './_scope_predicate.ts'

// The vocabulary of the conditions. A predicate declares its parameters;
// its value is the adapters', helped by dsl.ts.

/** A ping with this identity has been sent, whatever came back. */
export const a_ping_has_this_id = predicate({
  parameters: z.strictObject({
    ping_id: id.ping_id,
  }),
})

/** This ping waits for what comes back: sent, not closed. */
export const the_ping_waits = predicate({
  parameters: z.strictObject({
    ping_id: id.ping_id,
  }),
})

/** What came back of a ping is its pong: a predicate over what the return is given, its meaning the dsl's. */
export const the_pong_came_back = predicate({
  parameters: z.strictObject({
    what_came_back: value.what_came_back,
  }),
})

/** What came back of a ping is no response within its time. */
export const the_ping_had_no_response = predicate({
  parameters: z.strictObject({
    what_came_back: value.what_came_back,
  }),
})

/** What came back of a ping is a peer that cannot answer it. */
export const the_peer_cannot_answer = predicate({
  parameters: z.strictObject({
    what_came_back: value.what_came_back,
  }),
})

/** What came back of a ping is its calling off, the user's own gesture. */
export const the_ping_was_called_off = predicate({
  parameters: z.strictObject({
    what_came_back: value.what_came_back,
  }),
})

/** A pong with this identity has been given back. */
export const a_pong_has_this_id = predicate({
  parameters: z.strictObject({
    pong_id: id.pong_id,
  }),
})
