import { z } from 'zod'
import { date_time } from '../../library/index.ts'
import { _user, id } from './_scope_value.ts'

// The values of the activities (USR-1..USR-4): what she asks her node, in her
// words, and how it ended (ADP-2, D74).

/** Their ticket, as she scanned it or opened its link (BND-7, WEB-1), in her words. */
export const their_ticket = z.strictObject({
  key: z.string().min(1).max(128),
  introduced_as: z.string().min(1).max(64),
  mailbox: z.strictObject({
    deposit_address: z.string().min(1).max(128),
    relays: z.array(z.string().min(1).max(512)).min(1).max(8),
  }),
  secret: z.string().min(1).max(256),
})

/** The extensions her node offers a bond, with the majors it speaks (EXT-8), as `self` reads them. */
export const offered = z
  .array(
    z.strictObject({
      extension: _user.value.an_extension,
      majors: z.array(_user.value.a_major).max(64),
    }),
  )
  .max(64)

/** Where an action is drawn (EXT-16): on a bond's screen, with the bond; on the extension's own. */
export const the_place = z.discriminatedUnion('place', [
  z.strictObject({ place: z.literal('a_bond'), bond: _user.value.a_bond }),
  z.strictObject({ place: z.literal('the_extension') }),
])

/**
 * What she asks her node (USR-2), an ADT: one case per gesture of the
 * kernel's screens, each a leaf of `self` it is carried out by, with its
 * input in her words; an action of an extension, as data (GR-7, EXT-16); and
 * the two gestures on a held letter (USR-8). A closed set the kernel's
 * screens grow with; an extension's actions are data, an open set.
 */
export const what_is_asked = z.discriminatedUnion('activity', [
  z.strictObject({
    activity: z.literal('make_my_first_face'),
    face: _user.value.a_face,
    name: z.string().min(1).max(64),
  }),
  z.strictObject({
    activity: z.literal('prepare_a_ticket'),
    bond: _user.value.a_bond,
    face: _user.value.a_face,
  }),
  z.strictObject({
    activity: z.literal('open_their_ticket'),
    bond: _user.value.a_bond,
    their_ticket,
    name: z.string().min(1).max(64),
  }),
  z.strictObject({
    activity: z.literal('rename_a_bond'),
    bond: _user.value.a_bond,
    name: z.string().min(1).max(64),
  }),
  z.strictObject({ activity: z.literal('remove_a_bond'), bond: _user.value.a_bond }),
  z.strictObject({
    activity: z.literal('activate_an_extension'),
    manifest: _user.value.a_manifest,
  }),
  z.strictObject({
    activity: z.literal('deactivate_an_extension'),
    extension: _user.value.an_extension,
  }),
  z.strictObject({
    activity: z.literal('withdraw_the_offer_from_a_bond'),
    extension: _user.value.an_extension,
    bond: _user.value.a_bond,
  }),
  z.strictObject({
    activity: z.literal('offer_an_extension_to_a_bond'),
    extension: _user.value.an_extension,
    bond: _user.value.a_bond,
  }),
  z.strictObject({
    activity: z.literal('ask_a_bond_for_the_extensions_in_common'),
    bond: _user.value.a_bond,
    offered,
  }),
  z.strictObject({
    activity: z.literal('use_an_action'),
    extension: _user.value.an_extension,
    action: _user.value.a_name,
    on: the_place,
  }),
  z.strictObject({
    activity: z.literal('send_a_held_letter_again'),
    whose: _user.value.whose,
    letter: z.string().min(1).max(512),
  }),
  z.strictObject({
    activity: z.literal('put_a_held_letter_aside'),
    whose: _user.value.whose,
    letter: z.string().min(1).max(512),
    because: z.string().max(1024),
  }),
])

/**
 * How an activity ended (USR-3), in her words, an ADT (ADP-2, D74): the
 * meaning is the contract's, the name hers. `done`, `done_already` and
 * `cannot_be_done` are what the kernel's leaf said;
 * `the_extension_told_how_it_ended` an event of the extension's own, an
 * answer or none (a pong, `no_response`), whose meaning its texts tell
 * (EXT-16);
 * `no_longer_followed` the leaf's wait over before its end (DOM-3);
 * `the_extension_cannot_be_reached` an extension not active, or stopped
 * after its second fall (EXT-15); `the_app_cannot_do_it` a base event or a
 * closing of `self`'s node, a fault of the app, never hers.
 */
export const how_it_ended = z.discriminatedUnion('ended', [
  z.strictObject({ ended: z.literal('done'), said: _user.value.what_it_said }),
  z.strictObject({ ended: z.literal('done_already'), said: _user.value.what_it_said }),
  z.strictObject({ ended: z.literal('cannot_be_done'), said: _user.value.what_it_said }),
  z.strictObject({
    ended: z.literal('the_extension_told_how_it_ended'),
    said: _user.value.what_it_said,
  }),
  z.strictObject({ ended: z.literal('no_longer_followed') }),
  z.strictObject({
    ended: z.literal('the_extension_cannot_be_reached'),
    because: z.enum(['it_is_not_active', 'it_has_stopped']),
  }),
  z.strictObject({ ended: z.literal('the_app_cannot_do_it'), said: _user.value.what_it_said }),
])

/** An activity as she asked it: what, and when. */
export const an_asked_activity = z.strictObject({
  activity_id: id.activity_id,
  what: what_is_asked,
  asked_at: date_time,
})

/** Where an activity is (USR-1): in progress, or ended, how and when. */
export const stage = z.discriminatedUnion('stage', [
  z.strictObject({ stage: z.literal('in_progress') }),
  z.strictObject({ stage: z.literal('ended'), how_it_ended, ended_at: date_time }),
])

/** An activity, as the screens read it. */
export const activity_card = z.strictObject({
  activity_id: id.activity_id,
  what: what_is_asked,
  asked_at: date_time,
  stage,
})
