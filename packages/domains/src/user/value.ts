import { z } from 'zod'
import { is_a_json_value } from '../library/index.ts'

// The user's words for what she sees of her node (USR-1, USR-7, USR-8; ADP-2,
// D74): faces, bonds and extensions named by the identities `self`'s reads
// give, never imported (GR-2); what an extension asks, told before she
// activates it (EXT-7); and what happens without a fact, which nothing hides
// from her (F6). The port toward `self` parses these with `self`'s own
// schemas, and links its words to hers with exhaustive maps (GR-3, GR-7).

/** A face of hers, by the identity `self`'s reads give it (`my_faces`). */
export const a_face = z.string().min(1).max(128)

/** A bond of hers, by the identity `self`'s reads give it (`my_bonds`). */
export const a_bond = z.string().min(1).max(128)

/** An extension, by the name its manifest gives it (EXT-3): `ping_pong`. */
export const an_extension = z
  .string()
  .max(64)
  .regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/)

/** A name of the extension's own (an action, a place, an extension point): a business name in snake_case. */
export const a_name = z
  .string()
  .max(64)
  .regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/)

/** An extension's version, as its manifest tells it. */
export const a_version = z
  .string()
  .max(32)
  .regex(/^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$/)

/** A major of an extension's surface. */
export const a_major = z.number().int().min(0).max(65_535)

/** A leaf of an extension on known faces, by its path in its surface (`usecase/ping`). */
export const a_leaf = z
  .string()
  .max(256)
  .regex(/^(?:[a-z0-9_]+\/)*usecase\/[a-z][a-z0-9_]*$/)

/**
 * What a leaf said, as data: its event's name and its payload, a JSON value
 * the screens read (the kernel's events in the kernel's words, an
 * extension's in its texts, EXT-16). Unknown to the types: a recursive JSON
 * type goes too deep for the library's (TS2589), as the post's content.
 */
export const what_it_said = z.strictObject({
  event: z.string().min(1).max(128),
  payload: z.unknown().refine(is_a_json_value, { message: 'a JSON value', abort: true }),
})

/**
 * An extension's manifest as she is shown it before she activates it
 * (EXT-7): what it sees of known faces, what it touches, its extension
 * points, its leaves on known faces, the majors of its surfaces. Her own view
 * of the office's (GR-3), every list a set.
 */
export const a_manifest = z.strictObject({
  name: an_extension,
  version: a_version,
  sees: z.strictObject({
    known: z.array(z.enum(['the_peer_key', 'the_name_of_the_bond'])).max(8),
  }),
  touches: z.array(z.enum(['the_port_of_requests', 'its_storage'])).max(8),
  extension_points: z
    .array(
      z.strictObject({
        point: z.enum(['action', 'slot', 'page']),
        name: a_name,
        place: a_name,
      }),
    )
    .max(64),
  leaves_on_known: z.array(a_leaf).max(64),
  majors: z.strictObject({
    self: z.array(a_major).max(64),
    known: z.array(a_major).max(64),
  }),
})

/**
 * One thing an extension asks, as the notice of its activation tells it
 * (EXT-7): what its manifest declares, and the flaws the kernel cannot fence
 * (the principle of the flaws: told, not hidden). An ADT.
 */
export const what_an_extension_asks = z.discriminatedUnion('asks', [
  /** To see the key of the face of a bond's peer (EXT-3). */
  z.strictObject({ asks: z.literal('to_see_the_peers_key') }),
  /** To see the name she gave a bond. */
  z.strictObject({ asks: z.literal('to_see_the_name_of_the_bond') }),
  /** To send requests on her bonds, in her name (F7). */
  z.strictObject({ asks: z.literal('to_send_requests_on_your_bonds') }),
  /** A storage of its own, which only it reads (EXT-14). */
  z.strictObject({ asks: z.literal('a_storage_of_its_own') }),
  /** To answer the faces she is bonded with, by these leaves (EXT-1). */
  z.strictObject({ asks: z.literal('to_answer_your_bonds'), leaves: z.array(a_leaf) }),
  /** A place on her screens: an action, a slot, a page (EXT-16). */
  z.strictObject({
    asks: z.literal('a_place_on_your_screens'),
    point: z.enum(['action', 'slot', 'page']),
    name: a_name,
    place: a_name,
  }),
  /** A flaw the kernel cannot fence: the network, as far as the browser leaves it open (EXT-13). */
  z.strictObject({ asks: z.literal('the_network_as_far_as_the_browser_leaves_it') }),
  /** A flaw the kernel cannot fence: its frames act with no tap of hers (EXT-16). */
  z.strictObject({ asks: z.literal('its_frames_act_with_no_tap') }),
])

/** Whose a held letter is: an office of the kernel's, or an extension (EXT-2, DOM-15). */
export const whose = z.discriminatedUnion('of', [
  z.strictObject({ of: z.literal('the_kernel'), office: z.string().min(1).max(256) }),
  z.strictObject({ of: z.literal('an_extension'), extension: an_extension }),
])

/**
 * Why a letter is held, in her words (DOM-15, D67): it could not be
 * delivered (what the world said); what came back was refused by the office
 * it returned to; it was done otherwise before, under the same operation; the
 * app could not read what came back.
 */
export const why_it_is_held = z.discriminatedUnion('why', [
  z.strictObject({
    why: z.literal('it_could_not_be_delivered'),
    because: z.string().max(1024),
  }),
  z.strictObject({ why: z.literal('what_came_back_was_refused') }),
  z.strictObject({ why: z.literal('it_was_done_otherwise_before') }),
  z.strictObject({ why: z.literal('the_app_could_not_read_what_came_back') }),
])

/**
 * A held letter, as she is told it (F6, DOM-15): a dead letter of the
 * kernel's executors or reactions, or of an extension's, shown in its mark
 * (EXT-2, EXT-16). The paper's word is never shown (D67). She may send it
 * again or put it aside, activities of hers (USR-8).
 */
export const a_held_letter = z.strictObject({
  whose,
  letter: z.string().min(1).max(512),
  what: z.string().min(1).max(256),
  why: why_it_is_held,
})

/**
 * What happened without a fact, as she is told it (F6, EXT-6, PER-14): a
 * trace entry of the kernel's, of a tree's or of an extension's, in her
 * words. An ADT: the screens tell each in its own way, with when.
 */
export const what_happened_without_a_fact = z.discriminatedUnion('happened', [
  /** A request of a bond met silence: the extension is not there, not active, or not offered to that bond (F8: she is told which). */
  z.strictObject({
    happened: z.literal('a_request_met_silence'),
    bond: a_bond.optional(),
    extension: an_extension,
    because: z.enum([
      'the_extension_is_not_installed',
      'the_extension_is_not_active',
      'the_extension_is_not_offered_to_the_bond',
    ]),
  }),
  /** A letter came that could not be opened (PST-4). */
  z.strictObject({ happened: z.literal('a_letter_could_not_be_opened') }),
  /** A response came that answers no request of hers, or came late (F7, PST-7). */
  z.strictObject({ happened: z.literal('a_response_came_unasked') }),
  /** A letter was refused by the persona it named: its words, its leaf (PER-14). */
  z.strictObject({ happened: z.literal('a_letter_was_refused'), leaf: z.string().max(256) }),
  /** A response of hers could not be sent (PST-9). */
  z.strictObject({ happened: z.literal('a_response_could_not_be_sent') }),
  /** An extension did what its manifest does not declare (EXT-4): a call, an event, a frame's message. */
  z.strictObject({
    happened: z.literal('an_extension_did_what_it_does_not_declare'),
    extension: an_extension,
  }),
  /** An extension fell (EXT-15): the first time it is loaded again, the second it stays stopped. */
  z.strictObject({
    happened: z.literal('an_extension_fell'),
    extension: an_extension,
    fall: z.enum(['the_first', 'the_second']),
  }),
  /** A request to an extension was not answered (it fell, or it was not running). */
  z.strictObject({
    happened: z.literal('a_request_was_not_answered'),
    extension: an_extension,
  }),
])
