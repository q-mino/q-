import { version } from './_scope_version.ts'

// The version of `visitor`, the contract of its surface (PER-17, D75.6, A, 16
// Nov 2026 (7)): the one its clients send. No major has passed.

/** The visitor's surface, as the shed has had it since it opened. */
export const visitor = version('1.0.0')
