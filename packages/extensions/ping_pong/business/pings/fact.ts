import { z } from 'zod'
import { fact, id, value } from './_scope_fact.ts'

// The facts of `pings` (PNG-2, PNG-3; DOM-6: each names a happening). A
// ping is sent; it closes with one of four happenings, one fact each, since
// the office speaks of them as different happenings (DOM-6's criterion), as
// the office of the extensions learns or has no answer (EXT-8); a ping of a
// bond's is answered with a pong.

/** A ping has been sent to a bond (F7): waiting for its pong. */
export const a_ping_has_been_sent = fact({
  payload: z.strictObject({
    ping: value.ping,
  }),
})

/** The pong of a ping has been received: the bond answered, within the ping's time. */
export const a_pong_has_been_received = fact({
  payload: z.strictObject({
    ping_id: id.ping_id,
    at: value.instant,
  }),
})

/** A ping has had no response within its time: the bond's node was off, did not have ping pong for it, or a letter was lost (F8). */
export const a_ping_has_had_no_response = fact({
  payload: z.strictObject({
    ping_id: id.ping_id,
    at: value.instant,
  }),
})

/** A ping could not be answered: the bond's node answered with no pong (it does not know the bond, or speaks no version of the ping). */
export const a_ping_could_not_be_answered = fact({
  payload: z.strictObject({
    ping_id: id.ping_id,
    at: value.instant,
  }),
})

/** A ping has been called off: the user deactivated ping pong, or withdrew it from the bond, while it waited (EXT-12, F7). */
export const a_ping_has_been_called_off = fact({
  payload: z.strictObject({
    ping_id: id.ping_id,
    at: value.instant,
  }),
})

/** A bond's ping has been answered with a pong. */
export const a_ping_has_been_answered = fact({
  payload: z.strictObject({
    pong: value.pong,
  }),
})
