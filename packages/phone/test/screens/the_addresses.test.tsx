// A view's link and the browser's history, rendered (WEB-25, UI-1): each
// view of the way an entry of the page's history, with its address in her
// words; a refresh opens the same view; the browser's back (Android's, the
// installed app's) goes to the view before, and from her contacts leaves the
// app; an address opened cold opens its view over her contacts; the
// invitation's ticket leaves the address once the invitation is open.

import { the_link_of_a_ticket } from '@q-mino/adapters-web'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as user_value from '@q-mino/domains/user/_value.ts'
import * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { afterEach, describe, expect, test } from 'vitest'
import {
  a_device_of_test,
  a_history_of_test,
  a_node_of_test,
  has_a_button,
  opens_the_app,
  ten_in_rome,
  texts,
  the_button,
  the_page,
  the_title,
  the_words,
  types,
  until,
  type AHistoryOfTest,
  type ANodeOfTest,
  type TheAppOpened,
  type WhatTheNodeHolds,
} from './harness.tsx'

const words = texts.screens
let opened: TheAppOpened | undefined
afterEach(() => {
  opened?.closes()
  opened = undefined
})

const anna: Partial<WhatTheNodeHolds> = {
  faces: [{ face: 'F_a', name: 'Anna' }],
  the_active_face: 'F_a',
}

const bruno = ui_value.a_contact_seen.parse({
  bond: 'L_b',
  name: 'Bruno',
  introduced_as: 'Bruno',
  confirmation: { state: 'received', at: ten_in_rome },
})

const bruno_s_card = ui_value.a_contact_card.parse({
  ...bruno,
  handshake: { way: 'in_person', at: ten_in_rome },
  their_relays: ['wss://relay.example'],
})

const ping_pong = ui_value.an_extension_seen.parse({
  extension: 'ping_pong',
  version: '0.1.0',
  is: 'not_active',
  manifest: user_value.a_manifest.parse({
    name: 'ping_pong',
    version: '0.1.0',
    sees: { known: [] },
    touches: ['the_port_of_requests'],
    extension_points: [{ point: 'action', name: 'ping', place: 'a_bond' }],
    leaves_on_known: ['usecase/ping'],
    majors: { self: [1], known: [1] },
  }),
  what_it_asks: [{ asks: 'to_send_requests_on_your_bonds' }],
})

/** Anna with Bruno and ping pong installed. */
const anna_s = (): ANodeOfTest =>
  a_node_of_test({ ...anna, contacts: [bruno], cards: [bruno_s_card], extensions: [ping_pong] })

/** Ids enough for a screen that asks at its opening (a ticket, a bond to be). */
const ids = ['A10', 'B1', 'A11', 'B2', 'A12', 'B3', 'A13', 'B4']

/** The app opened on this node and history; a refresh is the same call again. */
const opens = (node: ANodeOfTest, history: AHistoryOfTest): TheAppOpened => {
  opened?.closes()
  opened = opens_the_app({ node: node.node, device: a_device_of_test(ids), the_history: history })
  return opened
}

/** Until the screen shown has this title. */
const on = async (app: TheAppOpened, title: string): Promise<void> => {
  await until(() => {
    expect(the_title(app)).toBe(title)
  })
}

/** She opens an entry of the menu of her contacts. */
const chooses = async (app: TheAppOpened, entry: string): Promise<void> => {
  await until(() => {
    expect(has_a_button(app.shown(), words.my_contacts.the_menu)).toBe(true)
  })
  the_button(app.shown(), words.my_contacts.the_menu).click()
  await until(() => {
    expect(has_a_button(app.shown(), entry)).toBe(true)
  })
  the_button(app.shown(), entry).click()
}

/** The addresses of the app's entries, in order. */
const the_addresses = (history: AHistoryOfTest): readonly string[] =>
  history.the_entries().map((entry) => new URL(entry.url).hash)

describe("a view's address", () => {
  test('the app opened at its page writes her contacts, and back from them leaves the app', async () => {
    const history = a_history_of_test()
    const app = opens(anna_s(), history)
    await on(app, words.my_contacts.title)
    expect(history.the_address()).toBe('#/contatti')
    expect(history.the_entries()).toHaveLength(1)
    history.back()
    expect(history.left()).toBe(true)
  })

  test('a view opened on top is an entry of its own, and a refresh opens it again', async () => {
    const node = anna_s()
    const history = a_history_of_test()
    let app = opens(node, history)
    await until(() => {
      expect(has_a_button(app.shown(), 'Bruno')).toBe(true)
    })
    the_button(app.shown(), 'Bruno').click()
    await on(app, words.a_contact.title)
    expect(history.the_address()).toBe('#/contatti/L_b')
    expect(history.at()).toBe(1)
    // The refresh: the page opened again on the same history.
    app = opens(node, history)
    await on(app, words.a_contact.title)
    expect(the_words(app)).toContain('Bruno')
    expect(history.the_address()).toBe('#/contatti/L_b')
    expect(history.the_entries()).toHaveLength(2)
    history.back()
    await on(app, words.my_contacts.title)
    expect(history.at()).toBe(0)
    history.back()
    expect(history.left()).toBe(true)
  })

  test('back across three views to her contacts, then out; her own «Indietro» goes the same way', async () => {
    const history = a_history_of_test()
    const app = opens(anna_s(), history)
    await chooses(app, words.my_contacts.the_entries.the_extensions)
    await on(app, words.the_extensions.title)
    expect(history.the_address()).toBe('#/estensioni')
    await until(() => {
      expect(has_a_button(app.shown(), 'Ping pong')).toBe(true)
    })
    the_button(app.shown(), 'Ping pong').click()
    await on(app, words.an_extension.title)
    expect(history.the_address()).toBe('#/estensioni/ping_pong')
    expect(history.at()).toBe(2)
    // Her own back goes through the browser's history.
    the_button(app.shown(), words.common.back).click()
    await on(app, words.the_extensions.title)
    expect(history.at()).toBe(1)
    history.forward()
    await on(app, words.an_extension.title)
    history.back()
    await on(app, words.the_extensions.title)
    history.back()
    await on(app, words.my_contacts.title)
    expect(history.the_address()).toBe('#/contatti')
    history.back()
    expect(history.left()).toBe(true)
  })

  test('a refresh on each view of the menu opens it again', async () => {
    const node = anna_s()
    for (const [entry, title, address] of [
      ['the_handshake_in_person', words.the_handshake_in_person.title, '#/di-persona'],
      ['the_handshake_at_a_distance', words.the_handshake_at_a_distance.title, '#/a-distanza'],
      ['the_extensions', words.the_extensions.title, '#/estensioni'],
      ['what_happened', words.what_happened.title, '#/cosa-e-successo'],
      ['the_introduction', words.the_introduction.title, '#/introduzione'],
      ['the_server', words.the_server.title, '#/server'],
    ] as const) {
      const history = a_history_of_test()
      let app = opens(node, history)
      await chooses(app, words.my_contacts.the_entries[entry])
      await on(app, title)
      expect(history.the_address()).toBe(address)
      app = opens(node, history)
      await on(app, title)
      expect(history.the_entries()).toHaveLength(2)
      history.back()
      await on(app, words.my_contacts.title)
    }
  })

  test('an address opened cold opens its view over the screens it is reached from', async () => {
    const history = a_history_of_test(`${the_page}#/estensioni/ping_pong`)
    const app = opens(anna_s(), history)
    await on(app, words.an_extension.title)
    expect(the_addresses(history)).toEqual(['#/contatti', '#/estensioni', '#/estensioni/ping_pong'])
    history.back()
    await on(app, words.the_extensions.title)
    history.back()
    await on(app, words.my_contacts.title)
    history.back()
    expect(history.left()).toBe(true)
  })

  test('an address typed in the bar opens its view', async () => {
    const history = a_history_of_test()
    const app = opens(anna_s(), history)
    await on(app, words.my_contacts.title)
    history.types('#/server')
    await on(app, words.the_server.title)
    history.back()
    await on(app, words.my_contacts.title)
  })

  test('an address of a contact no longer there tells it, and back is her contacts', async () => {
    const history = a_history_of_test(`${the_page}#/contatti/L_x`)
    const app = opens(anna_s(), history)
    await on(app, words.a_contact.title)
    await until(() => {
      expect(the_words(app)).toContain(words.a_contact.no_such_contact)
    })
    the_button(app.shown(), words.common.back).click()
    await on(app, words.my_contacts.title)
  })

  test('an address that names no view, or a ticket out of its form, opens her contacts', async () => {
    for (const address of ['#/altrove', '#/contatti/L_b/ping_pong', '#ticket=Zm9v', '#']) {
      const history = a_history_of_test(`${the_page}${address}`)
      const app = opens(anna_s(), history)
      await on(app, words.my_contacts.title)
      expect(history.the_address()).toBe('#/contatti')
    }
  })
})

describe("the invitation's ticket and the address", () => {
  const luca = activities_value.their_ticket.parse({
    key: `${'l'.repeat(42)}A`,
    introduced_as: 'Luca',
    mailbox: { deposit_address: 'D_luca', relays: ['https://relay.example'] },
    secret: `${'l'.repeat(85)}A`,
  })
  const the_link = ui_value.what_it_holds.parse({ holds: 'a_ticket', ticket: luca })

  test('the ticket leaves the address once the invitation opens, and the invitation is passed over once gone', async () => {
    const history = a_history_of_test(the_link_of_a_ticket(the_page)(luca))
    opened = opens_the_app({
      node: anna_s().node,
      device: a_device_of_test(ids),
      the_history: history,
      a_link: the_link,
    })
    const app = opened
    await on(app, words.an_invitation.title)
    expect(the_addresses(history)).toEqual(['#/contatti', '#/invito'])
    expect(JSON.stringify(history.the_entries())).not.toContain('ticket=')
    expect(JSON.stringify(history.the_entries())).not.toContain(luca.secret)
    history.back()
    await on(app, words.my_contacts.title)
    // Forward to the invitation, whose ticket the way no longer holds: passed over.
    history.forward()
    await until(() => {
      expect(history.at()).toBe(1)
    })
    await until(() => {
      expect(history.at()).toBe(0)
    })
    expect(the_title(app)).toBe(words.my_contacts.title)
  })

  test('a link followed while the app is open opens its invitation on top of where she is, and the ticket leaves the address', async () => {
    const link = the_link_of_a_ticket(the_page)(luca)
    const history = a_history_of_test()
    opened = opens_the_app({
      node: anna_s().node,
      device: a_device_of_test(ids),
      the_history: history,
      the_link_in: (address) => (address === link ? the_link : undefined),
    })
    const app = opened
    await chooses(app, words.my_contacts.the_entries.the_extensions)
    await on(app, words.the_extensions.title)
    history.types(link)
    await on(app, words.an_invitation.title)
    expect(the_addresses(history)).toEqual(['#/contatti', '#/estensioni', '#/invito'])
    expect(JSON.stringify(history.the_entries())).not.toContain('ticket=')
    history.back()
    await on(app, words.the_extensions.title)
    history.back()
    await on(app, words.my_contacts.title)
  })

  test('with no face, the first face whatever the address, which waits for her face', async () => {
    const node = a_node_of_test({ extensions: [ping_pong] })
    const history = a_history_of_test(`${the_page}#/estensioni`)
    opened = opens_the_app({
      node: node.node,
      device: a_device_of_test(['A1', 'F_a']),
      the_history: history,
    })
    const app = opened
    await on(app, words.the_first_face.title)
    expect(history.the_address()).toBe('#/estensioni')
    types(app.shown(), 'name', 'Anna')
    the_button(app.shown(), words.the_first_face.make_it).click()
    await until(() => {
      expect(node.activities_asked()).toHaveLength(1)
    })
    node.comes_to_hold((now) => ({ ...now, faces: [{ face: 'F_a', name: 'Anna' }] }))
    node.ends('A1', { ended: 'done', said: { event: 'your_face_is_being_made', payload: {} } })
    // The introduction, read the first time (UI-6), skipped on to the server.
    await on(app, words.the_introduction.title)
    expect(history.the_address()).toBe('#/introduzione')
    the_button(app.shown(), words.the_introduction.skip).click()
    await on(app, words.the_server.title)
    expect(history.the_address()).toBe('#/server')
    await until(() => {
      expect(has_a_button(app.shown(), words.the_server.go_on)).toBe(true)
    })
    the_button(app.shown(), words.the_server.go_on).click()
    // The view she opened the app at, over her contacts.
    await on(app, words.the_extensions.title)
    expect(the_addresses(history)).toEqual(['#/contatti', '#/estensioni'])
    history.back()
    await on(app, words.my_contacts.title)
  })

  test('with no face the ticket stays in the address, so that a refresh keeps it, until the invitation opens', async () => {
    const node = a_node_of_test()
    const link = the_link_of_a_ticket(the_page)(luca)
    const history = a_history_of_test(link)
    opened = opens_the_app({
      node: node.node,
      device: a_device_of_test(['A1', 'F_a']),
      the_history: history,
      a_link: the_link,
    })
    const app = opened
    await on(app, words.the_first_face.title)
    expect(history.location.href).toBe(link)
    types(app.shown(), 'name', 'Anna')
    the_button(app.shown(), words.the_first_face.make_it).click()
    await until(() => {
      expect(node.activities_asked()).toHaveLength(1)
    })
    node.comes_to_hold((now) => ({ ...now, faces: [{ face: 'F_a', name: 'Anna' }] }))
    node.ends('A1', { ended: 'done', said: { event: 'your_face_is_being_made', payload: {} } })
    await on(app, words.the_introduction.title)
    the_button(app.shown(), words.the_introduction.skip).click()
    await on(app, words.the_server.title)
    await until(() => {
      expect(has_a_button(app.shown(), words.the_server.go_on)).toBe(true)
    })
    the_button(app.shown(), words.the_server.go_on).click()
    await on(app, words.an_invitation.title)
    expect(the_addresses(history)).toEqual(['#/contatti', '#/invito'])
  })
})

describe('the words of the views', () => {
  test('are segments of an address she reads as they are, all different', () => {
    const all = Object.values(words.views)
    for (const word of all) expect(word).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    expect(new Set(all).size).toBe(all.length)
  })
})
