import { z } from 'zod'
import { command_use_case_over, pings } from './_scope_usecase.ts'

// The use cases of `known`, the leaves ping pong adds to a bonded face's
// persona (EXT-1), below the kernel's node, which gives the bond the
// request came on (`context.bond`, EXT-11). Each answers in one event: no
// `follows` (F7).

/**
 * Anna's ping reaches Bruno's node on their bond (PNG-3, F7): the office
 * answers it, and the leaf's projection is the pong, the response to her
 * request.
 */
export const ping = command_use_case_over({
  use_case: pings.usecase.answer_a_ping,
  input: z.strictObject({}),
  creator: (context) => () => ({ bond: context.bond }),
  events: {
    pong: z.strictObject({}),
    /** Never in ping pong: a pong is named by its request; a leaf still names its rejection. */
    no_pong: z.strictObject({}),
  },
  projection: {
    the_pong_is_new_so_it_is_given_back: () => ({ event: 'pong', payload: {} }),
    rejected: () => ({ event: 'no_pong', payload: {} }),
  },
})
