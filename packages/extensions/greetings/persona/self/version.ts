import { version } from './_scope_version.ts'

// The version of the surface the test extension adds to `self` (EXT-5,
// PER-17): the one its frames and the kernel's actions send. No major has
// passed.

/** The greetings on the local user's persona, since part 12.4. */
export const self = version('1.0.0')
