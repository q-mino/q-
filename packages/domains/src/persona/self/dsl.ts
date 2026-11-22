// The pure functions of `self` over its values, added at need. DOM-5
//
// A read's projection writes its entry field by field (D45): a value with
// parts is written part by part, so that a part the business adds never
// leaves, and a case it adds stops the projection from compiling.

import type { value } from './_scope_dsl.ts'

/** Where a face of hers sits, as she reads it. */
export const the_position = (position: value.face_position): value.face_position =>
  position.place === 'under_a_face'
    ? { place: 'under_a_face', face_id: position.face_id }
    : { place: 'at_the_top' }

/** Their face, on a bond, as she reads it. */
export const their_face = (face: value.their_face): value.their_face => ({
  key: face.key,
  introduced_as: face.introduced_as,
})

/** A mailbox, as she reads it. */
export const the_mailbox = (mailbox: value.mailbox): value.mailbox => ({
  deposit_address: mailbox.deposit_address,
  relays: mailbox.relays,
})

/** How a bond was made, as she reads it. */
export const the_handshake = (handshake: value.handshake): value.handshake => ({
  way: handshake.way,
  at: handshake.at,
})

/** Whether they have her, as she reads it. */
export const the_confirmation = (confirmation: value.confirmation): value.confirmation =>
  confirmation.state === 'received'
    ? { state: 'received', at: confirmation.at }
    : { state: 'awaited' }

/** An extension point, as she reads it. */
export const the_extension_point = (point: value.extension_point): value.extension_point => ({
  point: point.point,
  name: point.name,
  place: point.place,
})

/** A manifest, as she reads it. */
export const the_manifest = (manifest: value.manifest): value.manifest => ({
  name: manifest.name,
  version: manifest.version,
  sees: { known: manifest.sees.known },
  touches: manifest.touches,
  extension_points: manifest.extension_points.map(the_extension_point),
  leaves_on_known: manifest.leaves_on_known,
  majors: { self: manifest.majors.self, known: manifest.majors.known },
})

/** What an update asks more, as she reads it. */
export const what_it_asks_more = (more: value.more_asked): value.more_asked => {
  switch (more.asks) {
    case 'to_see_on_known':
      return { asks: 'to_see_on_known', name: more.name }
    case 'to_touch':
      return { asks: 'to_touch', name: more.name }
    case 'an_extension_point':
      return {
        asks: 'an_extension_point',
        extension_point: the_extension_point(more.extension_point),
      }
    case 'a_leaf_on_known':
      return { asks: 'a_leaf_on_known', leaf: more.leaf }
  }
}

/** Whether an extension is active, as she reads it. */
export const the_state = (state: value.extension_state): value.extension_state => {
  switch (state.is) {
    case 'active':
      return { is: 'active' }
    case 'not_active':
      return { is: 'not_active' }
    case 'waiting_for_the_new_manifest':
      return {
        is: 'waiting_for_the_new_manifest',
        asks_more: state.asks_more.map(what_it_asks_more),
      }
  }
}

/** Where a question about the extensions in common stands, as the office keeps it (EXT-8). */
type AQuestionsProgress =
  | { readonly stage: 'waiting' }
  | {
      readonly stage: 'learned'
      readonly in_common: readonly {
        readonly name: value.offered_extension['extension']
        readonly majors: value.offered_extension['majors']
      }[]
    }
  | { readonly stage: 'had_no_answer'; readonly why: 'no_response' | 'the_peer_cannot_answer' }

/** What came back of a question about the extensions in common, as she reads it (EXT-8). */
export const the_answer_about_the_extensions_in_common = (
  progress: AQuestionsProgress,
): value.the_answer_about_the_extensions_in_common => {
  switch (progress.stage) {
    case 'waiting':
      return { is: 'waiting' }
    case 'learned':
      return {
        is: 'learned',
        in_common: progress.in_common.map((each) => ({
          extension: each.name,
          majors: each.majors,
        })),
      }
    case 'had_no_answer':
      return { is: 'not_answered', why: progress.why }
  }
}
