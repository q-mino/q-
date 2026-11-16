import { version } from './_scope_version.ts'

// The version of `loans` (PER-17, DOM-22, A, 16 Nov 2026 (7)): the one its
// facts and effects are written at (DOM-10). 2.0.0: a loan is due on a day
// (`due_day`), no longer at an instant; the shapes of 1.x are in `1/`.

/** The loans as the desk keeps them since 4 November 2026: due on a day. */
export const loans = version('2.0.0')
