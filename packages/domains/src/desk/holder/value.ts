import { z } from 'zod'

// The values of `holder`, in the holder's words (GR-3): its own, so that its
// surface stays when `deposits` changes (PER-17).

/** An envelope as the holder collects it: sealed, in base64url, at most 64 KiB once decoded. */
export const envelope = z
  .string()
  .regex(/^[A-Za-z0-9_-]+$/)
  .max(87_382)
