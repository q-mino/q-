import { z } from 'zod'
import { id } from './_scope_value.ts'

// The values of the safe (SEA-1): bytes told in base64url with no padding,
// each of its length, so that a fact, a read and a request carry them as
// JSON, and a value of another length never passes (DOM-21). Each value
// its own schema, built by its form: one object, one path (DOM-24).

/** 32 bytes in base64url: 43 characters, the last of the 16 whose two low bits are zero. */
const thirty_two_bytes = () => z.string().regex(/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/)

/** 64 bytes in base64url: 86 characters, the last of the 4 whose four low bits are zero. */
const sixty_four_bytes = () => z.string().regex(/^[A-Za-z0-9_-]{85}[AQgw]$/)

/** Bytes of any length up to 64 KiB, in base64url (87 382 characters): a length of 1 mod 4 tells no bytes. */
const some_bytes = () =>
  z
    .string()
    .regex(/^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/)
    .max(87_382)

/** The secret of a seed: 32 random bytes, the seed SLIP-0010 takes (A, 6 Nov 2026). */
export const seed_secret = thirty_two_bytes()

/**
 * How the faces of a seed are derived from it (A, 6 Nov 2026): `slip10-flat`,
 * the face at index i is SLIP-0010's hardened child `m/i'` over Ed25519. A
 * scheme to come (a shareable branch, `m/i'/j'`) is another value.
 */
export const seed_scheme = z.enum(['slip10-flat'])

/** The index of a face under its seed: a hardened child, 0 to 2³¹ − 1. */
export const face_index = z.number().int().min(0).max(2_147_483_647)

/** The index the next face of a seed will take: never one already taken (SEA-2); 2³¹ once every index is. */
export const next_index = z.number().int().min(0).max(2_147_483_648)

/** A face's Ed25519 public key: the only key of the safe that leaves it (SEA-6). */
export const public_key = thirty_two_bytes()

/** A face's private key, SLIP-0010's key of its child: the seed of its Ed25519 key pair. */
export const private_key = thirty_two_bytes()

/** A face's chain code, SLIP-0010's: kept for the branches to come (a face as a branch's root). */
export const chain_code = thirty_two_bytes()

/** The keys of a face, as its derivation gives them (`dsl.the_face_at`). */
export const face_keys = z.strictObject({
  public_key: public_key,
  private_key: private_key,
  chain_code: chain_code,
})

/** An Ed25519 signature: 64 bytes. */
export const signature = sixty_four_bytes()

/** What `post` gives the safe to sign or to seal: bytes the safe does not read. */
export const content = some_bytes()

/** A content sealed for a public key (libsodium's sealed box): only that face's private key opens it. */
export const sealed_content = some_bytes()

/** A sealed content tried with a face's private key: opened, with its content, or not (not sealed for that face, or broken). */
export const opening = z.discriminatedUnion('outcome', [
  z.strictObject({ outcome: z.literal('opened'), content: content }),
  z.strictObject({ outcome: z.literal('not_opened') }),
])

/** The collect secret R of a mailbox: 32 random bytes, a bearer credential (V5). */
export const collect_secret = thirty_two_bytes()

/** The deposit address D of a mailbox: BLAKE2b-256 of its collect secret (SEA-4). */
export const deposit_address = thirty_two_bytes()

/** A field a state does not have: in the type, `?: undefined`; in the data, absent. */
const absent = z.undefined().optional()

/**
 * A seed of the node's user (SEA-2): its secret, its scheme and the index its
 * next face will take. Kept in the safe; nothing of it leaves.
 */
export const seed = z.strictObject({
  id: id.seed_id,
  scheme: seed_scheme,
  secret: seed_secret,
  next_index: next_index,
})

/** Being made, its seed is being drawn; made, it has its keys (SEA-3). */
export const face_status = z.enum(['being_made', 'made'])

/** Every field of every state of a face. Not a state: each state subtracts from it. */
const every_face_field = z.strictObject({
  id: id.face_id,
  status: face_status,
  seed_id: id.seed_id,
  index: face_index,
  public_key: public_key,
  private_key: private_key,
  chain_code: chain_code,
})

/** A face asked for, whose seed the safe is drawing: no seed, no keys yet. */
export const face_being_made = every_face_field.extend({
  status: z.literal(face_status.enum.being_made),
  seed_id: absent,
  index: absent,
  public_key: absent,
  private_key: absent,
  chain_code: absent,
})

/** A face with its keys, at its index under its seed. */
export const made_face = every_face_field.extend({
  status: z.literal(face_status.enum.made),
})

/** A face in the safe: its states share every field, so any field reads without narrowing. */
export const face = z.discriminatedUnion('status', [face_being_made, made_face])

/** What leaves the safe of a face: its id and its public key (SEA-6). */
export const face_of_mine = made_face.pick({ id: true, public_key: true })

/** Being drawn, its secret is being drawn; drawn, it has its R and its D (SEA-4). */
export const mailbox_key_status = z.enum(['being_drawn', 'drawn'])

/** Every field of every state of a mailbox key. Not a state: each state subtracts from it. */
const every_mailbox_key_field = z.strictObject({
  id: id.mailbox_key_id,
  status: mailbox_key_status,
  collect_secret: collect_secret,
  deposit_address: deposit_address,
})

/** A mailbox key asked for, whose collect secret the safe is drawing. */
export const mailbox_key_being_drawn = every_mailbox_key_field.extend({
  status: z.literal(mailbox_key_status.enum.being_drawn),
  collect_secret: absent,
  deposit_address: absent,
})

/** A mailbox key with its collect secret R and its deposit address D. */
export const drawn_mailbox_key = every_mailbox_key_field.extend({
  status: z.literal(mailbox_key_status.enum.drawn),
})

/** A mailbox key in the safe: its states share every field. */
export const mailbox_key = z.discriminatedUnion('status', [
  mailbox_key_being_drawn,
  drawn_mailbox_key,
])

/** What the safe gives of a mailbox key to who collects from the relay: R to show, D to name (V5, SEA-4). */
export const key_shown_to_the_relay = drawn_mailbox_key.pick({
  id: true,
  collect_secret: true,
  deposit_address: true,
})
