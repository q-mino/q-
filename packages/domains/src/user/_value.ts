// generated

// The values of `user` from `value.ts` (DOM-25): the same objects under the
// same names, each schema with its output type under the same name, so that one
// import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * A face of hers, by the identity `self`'s reads give it (`my_faces`).
 *
 * @see {@link value.a_face}
 */
export const a_face = value.a_face
export type a_face = z.output<typeof a_face>

/**
 * A bond of hers, by the identity `self`'s reads give it (`my_bonds`).
 *
 * @see {@link value.a_bond}
 */
export const a_bond = value.a_bond
export type a_bond = z.output<typeof a_bond>

/**
 * An extension, by the name its manifest gives it (EXT-3): `ping_pong`.
 *
 * @see {@link value.an_extension}
 */
export const an_extension = value.an_extension
export type an_extension = z.output<typeof an_extension>

/**
 * A name of the extension's own (an action, a place, an extension point): a business name in snake_case.
 *
 * @see {@link value.a_name}
 */
export const a_name = value.a_name
export type a_name = z.output<typeof a_name>

/**
 * An extension's version, as its manifest tells it.
 *
 * @see {@link value.a_version}
 */
export const a_version = value.a_version
export type a_version = z.output<typeof a_version>

/**
 * A major of an extension's surface.
 *
 * @see {@link value.a_major}
 */
export const a_major = value.a_major
export type a_major = z.output<typeof a_major>

/**
 * A leaf of an extension on known faces, by its path in its surface (`usecase/ping`).
 *
 * @see {@link value.a_leaf}
 */
export const a_leaf = value.a_leaf
export type a_leaf = z.output<typeof a_leaf>

/**
 * What a leaf said, as data: its event's name and its payload, a JSON value
 * the screens read (the kernel's events in the kernel's words, an
 * extension's in its texts, EXT-16). Unknown to the types: a recursive JSON
 * type goes too deep for the library's (TS2589), as the post's content.
 *
 * @see {@link value.what_it_said}
 */
export const what_it_said = value.what_it_said
export type what_it_said = z.output<typeof what_it_said>

/**
 * An extension's manifest as she is shown it before she activates it
 * (EXT-7): what it sees of known faces, what it touches, its extension
 * points, its leaves on known faces, the majors of its surfaces. Her own view
 * of the office's (GR-3), every list a set.
 *
 * @see {@link value.a_manifest}
 */
export const a_manifest = value.a_manifest
export type a_manifest = z.output<typeof a_manifest>

/**
 * One thing an extension asks, as the notice of its activation tells it
 * (EXT-7): what its manifest declares, and the flaws the kernel cannot fence
 * (the principle of the flaws: told, not hidden). An ADT.
 *
 * @see {@link value.what_an_extension_asks}
 */
export const what_an_extension_asks = value.what_an_extension_asks
export type what_an_extension_asks = z.output<typeof what_an_extension_asks>

/**
 * Whose a held letter is: an office of the kernel's, or an extension (EXT-2, DOM-15).
 *
 * @see {@link value.whose}
 */
export const whose = value.whose
export type whose = z.output<typeof whose>

/**
 * Why a letter is held, in her words (DOM-15, D67): it could not be
 * delivered (what the world said); what came back was refused by the office
 * it returned to; it was done otherwise before, under the same operation; the
 * app could not read what came back.
 *
 * @see {@link value.why_it_is_held}
 */
export const why_it_is_held = value.why_it_is_held
export type why_it_is_held = z.output<typeof why_it_is_held>

/**
 * A held letter, as she is told it (F6, DOM-15): a dead letter of the
 * kernel's executors or reactions, or of an extension's, shown in its mark
 * (EXT-2, EXT-16). The paper's word is never shown (D67). She may send it
 * again or put it aside, activities of hers (USR-8).
 *
 * @see {@link value.a_held_letter}
 */
export const a_held_letter = value.a_held_letter
export type a_held_letter = z.output<typeof a_held_letter>

/**
 * What happened without a fact, as she is told it (F6, EXT-6, PER-14): a
 * trace entry of the kernel's, of a tree's or of an extension's, in her
 * words. An ADT: the screens tell each in its own way, with when.
 *
 * @see {@link value.what_happened_without_a_fact}
 */
export const what_happened_without_a_fact = value.what_happened_without_a_fact
export type what_happened_without_a_fact = z.output<typeof what_happened_without_a_fact>
