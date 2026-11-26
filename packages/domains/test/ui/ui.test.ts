import { describe, expect, test } from 'vitest'
import * as ui from '../../src/ui/_dsl.ts'
import * as ui_value from '../../src/ui/_value.ts'
import * as a_contact from '../../src/ui/a_contact/_dsl.ts'
import * as a_page from '../../src/ui/a_page/_dsl.ts'
import * as an_extension from '../../src/ui/an_extension/_dsl.ts'
import * as an_invitation from '../../src/ui/an_invitation/_dsl.ts'
import * as my_contacts from '../../src/ui/my_contacts/_dsl.ts'
import * as the_first_face from '../../src/ui/the_first_face/_dsl.ts'
import * as the_handshake_at_a_distance from '../../src/ui/the_handshake_at_a_distance/_dsl.ts'
import * as the_handshake_in_person from '../../src/ui/the_handshake_in_person/_dsl.ts'
import * as the_introduction from '../../src/ui/the_introduction/_dsl.ts'
import * as the_server from '../../src/ui/the_server/_dsl.ts'
import * as what_happened from '../../src/ui/what_happened/_dsl.ts'
import type * as a_contact_value from '../../src/ui/a_contact/_value.ts'
import type * as an_extension_value from '../../src/ui/an_extension/_value.ts'
import type * as an_invitation_value from '../../src/ui/an_invitation/_value.ts'
import type * as at_a_distance_value from '../../src/ui/the_handshake_at_a_distance/_value.ts'
import type * as in_person_value from '../../src/ui/the_handshake_in_person/_value.ts'
import type * as what_happened_value from '../../src/ui/what_happened/_value.ts'
import * as activities_value from '../../src/user/activities/_value.ts'
import * as user_dsl from '../../src/user/_dsl.ts'
import * as user_value from '../../src/user/_value.ts'

// The stories of `ui` (packages/domains/src/ui/README.md; UI-1..UI-5, V2,
// ADP-7, GR-2, EXT-7, EXT-16, USR-2..USR-8, WEB-1, WEB-2, WEB-5; part 16.2),
// each a test named after its story, on the dsl alone: the screens'
// functions given what the story says the reads give, the ids and the times
// drawn by the story as the rendering draws them at the gesture. No timer, no
// loop: every function is pure.

// The names of the stories: Anna, her face F_a; her bonds L_b with Bruno and
// L_c with Carla; Luca, who sends her a link; ping pong 0.1.0, its action
// `ping` on `a_bond`, offered to L_b and L_c. Saturday 21 November 2026, 10:00
// in Rome.

/** 10:00 in Rome, as the clock writes it (UTC). */
const ten = '2026-11-21T09:00:00.000Z'
const F_a = 'F_a'
const L_b = 'L_b'
const L_c = 'L_c'
const ping_pong = 'ping_pong'

/** What a screen asked, its id drawn by the story at the gesture. */
const asked = (activity_id: string): ui_value.what_it_asked =>
  ui_value.what_it_asked.parse({ activity_id, at: ten })

/** How an activity ended, with what the leaf said. */
const how = (
  ended: 'done' | 'done_already' | 'cannot_be_done' | 'the_app_cannot_do_it',
  event = 'it_is_done',
): activities_value.how_it_ended =>
  activities_value.how_it_ended.parse({ ended, said: { event, payload: {} } })

const done = how('done')

/** What the screen asked ended, as the rendering tells it once. */
const it_ended = (
  activity_id: string,
  ended: activities_value.how_it_ended,
): ui_value.what_it_asked_ended =>
  ui_value.what_it_asked_ended.parse({ happens: 'what_it_asked_ended', activity_id, how: ended })

/** An activity as `user` reads it: in progress, or ended how. */
const a_card = (
  activity_id: string,
  what: activities_value.what_is_asked,
  ended?: activities_value.how_it_ended,
): activities_value.activity_card =>
  activities_value.activity_card.parse({
    activity_id,
    what,
    asked_at: ten,
    stage:
      ended === undefined
        ? { stage: 'in_progress' }
        : { stage: 'ended', how_it_ended: ended, ended_at: ten },
  })

/** The one item of a list, or the story fails. */
const the_one = <T>(items: readonly T[]): T => {
  const [one] = items
  if (one === undefined || items.length !== 1)
    throw new Error(`one expected, ${String(items.length)} given`)
  return one
}

/** Ping pong's manifest; with a slot on a bond, or a page on its own screen. */
const a_manifest = (
  more: readonly { point: 'action' | 'slot' | 'page'; name: string; place: string }[] = [],
  version = '0.1.0',
): user_value.a_manifest =>
  user_value.a_manifest.parse({
    name: ping_pong,
    version,
    sees: { known: ['the_peer_key'] },
    touches: ['the_port_of_requests'],
    extension_points: [{ point: 'action', name: 'ping', place: 'a_bond' }, ...more],
    leaves_on_known: ['usecase/ping'],
    majors: { self: [0], known: [0] },
  })

const the_manifest = a_manifest()

/** Ping pong as the screens are given it. */
const ping_pong_seen = (
  is: 'active' | 'not_active' | 'waiting_for_the_new_manifest',
  manifest: user_value.a_manifest = the_manifest,
): ui_value.an_extension_seen =>
  ui_value.an_extension_seen.parse({
    extension: ping_pong,
    version: '0.1.0',
    is,
    manifest,
    what_it_asks: user_dsl.what_an_extension_asks(manifest),
  })

/** The bonds ping pong is offered to. */
const offered_to = (...bonds: readonly string[]): ui_value.the_offers =>
  ui_value.the_offers.parse([{ extension: ping_pong, bonds }])

/** What her node offers a bond (EXT-8): ping pong, or nothing. */
const offers_a_bond = (offers: boolean): activities_value.offered =>
  activities_value.offered.parse(offers ? [{ extension: ping_pong, majors: [0] }] : [])

/** A ticket of theirs, introduced by a name. */
const their_ticket = (introduced_as: string): activities_value.their_ticket =>
  activities_value.their_ticket.parse({
    key: `the_key_of_${introduced_as}`,
    introduced_as,
    mailbox: { deposit_address: `the_box_of_${introduced_as}`, relays: ['wss://relay.example'] },
    secret: 'a_secret',
  })

const a_ticket_link = (introduced_as: string): ui_value.what_it_holds => ({
  holds: 'a_ticket',
  ticket: their_ticket(introduced_as),
})

/** A ticket of hers, ready, for a bond to be. */
const her_ticket = (bond: string): ui_value.a_ticket_ready =>
  ui_value.a_ticket_ready.parse({ bond, expires_at: '2026-11-23T09:00:00.000Z' })

/** A contact, as her list and its card give it. */
const a_contact_seen = (
  bond: string,
  name: string,
  introduced_as: string,
  they_have_me: boolean,
): ui_value.a_contact_seen =>
  ui_value.a_contact_seen.parse({
    bond,
    name,
    introduced_as,
    confirmation: they_have_me ? { state: 'received', at: ten } : { state: 'awaited' },
  })

const a_card_of = (bond: string, name: string): ui_value.a_contact_card =>
  ui_value.a_contact_card.parse({
    bond,
    name,
    introduced_as: name,
    confirmation: { state: 'received', at: ten },
    handshake: { way: 'in_person', at: ten },
    their_relays: ['wss://relay.example'],
  })

/** What a contact's screen is given. */
const the_contact_given = (
  bond: string,
  given: {
    readonly is?: 'active' | 'not_active'
    readonly offered?: boolean
    readonly activities?: readonly activities_value.activity_card[]
    readonly in_common?: a_contact_value.what_it_is_given['in_common']
  } = {},
): a_contact_value.what_it_is_given => ({
  card: a_card_of(bond, bond === L_b ? 'Bruno' : 'Carla R.'),
  extensions: [ping_pong_seen(given.is ?? 'active')],
  offered: offers_a_bond(given.offered ?? true),
  activities: [...(given.activities ?? [])],
  in_common: given.in_common ?? { answer: 'not_asked' },
})

/** Held letters: ping pong's (a ping to a bond removed), the kernel's. */
const ping_pongs_letter = user_value.a_held_letter.parse({
  whose: { of: 'an_extension', extension: ping_pong },
  letter: 'P1',
  what: 'a_ping',
  why: { why: 'it_could_not_be_delivered', because: 'the bond is removed' },
})
const the_kernels_letter = user_value.a_held_letter.parse({
  whose: { of: 'the_kernel', office: 'post' },
  letter: 'K1',
  what: 'a_letter',
  why: { why: 'what_came_back_was_refused' },
})

const a_silence = user_value.what_happened_without_a_fact.parse({
  happened: 'a_request_met_silence',
  bond: L_b,
  extension: ping_pong,
  because: 'the_extension_is_not_offered_to_the_bond',
})
const a_letter_unopened = user_value.what_happened_without_a_fact.parse({
  happened: 'a_letter_could_not_be_opened',
})
const it_fell = user_value.what_happened_without_a_fact.parse({
  happened: 'an_extension_fell',
  extension: ping_pong,
  fall: 'the_first',
})

describe('ui, the screens of stage 1 (part 16.2)', () => {
  test('with no face the app starts at the first face; with one and none active it chooses it', () => {
    const anna = ui_value.a_face_seen.parse({ face: F_a, name: 'Anna' })
    expect(ui.the_start({ faces: [], the_active_face: undefined, a_link: undefined })).toEqual({
      way: [{ screen: 'the_first_face' }],
      asks: [],
    })
    expect(ui.the_start({ faces: [anna], the_active_face: undefined, a_link: undefined })).toEqual({
      way: [{ screen: 'my_contacts' }],
      asks: [{ asks: 'to_change_face', face: F_a }],
    })
    expect(ui.the_start({ faces: [anna], the_active_face: F_a, a_link: undefined })).toEqual({
      way: [{ screen: 'my_contacts' }],
      asks: [],
    })
  })

  test('a link holding a ticket opens its invitation over her contacts; one with no ticket opens nothing', () => {
    const anna = ui_value.a_face_seen.parse({ face: F_a, name: 'Anna' })
    const start = (a_link: ui_value.what_it_holds, faces = [anna]) =>
      ui.the_start({ faces, the_active_face: F_a, a_link })
    const lucas = a_ticket_link('Luca')
    expect(start(lucas).way).toEqual([
      { screen: 'my_contacts' },
      { screen: 'an_invitation', link: lucas },
    ])
    expect(start({ holds: 'a_ticket_out_of_its_form' }).way).toEqual([
      { screen: 'my_contacts' },
      { screen: 'an_invitation', link: { holds: 'a_ticket_out_of_its_form' } },
    ])
    expect(start({ holds: 'no_ticket' }).way).toEqual([{ screen: 'my_contacts' }])
    expect(start(lucas, [])).toEqual({ way: [{ screen: 'the_first_face' }], asks: [] })
  })

  test('a screen opens on top, back closes it but never the last, and the start replaces the way', () => {
    const home: ui_value.the_way = [{ screen: 'my_contacts' }]
    const start: ui_value.the_way = [{ screen: 'the_first_face' }]
    const opened = my_contacts.after(my_contacts.at_the_start(), {
      happens: 'she_opens_a_contact',
      bond: L_b,
    })
    expect(opened.goes).toEqual({ goes: 'to_a_screen', screen: { screen: 'a_contact', bond: L_b } })
    const on_top = ui.the_way_after(home, opened.goes, start)
    expect(on_top).toEqual([{ screen: 'my_contacts' }, { screen: 'a_contact', bond: L_b }])
    expect(ui.the_way_after(on_top, opened.goes, start)).toEqual(on_top)
    const back = ui.the_way_after(on_top, { goes: 'back' }, start)
    expect(back).toEqual(home)
    expect(ui.the_way_after(back, { goes: 'back' }, start)).toEqual(home)
    expect(ui.the_way_after(on_top, { goes: 'to_the_start' }, start)).toEqual(start)
    expect(ui.the_way_after(on_top, { goes: 'nowhere' }, start)).toEqual(on_top)
  })

  test('the name she types for her first face is kept as a draft, and the button is off with no name', () => {
    const the_name = { for: 'the_name_of_my_first_face' } as const
    const typed = the_first_face.after(the_first_face.at_the_start(undefined), {
      happens: 'she_types_the_name',
      name: 'Anna',
    })
    expect(typed.asks).toEqual([{ asks: 'to_keep_a_draft', for: the_name, text: 'Anna' }])
    expect(typed.goes).toEqual({ goes: 'nowhere' })
    expect(the_first_face.what_it_shows(typed.state, undefined).the_button).toBe('on')
    const emptied = the_first_face.after(typed.state, { happens: 'she_types_the_name', name: '' })
    expect(emptied.asks).toEqual([{ asks: 'to_drop_a_draft', for: the_name }])
    expect(the_first_face.what_it_shows(emptied.state, undefined).the_button).toBe('off')
    expect(the_first_face.what_it_shows(the_first_face.at_the_start('Ann'), undefined)).toEqual({
      name: 'Ann',
      the_button: 'on',
      course: { course: 'nothing_asked' },
    })
  })

  test('making the first face asks once, and once made drops the draft and shows the introduction', () => {
    const typed = the_first_face.after(the_first_face.at_the_start(undefined), {
      happens: 'she_types_the_name',
      name: 'Anna',
    }).state
    const made = the_first_face.after(typed, {
      happens: 'she_makes_the_face',
      asked: asked('A1'),
      face: F_a,
    })
    const what = { activity: 'make_my_first_face', face: F_a, name: 'Anna' } as const
    expect(made.asks).toEqual([{ asks: 'an_activity', activity_id: 'A1', what }])
    expect(the_first_face.what_it_shows(made.state, undefined).the_button).toBe('making')
    expect(the_first_face.what_it_shows(made.state, a_card('A1', what)).the_button).toBe('making')
    const again = the_first_face.after(made.state, {
      happens: 'she_makes_the_face',
      asked: asked('A1_again'),
      face: 'F_a_again',
    })
    expect(again.asks).toEqual([])
    expect(again.state).toEqual(made.state)
    for (const ended of [done, how('done_already')]) {
      const after = the_first_face.after(made.state, it_ended('A1', ended))
      expect(after.asks).toEqual([
        { asks: 'to_drop_a_draft', for: { for: 'the_name_of_my_first_face' } },
      ])
      expect(after.goes).toEqual({
        goes: 'to_a_screen',
        screen: { screen: 'the_introduction', read: 'the_first_time' },
      })
    }
    expect(the_first_face.after(made.state, it_ended('A_other', done)).asks).toEqual([])
  })

  test('a making that cannot be done is told, and she makes it again', () => {
    const typed = the_first_face.after(the_first_face.at_the_start('Anna'), {
      happens: 'she_types_the_name',
      name: 'Anna',
    }).state
    const made = the_first_face.after(typed, {
      happens: 'she_makes_the_face',
      asked: asked('A1'),
      face: F_a,
    }).state
    const cannot = how('the_app_cannot_do_it', 'the_node_is_closing')
    const ended = the_first_face.after(made, it_ended('A1', cannot))
    expect(ended.goes).toEqual({ goes: 'nowhere' })
    expect(ended.asks).toEqual([])
    const what = { activity: 'make_my_first_face', face: F_a, name: 'Anna' } as const
    expect(the_first_face.what_it_shows(ended.state, a_card('A1', what, cannot))).toEqual({
      name: 'Anna',
      the_button: 'on',
      course: { course: 'ended', activity_id: 'A1', how: cannot },
    })
    const again = the_first_face.after(ended.state, {
      happens: 'she_makes_the_face',
      asked: asked('A2'),
      face: 'F_a2',
    })
    expect(again.asks).toEqual([
      {
        asks: 'an_activity',
        activity_id: 'A2',
        what: { activity: 'make_my_first_face', face: 'F_a2', name: 'Anna' },
      },
    ])
  })

  test('no contacts shows the two handshakes; some, by her name, as introduced when it differs, and whether they have her', () => {
    const closed = my_contacts.at_the_start()
    expect(
      my_contacts.what_it_shows(closed, { contacts: [], held_letters: 0, happened: 0 }),
    ).toEqual({
      contacts: {
        are: 'none_yet',
        ways: ['the_handshake_in_person', 'the_handshake_at_a_distance'],
      },
    })
    const contacts = [
      a_contact_seen(L_b, 'Bruno', 'Bruno', true),
      a_contact_seen(L_c, 'Carla R.', 'Carla', false),
    ]
    expect(my_contacts.what_it_shows(closed, { contacts, held_letters: 0, happened: 0 })).toEqual({
      contacts: {
        are: 'some',
        list: [
          { bond: L_b, name: 'Bruno', they_have_me: true },
          { bond: L_c, name: 'Carla R.', introduced_as: 'Carla', they_have_me: false },
        ],
      },
    })
    expect(
      my_contacts.what_it_shows(closed, { contacts, held_letters: 1, happened: 0 })
        .something_happened,
    ).toEqual({ held_letters: 1, happened: 0 })
  })

  test('each entry of the menu opens its screen and closes the menu', () => {
    const open = my_contacts.after(my_contacts.at_the_start(), { happens: 'she_opens_the_menu' })
    const the_menu = [
      'the_handshake_in_person',
      'the_handshake_at_a_distance',
      'the_extensions',
      'what_happened',
      'the_introduction',
      'the_server',
    ] as const
    expect(
      my_contacts.what_it_shows(open.state, { contacts: [], held_letters: 0, happened: 0 }).menu,
    ).toEqual(the_menu)
    for (const entry of the_menu) {
      const chosen = my_contacts.after(open.state, { happens: 'she_chooses', entry })
      expect(chosen.state).toEqual({ menu: 'closed' })
      expect(chosen.goes).toEqual({
        goes: 'to_a_screen',
        screen: entry === 'the_introduction' ? { screen: entry, read: 'again' } : { screen: entry },
      })
      expect(chosen.asks).toEqual([])
    }
    expect(my_contacts.after(open.state, { happens: 'she_closes_the_menu' }).state).toEqual({
      menu: 'closed',
    })
  })

  test('renaming keeps the bond’s name as a draft, renames it once, and drops the draft when done', () => {
    const the_draft = { for: 'the_name_i_give_a_bond', bond: L_c } as const
    const started = a_contact.after(a_contact.at_the_start(L_c), {
      happens: 'she_starts_renaming',
      name: 'Carla R.',
    })
    expect(started.asks).toEqual([])
    const typed = a_contact.after(started.state, {
      happens: 'she_types_the_name',
      name: 'Carla Rossi',
    })
    expect(typed.asks).toEqual([{ asks: 'to_keep_a_draft', for: the_draft, text: 'Carla Rossi' }])
    const renamed = a_contact.after(typed.state, { happens: 'she_renames_it', asked: asked('A3') })
    expect(renamed.asks).toEqual([
      {
        asks: 'an_activity',
        activity_id: 'A3',
        what: { activity: 'rename_a_bond', bond: L_c, name: 'Carla Rossi' },
      },
    ])
    const shown = a_contact.what_it_shows(renamed.state, the_contact_given(L_c))
    expect(shown.shows === 'the_contact' && shown.renaming).toEqual({
      name: 'Carla Rossi',
      the_button: 'renaming',
    })
    expect(
      a_contact.after(renamed.state, { happens: 'she_renames_it', asked: asked('A3_again') }).asks,
    ).toEqual([])
    const ended = a_contact.after(renamed.state, it_ended('A3', done))
    expect(ended.asks).toEqual([{ asks: 'to_drop_a_draft', for: the_draft }])
    expect(ended.state.renaming).toBeUndefined()
    const stopped = a_contact.after(typed.state, { happens: 'she_stops_renaming' })
    expect(stopped.asks).toEqual([{ asks: 'to_drop_a_draft', for: the_draft }])
    expect(stopped.state.renaming).toBeUndefined()
  })

  test('removing asks to confirm, removes once, and goes back once removed', () => {
    const start = a_contact.at_the_start(L_b)
    expect(a_contact.after(start, { happens: 'she_removes_it', asked: asked('A4') }).asks).toEqual(
      [],
    )
    const to_confirm = a_contact.after(start, { happens: 'she_asks_to_remove_it' }).state
    const shown = a_contact.what_it_shows(to_confirm, the_contact_given(L_b))
    expect(shown.shows === 'the_contact' && shown.removing).toBe('to_confirm')
    expect(a_contact.after(to_confirm, { happens: 'she_keeps_it' }).state.removing).toBe(
      'not_asked',
    )
    const removed = a_contact.after(to_confirm, { happens: 'she_removes_it', asked: asked('A4') })
    expect(removed.asks).toEqual([
      { asks: 'an_activity', activity_id: 'A4', what: { activity: 'remove_a_bond', bond: L_b } },
    ])
    const removing = a_contact.what_it_shows(removed.state, the_contact_given(L_b))
    expect(removing.shows === 'the_contact' && removing.removing).toBe('removing')
    expect(a_contact.after(removed.state, it_ended('A4', done)).goes).toEqual({ goes: 'back' })
    expect(
      a_contact.what_it_shows(removed.state, { ...the_contact_given(L_b), card: undefined }),
    ).toEqual({ shows: 'no_such_contact' })
  })

  test('an active extension is offered to the contact or withdrawn, once at a time; one not active is not listed', () => {
    const on_bruno = a_contact.at_the_start(L_b)
    const shown = a_contact.what_it_shows(on_bruno, the_contact_given(L_b))
    expect(shown.shows === 'the_contact' && shown.the_extensions).toEqual([
      { extension: ping_pong, offered: true, may: 'withdraw_the_offer' },
    ])
    const withdrawn = a_contact.after(on_bruno, {
      happens: 'she_withdraws_the_offer',
      extension: ping_pong,
      asked: asked('A5'),
    })
    expect(withdrawn.asks).toEqual([
      {
        asks: 'an_activity',
        activity_id: 'A5',
        what: { activity: 'withdraw_the_offer_from_a_bond', extension: ping_pong, bond: L_b },
      },
    ])
    const waiting = a_contact.what_it_shows(withdrawn.state, the_contact_given(L_b))
    expect(waiting.shows === 'the_contact' && waiting.the_extensions).toEqual([
      { extension: ping_pong, offered: true, may: 'wait' },
    ])
    expect(
      a_contact.after(withdrawn.state, {
        happens: 'she_offers_an_extension',
        extension: ping_pong,
        asked: asked('A5_again'),
      }).asks,
    ).toEqual([])
    const on_carla = a_contact.at_the_start(L_c)
    const not_offered = a_contact.what_it_shows(
      on_carla,
      the_contact_given(L_c, { offered: false }),
    )
    expect(not_offered.shows === 'the_contact' && not_offered.the_extensions).toEqual([
      { extension: ping_pong, offered: false, may: 'offer' },
    ])
    expect(
      a_contact.after(on_carla, {
        happens: 'she_offers_an_extension',
        extension: ping_pong,
        asked: asked('A6'),
      }).asks,
    ).toEqual([
      {
        asks: 'an_activity',
        activity_id: 'A6',
        what: { activity: 'offer_an_extension_to_a_bond', extension: ping_pong, bond: L_c },
      },
    ])
    const not_active = a_contact.what_it_shows(
      on_bruno,
      the_contact_given(L_b, { is: 'not_active' }),
    )
    expect(not_active.shows === 'the_contact' && not_active.the_extensions).toEqual([])
    const offered = offers_a_bond(true)
    expect(
      a_contact.after(on_bruno, {
        happens: 'she_asks_for_the_extensions_in_common',
        offered,
        asked: asked('A7'),
      }).asks,
    ).toEqual([
      {
        asks: 'an_activity',
        activity_id: 'A7',
        what: { activity: 'ask_a_bond_for_the_extensions_in_common', bond: L_b, offered },
      },
    ])
  })

  test('an extension’s points are drawn on a bond in its mark only while active and offered to it', () => {
    const on = (bond: string) => ({ place: 'a_bond', bond }) as const
    const active = [ping_pong_seen('active')]
    expect(ui.the_marks_at(on(L_b), { extensions: active, offered: offered_to(L_b, L_c) })).toEqual(
      [{ extension: ping_pong, told: on(L_b), actions: ['ping'], slots: [], pages: [] }],
    )
    const withdrawn = { extensions: active, offered: offered_to(L_c) }
    expect(ui.the_marks_at(on(L_b), withdrawn)).toEqual([])
    expect(ui.the_marks_at(on(L_c), withdrawn)).toHaveLength(1)
    const not_active = { extensions: [ping_pong_seen('not_active')], offered: offered_to(L_b, L_c) }
    expect(ui.the_marks_at(on(L_b), not_active)).toEqual([])
    expect(ui.the_marks_at(on(L_c), not_active)).toEqual([])
    const with_a_slot = ping_pong_seen(
      'active',
      a_manifest([{ point: 'slot', name: 'the_last_pong', place: 'a_bond' }]),
    )
    expect(
      ui.the_marks_at(on(L_b), { extensions: [with_a_slot], offered: offered_to(L_b) }),
    ).toEqual([
      {
        extension: ping_pong,
        told: on(L_b),
        actions: ['ping'],
        slots: ['the_last_pong'],
        pages: [],
      },
    ])
    const on_the_contact = a_contact.what_it_shows(
      a_contact.at_the_start(L_b),
      the_contact_given(L_b),
    )
    expect(on_the_contact.shows === 'the_contact' && on_the_contact.marks).toEqual([
      { extension: ping_pong, told: on(L_b), actions: ['ping'], slots: [], pages: [] },
    ])
    const withdrawn_on_the_contact = a_contact.what_it_shows(
      a_contact.at_the_start(L_b),
      the_contact_given(L_b, { offered: false }),
    )
    expect(
      withdrawn_on_the_contact.shows === 'the_contact' && withdrawn_on_the_contact.marks,
    ).toEqual([])
  })

  test('tapping an action of a mark asks to use it on the place, once while in progress', () => {
    const mark = the_one(
      ui.the_marks_at(
        { place: 'a_bond', bond: L_b },
        { extensions: [ping_pong_seen('active')], offered: offered_to(L_b, L_c) },
      ),
    )
    const tap = (state: a_contact_value.the_state, id: string, action = 'ping', on = mark) =>
      a_contact.after(state, { happens: 'she_taps_an_action', mark: on, action, asked: asked(id) })
    const use = (activity_id: string) => ({
      asks: 'an_activity',
      activity_id,
      what: {
        activity: 'use_an_action',
        extension: ping_pong,
        action: 'ping',
        on: { place: 'a_bond', bond: L_b },
      },
    })
    const tapped = tap(a_contact.at_the_start(L_b), 'A8')
    expect(tapped.asks).toEqual([use('A8')])
    expect(tap(tapped.state, 'A8_again').asks).toEqual([])
    const ended = a_contact.after(tapped.state, it_ended('A8', how('done', 'a_pong_came_back')))
    expect(tap(ended.state, 'A9').asks).toEqual([use('A9')])
    expect(tap(a_contact.at_the_start(L_b), 'A10', 'pong').asks).toEqual([])
    const told_carla = { ...mark, told: { place: 'a_bond', bond: L_c } } as const
    expect(tap(a_contact.at_the_start(L_b), 'A10', 'ping', told_carla).asks).toEqual([])
  })

  test('the screen opened prepares a ticket; ready it shows the QR and the camera; the first ticket scanned opens on its bond by its name', () => {
    const opened = the_handshake_in_person.after(the_handshake_in_person.at_the_start(), {
      happens: 'the_screen_is_opened',
      asked: asked('A10'),
      bond: 'B1',
      face: F_a,
    })
    const prepare = { activity: 'prepare_a_ticket', bond: 'B1', face: F_a } as const
    expect(opened.asks).toEqual([{ asks: 'an_activity', activity_id: 'A10', what: prepare }])
    expect(the_handshake_in_person.what_it_shows(opened.state, { activities: [] })).toEqual({
      shows: 'getting_the_ticket_ready',
    })
    const ready = { ticket: her_ticket('B1'), activities: [a_card('A10', prepare, done)] }
    const camera_on = the_handshake_in_person.after(opened.state, {
      happens: 'the_camera_is',
      camera: 'on',
    }).state
    expect(the_handshake_in_person.what_it_shows(camera_on, ready)).toEqual({
      shows: 'ready',
      ticket: her_ticket('B1'),
      camera: 'on',
      side: 'front',
      turn: 'none',
      scanned: 'nothing',
    })
    const brunos = a_ticket_link('Bruno')
    const scanned = the_handshake_in_person.after(camera_on, {
      happens: 'she_scans',
      holds: brunos,
      asked: asked('A11'),
    })
    const open = {
      activity: 'open_their_ticket',
      bond: 'B1',
      their_ticket: their_ticket('Bruno'),
      name: 'Bruno',
    } as const
    expect(scanned.asks).toEqual([{ asks: 'an_activity', activity_id: 'A11', what: open }])
    expect(
      the_handshake_in_person.after(scanned.state, {
        happens: 'she_scans',
        holds: a_ticket_link('Carla'),
        asked: asked('A11_again'),
      }).asks,
    ).toEqual([])
    // Her QR still shown, the other phone may still be reading it, until she puts it away.
    expect(the_handshake_in_person.what_it_shows(scanned.state, ready)).toEqual({
      shows: 'their_ticket_read',
      ticket: her_ticket('B1'),
      introduced_as: 'Bruno',
    })
    const put_away = the_handshake_in_person.after(scanned.state, {
      happens: 'she_puts_her_qr_away',
    }).state
    expect(the_handshake_in_person.what_it_shows(put_away, ready)).toEqual({
      shows: 'opening_their_ticket',
      introduced_as: 'Bruno',
    })
    const bonded = the_handshake_in_person.after(put_away, it_ended('A11', done)).state
    expect(
      the_handshake_in_person.what_it_shows(bonded, {
        ...ready,
        activities: [...ready.activities, a_card('A11', open, done)],
      }),
    ).toEqual({
      shows: 'bonded',
      introduced_as: 'Bruno',
      already: false,
      said: { event: 'it_is_done', payload: {} },
    })
    // What her node said of it goes with it: in person only when it said so (BND-10).
    for (const event of ['you_met_in_person', 'you_are_bonded', 'your_introduction_is_sent']) {
      const met = how('done', event)
      expect(
        the_handshake_in_person.what_it_shows(bonded, {
          ...ready,
          activities: [...ready.activities, a_card('A11', open, met)],
        }),
      ).toMatchObject({ shows: 'bonded', said: { event } })
    }
    expect(
      the_handshake_in_person.after(bonded, { happens: 'she_opens_the_contact' }).goes,
    ).toEqual({ goes: 'to_a_screen', screen: { screen: 'a_contact', bond: 'B1' } })
  })

  test('a text with no ticket is told and she scans on; a ticket that cannot be opened is told and she scans again', () => {
    const prepare = { activity: 'prepare_a_ticket', bond: 'B1', face: F_a } as const
    const opened = the_handshake_in_person.after(the_handshake_in_person.at_the_start(), {
      happens: 'the_screen_is_opened',
      asked: asked('A10'),
      bond: 'B1',
      face: F_a,
    }).state
    const on = the_handshake_in_person.after(opened, {
      happens: 'the_camera_is',
      camera: 'on',
    }).state
    const ready = { ticket: her_ticket('B1'), activities: [a_card('A10', prepare, done)] }
    const scan = (state: in_person_value.the_state, holds: ui_value.what_it_holds, id: string) =>
      the_handshake_in_person.after(state, { happens: 'she_scans', holds, asked: asked(id) })
    for (const holds of ['no_ticket', 'a_ticket_out_of_its_form'] as const) {
      const told = scan(on, { holds }, 'A11')
      expect(told.asks).toEqual([])
      expect(the_handshake_in_person.what_it_shows(told.state, ready)).toEqual({
        shows: 'ready',
        ticket: her_ticket('B1'),
        camera: 'on',
        side: 'front',
        turn: 'none',
        scanned: holds,
      })
    }
    const scanned = scan(on, a_ticket_link('Bruno'), 'A11').state
    const open = {
      activity: 'open_their_ticket',
      bond: 'B1',
      their_ticket: their_ticket('Bruno'),
      name: 'Bruno',
    } as const
    const cannot = how('cannot_be_done', 'their_ticket_cannot_be_opened')
    // Not opened: told, her QR shown and the camera on to scan again, whether she put her QR away or not.
    const not_opened = the_handshake_in_person.after(scanned, it_ended('A11', cannot)).state
    expect(
      the_handshake_in_person.what_it_shows(not_opened, {
        ...ready,
        activities: [...ready.activities, a_card('A11', open, cannot)],
      }),
    ).toEqual({
      shows: 'their_ticket_cannot_be_opened',
      introduced_as: 'Bruno',
      how: cannot,
      ticket: her_ticket('B1'),
      camera: 'on',
      side: 'front',
      turn: 'none',
    })
    expect(scan(not_opened, a_ticket_link('Bruno'), 'A12').asks).toEqual([
      { asks: 'an_activity', activity_id: 'A12', what: open },
    ])
    const already = the_handshake_in_person.after(
      the_handshake_in_person.after(scanned, { happens: 'she_puts_her_qr_away' }).state,
      it_ended('A11', how('done_already')),
    ).state
    expect(
      the_handshake_in_person.what_it_shows(already, {
        ...ready,
        activities: [...ready.activities, a_card('A11', open, how('done_already'))],
      }),
    ).toEqual({
      shows: 'bonded',
      introduced_as: 'Bruno',
      already: true,
      said: { event: 'it_is_done', payload: {} },
    })
    const refused = the_handshake_in_person.after(opened, {
      happens: 'the_camera_is',
      camera: 'refused',
    }).state
    expect(the_handshake_in_person.what_it_shows(refused, ready)).toEqual({
      shows: 'ready',
      ticket: her_ticket('B1'),
      camera: 'refused',
      side: 'front',
      turn: 'none',
      scanned: 'nothing',
    })
  })

  test('the camera faces her at the start; with more than one she turns it to the rear and back', () => {
    const prepare = { activity: 'prepare_a_ticket', bond: 'B1', face: F_a } as const
    expect(the_handshake_in_person.at_the_start()).toEqual({
      camera: 'off',
      side: 'front',
      cameras: 'one',
    })
    const opened = the_handshake_in_person.after(the_handshake_in_person.at_the_start(), {
      happens: 'the_screen_is_opened',
      asked: asked('A10'),
      bond: 'B1',
      face: F_a,
    }).state
    const ready = { ticket: her_ticket('B1'), activities: [a_card('A10', prepare, done)] }
    const shows = (state: in_person_value.the_state) =>
      the_handshake_in_person.what_it_shows(state, ready)
    const on = the_handshake_in_person.after(opened, {
      happens: 'the_camera_is',
      camera: 'on',
    }).state
    expect(shows(on)).toMatchObject({ shows: 'ready', camera: 'on', side: 'front', turn: 'none' })
    // One camera: nowhere to turn, her gesture changes nothing.
    const turn = (state: in_person_value.the_state) =>
      the_handshake_in_person.after(state, { happens: 'she_turns_the_camera' })
    expect(turn(on)).toEqual({ state: on, asks: [], goes: { goes: 'nowhere' } })
    const counted = the_handshake_in_person.after(on, {
      happens: 'the_cameras_are_counted',
      cameras: 'more_than_one',
    }).state
    expect(shows(counted)).toMatchObject({ camera: 'on', side: 'front', turn: 'to_the_rear' })
    // Turned: the camera off until the browser says it is on, nowhere to turn meanwhile.
    const turned = turn(counted)
    expect(turned.asks).toEqual([])
    expect(shows(turned.state)).toMatchObject({ camera: 'off', side: 'rear', turn: 'none' })
    expect(turn(turned.state).state).toEqual(turned.state)
    const rear = the_handshake_in_person.after(turned.state, {
      happens: 'the_camera_is',
      camera: 'on',
    }).state
    expect(shows(rear)).toMatchObject({ camera: 'on', side: 'rear', turn: 'to_the_front' })
    const front = the_handshake_in_person.after(turn(rear).state, {
      happens: 'the_camera_is',
      camera: 'on',
    }).state
    expect(shows(front)).toMatchObject({ camera: 'on', side: 'front', turn: 'to_the_rear' })
    // The rear camera busy: she may still turn back to the front.
    const busy = the_handshake_in_person.after(turned.state, {
      happens: 'the_camera_is',
      camera: 'busy',
    }).state
    expect(shows(busy)).toMatchObject({ camera: 'busy', side: 'rear', turn: 'to_the_front' })
    // Another hand: a new ticket keeps the side she chose and the cameras counted.
    const another = the_handshake_in_person.after(rear, {
      happens: 'she_shakes_another_hand',
      asked: asked('A12'),
      bond: 'B2',
      face: F_a,
    }).state
    expect(another).toMatchObject({ camera: 'off', side: 'rear', cameras: 'more_than_one' })
  })

  test('after she scans theirs her QR stays shown until she puts it away', () => {
    const prepare = { activity: 'prepare_a_ticket', bond: 'B1', face: F_a } as const
    const opened = the_handshake_in_person.after(the_handshake_in_person.at_the_start(), {
      happens: 'the_screen_is_opened',
      asked: asked('A10'),
      bond: 'B1',
      face: F_a,
    }).state
    const on = the_handshake_in_person.after(opened, { happens: 'the_camera_is', camera: 'on' })
    const scanned = the_handshake_in_person.after(on.state, {
      happens: 'she_scans',
      holds: a_ticket_link('Bruno'),
      asked: asked('A11'),
    })
    const open = {
      activity: 'open_their_ticket',
      bond: 'B1',
      their_ticket: their_ticket('Bruno'),
      name: 'Bruno',
    } as const
    const ready = { ticket: her_ticket('B1'), activities: [a_card('A10', prepare, done)] }
    const opened_done = { ...ready, activities: [...ready.activities, a_card('A11', open, done)] }
    const read = {
      shows: 'their_ticket_read',
      ticket: her_ticket('B1'),
      introduced_as: 'Bruno',
    } as const
    // A read goes nowhere: her QR stays, while their ticket opens and once it is opened.
    expect(scanned.goes).toEqual({ goes: 'nowhere' })
    expect(the_handshake_in_person.what_it_shows(scanned.state, ready)).toEqual(read)
    const bonded = the_handshake_in_person.after(scanned.state, it_ended('A11', done))
    expect(bonded.goes).toEqual({ goes: 'nowhere' })
    expect(the_handshake_in_person.what_it_shows(bonded.state, opened_done)).toEqual(read)
    // Her gesture puts it away: what the bond made says, then the contact or another hand.
    const put_away = the_handshake_in_person.after(bonded.state, {
      happens: 'she_puts_her_qr_away',
    })
    expect(put_away.asks).toEqual([])
    expect(put_away.goes).toEqual({ goes: 'nowhere' })
    expect(the_handshake_in_person.what_it_shows(put_away.state, opened_done)).toEqual({
      shows: 'bonded',
      introduced_as: 'Bruno',
      already: false,
      said: { event: 'it_is_done', payload: {} },
    })
    // Before any ticket of theirs, her gesture changes nothing.
    expect(
      the_handshake_in_person.after(on.state, { happens: 'she_puts_her_qr_away' }).state,
    ).toEqual(on.state)
    // Another hand: a new ticket, nothing scanned, her QR shown as ready.
    const another = the_handshake_in_person.after(put_away.state, {
      happens: 'she_shakes_another_hand',
      asked: asked('A12'),
      bond: 'B2',
      face: F_a,
    }).state
    expect(another.scanned).toBeUndefined()
  })

  test('the flaw is told first; making a link prepares a ticket, and once ready the link is shown', () => {
    const start = the_handshake_at_a_distance.at_the_start()
    const shares = { the_phone: 'shares' } as const
    expect(the_handshake_at_a_distance.what_it_shows(start, shares)).toEqual({
      shows: 'the_flaw_told',
    })
    const make = (state: at_a_distance_value.the_state, id: string, bond: string) =>
      the_handshake_at_a_distance.after(state, {
        happens: 'she_makes_a_link',
        asked: asked(id),
        bond,
        face: F_a,
      })
    const prepare = (bond: string) => ({ activity: 'prepare_a_ticket', bond, face: F_a }) as const
    const made = make(start, 'A12', 'B2')
    expect(made.asks).toEqual([{ asks: 'an_activity', activity_id: 'A12', what: prepare('B2') }])
    expect(the_handshake_at_a_distance.what_it_shows(made.state, shares)).toEqual({
      shows: 'getting_the_link_ready',
    })
    const ready = { ticket: her_ticket('B2'), activity: a_card('A12', prepare('B2'), done) }
    expect(the_handshake_at_a_distance.what_it_shows(made.state, { ...ready, ...shares })).toEqual({
      shows: 'the_link',
      ticket: her_ticket('B2'),
      gesture: 'share',
    })
    // Where the phone has no share, she copies the link, and is told it is copied (WEB-18).
    const copies = { ...ready, the_phone: 'copies' } as const
    expect(the_handshake_at_a_distance.what_it_shows(made.state, copies)).toMatchObject({
      gesture: 'copy',
    })
    const copied = the_handshake_at_a_distance.after(made.state, { happens: 'the_link_is_copied' })
    expect(copied.asks).toEqual([])
    expect(the_handshake_at_a_distance.what_it_shows(copied.state, copies)).toMatchObject({
      gesture: 'copied',
    })
    expect(make(made.state, 'A12_again', 'B2_again').asks).toEqual([])
    const cannot = how('cannot_be_done', 'a_ticket_cannot_be_prepared')
    const ended = the_handshake_at_a_distance.after(made.state, it_ended('A12', cannot)).state
    expect(
      the_handshake_at_a_distance.what_it_shows(ended, {
        activity: a_card('A12', prepare('B2'), cannot),
        ...shares,
      }),
    ).toEqual({ shows: 'the_link_cannot_be_prepared', how: cannot })
    expect(make(ended, 'A13', 'B3').asks).toEqual([
      { asks: 'an_activity', activity_id: 'A13', what: prepare('B3') },
    ])
  })

  test('accepting prepares her ticket, then opens his once hers is ready; declining asks nothing', () => {
    const lucas = a_ticket_link('Luca')
    const start = an_invitation.at_the_start(lucas)
    expect(an_invitation.what_it_shows(start, { activities: [] })).toEqual({
      shows: 'the_invitation',
      introduced_as: 'Luca',
      name: 'Luca',
      the_button: 'on',
    })
    const named = an_invitation.after(start, { happens: 'she_types_the_name', name: 'Luca B.' })
    const accept = (state: an_invitation_value.the_state) =>
      an_invitation.after(state, {
        happens: 'she_accepts',
        bond: 'B3',
        face: F_a,
        to_prepare: asked('A13'),
        to_open: asked('A14'),
      })
    const prepare = { activity: 'prepare_a_ticket', bond: 'B3', face: F_a } as const
    const accepted = accept(named.state)
    expect(accepted.asks).toEqual([{ asks: 'an_activity', activity_id: 'A13', what: prepare }])
    expect(an_invitation.what_it_shows(accepted.state, { activities: [] })).toEqual({
      shows: 'on_its_way',
      introduced_as: 'Luca',
    })
    const ready = an_invitation.after(accepted.state, {
      happens: 'her_ticket_is_ready',
      bond: 'B3',
    })
    const open = {
      activity: 'open_their_ticket',
      bond: 'B3',
      their_ticket: their_ticket('Luca'),
      name: 'Luca B.',
    } as const
    expect(ready.asks).toEqual([{ asks: 'an_activity', activity_id: 'A14', what: open }])
    expect(
      an_invitation.after(ready.state, { happens: 'her_ticket_is_ready', bond: 'B3' }).asks,
    ).toEqual([])
    const bonded = an_invitation.after(ready.state, it_ended('A14', done)).state
    expect(
      an_invitation.what_it_shows(bonded, {
        activities: [a_card('A13', prepare, done), a_card('A14', open, done)],
      }),
    ).toEqual({ shows: 'bonded', introduced_as: 'Luca', already: false })
    const declined = an_invitation.after(named.state, { happens: 'she_declines' })
    expect(declined.goes).toEqual({ goes: 'back' })
    expect(declined.asks).toEqual([])
    const emptied = an_invitation.after(start, { happens: 'she_types_the_name', name: '' }).state
    const shown = an_invitation.what_it_shows(emptied, { activities: [] })
    expect(shown.shows === 'the_invitation' && shown.the_button).toBe('off')
    expect(accept(emptied).asks).toEqual([])
  })

  test('a link out of its form is not an invitation; one used or expired is told', () => {
    const out_of_its_form = an_invitation.at_the_start({ holds: 'a_ticket_out_of_its_form' })
    expect(an_invitation.what_it_shows(out_of_its_form, { activities: [] })).toEqual({
      shows: 'not_an_invitation',
    })
    const accept = {
      happens: 'she_accepts',
      bond: 'B3',
      face: F_a,
      to_prepare: asked('A13'),
      to_open: asked('A14'),
    } as const
    expect(an_invitation.after(out_of_its_form, accept).asks).toEqual([])
    const accepted = an_invitation.after(an_invitation.at_the_start(a_ticket_link('Luca')), accept)
    const ready = an_invitation.after(accepted.state, {
      happens: 'her_ticket_is_ready',
      bond: 'B3',
    })
    const prepare = { activity: 'prepare_a_ticket', bond: 'B3', face: F_a } as const
    const open = {
      activity: 'open_their_ticket',
      bond: 'B3',
      their_ticket: their_ticket('Luca'),
      name: 'Luca',
    } as const
    const cannot = how('cannot_be_done', 'their_ticket_cannot_be_opened')
    const not_opened = an_invitation.after(ready.state, it_ended('A14', cannot)).state
    expect(
      an_invitation.what_it_shows(not_opened, {
        activities: [a_card('A13', prepare, done), a_card('A14', open, cannot)],
      }),
    ).toEqual({ shows: 'the_invitation_no_longer_holds', introduced_as: 'Luca', how: cannot })
    const the_app = how('the_app_cannot_do_it', 'the_node_is_closing')
    const not_prepared = an_invitation.after(accepted.state, it_ended('A13', the_app)).state
    expect(
      an_invitation.what_it_shows(not_prepared, { activities: [a_card('A13', prepare, the_app)] }),
    ).toEqual({ shows: 'the_invitation_no_longer_holds', introduced_as: 'Luca', how: the_app })
  })

  test('asking to activate opens the notice, and accepting asks with the manifest shown', () => {
    const start = an_extension.at_the_start(ping_pong)
    const given = (
      is: 'active' | 'not_active' | 'waiting_for_the_new_manifest',
      manifest = the_manifest,
    ): an_extension_value.what_it_is_given => ({
      extension: ping_pong_seen(is, manifest),
      held_letters: [],
      happened: [],
      activities: [],
    })
    const closed = an_extension.what_it_shows(start, given('not_active'))
    expect(closed.shows === 'the_extension' && closed.may).toBe('activate')
    expect(closed.shows === 'the_extension' && closed.the_notice).toBeUndefined()
    const asking = an_extension.after(start, { happens: 'she_asks_to_activate_it' }).state
    const the_notice = an_extension.what_it_shows(asking, given('not_active'))
    expect(the_notice.shows === 'the_extension' && the_notice.the_notice).toEqual([
      { asks: 'to_see_the_peers_key' },
      { asks: 'to_send_requests_on_your_bonds' },
      { asks: 'to_answer_your_bonds', leaves: ['usecase/ping'] },
      { asks: 'a_place_on_your_screens', point: 'action', name: 'ping', place: 'a_bond' },
      { asks: 'all_that_cumino_reaches' },
    ])
    const accepted = an_extension.after(asking, {
      happens: 'she_accepts',
      manifest: the_manifest,
      asked: asked('A15'),
    })
    expect(accepted.asks).toEqual([
      {
        asks: 'an_activity',
        activity_id: 'A15',
        what: { activity: 'activate_an_extension', manifest: the_manifest },
      },
    ])
    expect(accepted.state.the_notice).toBe('closed')
    const waiting = an_extension.what_it_shows(accepted.state, given('not_active'))
    expect(waiting.shows === 'the_extension' && waiting.may).toBe('wait')
    const not_accepted = an_extension.after(asking, { happens: 'she_does_not_accept' })
    expect(not_accepted.state.the_notice).toBe('closed')
    expect(not_accepted.asks).toEqual([])
    const another = user_value.a_manifest.parse({ ...the_manifest, name: 'another_one' })
    expect(
      an_extension.after(asking, { happens: 'she_accepts', manifest: another, asked: asked('A15') })
        .asks,
    ).toEqual([])
  })

  test('a new manifest waits for her to accept it; deactivating asks once', () => {
    const start = an_extension.at_the_start(ping_pong)
    const the_new_one = a_manifest(
      [{ point: 'page', name: 'the_scores', place: 'the_extension' }],
      '0.2.0',
    )
    const given = (
      is: 'active' | 'waiting_for_the_new_manifest',
      manifest = the_manifest,
    ): an_extension_value.what_it_is_given => ({
      extension: ping_pong_seen(is, manifest),
      held_letters: [],
      happened: [],
      activities: [],
    })
    const waiting = an_extension.what_it_shows(
      start,
      given('waiting_for_the_new_manifest', the_new_one),
    )
    expect(waiting.shows === 'the_extension' && waiting.may).toBe('accept_the_new_manifest')
    const asking = an_extension.after(start, { happens: 'she_asks_to_activate_it' }).state
    const its_notice = an_extension.what_it_shows(
      asking,
      given('waiting_for_the_new_manifest', the_new_one),
    )
    expect(its_notice.shows === 'the_extension' && its_notice.the_notice).toEqual(
      user_dsl.what_an_extension_asks(the_new_one),
    )
    expect(its_notice.shows === 'the_extension' && its_notice.the_notice).toContainEqual({
      asks: 'its_parts_act_with_no_tap',
    })
    const active = an_extension.what_it_shows(start, given('active'))
    expect(active.shows === 'the_extension' && active.may).toBe('deactivate')
    const deactivated = an_extension.after(start, {
      happens: 'she_deactivates_it',
      asked: asked('A16'),
    })
    expect(deactivated.asks).toEqual([
      {
        asks: 'an_activity',
        activity_id: 'A16',
        what: { activity: 'deactivate_an_extension', extension: ping_pong },
      },
    ])
    expect(
      an_extension.after(deactivated.state, {
        happens: 'she_deactivates_it',
        asked: asked('A16_again'),
      }).asks,
    ).toEqual([])
    const shown = an_extension.what_it_shows(deactivated.state, given('active'))
    expect(shown.shows === 'the_extension' && shown.may).toBe('wait')
  })

  test('an extension’s own screen holds its points while active, its letters held and what happened to it, in its mark', () => {
    const with_a_page = a_manifest([{ point: 'page', name: 'the_scores', place: 'the_extension' }])
    const start = an_extension.at_the_start(ping_pong)
    const given = (is: 'active' | 'not_active'): an_extension_value.what_it_is_given => ({
      extension: ping_pong_seen(is, with_a_page),
      held_letters: [the_kernels_letter, ping_pongs_letter],
      happened: [a_letter_unopened, a_silence],
      activities: [],
    })
    const its_own = { place: 'the_extension', extension: ping_pong } as const
    const active = an_extension.what_it_shows(start, given('active'))
    expect(active.shows === 'the_extension' && active.mark).toEqual({
      points: {
        extension: ping_pong,
        told: its_own,
        actions: [],
        slots: [],
        pages: ['the_scores'],
      },
      held_letters: [{ held: ping_pongs_letter, course: { course: 'nothing_asked' } }],
      happened: [a_silence],
    })
    const sent = an_extension.after(start, {
      happens: 'she_sends_a_letter_again',
      held: ping_pongs_letter,
      asked: asked('A17'),
    })
    expect(sent.asks).toEqual([
      {
        asks: 'an_activity',
        activity_id: 'A17',
        what: {
          activity: 'send_a_held_letter_again',
          whose: { of: 'an_extension', extension: ping_pong },
          letter: 'P1',
        },
      },
    ])
    const sending = an_extension.what_it_shows(sent.state, given('active'))
    expect(sending.shows === 'the_extension' && sending.mark.held_letters).toEqual([
      {
        held: ping_pongs_letter,
        course: { course: 'in_progress', activity_id: 'A17', since: ten },
      },
    ])
    expect(
      an_extension.after(start, {
        happens: 'she_puts_a_letter_aside',
        held: ping_pongs_letter,
        because: 'non serve',
        asked: asked('A17_aside'),
      }).asks,
    ).toEqual([
      {
        asks: 'an_activity',
        activity_id: 'A17_aside',
        what: {
          activity: 'put_a_held_letter_aside',
          whose: { of: 'an_extension', extension: ping_pong },
          letter: 'P1',
          because: 'non serve',
        },
      },
    ])
    expect(
      an_extension.after(start, {
        happens: 'she_sends_a_letter_again',
        held: the_kernels_letter,
        asked: asked('A17_kernel'),
      }).asks,
    ).toEqual([])
    const not_active = an_extension.what_it_shows(start, given('not_active'))
    expect(not_active.shows === 'the_extension' && not_active.mark).toEqual({
      held_letters: [{ held: ping_pongs_letter, course: { course: 'nothing_asked' } }],
      happened: [a_silence],
    })
    expect(an_extension.what_it_shows(start, { ...given('active'), extension: undefined })).toEqual(
      {
        shows: 'no_such_extension',
      },
    )
  })

  test('a page opens told the place’s data, and is no longer there once its place draws it no more', () => {
    const with_a_page = a_manifest([{ point: 'page', name: 'the_scores', place: 'the_extension' }])
    const its_own = { place: 'the_extension', extension: ping_pong } as const
    const shown = an_extension.what_it_shows(an_extension.at_the_start(ping_pong), {
      extension: ping_pong_seen('active', with_a_page),
      held_letters: [],
      happened: [],
      activities: [],
    })
    if (shown.shows !== 'the_extension' || shown.mark.points === undefined)
      throw new Error('ping pong’s mark expected')
    const mark = shown.mark.points
    const opened = an_extension.after(an_extension.at_the_start(ping_pong), {
      happens: 'she_opens_a_page',
      mark,
      page: 'the_scores',
    })
    const screen = {
      screen: 'a_page',
      extension: ping_pong,
      page: 'the_scores',
      told: its_own,
    } as const
    expect(opened.goes).toEqual({ goes: 'to_a_screen', screen })
    const the_page = a_page.at_the_start(screen)
    expect(
      a_page.what_it_shows(the_page, {
        extensions: [ping_pong_seen('active', with_a_page)],
        offers: offered_to(L_b, L_c),
      }),
    ).toEqual({ shows: 'the_part', extension: ping_pong, page: 'the_scores', told: its_own })
    expect(
      a_page.what_it_shows(the_page, {
        extensions: [ping_pong_seen('not_active', with_a_page)],
        offers: offered_to(L_b, L_c),
      }),
    ).toEqual({ shows: 'no_longer_there' })
    expect(a_page.after(the_page, { happens: 'she_goes_back' }).goes).toEqual({ goes: 'back' })
    expect(
      an_extension.after(an_extension.at_the_start(ping_pong), {
        happens: 'she_opens_a_page',
        mark,
        page: 'the_others',
      }).goes,
    ).toEqual({ goes: 'nowhere' })
  })

  test('what happened shows what is in progress, the kernel’s news, and each extension’s in its mark; a held letter is sent again once', () => {
    const start = what_happened.at_the_start()
    const nothing: what_happened_value.what_it_is_given = {
      in_progress: [],
      held_letters: [],
      happened: [],
      activities: [],
    }
    expect(what_happened.what_it_shows(start, nothing)).toEqual({ shows: 'nothing_happened' })
    const A1 = a_card('A1', { activity: 'make_my_first_face', face: F_a, name: 'Anna' })
    const given: what_happened_value.what_it_is_given = {
      in_progress: [A1],
      held_letters: [the_kernels_letter, ping_pongs_letter],
      happened: [a_letter_unopened, it_fell],
      activities: [],
    }
    const nothing_asked = { course: 'nothing_asked' } as const
    expect(what_happened.what_it_shows(start, given)).toEqual({
      shows: 'what_happened',
      in_progress: [A1],
      the_kernels: {
        held_letters: [{ held: the_kernels_letter, course: nothing_asked }],
        happened: [a_letter_unopened],
      },
      in_their_marks: [
        {
          extension: ping_pong,
          held_letters: [{ held: ping_pongs_letter, course: nothing_asked }],
          happened: [it_fell],
        },
      ],
    })
    const whose = { of: 'the_kernel', office: 'post' } as const
    const sent = what_happened.after(start, {
      happens: 'she_sends_a_letter_again',
      held: the_kernels_letter,
      asked: asked('A18'),
    })
    expect(sent.asks).toEqual([
      {
        asks: 'an_activity',
        activity_id: 'A18',
        what: { activity: 'send_a_held_letter_again', whose, letter: 'K1' },
      },
    ])
    const aside = (state: what_happened_value.the_state) =>
      what_happened.after(state, {
        happens: 'she_puts_a_letter_aside',
        held: the_kernels_letter,
        because: 'non serve',
        asked: asked('A19'),
      })
    expect(
      what_happened.after(sent.state, {
        happens: 'she_sends_a_letter_again',
        held: the_kernels_letter,
        asked: asked('A18_again'),
      }).asks,
    ).toEqual([])
    expect(aside(sent.state).asks).toEqual([])
    const ended = what_happened.after(sent.state, it_ended('A18', done)).state
    expect(aside(ended).asks).toEqual([
      {
        asks: 'an_activity',
        activity_id: 'A19',
        what: { activity: 'put_a_held_letter_aside', whose, letter: 'K1', because: 'non serve' },
      },
    ])
  })
  test('the server is shown once after the introduction, read again from the menu, and goes on to the start', () => {
    const shown = the_server.what_it_shows(the_server.at_the_start(), {
      relay: 'https://relay.cumino.test',
    })
    expect(shown).toEqual({ relay: 'https://relay.cumino.test' })
    for (const happens of [{ happens: 'she_goes_on' }, { happens: 'she_goes_back' }] as const) {
      expect(the_server.after(the_server.at_the_start(), happens)).toEqual({
        state: {},
        asks: [],
        goes: { goes: 'to_the_start' },
      })
    }
    const from_the_menu = my_contacts.after(
      { menu: 'open' },
      { happens: 'she_chooses', entry: 'the_server' },
    )
    expect(from_the_menu.goes).toEqual({ goes: 'to_a_screen', screen: { screen: 'the_server' } })
  })
  test('the introduction is read once after the first face, on to the server, skippable, and again from the menu, back where she was', () => {
    const first = the_introduction.at_the_start('the_first_time')
    expect(the_introduction.what_it_shows(first)).toEqual({
      card: 'what_cumino_is',
      the_cards: ['what_cumino_is', 'how_the_letters_travel', 'the_extensions'],
      going_on: 'to_the_next_card',
      turning_back: 'none',
      skipping: 'to_the_server',
    })
    const before_the_first = the_introduction.after(first, {
      happens: 'she_turns_to_the_card_before',
    })
    expect(before_the_first).toEqual({ state: first, asks: [], goes: { goes: 'nowhere' } })
    const second = the_introduction.after(first, { happens: 'she_turns_to_the_next_card' })
    expect(second.goes).toEqual({ goes: 'nowhere' })
    expect(second.asks).toEqual([])
    expect(the_introduction.what_it_shows(second.state)).toMatchObject({
      card: 'how_the_letters_travel',
      going_on: 'to_the_next_card',
      turning_back: 'to_the_card_before',
      skipping: 'to_the_server',
    })
    expect(
      the_introduction.after(second.state, { happens: 'she_turns_to_the_card_before' }).state,
    ).toEqual(first)
    const third = the_introduction.after(second.state, { happens: 'she_turns_to_the_next_card' })
    expect(the_introduction.what_it_shows(third.state)).toMatchObject({
      card: 'the_extensions',
      going_on: 'to_the_server',
      turning_back: 'to_the_card_before',
      skipping: 'none',
    })
    const to_the_server = { goes: 'to_a_screen', screen: { screen: 'the_server' } }
    expect(
      the_introduction.after(third.state, { happens: 'she_turns_to_the_next_card' }),
    ).toMatchObject({ asks: [], goes: to_the_server })
    expect(the_introduction.after(first, { happens: 'she_skips_it' })).toMatchObject({
      asks: [],
      goes: to_the_server,
    })
    expect(the_introduction.after(first, { happens: 'she_goes_back' }).goes).toEqual({
      goes: 'back',
    })
    const again = the_introduction.at_the_start('again')
    expect(the_introduction.what_it_shows(again)).toMatchObject({
      going_on: 'to_the_next_card',
      skipping: 'none',
    })
    const its_last = the_introduction.after(
      the_introduction.after(again, { happens: 'she_turns_to_the_next_card' }).state,
      { happens: 'she_turns_to_the_next_card' },
    ).state
    expect(the_introduction.what_it_shows(its_last).going_on).toBe('back_where_she_was')
    expect(
      the_introduction.after(its_last, { happens: 'she_turns_to_the_next_card' }).goes,
    ).toEqual({ goes: 'back' })
    expect(the_introduction.after(again, { happens: 'she_skips_it' }).goes).toEqual({
      goes: 'back',
    })
    const from_the_menu = my_contacts.after(
      { menu: 'open' },
      { happens: 'she_chooses', entry: 'the_introduction' },
    )
    expect(from_the_menu.goes).toEqual({
      goes: 'to_a_screen',
      screen: { screen: 'the_introduction', read: 'again' },
    })
    expect(
      ui.the_way_after([{ screen: 'my_contacts' }], from_the_menu.goes, [
        { screen: 'my_contacts' },
      ]),
    ).toEqual([{ screen: 'my_contacts' }, { screen: 'the_introduction', read: 'again' }])
  })

  test('a strip over every screen while the relay does not answer, none once it answers', () => {
    expect(ui.the_strip({ relay: 'did_not_answer', network: 'not_told' })).toEqual({
      strip: 'the_relay_does_not_answer',
    })
    expect(ui.the_strip({ relay: 'answered', network: 'not_told' })).toEqual({ strip: 'none' })
  })

  test('a strip while the relay answered it is full (REL-3), no network first', () => {
    expect(ui.the_strip({ relay: 'is_full', network: 'not_told' })).toEqual({
      strip: 'the_relay_is_full',
    })
    expect(ui.the_strip({ relay: 'is_full', network: 'offline' })).toEqual({ strip: 'no_network' })
  })

  test('no network, when her phone tells it, told apart from a relay silent, whatever the relay last did', () => {
    expect(ui.the_strip({ relay: 'did_not_answer', network: 'offline' })).toEqual({
      strip: 'no_network',
    })
    expect(ui.the_strip({ relay: 'answered', network: 'offline' })).toEqual({ strip: 'no_network' })
  })

  test('the answer of the extensions in common is shown beside its question, the last one asked', () => {
    const shown = (in_common: a_contact_value.what_it_is_given['in_common']) => {
      const it = a_contact.what_it_shows(
        a_contact.at_the_start(L_b),
        the_contact_given(L_b, { in_common }),
      )
      return it.shows === 'the_contact' ? it.in_common : undefined
    }
    expect(shown({ answer: 'not_asked' })).toEqual({ answer: 'not_asked' })
    expect(shown({ answer: 'waiting' })).toEqual({ answer: 'waiting' })
    expect(shown({ answer: 'in_common', extensions: [ping_pong] })).toEqual({
      answer: 'in_common',
      extensions: [ping_pong],
    })
    expect(shown({ answer: 'in_common', extensions: [] })).toEqual({ answer: 'none_in_common' })
    expect(shown({ answer: 'no_answer', why: 'no_response' })).toEqual({
      answer: 'no_answer',
      why: 'no_response',
    })
  })
})
