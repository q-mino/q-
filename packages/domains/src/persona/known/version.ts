import { version } from './_scope_version.ts'

// The version of `known`, the contract of its surface (PER-17, D75.6): the
// one its clients send. No major has passed.

/** A bonded face's surface, the kernel's part, since stage 1: the extensions add theirs (EXT-5). */
export const known = version('1.0.0')
