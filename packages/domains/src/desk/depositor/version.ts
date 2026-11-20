import { version } from './_scope_version.ts'

// The version of `depositor`, the contract of its surface (PER-17, D75.6):
// the one its clients send. No major has passed.

/** The depositor's surface, as the relay has had it since stage 1. */
export const depositor = version('1.0.0')
