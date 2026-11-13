import { z } from 'zod'
import { caller } from './_value.ts'
import { above } from './_above.ts'

// The node of the persona base (PER-6, D78.7), at the top of the tree of every
// persona: it takes what the entry gives, the `Caller`, the same whatever the
// hat. Above the hats it gives context, never leaves (D78), and verifies no
// hat: the node of each persona verifies its own (PER-7); `visitor` has none,
// and anyone wears it.

/** Whoever asks, Marta signed in or Luca with no account: the `Caller`, verified. */
export const persona = above.node({
  takes: z.strictObject({ caller: caller }),
})
