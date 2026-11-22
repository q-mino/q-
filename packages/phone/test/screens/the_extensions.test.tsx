// The extensions and an extension's own screen, rendered (UI-5; EXT-7,
// EXT-16, USR-7, USR-8; stories 19, 20, 21 of `ui`'s README, the points of
// the mark aside, part 22.2's): the list, the notice of what it asks, the
// manifest accepted, deactivating it, and its news in the kernel's mark.

import * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as user_value from '@q-mino/domains/user/_value.ts'
import { afterEach, describe, expect, test } from 'vitest'
import {
  a_device_of_test,
  a_node_of_test,
  has_a_button,
  opens_the_app,
  texts,
  the_button,
  the_title,
  the_words,
  types,
  until,
  type TheAppOpened,
  type WhatTheNodeHolds,
} from './harness.tsx'

const words = texts.screens
const its = words.an_extension
let opened: TheAppOpened | undefined
afterEach(() => {
  opened?.closes()
  opened = undefined
})

/** Ping pong's manifest: its action `ping` on `a_bond`, a page `the_scores` on its own screen. */
const the_manifest = (version: string): user_value.a_manifest =>
  user_value.a_manifest.parse({
    name: 'ping_pong',
    version,
    sees: { known: [] },
    touches: ['the_port_of_requests'],
    extension_points: [
      { point: 'action', name: 'ping', place: 'a_bond' },
      { point: 'page', name: 'the_scores', place: 'the_extension' },
    ],
    leaves_on_known: ['usecase/ping'],
    majors: { self: [1], known: [1] },
  })

/** What ping pong 0.1.0 asks, in USR-7's order: its manifest, then the flaws. */
const what_ping_pong_asks: user_value.what_an_extension_asks[] = [
  { asks: 'to_send_requests_on_your_bonds' },
  { asks: 'to_answer_your_bonds', leaves: ['usecase/ping'] },
  { asks: 'a_place_on_your_screens', point: 'action', name: 'ping', place: 'a_bond' },
  { asks: 'a_place_on_your_screens', point: 'page', name: 'the_scores', place: 'the_extension' },
  { asks: 'the_network_as_far_as_the_browser_leaves_it' },
  { asks: 'its_frames_act_with_no_tap' },
]

/** The same, in her words. */
const ping_pong_s_notice = [
  its.what_it_asks.to_send_requests_on_your_bonds,
  its.to_answer_your_bonds(['usecase/ping']),
  its.a_place_on_your_screens.action('ping', 'a_bond'),
  its.a_place_on_your_screens.page('the_scores', 'the_extension'),
  its.what_it_asks.the_network_as_far_as_the_browser_leaves_it,
  its.what_it_asks.its_frames_act_with_no_tap,
]

const ping_pong = (
  is: ui_value.an_extension_seen['is'],
  manifest = the_manifest('0.1.0'),
  what_it_asks = what_ping_pong_asks,
): ui_value.an_extension_seen =>
  ui_value.an_extension_seen.parse({
    extension: 'ping_pong',
    version: '0.1.0',
    is,
    manifest,
    what_it_asks,
  })

const anna: Partial<WhatTheNodeHolds> = {
  faces: [{ face: 'F_a', name: 'Anna' }],
  the_active_face: 'F_a',
}

/** She opens the extensions from the menu, then the extension, by its name. */
const opens_the_extension = async (app: TheAppOpened, extension: string): Promise<void> => {
  await until(() => {
    expect(has_a_button(app.shown(), words.my_contacts.the_menu)).toBe(true)
  })
  the_button(app.shown(), words.my_contacts.the_menu).click()
  await until(() => {
    expect(has_a_button(app.shown(), words.my_contacts.the_entries.the_extensions)).toBe(true)
  })
  the_button(app.shown(), words.my_contacts.the_entries.the_extensions).click()
  await until(() => {
    expect(the_title(app)).toBe(words.the_extensions.title)
    expect(has_a_button(app.shown(), extension)).toBe(true)
  })
  the_button(app.shown(), extension).click()
  await until(() => {
    expect(the_title(app)).toBe(its.title)
    expect(app.shown().querySelector('h2')?.textContent).toBe(extension)
  })
}

/** The notice, as she reads it: what it asks, in order. */
const the_notice = (app: TheAppOpened): string[] =>
  [...app.shown().querySelectorAll('ol li')].map((li) => li.textContent)

/** The kernel's mark of the extension on the screen shown, by the name its words give it. */
const the_mark = (app: TheAppOpened, name: string): HTMLElement => {
  const found = [...app.shown().querySelectorAll<HTMLElement>('section')].find(
    (section) => section.getAttribute('aria-label') === words.common.the_mark_of(name),
  )
  if (found === undefined) throw new Error(`no mark of ${name}`)
  return found
}

/** The letter held in a mark, by what it is. */
const the_letter = (within: HTMLElement, what: string): HTMLElement => {
  const found = [...within.querySelectorAll<HTMLElement>('li')].find((li) =>
    li.textContent.includes(what),
  )
  if (found === undefined) throw new Error(`no letter "${what}"`)
  return found
}

const said = (event: string) => ({ event, payload: {} })

describe('the extensions', () => {
  test('asking to activate opens the notice, and accepting asks with the manifest shown', async () => {
    const anna_s = a_node_of_test({ ...anna, extensions: [ping_pong('not_active')] })
    opened = opens_the_app({ node: anna_s.node, device: a_device_of_test(['A15']) })
    const app = opened
    await until(() => {
      expect(has_a_button(app.shown(), words.my_contacts.the_menu)).toBe(true)
    })
    the_button(app.shown(), words.my_contacts.the_menu).click()
    the_button(app.shown(), words.my_contacts.the_entries.the_extensions).click()
    await until(() => {
      expect(the_words(app)).toContain(
        `ping_pong ${words.the_extensions.the_version('0.1.0')} ${words.the_extensions.is.not_active}`,
      )
    })
    the_button(app.shown(), words.common.back).click()
    await opens_the_extension(app, 'ping_pong')
    expect(the_words(app)).toContain(its.is.not_active)
    expect(the_notice(app)).toEqual([])

    // The notice, then not accepted: closed, nothing asked.
    the_button(app.shown(), its.may.activate).click()
    await until(() => {
      expect(the_notice(app)).toEqual(ping_pong_s_notice)
    })
    expect(the_words(app)).toContain(its.the_notice('ping_pong', '0.1.0'))
    the_button(app.shown(), its.do_not_accept).click()
    await until(() => {
      expect(the_notice(app)).toEqual([])
    })
    expect(anna_s.handed()).toEqual([])

    // The notice again, accepted: the manifest she was shown.
    the_button(app.shown(), its.may.activate).click()
    await until(() => {
      expect(the_notice(app)).toEqual(ping_pong_s_notice)
    })
    the_button(app.shown(), its.accept).click()
    await until(() => {
      expect(anna_s.activities_asked()).toEqual([
        { activity: 'activate_an_extension', manifest: the_manifest('0.1.0') },
      ])
    })
    await until(() => {
      expect(the_button(app.shown(), its.may.wait).disabled).toBe(true)
    })
    expect(the_notice(app)).toEqual([])
  })

  test('a new manifest waits for her to accept it; deactivating asks once', async () => {
    const what_the_new_one_asks: user_value.what_an_extension_asks[] = [
      ...what_ping_pong_asks,
      { asks: 'a_storage_of_its_own' },
    ]
    const anna_s = a_node_of_test({
      ...anna,
      extensions: [
        ping_pong('waiting_for_the_new_manifest', the_manifest('0.2.0'), what_the_new_one_asks),
      ],
    })
    opened = opens_the_app({
      node: anna_s.node,
      device: a_device_of_test(['A15', 'A16', 'A16bis']),
    })
    const app = opened
    await opens_the_extension(app, 'ping_pong')
    expect(the_words(app)).toContain(its.is.waiting_for_the_new_manifest)
    the_button(app.shown(), its.may.accept_the_new_manifest).click()
    await until(() => {
      expect(the_notice(app)).toEqual([
        ...ping_pong_s_notice,
        its.what_it_asks.a_storage_of_its_own,
      ])
    })
    expect(the_words(app)).toContain(its.the_notice('ping_pong', '0.2.0'))
    the_button(app.shown(), its.accept).click()
    await until(() => {
      expect(anna_s.activities_asked()).toEqual([
        { activity: 'activate_an_extension', manifest: the_manifest('0.2.0') },
      ])
    })

    // Accepted: active; she deactivates it, once while in progress.
    anna_s.comes_to_hold((now) => ({
      ...now,
      extensions: [ping_pong('active', the_manifest('0.2.0'), what_the_new_one_asks)],
    }))
    anna_s.ends('A15', { ended: 'done', said: said('the_extension_is_active') })
    await until(() => {
      expect(has_a_button(app.shown(), its.may.deactivate)).toBe(true)
    })
    the_button(app.shown(), its.may.deactivate).click()
    await until(() => {
      expect(the_button(app.shown(), its.may.wait).disabled).toBe(true)
    })
    the_button(app.shown(), its.may.wait).click()
    await until(() => {
      expect(anna_s.activities_asked()).toEqual([
        { activity: 'activate_an_extension', manifest: the_manifest('0.2.0') },
        { activity: 'deactivate_an_extension', extension: 'ping_pong' },
      ])
    })
  })

  test('an extension’s own screen holds its letters held and what happened to it, in its mark', async () => {
    const its_letter = user_value.a_held_letter.parse({
      whose: { of: 'an_extension', extension: 'ping_pong' },
      letter: 'P1',
      what: 'Un ping a un contatto tolto',
      why: { why: 'it_could_not_be_delivered', because: 'il relay non risponde' },
    })
    const the_kernel_s_letter = user_value.a_held_letter.parse({
      whose: { of: 'the_kernel', office: 'bonds' },
      letter: 'K1',
      what: 'La conferma a Bruno',
      why: { why: 'what_came_back_was_refused' },
    })
    const anna_s = a_node_of_test({
      ...anna,
      extensions: [ping_pong('active')],
      held_letters: [the_kernel_s_letter, its_letter],
      happened: [
        {
          happened: 'a_request_met_silence',
          bond: 'L_b',
          extension: 'ping_pong',
          because: 'the_extension_is_not_offered_to_the_bond',
        },
        { happened: 'a_letter_could_not_be_opened' },
      ],
    })
    opened = opens_the_app({ node: anna_s.node, device: a_device_of_test(['A17', 'A18']) })
    const app = opened
    await opens_the_extension(app, 'ping_pong')
    const news = words.an_extension.the_news
    const the_silence = `${news.happened.a_request_met_silence}: ${news.the_silence_because.the_extension_is_not_offered_to_the_bond}`
    await until(() => {
      expect(the_mark(app, 'Ping pong').textContent).toContain('Un ping a un contatto tolto')
    })
    expect(the_mark(app, 'Ping pong').textContent).toContain(the_silence)
    expect(the_mark(app, 'Ping pong').textContent).toContain(
      news.why_it_is_held.it_could_not_be_delivered,
    )
    expect(the_mark(app, 'Ping pong').textContent).toContain('il relay non risponde')
    expect(the_words(app)).not.toContain('La conferma a Bruno')
    expect(the_words(app)).not.toContain(news.happened.a_letter_could_not_be_opened)

    // Sent again, once while in progress; then put aside with her reason.
    const the_ping = () => the_letter(the_mark(app, 'Ping pong'), 'Un ping a un contatto tolto')
    the_button(the_ping(), news.send_it_again).click()
    await until(() => {
      expect(the_button(the_ping(), news.send_it_again).disabled).toBe(true)
    })
    await until(() => {
      expect(anna_s.activities_asked()).toEqual([
        {
          activity: 'send_a_held_letter_again',
          whose: { of: 'an_extension', extension: 'ping_pong' },
          letter: 'P1',
        },
      ])
    })
    anna_s.ends('A17', { ended: 'done', said: said('the_letter_is_sent_again') })
    await until(() => {
      expect(the_button(the_ping(), news.put_it_aside).disabled).toBe(false)
    })
    types(the_ping(), 'because', 'non serve')
    the_button(the_ping(), news.put_it_aside).click()
    await until(() => {
      expect(anna_s.activities_asked()).toContainEqual({
        activity: 'put_a_held_letter_aside',
        whose: { of: 'an_extension', extension: 'ping_pong' },
        letter: 'P1',
        because: 'non serve',
      })
    })

    // Not active: its news still there. Not installed: no such extension.
    anna_s.comes_to_hold((now) => ({ ...now, extensions: [ping_pong('not_active')] }))
    await until(() => {
      expect(has_a_button(app.shown(), its.may.activate)).toBe(true)
    })
    expect(the_mark(app, 'Ping pong').textContent).toContain('Un ping a un contatto tolto')
    expect(the_mark(app, 'Ping pong').textContent).toContain(the_silence)
    anna_s.comes_to_hold((now) => ({ ...now, extensions: [] }))
    await until(() => {
      expect(the_words(app)).toContain(its.no_such_extension)
    })
    expect(anna_s.activities_asked()).toHaveLength(2)
  })
})
