import { z } from 'zod'
import { node, value } from './_scope_node.ts'

// The node of the desk, at the top of the tree of both its personas (PER-6,
// D78.7): it takes what the interface gives, the `Caller`, the same whatever
// the hat. It verifies no hat: `holder` verifies its own (PER-7), and
// `depositor` has none: anyone wears it.

/** Whoever comes to the relay's counter, with a collect secret or with nothing. */
export const desk = node({
  takes: z.strictObject({ caller: value.caller }),
})
