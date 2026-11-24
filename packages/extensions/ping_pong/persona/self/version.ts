import { version } from './_scope_version.ts'

// The version of the surface ping pong adds to `self` (EXT-5, PER-17): the
// one its parts and the kernel's actions send. No major has passed.

/** The pings on the local user's persona, since part 14.1. */
export const self = version('1.0.0')
