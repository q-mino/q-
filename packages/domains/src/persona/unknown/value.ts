import { z } from 'zod'

// The values of `unknown`, in the words of a face that introduces itself
// (GR-3): its own, even where they match the address book's, so that its
// surface stays when the address book changes (PER-17).

/** The name the face is introduced as: "Dario". Its user's, shown to whoever it bonds with. */
export const face_name = z.string().min(1).max(80)

/** The address of a relay: an `https` URL. */
export const relay_address = z.url({ protocol: /^https$/ }).max(2048)

/** The relays of a mailbox: one in stage 1. */
export const relays = z.array(relay_address).min(1).max(1)

/** A deposit address D, in the relay's form (MBX-1): base64url, at most 128 characters. */
export const deposit_address = z
  .string()
  .regex(/^[A-Za-z0-9_-]+$/)
  .max(128)

/** The face's mailbox for the bond, as it declares it (F2): where the node it introduces itself to deposits for it. */
export const mailbox = z.strictObject({
  deposit_address: deposit_address,
  relays: relays,
})

/** The secret of the ticket presented (BND-9): 64 bytes in base64url, 86 characters. */
export const ticket_secret = z.string().regex(/^[A-Za-z0-9_-]{85}[AQgw]$/)
