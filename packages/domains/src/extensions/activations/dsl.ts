// The pure functions and the constants of the activations (DOM-5): what a
// manifest asks more than the one accepted (EXT-10), whether an extension is
// active (EXT-7), whether it is offered to a bond, how long a question about
// the extensions in common waits, and the meanings of the predicates for
// the adapters.

import type { address_book, value } from './_scope_dsl.ts'

/** How long a question about the extensions in common waits for its answer: 60 seconds, as a ping (F7). */
export const a_question_waits = 60

/** A list as a set: its names in one order, so that two sets compare. */
const as_a_set = (names: readonly string[]): readonly string[] => [...names].toSorted()

/** An extension point as one text, its kind, name and place. */
const the_key_of = (point: value.extension_point): string =>
  `${point.point}/${point.name}/${point.place}`

/** A manifest in one form: every list as a set, every key in one order. */
const in_one_form = (manifest: value.manifest) => ({
  name: manifest.name,
  version: manifest.version,
  sees: { known: as_a_set(manifest.sees.known) },
  touches: as_a_set(manifest.touches),
  extension_points: as_a_set(manifest.extension_points.map(the_key_of)),
  leaves_on_known: as_a_set(manifest.leaves_on_known),
  majors: {
    self: [...manifest.majors.self].toSorted((a, b) => a - b),
    known: [...manifest.majors.known].toSorted((a, b) => a - b),
  },
})

/** Two manifests are the same: field by field, each list as a set (EXT-7: the one shown is the one accepted). */
export const the_same_manifest = (a: value.manifest, b: value.manifest): boolean =>
  JSON.stringify(in_one_form(a)) === JSON.stringify(in_one_form(b))

/** Two lists of majors are the same, as sets. */
export const the_same_majors = (a: readonly number[], b: readonly number[]): boolean =>
  JSON.stringify([...a].toSorted((x, y) => x - y)) ===
  JSON.stringify([...b].toSorted((x, y) => x - y))

/**
 * What the installed manifest asks more than the one the user accepted
 * (EXT-10), in the order the notice shows it: what it sees, what it touches,
 * its extension points, its leaves on `known`. Nothing when it asks no more.
 */
export const what_it_asks_more = (
  accepted: value.manifest,
  installed: value.manifest,
): readonly value.more_asked[] => [
  ...installed.sees.known
    .filter((name) => !accepted.sees.known.includes(name))
    .map((name): value.more_asked => ({ asks: 'to_see_on_known', name })),
  ...installed.touches
    .filter((name) => !accepted.touches.includes(name))
    .map((name): value.more_asked => ({ asks: 'to_touch', name })),
  ...installed.extension_points
    .filter((point) => !accepted.extension_points.map(the_key_of).includes(the_key_of(point)))
    .map((extension_point): value.more_asked => ({ asks: 'an_extension_point', extension_point })),
  ...installed.leaves_on_known
    .filter((leaf) => !accepted.leaves_on_known.includes(leaf))
    .map((leaf): value.more_asked => ({ asks: 'a_leaf_on_known', leaf })),
]

/** The installed manifest asks more than the one accepted (EXT-7): an update the user has not accepted yet. */
export const it_asks_more = (accepted: value.manifest, installed: value.manifest): boolean =>
  what_it_asks_more(accepted, installed).length > 0

/** The user activated the extension, whatever its manifest installed now asks. */
export const the_extension_is_activated = (activation: value.activation | undefined): boolean =>
  activation?.status === 'activated'

/** The user activated the extension accepting this manifest, and has not deactivated it since. */
export const the_extension_is_activated_with = (
  manifest: value.manifest,
  activation: value.activation | undefined,
): boolean => activation?.status === 'activated' && the_same_manifest(activation.accepted, manifest)

/**
 * Whether an installed extension is active (EXT-7): active when the user
 * activated it with a manifest the installed one asks no more than; waiting
 * for the new manifest when it asks more; else not active.
 */
export const the_state_of_an_extension = (
  installed: value.manifest,
  activation: value.activation | undefined,
): value.extension_state => {
  if (activation?.status !== 'activated') return { is: 'not_active' }
  const more = what_it_asks_more(activation.accepted, installed)
  return more.length === 0
    ? { is: 'active' }
    : { is: 'waiting_for_the_new_manifest', asks_more: [...more] }
}

/** The offer of the extension is withdrawn from the bond (EXT-7). */
export const the_offer_is_withdrawn_from = (
  bond: address_book.id.bond_id,
  withdrawn_from: readonly address_book.id.bond_id[],
): boolean => withdrawn_from.includes(bond)

/**
 * The extension is offered to the bond (EXT-7): active, and its offer not
 * withdrawn from the bond. Every bond, present and to come, by default.
 */
export const the_extension_is_offered_to = (
  bond: address_book.id.bond_id,
  state: value.extension_state,
  withdrawn_from: readonly address_book.id.bond_id[],
): boolean => state.is === 'active' && !the_offer_is_withdrawn_from(bond, withdrawn_from)

/** A question with this identity is in the record, whatever came back. */
export const a_question_is_there = (
  the_question: value.question | undefined,
): the_question is value.question => the_question !== undefined

/** The question waits for its answer. */
export const the_question_waits = (the_question: value.question | undefined): boolean =>
  the_question?.progress.stage === 'waiting'

/** The extensions in common came back, as the office reads what came back (EXT-8). */
export const the_extensions_in_common_came_back = (what_came_back: value.what_came_back): boolean =>
  what_came_back.outcome === 'the_extensions_in_common_came_back'
