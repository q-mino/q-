import { z } from 'zod'
import { node, value } from './_scope_node.ts'

// The node of the desk, at the top of the tree of its personas (PER-6,
// D78.7): it takes what the interface gives, the `Caller`, the same whatever
// the hat. It verifies no hat: `holder` and `inviter` verify their own
// (PER-7), and `depositor` and `passer_by` have none: anyone wears them.

/** Whoever comes to the relay's counter, with a collect secret, an inviter's signature, or nothing. */
export const desk = node({
  takes: z.strictObject({ caller: value.caller }),
})
