// The pure functions of the activities (DOM-5, D74.6): how an activity ends
// when its leaf closes in the library's or the boundary's words, the same for
// every leaf, and the meanings of the predicates for the adapters. The words
// of each leaf of `self` are linked to hers by the port (GR-3's exhaustive
// map, USR-3): their meanings are the contract's.

import type { _user, value } from './_scope_dsl.ts'

/** The base events and the closings of `self`'s node: a fault of the app's composition, never hers (PER-5, PER-14). */
const the_apps_faults: readonly string[] = [
  'invalid_request',
  'version_not_supported',
  'identity_already_used',
  'not_found',
  'refused',
]

/**
 * How an activity ends when its leaf closes in the library's words, or
 * `undefined` when it closed in the leaf's own: the wait over is no longer
 * followed (DOM-3); a base event or a closing of the node, the app cannot do
 * it (D74: every base event named, PER-5).
 */
export const how_a_closing_ends = (
  said: _user.value.what_it_said,
): value.how_it_ended | undefined =>
  said.event === 'the_wait_is_over'
    ? { ended: 'no_longer_followed' }
    : the_apps_faults.includes(said.event)
      ? { ended: 'the_app_cannot_do_it', said }
      : undefined

/** The activity with this id is in progress: asked, and not ended. */
export const the_activity_is_in_progress = (card: value.activity_card): boolean =>
  card.stage.stage === 'in_progress'
