import { version } from './_scope_version.ts'

// The version of `unknown`, the contract of its surface (PER-17, D75.6): the
// one its clients send. No major has passed.

/** A face's surface at a ticket of the user's, since stage 1: the introduction. */
export const unknown = version('1.0.0')
