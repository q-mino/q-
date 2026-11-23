import { version } from './_scope_version.ts'

// The version of `self`, the contract of its surface (PER-17, D75.6): the
// one its clients send. No major has passed.

/** The user's surface on her own node, as the app has had it since stage 1. */
export const self = version('1.0.0')
