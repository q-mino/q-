import { z } from 'zod'

// The values of `passer_by`, in the passer-by's words (GR-3): its own, so
// that its surface stays when `invitations` changes (PER-17).

/** A ticket as a passer-by takes it: the text after `ticket=` in its link, base64url, at most 4 096 characters. */
export const ticket = z
  .string()
  .regex(/^[A-Za-z0-9_-]+$/)
  .max(4096)
