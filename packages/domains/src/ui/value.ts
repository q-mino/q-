import { z } from 'zod'
import { date_time } from '../library/index.ts'
import { activities, user } from './_scope_value.ts'

// The words of the screens shared by them (UI-1..UI-5; V2, ADP-7, D76): where
// she is, where a gesture takes her, what a gesture asks of her node (a value
// of `user`'s, which the rendering hands to `user`'s use cases), the course of
// what she asked, the places the kernel's screens offer the extensions and the
// mark it draws them in (EXT-16), and what the screens are given to show, in
// their own words (GR-3's form: the rendering links the reads to them). Only
// presentational state: what she asked and what her node keeps are `user`'s.

/** A place of the kernel's screens for an extension point (EXT-16, UI-4), with the data it tells: a bond's screen, with the bond; the extension's own. */
export const a_place = z.discriminatedUnion('place', [
  z.strictObject({ place: z.literal('a_bond'), bond: user.value.a_bond }),
  z.strictObject({ place: z.literal('the_extension'), extension: user.value.an_extension }),
])

/** What a draft of the screens is for: the texts of stage 1 she types (USR-5). */
export const a_draft_for = z.discriminatedUnion('for', [
  z.strictObject({ for: z.literal('the_name_of_my_first_face') }),
  z.strictObject({ for: z.literal('the_name_i_give_a_bond'), bond: user.value.a_bond }),
])

/** What a link or a QR she scanned holds (WEB-1), as the rendering reads it: a ticket, no ticket, or a ticket out of its form. */
export const what_it_holds = z.discriminatedUnion('holds', [
  z.strictObject({ holds: z.literal('a_ticket'), ticket: activities.value.their_ticket }),
  z.strictObject({ holds: z.literal('no_ticket') }),
  z.strictObject({ holds: z.literal('a_ticket_out_of_its_form') }),
])

/** A screen of stage 1, with what it is about (UI-1). */
export const a_screen = z.discriminatedUnion('screen', [
  /** Before her first face (1a of the notes on screens). */
  z.strictObject({ screen: z.literal('the_first_face') }),
  /** The home of stage 1: her contacts (there are no chats before messaging). */
  z.strictObject({ screen: z.literal('my_contacts') }),
  /** A contact: the card of a bond, its extensions and their places (EXT-16). */
  z.strictObject({ screen: z.literal('a_contact'), bond: user.value.a_bond }),
  /** The handshake in person: the crossed QR. */
  z.strictObject({ screen: z.literal('the_handshake_in_person') }),
  /** The handshake at a distance: a link she sends. */
  z.strictObject({ screen: z.literal('the_handshake_at_a_distance') }),
  /** A link of a ticket she opened: their invitation, which she accepts or not; or a link out of its form, which she is told. */
  z.strictObject({ screen: z.literal('an_invitation'), link: what_it_holds }),
  /** The extensions installed. */
  z.strictObject({ screen: z.literal('the_extensions') }),
  /** An extension's own screen: its manifest, its activation, its places and its news (EXT-16). */
  z.strictObject({ screen: z.literal('an_extension'), extension: user.value.an_extension }),
  /** A page of an extension: a screen whose content is the extension's part, in its mark (EXT-16). */
  z.strictObject({
    screen: z.literal('a_page'),
    extension: user.value.an_extension,
    page: user.value.a_name,
    told: a_place,
  }),
  /** What happened: the letters held and what happened without a fact, the kernel's (USR-8). */
  z.strictObject({ screen: z.literal('what_happened') }),
  /** The server: the relay her letters go through, what it declares, what it sees and what not (1c, informative, UI-5). */
  z.strictObject({ screen: z.literal('the_server') }),
])

/** The screens she opened, the last the one shown; back goes to the one before (UI-1). */
export const the_way = z.array(a_screen).min(1).max(32)

/** Where a gesture takes her (UI-1): she stays, a screen opens on top, she goes back, or the way starts again from what her node holds. */
export const where_it_goes = z.discriminatedUnion('goes', [
  z.strictObject({ goes: z.literal('nowhere') }),
  z.strictObject({ goes: z.literal('to_a_screen'), screen: a_screen }),
  z.strictObject({ goes: z.literal('back') }),
  z.strictObject({ goes: z.literal('to_the_start') }),
])

/**
 * What a gesture asks of her node (UI-3), a value of `user`'s: an activity,
 * its id drawn by the rendering at the gesture (DOM-12, WEB-5); a draft kept
 * or dropped; the face she acts as. The rendering hands each to the use case
 * of `user` of its name; `ui` invokes nothing (ADP-7).
 */
export const what_it_asks = z.discriminatedUnion('asks', [
  z.strictObject({
    asks: z.literal('an_activity'),
    activity_id: activities.id.activity_id,
    what: activities.value.what_is_asked,
  }),
  z.strictObject({
    asks: z.literal('to_keep_a_draft'),
    for: a_draft_for,
    text: z.string().max(1024),
  }),
  z.strictObject({ asks: z.literal('to_drop_a_draft'), for: a_draft_for }),
  z.strictObject({ asks: z.literal('to_change_face'), face: user.value.a_face }),
])

/** What a screen asked, as it keeps it: its activity's id, drawn at the gesture, and when (UI-3). */
export const what_it_asked = z.strictObject({
  activity_id: activities.id.activity_id,
  at: date_time,
})

/**
 * The course of what a screen asked (UI-3): nothing yet; in progress; ended,
 * how in her words (USR-3). A screen keeps the id of its activity, and is
 * given the activity as `user` reads it.
 */
export const a_course = z.discriminatedUnion('course', [
  z.strictObject({ course: z.literal('nothing_asked') }),
  z.strictObject({
    course: z.literal('in_progress'),
    activity_id: activities.id.activity_id,
    since: date_time,
  }),
  z.strictObject({
    course: z.literal('ended'),
    activity_id: activities.id.activity_id,
    how: activities.value.how_it_ended,
  }),
])

/**
 * The kernel's mark of an extension on a screen (EXT-16, UI-4): its name and a
 * border, and what it holds there: its actions, data the kernel draws; its
 * slots, parts placed in it; its pages, each opened as a screen; on its own
 * screen, its letters held and what happened to it without a fact (USR-8).
 */
export const a_mark = z.strictObject({
  extension: user.value.an_extension,
  told: a_place,
  actions: z.array(user.value.a_name).max(64),
  slots: z.array(user.value.a_name).max(64),
  pages: z.array(user.value.a_name).max(64),
})

/** The camera of the crossed QR, as the browser gives it (WEB-2): off, on, refused, missing, busy. */
export const the_camera = z.enum(['off', 'on', 'refused', 'missing', 'busy'])

// What the screens are given to show, in their words (GR-3's form): the
// rendering reads `user`, and `self`'s reads through `user`'s port (USR-9),
// and links them here; a field `self` adds fails nowhere, one it drops fails
// at the link.

/** A face of hers, as the screens show it (`my_faces`). */
export const a_face_seen = z.strictObject({
  face: user.value.a_face,
  name: z.string().min(1).max(80),
})

/** How a bond's handshake went, and whether they have her yet (the annotations of `bonds`, BND-4). */
export const the_confirmation = z.discriminatedUnion('state', [
  z.strictObject({ state: z.literal('awaited') }),
  z.strictObject({ state: z.literal('received'), at: date_time }),
])

/** A contact in her list (`my_bonds`): the name she gives it, as it introduced itself, whether it has her yet. */
export const a_contact_seen = z.strictObject({
  bond: user.value.a_bond,
  name: z.string().min(1).max(80),
  introduced_as: z.string().min(1).max(80),
  confirmation: the_confirmation,
})

/** A contact's card (`a_bond`): as in the list, with how they shook hands and the relays of their mailbox. */
export const a_contact_card = z.strictObject({
  bond: user.value.a_bond,
  name: z.string().min(1).max(80),
  introduced_as: z.string().min(1).max(80),
  confirmation: the_confirmation,
  handshake: z.strictObject({ way: z.enum(['in_person', 'at_a_distance']), at: date_time }),
  their_relays: z.array(z.string().min(1).max(2048)).max(8),
})

/** A ticket of hers, ready (`my_ticket`): the bond it opens, until when it holds; the rendering draws its link and its QR (WEB-1, WEB-2). */
export const a_ticket_ready = z.strictObject({
  bond: user.value.a_bond,
  expires_at: date_time,
})

/**
 * An extension, as the screens show it (`an_extension`; `user`'s view of the
 * manifest and what it asks, USR-7): active, not active, or waiting for her
 * to accept a new manifest (EXT-10); the manifest she would accept, and the
 * notice told before she does.
 */
export const an_extension_seen = z.strictObject({
  extension: user.value.an_extension,
  version: user.value.a_version,
  is: z.enum(['active', 'not_active', 'waiting_for_the_new_manifest']),
  manifest: user.value.a_manifest,
  what_it_asks: z.array(user.value.what_an_extension_asks).max(256),
})

// What happens on every screen, beside its own (UI-2).

/** She goes back. */
export const she_goes_back = z.strictObject({ happens: z.literal('she_goes_back') })

/** What the screen asked ended, as `user` reads it (USR-3): the rendering tells the screen once. */
export const what_it_asked_ended = z.strictObject({
  happens: z.literal('what_it_asked_ended'),
  activity_id: activities.id.activity_id,
  how: activities.value.how_it_ended,
})

/** The bonds each extension is offered to (EXT-7, `the_extensions_offered_to_a_bond`), what the places of a bond are drawn from. */
export const the_offers = z
  .array(
    z.strictObject({
      extension: user.value.an_extension,
      bonds: z.array(user.value.a_bond).max(4096),
    }),
  )
  .max(256)

/**
 * What came back of the last question she asked a contact about the
 * extensions in common (EXT-8, UI-5; `self`'s `the_questions_asked_of_a_bond`):
 * none asked; waiting; the extensions in common, by name (none, maybe); or no
 * answer, with why.
 */
export const the_extensions_in_common = z.discriminatedUnion('answer', [
  z.strictObject({ answer: z.literal('not_asked') }),
  z.strictObject({ answer: z.literal('waiting') }),
  z.strictObject({
    answer: z.literal('in_common'),
    extensions: z.array(user.value.an_extension).max(64),
  }),
  z.strictObject({
    answer: z.literal('no_answer'),
    why: z.enum(['no_response', 'the_peer_cannot_answer']),
  }),
])

/**
 * The relay, as her node last met it (UI-5): it answered, or it did not (the
 * relay client's `unreachable`: the request lost, or the relay unheard).
 * Before her node met it, as if it answered.
 */
export const the_relay_met = z.enum(['answered', 'did_not_answer'])

/**
 * The device's network, as her phone tells it (UI-5): no network, for sure,
 * or nothing told (a network says nothing of the relay).
 */
export const the_device_s_network = z.enum(['offline', 'not_told'])

/**
 * The strip over every screen (UI-5): none; no network, when her phone tells
 * it; else the relay that does not answer (her letters wait).
 */
export const a_strip = z.discriminatedUnion('strip', [
  z.strictObject({ strip: z.literal('none') }),
  z.strictObject({ strip: z.literal('no_network') }),
  z.strictObject({ strip: z.literal('the_relay_does_not_answer') }),
])
