import { version } from './_scope_version.ts'

// The version of `member`, the contract of its surface (PER-17, D75.6, A, 16
// Nov 2026 (7)): the one its clients send. 2.0.0: a loan is due on a day
// (`due_day`); the leaves of 1.x, over those of 2.0.0, are in `1/`.

/** The member's surface since 4 November 2026: a loan due on a day. */
export const member = version('2.0.0')
