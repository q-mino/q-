import { version } from './_scope_version.ts'

// The version of `inviter`, the contract of its surface (PER-17, D75.6):
// the one its clients send. No major has passed.

/** The inviter's surface, as the relay has had it since the assistant (27 Nov 2026). */
export const inviter = version('1.0.0')
