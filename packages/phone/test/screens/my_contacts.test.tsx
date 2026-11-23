// Her contacts and the way, rendered (UI-5, UI-1; stories 3, 7, 8 of `ui`'s
// README): her contacts as she reads them, the menu, the screens opened on
// top and closed by back.

import * as ui_value from '@q-mino/domains/ui/_value.ts'
import type * as my_contacts_value from '@q-mino/domains/ui/my_contacts/_value.ts'
import * as user_value from '@q-mino/domains/user/_value.ts'
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

/** Anna, her face F_a "Anna", the face she acts as. */
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

const carla = ui_value.a_contact_seen.parse({
  bond: 'L_c',
  name: 'Carla R.',
  introduced_as: 'Carla',
  confirmation: { state: 'awaited' },
})

const bruno_s_card = ui_value.a_contact_card.parse({
  ...bruno,
  handshake: { way: 'in_person', at: ten_in_rome },
  their_relays: ['wss://relay.example'],
})

/** The entry of her contacts that holds these words. */
const the_entry = (app: TheAppOpened, name: string): string =>
  (
    [...app.shown().querySelectorAll('li')].find((li) =>
      li.querySelector('button')?.textContent.includes(name),
    )?.textContent ?? ''
  )
    .replace(/\s+/g, ' ')
    .trim()

/** The screens of the way, the last one shown. */
const the_screens_open = (app: TheAppOpened): number =>
  app.root.querySelectorAll('main > div').length

/** Her contacts, kept under the screen shown. */
const her_contacts = (app: TheAppOpened): HTMLElement => {
  const found = app.root.querySelector<HTMLElement>(
    `main > div > section[aria-label="${words.my_contacts.title}"]`,
  )
  if (found === null) throw new Error('no contacts kept')
  return found
}

describe('her contacts', () => {
  test('no contacts shows the two handshakes; some, by her name, as introduced when it differs, and whether they have her', async () => {
    const alone = a_node_of_test(anna)
    opened = opens_the_app({ node: alone.node, device: a_device_of_test([]) })
    const first = opened
    await until(() => {
      expect(the_words(first)).toContain(words.my_contacts.none_yet)
    })
    expect(
      [...first.shown().querySelectorAll('button')]
        .map((button) => button.textContent.trim())
        .filter((text) => text !== words.my_contacts.the_menu),
    ).toEqual([
      words.my_contacts.the_entries.the_handshake_in_person,
      words.my_contacts.the_entries.the_handshake_at_a_distance,
    ])
    first.closes()

    const held = user_value.a_held_letter.parse({
      whose: { of: 'the_kernel', office: 'bonds' },
      letter: 'K1',
      what: 'La conferma a Bruno',
      why: { why: 'it_could_not_be_delivered', because: 'il relay non risponde' },
    })
    const with_two = a_node_of_test({ ...anna, contacts: [bruno, carla], held_letters: [held] })
    opened = opens_the_app({ node: with_two.node, device: a_device_of_test([]) })
    const app = opened
    await until(() => {
      expect(the_entry(app, 'Bruno')).toBe(`Bruno ${words.my_contacts.they_have_you}`)
    })
    expect(the_entry(app, 'Carla R.')).toBe(
      `Carla R. ${words.my_contacts.introduced_as('Carla')} ${words.my_contacts.not_yet}`,
    )
    expect(has_a_button(app.shown(), words.my_contacts.something_happened(1, 0))).toBe(true)
    expect(the_words(app)).not.toContain(words.my_contacts.none_yet)
  })

  test('each entry of the menu opens its screen and closes the menu', async () => {
    const entries: readonly (readonly [my_contacts_value.an_entry, string])[] = [
      ['the_handshake_in_person', words.the_handshake_in_person.title],
      ['the_handshake_at_a_distance', words.the_handshake_at_a_distance.title],
      ['the_extensions', words.the_extensions.title],
      ['what_happened', words.what_happened.title],
      ['the_server', words.the_server.title],
    ]
    for (const [entry, title] of entries) {
      opened?.closes()
      const anna_s = a_node_of_test({ ...anna, contacts: [bruno] })
      // Ids enough for a screen that asks at its opening (a ticket, a bond to be).
      opened = opens_the_app({
        node: anna_s.node,
        device: a_device_of_test(['A10', 'B1', 'A11', 'B2', 'A12', 'B3']),
      })
      const app = opened
      await until(() => {
        expect(has_a_button(app.shown(), words.my_contacts.the_menu)).toBe(true)
      })
      the_button(app.shown(), words.my_contacts.the_menu).click()
      await until(() => {
        expect(
          [...app.shown().querySelectorAll('nav button')].map((button) =>
            button.textContent.trim(),
          ),
        ).toEqual([
          ...entries.map(([one]) => words.my_contacts.the_entries[one]),
          words.my_contacts.close_the_menu,
        ])
      })
      the_button(app.shown(), words.my_contacts.the_entries[entry]).click()
      await until(() => {
        expect(the_title(app)).toBe(title)
      })
      expect(her_contacts(app).querySelector('nav')).toBeNull()
    }
  })
})

describe('the way', () => {
  test('a screen opens on top, the same again changes nothing, and back closes it, never the last', async () => {
    const anna_s = a_node_of_test({ ...anna, contacts: [bruno], cards: [bruno_s_card] })
    opened = opens_the_app({ node: anna_s.node, device: a_device_of_test([]) })
    const app = opened
    await until(() => {
      expect(has_a_button(app.shown(), 'Bruno')).toBe(true)
    })
    the_button(app.shown(), 'Bruno').click()
    await until(() => {
      expect(the_title(app)).toBe(words.a_contact.title)
    })
    expect(the_screens_open(app)).toBe(2)
    // The same contact again, from her contacts kept under it: nothing opens.
    the_button(her_contacts(app), 'Bruno').click()
    await until(() => {
      expect(the_words(app)).toContain(words.a_contact.the_confirmation.received)
    })
    expect(the_screens_open(app)).toBe(2)
    the_button(app.shown(), words.common.back).click()
    await until(() => {
      expect(the_title(app)).toBe(words.my_contacts.title)
    })
    expect(the_screens_open(app)).toBe(1)
    // The last screen has no way back.
    expect(has_a_button(app.shown(), words.common.back)).toBe(false)
    expect(anna_s.handed()).toEqual([])
  })
})
