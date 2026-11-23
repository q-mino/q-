// generated

// The values of `extensions/activations` from `value.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * A name in a manifest (EXT-3): what an extension sees, what it touches, an extension point's, a place's; snake_case.
 *
 * @see {@link value.a_name}
 */
export const a_name = value.a_name
export type a_name = z.output<typeof a_name>

/**
 * An extension's version, as its package tells it (EXT-10): major, minor, patch.
 *
 * @see {@link value.extension_version}
 */
export const extension_version = value.extension_version
export type extension_version = z.output<typeof extension_version>

/**
 * A major of a surface (PER-17): one the surface speaks, compatible inside its window.
 *
 * @see {@link value.major}
 */
export const major = value.major
export type major = z.output<typeof major>

/**
 * A leaf, by its path in its surface from the persona's segment (EXT-5, DOM-24): `usecase/greet`.
 *
 * @see {@link value.a_leaf}
 */
export const a_leaf = value.a_leaf
export type a_leaf = z.output<typeof a_leaf>

/**
 * An extension point, as the user accepts it (EXT-16): an action, a slot or a page, by its name, in its place.
 *
 * @see {@link value.extension_point}
 */
export const extension_point = value.extension_point
export type extension_point = z.output<typeof extension_point>

/**
 * An extension's manifest as the user accepts it (EXT-3, EXT-7): its name
 * and version; what it sees of the kernel on `known` beside the bond (the
 * peer's key, the bond's name); the kernel's ports it touches; its extension
 * points; its leaves on `known`, by path, at any major, the ways a bond
 * reaches the node through it; and the majors its surfaces speak on each
 * persona (none where it adds no leaf). Each list a set, in no order. The
 * office's own view (GR-3): what is shown and accepted, not the frames'
 * files nor the leaves' schemas, which are the kernel's to enforce (EXT-4).
 *
 * @see {@link value.manifest}
 */
export const manifest = value.manifest
export type manifest = z.output<typeof manifest>

/**
 * What a manifest asks more than the one the user accepted (EXT-10): a name
 * added to what it sees on `known`, or to what it touches; an extension
 * point added (by its kind, name and place: one moved to another place is
 * a new way to appear); a leaf added on `known` (a new way for a bond to
 * reach the node). A leaf on `self`, a new major, a new version or a frame's
 * file ask no more.
 *
 * @see {@link value.more_asked}
 */
export const more_asked = value.more_asked
export type more_asked = z.output<typeof more_asked>

/**
 * An extension the user activated (EXT-7), accepting its manifest as shown, at its version, at this instant.
 *
 * @see {@link value.activated_extension}
 */
export const activated_extension = value.activated_extension
export type activated_extension = z.output<typeof activated_extension>

/**
 * An extension the user deactivated (EXT-7), at this instant.
 *
 * @see {@link value.deactivated_extension}
 */
export const deactivated_extension = value.deactivated_extension
export type deactivated_extension = z.output<typeof deactivated_extension>

/**
 * What the user did last of an extension (EXT-7): activated it, or
 * deactivated it. An extension she never activated has none: preinstalled,
 * it is off.
 *
 * @see {@link value.activation}
 */
export const activation = value.activation
export type activation = z.output<typeof activation>

/**
 * Whether an installed extension is active (EXT-7, F6): active, activated
 * with a manifest the installed one asks no more than; not active, never
 * activated or deactivated; or waiting for the new manifest, activated with
 * one the installed manifest (an update) asks more than, with what it asks
 * more, until the user accepts it.
 *
 * @see {@link value.extension_state}
 */
export const extension_state = value.extension_state
export type extension_state = z.output<typeof extension_state>

/**
 * An installed extension as the user's screens read it: its name, its manifest as installed, and whether it is active.
 *
 * @see {@link value.extension_card}
 */
export const extension_card = value.extension_card
export type extension_card = z.output<typeof extension_card>

/**
 * An offer the user withdrew (EXT-7): this extension, from this bond.
 *
 * @see {@link value.withdrawn_offer}
 */
export const withdrawn_offer = value.withdrawn_offer
export type withdrawn_offer = z.output<typeof withdrawn_offer>

/**
 * An extension one side offers the other (EXT-8), by its name, with the
 * majors of its surface on `known` it speaks: the asker's, the server's.
 *
 * @see {@link value.offered_extension}
 */
export const offered_extension = value.offered_extension
export type offered_extension = z.output<typeof offered_extension>

/**
 * The extensions a side offers, or has in common (EXT-8): each named once, a set in no order.
 *
 * @see {@link value.offered_extensions}
 */
export const offered_extensions = value.offered_extensions
export type offered_extensions = z.output<typeof offered_extensions>

/**
 * How long a question about the extensions in common waits for its answer,
 * in seconds (F7): the asker's, at most the seven days a relay keeps a
 * letter (MBX-2).
 *
 * @see {@link value.waiting_time}
 */
export const waiting_time = value.waiting_time
export type waiting_time = z.output<typeof waiting_time>

/**
 * Why no answer came to a question (EXT-8, D108): no response in its time, or a peer that cannot answer it.
 *
 * @see {@link value.no_answer}
 */
export const no_answer = value.no_answer
export type no_answer = z.output<typeof no_answer>

/**
 * What came back of a question about the extensions in common, the office's
 * own closed set of meanings (EXT-8, EXT-12, D108), never the peer's events:
 * the extensions in common, those of the node's the peer offers back, with
 * the majors it serves; or no answer, with why.
 *
 * @see {@link value.what_came_back}
 */
export const what_came_back = value.what_came_back
export type what_came_back = z.output<typeof what_came_back>

/**
 * Where a question stands: waiting for its answer; the extensions in common learned; or no answer.
 *
 * @see {@link value.question_progress}
 */
export const question_progress = value.question_progress
export type question_progress = z.output<typeof question_progress>

/**
 * A question the node asked a bond (EXT-8): what it offered it, when, and where it stands.
 *
 * @see {@link value.question}
 */
export const question = value.question
export type question = z.output<typeof question>
