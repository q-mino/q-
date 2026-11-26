// The pure functions of the user domain (DOM-5, D74.6): what an extension
// asks, told before she activates it (EXT-7, USR-7).

import type { value } from './_scope_dsl.ts'

/** Each place on her screens a manifest declares. */
const the_places_of = (manifest: value.a_manifest): readonly value.what_an_extension_asks[] =>
  manifest.extension_points.map((point) => ({
    asks: 'a_place_on_your_screens',
    point: point.point,
    name: point.name,
    place: point.place,
  }))

/**
 * What an extension asks, in the order the notice tells it: what it sees,
 * what it touches, the faces it answers, its places on her screens; then the
 * flaws the kernel cannot fence: all that Cumino reaches, always (an
 * extension the app ships runs integrated, in its process: what it declares
 * informs, it does not fence, EXT-13), and its parts' invocations with no
 * tap, when it has a slot or a page (EXT-16).
 */
export const what_an_extension_asks = (
  manifest: value.a_manifest,
): readonly value.what_an_extension_asks[] => {
  const sees: readonly value.what_an_extension_asks[] = manifest.sees.known.map(
    (seen): value.what_an_extension_asks =>
      seen === 'the_peer_key'
        ? { asks: 'to_see_the_peers_key' }
        : seen === 'the_name_of_the_bond'
          ? { asks: 'to_see_the_name_of_the_bond' }
          : { asks: 'to_see_the_time_they_declare' },
  )
  const touches: readonly value.what_an_extension_asks[] = manifest.touches.map((touched) =>
    touched === 'the_port_of_requests'
      ? { asks: 'to_send_requests_on_your_bonds' }
      : { asks: 'a_storage_of_its_own' },
  )
  const answers: readonly value.what_an_extension_asks[] =
    manifest.leaves_on_known.length > 0
      ? [{ asks: 'to_answer_your_bonds', leaves: manifest.leaves_on_known }]
      : []
  const it_has_parts = manifest.extension_points.some((point) => point.point !== 'action')
  const parts: readonly value.what_an_extension_asks[] = it_has_parts
    ? [{ asks: 'its_parts_act_with_no_tap' }]
    : []
  return [
    ...sees,
    ...touches,
    ...answers,
    ...the_places_of(manifest),
    { asks: 'all_that_cumino_reaches' },
    ...parts,
  ]
}
