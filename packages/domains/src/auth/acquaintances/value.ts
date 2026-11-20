import { z } from 'zod'
import { id } from './_scope_value.ts'

// The values of the acquaintances (PER-9, GR-4): whom the node knows, at
// which of its mailboxes, and what it offers them, in auth's own words,
// declared again in the formats of the address book, the post and the
// office of the extensions, which its adapters read. Data, never decisions:
// the comparisons are the nodes' and the kernel's.

/** A face's Ed25519 public key, 32 bytes in base64url with no padding, as the post gives the signer of a letter. */
export const face_key = z.string().regex(/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/)

/** A deposit address D, in the relay's form (MBX-1): base64url, at most 128 characters. A mailbox of the node's user. */
export const deposit_address = z
  .string()
  .regex(/^[A-Za-z0-9_-]+$/)
  .max(128)

/** An extension, by the name its manifest gives it (EXT-3): `greetings`. */
export const extension_name = z
  .string()
  .max(64)
  .regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/)

/** A major of an extension's surface on `known` (PER-17): one it speaks. */
export const major = z.number().int().min(0).max(65_535)

/** The name the user gives a bond: "Bru". Hers, on her node only. */
export const bond_name = z.string().min(1).max(80)

/**
 * The key of every lookup of the acquaintances (F2, PER-13): the face that
 * signed a letter and the mailbox of mine the letter came to, both verified
 * by the post (a letter re-addressed to another mailbox does not open
 * there). Bruno's K_b, at D_mb, the mailbox Anna keeps for him.
 */
export const a_face_at_my_mailbox = z.strictObject({
  face: face_key,
  mailbox: deposit_address,
})

/**
 * The bond kept at a mailbox of mine whose face is that key: Anna's L_b,
 * her face F_a, Bruno's K_b, the name she gives him. What `known` gives its
 * leaves and the extensions' mounted folders, whole.
 */
export const bond_of_a_face = z.strictObject({
  bond_id: id.bond_id,
  my_face_id: id.face_id,
  their_key: face_key,
  name: bond_name,
})

/**
 * What a face presents at a mailbox of mine (BND-7, BND-10): a ready ticket
 * of mine there, or the bond kept there with that face (the crossed QR).
 * What an introduction is for: Carla's ticket, the bond to be L_a, her face
 * F_c, Dario's key K_d. The key is the one the lookup was asked with: the
 * leaf of `unknown` gives the business the verified signer from it, never
 * from the letter's input (PER-8).
 */
export const ticket_a_face_presents = z.strictObject({
  bond_id: id.bond_id,
  my_face_id: id.face_id,
  their_key: face_key,
})

/**
 * The extensions the node offers to a bond (EXT-6, EXT-7), each by its name
 * with the majors of its surface on `known`: greetings, at major 1, to
 * Bruno's bond. Empty when the bond has none offered.
 */
export const extensions_offered = z
  .array(
    z.strictObject({
      extension: extension_name,
      majors: z.array(major).readonly(),
    }),
  )
  .readonly()
