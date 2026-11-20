import { version } from './_scope_version.ts'

// The version of `anonymous`, the contract of its surface (PER-17, D75.6):
// the one its clients send. No leaf: every letter that wears it is answered
// `invalid_request` by the tree's ports and traced (F6, PER-14), as no
// surface of the kernel is open to an unsigned letter. Anyone wears it, so
// it has no node to verify it (PER-7). No major has passed.

/** The anonymous persona, as the node has had it since stage 1: no leaf. */
export const anonymous = version('1.0.0')
