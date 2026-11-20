import { z } from 'zod'
import { node, value } from './_scope_node.ts'

// The node of the persona base (PER-6, D78.7), at the top of the tree of
// every persona of the kernel: it takes what the kernel's entry gives, the
// `Caller`, the same whatever the persona. It verifies no hat: the node of
// each persona verifies its own (PER-7): `self` the user, `known` the bond
// of the face, `unknown` the ticket it presents; `anonymous` has none, and
// anyone wears it.

/** Whoever asks Anna's node: Anna on her phone, Bruno's face by a letter, an unsigned letter. */
export const persona = node({
  takes: z.strictObject({ caller: value.caller }),
})
