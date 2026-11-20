import { z } from 'zod'
import { date_time } from '../../library/index.ts'
import { address_book, id } from './_scope_value.ts'

// The values of the activations (EXT-7, EXT-8): the manifest as the user
// accepts it, in the office's own words (GR-3: the kernel's adapter
// translates the boundary's manifest into it, GR-10); what an update asks
// more; what the user did of an extension and of its offers; whether an
// extension is active; the extensions one side offers the other, and the
// questions the node asks a bond about them, with what came back.

/** A name in a manifest (EXT-3): what an extension sees, what it touches, an extension point's, a place's; snake_case. */
export const a_name = z
  .string()
  .max(64)
  .regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/)

/** An extension's version, as its package tells it (EXT-10): major, minor, patch. */
export const extension_version = z
  .string()
  .max(32)
  .regex(/^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$/)

/** A major of a surface (PER-17): one the surface speaks, compatible inside its window. */
export const major = z.number().int().min(0).max(65_535)

/** A leaf, by its path in its surface from the persona's segment (EXT-5, DOM-24): `usecase/greet`. */
export const a_leaf = z
  .string()
  .max(256)
  .regex(/^(?:[a-z0-9_]+\/)*usecase\/[a-z][a-z0-9_]*$/)

/** An extension point, as the user accepts it (EXT-16): an action, a slot or a page, by its name, in its place. */
export const extension_point = z.strictObject({
  point: z.enum(['action', 'slot', 'page']),
  name: a_name,
  place: a_name,
})

/**
 * An extension's manifest as the user accepts it (EXT-3, EXT-7): its name
 * and version; what it sees of the kernel on `known` beside the bond (the
 * peer's key, the bond's name); the kernel's ports it touches; its extension
 * points; its leaves on `known`, by path, at any major, the ways a bond
 * reaches the node through it; and the majors its surfaces speak on each
 * persona (none where it adds no leaf). Each list a set, in no order. The
 * office's own view (GR-3): what is shown and accepted, not the frames'
 * files nor the leaves' schemas, which are the kernel's to enforce (EXT-4).
 */
export const manifest = z.strictObject({
  name: id.extension_name,
  version: extension_version,
  sees: z.strictObject({ known: z.array(a_name).max(16) }),
  touches: z.array(a_name).max(16),
  extension_points: z.array(extension_point).max(64),
  leaves_on_known: z.array(a_leaf).max(256),
  majors: z.strictObject({
    self: z.array(major).max(64),
    known: z.array(major).max(64),
  }),
})

/**
 * What a manifest asks more than the one the user accepted (EXT-10): a name
 * added to what it sees on `known`, or to what it touches; an extension
 * point added (by its kind, name and place: one moved to another place is
 * a new way to appear); a leaf added on `known` (a new way for a bond to
 * reach the node). A leaf on `self`, a new major, a new version or a frame's
 * file ask no more.
 */
export const more_asked = z.discriminatedUnion('asks', [
  z.strictObject({ asks: z.literal('to_see_on_known'), name: a_name }),
  z.strictObject({ asks: z.literal('to_touch'), name: a_name }),
  z.strictObject({ asks: z.literal('an_extension_point'), extension_point }),
  z.strictObject({ asks: z.literal('a_leaf_on_known'), leaf: a_leaf }),
])

/** An extension the user activated (EXT-7), accepting its manifest as shown, at its version, at this instant. */
export const activated_extension = z.strictObject({
  name: id.extension_name,
  status: z.literal('activated'),
  accepted: manifest,
  at: date_time,
})

/** An extension the user deactivated (EXT-7), at this instant. */
export const deactivated_extension = z.strictObject({
  name: id.extension_name,
  status: z.literal('deactivated'),
  at: date_time,
})

/**
 * What the user did last of an extension (EXT-7): activated it, or
 * deactivated it. An extension she never activated has none: preinstalled,
 * it is off.
 */
export const activation = z.discriminatedUnion('status', [
  activated_extension,
  deactivated_extension,
])

/**
 * Whether an installed extension is active (EXT-7, F6): active, activated
 * with a manifest the installed one asks no more than; not active, never
 * activated or deactivated; or waiting for the new manifest, activated with
 * one the installed manifest (an update) asks more than, with what it asks
 * more, until the user accepts it.
 */
export const extension_state = z.discriminatedUnion('is', [
  z.strictObject({ is: z.literal('active') }),
  z.strictObject({ is: z.literal('not_active') }),
  z.strictObject({
    is: z.literal('waiting_for_the_new_manifest'),
    asks_more: z.array(more_asked),
  }),
])

/** An installed extension as the user's screens read it: its name, its manifest as installed, and whether it is active. */
export const extension_card = z.strictObject({
  name: id.extension_name,
  manifest,
  state: extension_state,
})

/** An offer the user withdrew (EXT-7): this extension, from this bond. */
export const withdrawn_offer = z.strictObject({
  name: id.extension_name,
  bond: address_book.id.bond_id,
})

/**
 * An extension one side offers the other (EXT-8), by its name, with the
 * majors of its surface on `known` it speaks: the asker's, the server's.
 */
export const offered_extension = z.strictObject({
  name: id.extension_name,
  majors: z.array(major).max(64),
})

/** The extensions a side offers, or has in common (EXT-8): each named once, a set in no order. */
export const offered_extensions = z
  .array(offered_extension)
  .max(64)
  .refine(
    (offered) => new Set(offered.map((each) => each.name)).size === offered.length,
    'an extension named twice',
  )

/**
 * How long a question about the extensions in common waits for its answer,
 * in seconds (F7): the asker's, at most the seven days a relay keeps a
 * letter (MBX-2).
 */
export const waiting_time = z.number().int().min(1).max(604_800)

/** Why no answer came to a question (EXT-8, D108): no response in its time, or a peer that cannot answer it. */
export const no_answer = z.enum(['no_response', 'the_peer_cannot_answer'])

/**
 * What came back of a question about the extensions in common, the office's
 * own closed set of meanings (EXT-8, EXT-12, D108), never the peer's events:
 * the extensions in common, those of the node's the peer offers back, with
 * the majors it serves; or no answer, with why.
 */
export const what_came_back = z.discriminatedUnion('outcome', [
  z.strictObject({
    outcome: z.literal('the_extensions_in_common_came_back'),
    in_common: offered_extensions,
  }),
  z.strictObject({ outcome: z.literal('no_answer_came_back'), why: no_answer }),
])

/** Where a question stands: waiting for its answer; the extensions in common learned; or no answer. */
export const question_progress = z.discriminatedUnion('stage', [
  z.strictObject({ stage: z.literal('waiting') }),
  z.strictObject({ stage: z.literal('learned'), in_common: offered_extensions }),
  z.strictObject({ stage: z.literal('had_no_answer'), why: no_answer }),
])

/** A question the node asked a bond (EXT-8): what it offered it, and where it stands. */
export const question = z.strictObject({
  id: id.question_id,
  bond: address_book.id.bond_id,
  offered: offered_extensions,
  progress: question_progress,
})
