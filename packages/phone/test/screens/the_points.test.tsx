// The extension points, rendered (UI-4, EXT-16, WEB-22, WEB-23; stories 12,
// 13, 21 and 22 of `ui`'s README; part 22.2): on a bond, ping pong's mark
// with its action, labelled in its own words, drawn only while active and
// offered; tapped, an activity on the place, once at a time, its pong told in
// ping pong's words; a slot's frame in the same mark, sandboxed, its
// document after the kernel's policy; a page opened from the extension's own
// screen, its frame in the mark, no longer there once deactivated. And the
// frame's transport: told its place, its messages heard from its window
// only, through the fence (served only while active and shown, the
// extension's name added by the kernel), the events posted back by the
// exchange's id, what it did told in the mark; what the fence refuses traced.

import * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as user_value from '@q-mino/domains/user/_value.ts'
import { the_policy_of_a_frame } from '@q-mino/adapters-web'
import { afterEach, describe, expect, test } from 'vitest'
import {
  a_device_of_test,
  a_node_of_test,
  has_a_button,
  opens_the_app,
  ten_in_rome,
  texts,
  the_button,
  the_title,
  the_words,
  until,
  type TheAppOpened,
  type WhatTheNodeHolds,
} from './harness.tsx'

const words = texts.screens
let opened: TheAppOpened | undefined
afterEach(() => {
  opened?.closes()
  opened = undefined
})

const a_card = (bond: string, name: string): ui_value.a_contact_card =>
  ui_value.a_contact_card.parse({
    bond,
    name,
    introduced_as: name,
    confirmation: { state: 'received', at: ten_in_rome },
    handshake: { way: 'in_person', at: ten_in_rome },
    their_relays: [],
  })

const bruno = a_card('L_b', 'Bruno')
const carla = a_card('L_c', 'Carla')

type a_point = user_value.a_manifest['extension_points'][number]

/** Ping pong 0.1.0, its action `ping` on a bond, and the points a story adds. */
const ping_pong = (
  is: ui_value.an_extension_seen['is'],
  more: readonly a_point[] = [],
): ui_value.an_extension_seen =>
  ui_value.an_extension_seen.parse({
    extension: 'ping_pong',
    version: '0.1.0',
    is,
    manifest: user_value.a_manifest.parse({
      name: 'ping_pong',
      version: '0.1.0',
      sees: { known: [] },
      touches: ['the_port_of_requests', 'its_storage'],
      extension_points: [{ point: 'action', name: 'ping', place: 'a_bond' }, ...more],
      leaves_on_known: ['usecase/ping'],
      majors: { self: [1], known: [1] },
    }),
    what_it_asks: [{ asks: 'to_send_requests_on_your_bonds' }],
  })

/** Anna, her bonds with Bruno and Carla; ping pong active, offered to Bruno only. */
const anna = (extension = ping_pong('active')): Partial<WhatTheNodeHolds> => ({
  faces: [{ face: 'F_a', name: 'Anna' }],
  the_active_face: 'F_a',
  contacts: [bruno, carla].map((card) => ({
    bond: card.bond,
    name: card.name,
    introduced_as: card.introduced_as,
    confirmation: card.confirmation,
  })),
  cards: [bruno, carla],
  extensions: [extension],
  offers: [{ extension: 'ping_pong', bonds: ['L_b'] }],
  offered: [{ bond: 'L_b', offered: [{ extension: 'ping_pong', majors: [1] }] }],
})

const the_mark = words.common.the_mark_of('ping_pong')

/** Ping pong's mark on the screen shown, if drawn. */
const the_mark_shown = (app: TheAppOpened): HTMLElement | null =>
  app.shown().querySelector<HTMLElement>(`section[aria-label="${the_mark}"]`)

/** She opens a contact from her contacts, by its name, and waits for its card. */
const opens_the_contact = async (app: TheAppOpened, name: string): Promise<void> => {
  await until(() => {
    expect(the_title(app)).toBe(words.my_contacts.title)
    expect(has_a_button(app.shown(), name)).toBe(true)
  })
  the_button(app.shown(), name).click()
  await until(() => {
    expect(the_title(app)).toBe(words.a_contact.title)
    expect(app.shown().querySelector('h2')?.textContent).toBe(name)
  })
}

/** She opens the extension's own screen from the extensions, by the menu of her contacts. */
const opens_ping_pong = async (app: TheAppOpened): Promise<void> => {
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
    expect(has_a_button(app.shown(), 'ping_pong')).toBe(true)
  })
  the_button(app.shown(), 'ping_pong').click()
  await until(() => {
    expect(the_title(app)).toBe(words.an_extension.title)
  })
}

const the_frame_in = (within: HTMLElement): HTMLIFrameElement => {
  const frame = within.querySelector('iframe')
  if (frame === null) throw new Error('no frame')
  return frame
}

/** The frame's window, as the kernel hears it and posts to it. */
const the_window_of = (frame: HTMLIFrameElement): Window => {
  const view = frame.contentWindow
  if (view === null) throw new Error('the frame has no window')
  return view
}

/** What the kernel posted to a frame, in order. */
const posted_to = (frame: HTMLIFrameElement): unknown[] => {
  const posted: unknown[] = []
  the_window_of(frame).addEventListener('message', (event) => {
    posted.push(event.data)
  })
  return posted
}

/** The frame's window posts a message to the kernel. */
const the_frame_posts = (frame: HTMLIFrameElement, data: unknown): void => {
  window.dispatchEvent(new MessageEvent('message', { data, source: the_window_of(frame) }))
}

const a_document = '<!doctype html><p>the pings of a bond</p>'

describe('the extension points', () => {
  test('an extension’s points are drawn on a bond in its mark only while active and offered to it; a slot in the same mark', async () => {
    const anna_s = a_node_of_test(anna())
    opened = opens_the_app({ node: anna_s.node, device: a_device_of_test([]) })
    const app = opened
    await opens_the_contact(app, 'Bruno')
    await until(() => {
      expect(the_mark_shown(app)).not.toBeNull()
    })
    const mark = the_mark_shown(app)
    if (mark === null) throw new Error('no mark')
    expect(mark.querySelector('h2')?.textContent).toBe(the_mark)
    expect(has_a_button(mark, 'Ping')).toBe(true)

    // Carla: not offered, no mark.
    the_button(app.shown(), words.common.back).click()
    await opens_the_contact(app, 'Carla')
    expect(the_mark_shown(app)).toBeNull()

    // Not active: none on Bruno either.
    the_button(app.shown(), words.common.back).click()
    anna_s.comes_to_hold((now) => ({ ...now, extensions: [ping_pong('not_active')] }))
    await opens_the_contact(app, 'Bruno')
    await until(() => {
      expect(the_words(app)).toContain(words.a_contact.no_extension_active)
    })
    expect(the_mark_shown(app)).toBeNull()

    // A slot on a bond too: its frame in the same mark, sandboxed, after the kernel's policy.
    the_button(app.shown(), words.common.back).click()
    anna_s.comes_to_hold((now) => ({
      ...now,
      extensions: [
        ping_pong('active', [{ point: 'slot', name: 'the_pings_of_a_bond', place: 'a_bond' }]),
      ],
    }))
    await opens_the_contact(app, 'Bruno')
    await until(() => {
      expect(the_mark_shown(app)?.textContent).toContain(words.common.the_points.no_document)
    })
    const with_a_slot = the_mark_shown(app)
    if (with_a_slot === null) throw new Error('no mark')
    expect(has_a_button(with_a_slot, 'Ping')).toBe(true)
    // The app has no document for it: no frame, told as the app's fault.
    expect(with_a_slot.querySelector('iframe')).toBeNull()
  })

  test('tapping ping asks to use it on the bond, once while in progress; its pong is told in ping pong’s words', async () => {
    const anna_s = a_node_of_test(anna())
    opened = opens_the_app({ node: anna_s.node, device: a_device_of_test(['A8', 'A9', 'A10']) })
    const app = opened
    await opens_the_contact(app, 'Bruno')
    await until(() => {
      expect(the_mark_shown(app)).not.toBeNull()
    })
    const ping = () => {
      const mark = the_mark_shown(app)
      if (mark === null) throw new Error('no mark')
      return the_button(mark, 'Ping')
    }
    ping().click()
    await until(() => {
      expect(anna_s.activities_asked()).toEqual([
        {
          activity: 'use_an_action',
          extension: 'ping_pong',
          action: 'ping',
          on: { place: 'a_bond', bond: 'L_b' },
        },
      ])
      expect(ping().disabled).toBe(true)
    })
    expect(the_mark_shown(app)?.textContent).toContain(words.common.in_progress)
    ping().click()
    expect(anna_s.activities_asked()).toHaveLength(1)

    anna_s.ends('A8', {
      ended: 'the_extension_told_how_it_ended',
      said: { event: 'pong', payload: { ping_id: 'P1' } },
    })
    await until(() => {
      expect(the_mark_shown(app)?.textContent).toContain('pong!')
      expect(ping().disabled).toBe(false)
    })
    ping().click()
    await until(() => {
      expect(anna_s.activities_asked()).toHaveLength(2)
    })
    anna_s.ends('A9', {
      ended: 'the_extension_told_how_it_ended',
      said: { event: 'no_response', payload: { ping_id: 'P2' } },
    })
    await until(() => {
      expect(the_mark_shown(app)?.textContent).toContain('nessuna risposta')
    })
    // A ping called off, by a withdrawal or a deactivation while it waited (PNG-2): her own gesture, in ping pong's words.
    ping().click()
    await until(() => {
      expect(anna_s.activities_asked()).toHaveLength(3)
    })
    anna_s.ends('A10', {
      ended: 'the_extension_told_how_it_ended',
      said: { event: 'called_off', payload: { ping_id: 'P3' } },
    })
    await until(() => {
      expect(the_mark_shown(app)?.textContent).toContain('ping annullato')
    })
  })

  test('the extension’s own screen holds its page; opened, its frame in the mark, no longer there once deactivated', async () => {
    const with_a_page = ping_pong('active', [
      { point: 'page', name: 'the_scores', place: 'the_extension' },
    ])
    const anna_s = a_node_of_test(anna(with_a_page))
    opened = opens_the_app({
      node: anna_s.node,
      device: a_device_of_test([]),
      documents: (frame) =>
        frame.extension === 'ping_pong' && frame.point === 'page' && frame.name === 'the_scores'
          ? a_document
          : undefined,
    })
    const app = opened
    await opens_ping_pong(app)
    await until(() => {
      expect(has_a_button(app.shown(), words.common.the_points.opens_the_page('the_scores'))).toBe(
        true,
      )
    })
    the_button(app.shown(), words.common.the_points.opens_the_page('the_scores')).click()
    await until(() => {
      expect(the_title(app)).toBe(words.a_page.title)
      expect(the_mark_shown(app)?.querySelector('iframe')).toBeTruthy()
    })
    const mark = the_mark_shown(app)
    if (mark === null) throw new Error('no mark')
    const frame = the_frame_in(mark)
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts')
    expect(frame.getAttribute('title')).toBe(words.common.the_points.the_frame('the_scores'))
    const document_given = frame.getAttribute('srcdoc') ?? ''
    expect(
      document_given.startsWith('<!doctype html><meta http-equiv="Content-Security-Policy"'),
    ).toBe(true)
    expect(document_given).toContain(the_policy_of_a_frame)
    expect(document_given.endsWith(a_document)).toBe(true)

    anna_s.comes_to_hold((now) => ({
      ...now,
      extensions: [{ ...with_a_page, is: 'not_active' }],
    }))
    await until(() => {
      expect(the_words(app)).toContain(words.a_page.no_longer_there)
    })
    expect(app.shown().querySelector('iframe')).toBeNull()
  })

  test('a frame is told its place; its messages are fenced, served on its own extension, answered by id, and what it did is told in the mark', async () => {
    const anna_s = a_node_of_test(
      anna(ping_pong('active', [{ point: 'slot', name: 'the_pings_of_a_bond', place: 'a_bond' }])),
    )
    anna_s.answers_frames(() => [
      { event: 'snapshot', entries: [{ ping_id: 'P1' }] },
      { event: 'pong', payload: { ping_id: 'P1' } },
    ])
    opened = opens_the_app({
      node: anna_s.node,
      device: a_device_of_test([]),
      documents: (frame) => (frame.name === 'the_pings_of_a_bond' ? a_document : undefined),
    })
    const app = opened
    await opens_the_contact(app, 'Bruno')
    await until(() => {
      expect(the_mark_shown(app)?.querySelector('iframe')).toBeTruthy()
    })
    const mark = the_mark_shown(app)
    if (mark === null) throw new Error('no mark')
    const frame = the_frame_in(mark)
    const its_window = the_window_of(frame)
    const posted = posted_to(frame)

    // Loaded, it is told its place: the bond.
    frame.dispatchEvent(new Event('load'))
    await until(() => {
      expect(posted).toContainEqual({ message: 'placed', place: 'a_bond', data: { bond: 'L_b' } })
    })

    // It invokes its leaf: served with ping pong's name added, its events back by its id, then done.
    the_frame_posts(frame, {
      message: 'follow',
      id: 'f1',
      use_case: 'usecase/the_pings_of_a_bond',
      version: '1.0.0',
      input: { bond: 'L_b' },
    })
    await until(() => {
      expect(posted).toContainEqual({ message: 'done', id: 'f1' })
    })
    expect(anna_s.frames_asked()).toEqual([
      {
        fenced: 'served',
        exchange: 'follow',
        id: 'f1',
        invokes: {
          of: 'an_extension',
          extension: 'ping_pong',
          persona: 'self',
          use_case: 'usecase/the_pings_of_a_bond',
          version: '1.0.0',
        },
        input: { bond: 'L_b' },
      },
    ])
    expect(posted.filter((one) => JSON.stringify(one).includes('"event"'))).toEqual([
      { message: 'event', id: 'f1', event: { event: 'snapshot', entries: [{ ping_id: 'P1' }] } },
      { message: 'event', id: 'f1', event: { event: 'pong', payload: { ping_id: 'P1' } } },
    ])
    expect(mark.textContent).toContain(
      words.common.the_points.it_did('usecase/the_pings_of_a_bond', ten_in_rome, 'Europe/Rome'),
    )

    // A message from another window is not heard; one that is no frame's message is refused, traced.
    window.dispatchEvent(
      new MessageEvent('message', { data: { message: 'invoke' }, source: window }),
    )
    the_frame_posts(frame, { message: 'invoke', id: 'f2', extension: 'greetings' })
    await until(() => {
      expect(anna_s.frames_fenced()).toHaveLength(1)
    })
    expect(anna_s.frames_fenced()[0]).toMatchObject({
      why: 'a_frame_fenced',
      extension: 'ping_pong',
      fence: 'not_a_frames_message',
    })
    expect(anna_s.frames_asked()).toHaveLength(1)

    // Its screen closed: the frame removed hears nothing more.
    the_button(app.shown(), words.common.back).click()
    await until(() => {
      expect(the_title(app)).toBe(words.my_contacts.title)
    })
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          message: 'invoke',
          id: 'f3',
          use_case: 'usecase/send_a_ping',
          version: '1.0.0',
          input: {},
        },
        source: its_window,
      }),
    )
    expect(anna_s.frames_asked()).toHaveLength(1)
    expect(anna_s.frames_fenced()).toHaveLength(1)
  })

  test('a frame of a screen hidden under another is not shown: refused, traced, and its flows stopped', async () => {
    const anna_s = a_node_of_test(
      anna(
        ping_pong('active', [
          { point: 'slot', name: 'the_board', place: 'the_extension' },
          { point: 'page', name: 'the_scores', place: 'the_extension' },
        ]),
      ),
    )
    opened = opens_the_app({
      node: anna_s.node,
      device: a_device_of_test([]),
      documents: () => a_document,
    })
    const app = opened
    await opens_ping_pong(app)
    await until(() => {
      expect(the_mark_shown(app)?.querySelector('iframe')).toBeTruthy()
    })
    const mark = the_mark_shown(app)
    if (mark === null) throw new Error('no mark')
    const the_board = the_frame_in(mark)
    the_button(app.shown(), words.common.the_points.opens_the_page('the_scores')).click()
    await until(() => {
      expect(the_title(app)).toBe(words.a_page.title)
    })
    the_frame_posts(the_board, {
      message: 'invoke',
      id: 'b1',
      use_case: 'usecase/send_a_ping',
      version: '1.0.0',
      input: {},
    })
    await until(() => {
      expect(anna_s.frames_fenced()).toHaveLength(1)
    })
    expect(anna_s.frames_fenced()[0]).toMatchObject({
      why: 'a_frame_fenced',
      extension: 'ping_pong',
      fence: 'the_frame_is_not_shown',
    })
    expect(anna_s.frames_asked()).toEqual([])
  })
})
