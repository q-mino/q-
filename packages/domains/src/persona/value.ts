import { z } from 'zod'

// The values of the persona base (PER-4, DOM-25): above every persona, what
// every request takes from the kernel's entry, which builds it from the
// letter the post opened, or from the app. The persona does not see the
// post: its values are its own; it sees auth's lookups and identities only
// (`sight.ts`), so the key and the mailbox are declared again here, in the
// formats of the post and the acquaintances.

/** A face's Ed25519 public key, 32 bytes in base64url with no padding: the key a letter's signature holds for. */
export const face_key = z.string().regex(/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/)

/** A deposit address D, in the relay's form (MBX-1): a mailbox of the node's user, where a letter came. */
export const deposit_address = z
  .string()
  .regex(/^[A-Za-z0-9_-]+$/)
  .max(128)

/**
 * What the post noted of an anonymous letter's signature (PER-2): none, or
 * one that does not hold, with the face it claims, never taken for it. Dario
 * signs with a key, then changes a byte of the letter: "invalid signature,
 * claimed face K_d".
 */
export const annotation = z.discriminatedUnion('signature', [
  z.strictObject({ signature: z.literal('none') }),
  z.strictObject({ signature: z.literal('does_not_hold'), claimed_face: face_key }),
])

/**
 * Who asks (PER-4), as the kernel's entry gives it to every persona, the
 * same whatever the persona; the node of each verifies its own (PER-7).
 * The user of this node, from the app (Anna on her phone); a face, by the
 * key a letter's signature holds for, to the mailbox of mine it came to,
 * both verified by the post (a letter re-addressed to another mailbox does
 * not reach a persona); or anonymous, a letter with no signature or one
 * that does not hold (PER-2), its id the hash of its envelope: with no
 * stable sender, every letter is a new operation (PER-4).
 */
export const caller = z.discriminatedUnion('is', [
  z.strictObject({ is: z.literal('the_user') }),
  z.strictObject({ is: z.literal('a_face'), key: face_key, to_my_mailbox: deposit_address }),
  z.strictObject({
    is: z.literal('anonymous'),
    id: z.string().min(1),
    annotation: annotation,
    to_my_mailbox: deposit_address,
  }),
])
