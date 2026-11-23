import { z } from 'zod'

// The values of `depositor`, in the depositor's words (GR-3): its own, even
// where they match the mailbox's, so that its surface stays when `deposits`
// changes (PER-17).

/** An envelope as a depositor leaves it: sealed, in base64url, at most 64 KiB once decoded. */
export const envelope = z
  .string()
  .regex(/^[A-Za-z0-9_-]+$/)
  .max(87_382)
