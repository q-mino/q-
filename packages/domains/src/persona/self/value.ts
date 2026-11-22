import { z } from 'zod'
import { date_time } from '../../library/index.ts'
import { address_book, activations } from './_scope_value.ts'

// The values of `self`, in the user's words (GR-3): its own, even where
// they match the address book's or the office of the extensions', so that
// its surface stays when theirs changes (PER-17). The ids are theirs, which
// the persona sees (`sight.ts`) and the app draws (DOM-12).

/** The name a face of hers is introduced as: "Anna". */
export const face_name = z.string().min(1).max(80)

/** The name she gives a bond: "Bru". Hers, on her phone only. */
export const bond_name = z.string().min(1).max(80)

/** A face's Ed25519 public key, 32 bytes in base64url with no padding: hers, or theirs on a bond. */
export const face_key = z.string().regex(/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/)

/** Where a face of hers sits in her tree of faces (BND-3): at the top, or under another of her faces. */
export const face_position = z.discriminatedUnion('place', [
  z.strictObject({ place: z.literal('at_the_top') }),
  z.strictObject({ place: z.literal('under_a_face'), face_id: address_book.id.face_id }),
])

/** The address of a relay: an `https` URL, `https://relay.q-mino.test`. */
export const relay_address = z.url({ protocol: /^https$/ }).max(2048)

/** The relays of a mailbox: one in stage 1. */
export const relays = z.array(relay_address).min(1).max(1)

/** A deposit address D, in the relay's form (MBX-1): base64url, at most 128 characters. */
export const deposit_address = z
  .string()
  .regex(/^[A-Za-z0-9_-]+$/)
  .max(128)

/** A mailbox: its D and its relays. Bruno's D_b, or hers for him, D_mb. */
export const mailbox = z.strictObject({
  deposit_address: deposit_address,
  relays: relays,
})

/** The secret of a ticket (BND-9): 64 bytes in base64url, 86 characters. */
export const ticket_secret = z.string().regex(/^[A-Za-z0-9_-]{85}[AQgw]$/)

/**
 * A ticket of someone else's, as she opens it (BND-10): Bruno's QR, Carla's
 * link. Their claims (F2): the face by its key and the name it is
 * introduced as, the mailbox of the bond to be, the secret.
 */
export const their_ticket = z.strictObject({
  key: face_key,
  introduced_as: face_name,
  mailbox: mailbox,
  secret: ticket_secret,
})

/** Their face, on a bond: its key and the name it is introduced as. */
export const their_face = z.strictObject({
  key: face_key,
  introduced_as: face_name,
})

/** In person, the crossed QR; at a distance, a link (BND-5). */
export const handshake_way = z.enum(['in_person', 'at_a_distance'])

/** How the bond was made, as her phone saw it (BND-5): in person or at a distance, and when. */
export const handshake = z.strictObject({
  way: handshake_way,
  at: date_time,
})

/** Whether they have her (BND-5): awaited, or received, and when. */
export const confirmation = z.discriminatedUnion('state', [
  z.strictObject({ state: z.literal('awaited') }),
  z.strictObject({ state: z.literal('received'), at: date_time }),
])

/** A name in a manifest (EXT-3): what an extension sees, touches, an extension point's, a place's. */
export const a_name = z
  .string()
  .max(64)
  .regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/)

/** An extension's version: major, minor, patch. */
export const extension_version = z
  .string()
  .max(32)
  .regex(/^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$/)

/** A major of an extension's surface (PER-17). */
export const major = z.number().int().min(0).max(65_535)

/** The majors of an extension's surface. */
export const majors = z.array(major).max(64)

/** A leaf of an extension, by its path from the persona's segment: `usecase/greet`. */
export const a_leaf = z
  .string()
  .max(256)
  .regex(/^(?:[a-z0-9_]+\/)*usecase\/[a-z][a-z0-9_]*$/)

/** An extension point, as she accepts it (EXT-16): an action, a slot or a page, by its name, in its place. */
export const extension_point = z.strictObject({
  point: z.enum(['action', 'slot', 'page']),
  name: a_name,
  place: a_name,
})

/**
 * An extension's manifest, as she is shown it and accepts it (EXT-7):
 * greetings 0.1.0, what it sees on `known`, what it touches, its extension
 * points, its leaves on `known`, the majors of its surfaces.
 */
export const manifest = z.strictObject({
  name: activations.id.extension_name,
  version: extension_version,
  sees: z.strictObject({ known: z.array(a_name).max(16) }),
  touches: z.array(a_name).max(16),
  extension_points: z.array(extension_point).max(64),
  leaves_on_known: z.array(a_leaf).max(256),
  majors: z.strictObject({
    self: majors,
    known: majors,
  }),
})

/** What an update asks more than the manifest she accepted (EXT-10). */
export const more_asked = z.discriminatedUnion('asks', [
  z.strictObject({ asks: z.literal('to_see_on_known'), name: a_name }),
  z.strictObject({ asks: z.literal('to_touch'), name: a_name }),
  z.strictObject({ asks: z.literal('an_extension_point'), extension_point: extension_point }),
  z.strictObject({ asks: z.literal('a_leaf_on_known'), leaf: a_leaf }),
])

/** Whether an extension is active, not active, or waiting for her to accept what an update asks more (EXT-7). */
export const extension_state = z.discriminatedUnion('is', [
  z.strictObject({ is: z.literal('active') }),
  z.strictObject({ is: z.literal('not_active') }),
  z.strictObject({
    is: z.literal('waiting_for_the_new_manifest'),
    asks_more: z.array(more_asked),
  }),
])

/** An extension her node offers a bond, with the majors of its surface on `known`: greetings, at major 1. */
export const offered_extension = z.strictObject({
  extension: activations.id.extension_name,
  majors: majors,
})

/** The extensions her node offers a bond, as she tells them when she asks (EXT-8): each named once. */
export const offered_extensions = z
  .array(offered_extension)
  .max(64)
  .refine(
    (offered) => new Set(offered.map((each) => each.extension)).size === offered.length,
    'an extension named twice',
  )

/**
 * What came back of a question she asked a bond about the extensions in
 * common (EXT-8): nothing yet, the extensions in common (none, maybe), or no
 * answer, with why.
 */
export const the_answer_about_the_extensions_in_common = z.discriminatedUnion('is', [
  z.strictObject({ is: z.literal('waiting') }),
  z.strictObject({ is: z.literal('learned'), in_common: z.array(offered_extension).max(64) }),
  z.strictObject({
    is: z.literal('not_answered'),
    why: z.enum(['no_response', 'the_peer_cannot_answer']),
  }),
])

/** A question she asked a bond about the extensions in common, when, and its answer (EXT-8, UI-5). */
export const a_question_asked = z.strictObject({
  question_id: activations.id.question_id,
  asked_at: date_time,
  answer: the_answer_about_the_extensions_in_common,
})
