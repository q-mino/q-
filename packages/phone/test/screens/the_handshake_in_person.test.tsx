// The handshake in person, rendered (UI-5, WEB-1, WEB-2; stories 14 and 15
// of `ui`'s README): her ticket prepared and its QR shown, the camera on
// while she scans, what it reads opened or told, what reaches her node.

import { the_link_of_a_ticket } from '@q-mino/adapters-web'
import { the_words_of_a_bond_made, type HerTicket } from '@q-mino/adapters-web/screens'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { afterEach, describe, expect, test } from 'vitest'
import { a_camera_of_test, a_camera_refused } from './camera_of_test.ts'
import {
  a_device_of_test,
  a_node_of_test,
  opens_the_app,
  texts,
  the_button,
  the_title,
  the_words,
  until,
  type ANodeOfTest,
  type TheAppOpened,
} from './harness.tsx'

const words = texts.screens
const in_person = words.the_handshake_in_person
let opened: TheAppOpened | undefined
afterEach(() => {
  opened?.closes()
  opened = undefined
})

const the_link_of = the_link_of_a_ticket('https://cumino.example/q-/')

/** A ticket as a face shows it, with its name and a letter of its own in its key and secret. */
const a_ticket = (introduced_as: string, letter: string): activities_value.their_ticket =>
  activities_value.their_ticket.parse({
    key: `${letter.repeat(42)}A`,
    introduced_as,
    mailbox: { deposit_address: `D_${letter}`, relays: ['https://relay.example'] },
    secret: `${letter.repeat(85)}A`,
  })

const bruno_s_ticket = a_ticket('Bruno', 'b')

/** Anna's ticket for a bond to be, ready, and its link. */
const anna_s_ticket_for = (bond: string): HerTicket => ({
  ready: ui_value.a_ticket_ready.parse({ bond, expires_at: '2026-11-21T10:10:00+01:00' }),
  link: the_link_of(a_ticket('Anna', 'a')),
})

const anna_with_her_face = (): ANodeOfTest =>
  a_node_of_test({ faces: [{ face: 'F_a', name: 'Anna' }], the_active_face: 'F_a' })

/** From her contacts, she opens the handshake in person. */
const opens_the_handshake = async (app: TheAppOpened): Promise<void> => {
  await until(() => {
    expect(the_title(app)).toBe(words.my_contacts.title)
  })
  the_button(app.shown(), words.my_contacts.the_entries.the_handshake_in_person).click()
  await until(() => {
    expect(the_title(app)).toBe(in_person.title)
  })
}

/** Her ticket for the bond comes to be ready: its QR is shown. */
const her_ticket_is_ready = async (
  anna: ANodeOfTest,
  app: TheAppOpened,
  bond: string,
): Promise<void> => {
  anna.comes_to_hold((now) => ({ ...now, tickets: [anna_s_ticket_for(bond)] }))
  await until(() => {
    expect(app.shown().querySelector('img')?.getAttribute('alt')).toBe(in_person.the_qr)
  })
}

describe('the handshake in person', () => {
  test('the screen opened prepares a ticket; ready it shows the QR and the camera; the first ticket scanned opens on its bond by its name', async () => {
    const anna = anna_with_her_face()
    const camera = a_camera_of_test()
    opened = opens_the_app({
      node: anna.node,
      device: a_device_of_test(['A10', 'B1', 'A11'], camera.scans),
    })
    const app = opened
    await opens_the_handshake(app)
    await until(() => {
      expect(anna.activities_asked()).toEqual([
        { activity: 'prepare_a_ticket', bond: 'B1', face: 'F_a' },
      ])
    })
    expect(the_words(app)).toContain(in_person.getting_the_ticket_ready)
    expect(camera.is_on()).toBe(false)

    await her_ticket_is_ready(anna, app, 'B1')
    expect(app.shown().querySelector('img')?.getAttribute('src')).toMatch(/^data:image\/svg\+xml,/)
    await until(() => {
      expect(camera.is_on()).toBe(true)
    })
    const video = app.shown().querySelector('video')
    expect(video?.muted).toBe(true)
    expect(video?.hidden).toBe(false)
    await until(() => {
      expect(the_words(app)).not.toContain(in_person.the_camera.off)
    })

    camera.shows(the_link_of(bruno_s_ticket))
    await until(() => {
      expect(anna.handed()).toContainEqual({
        asks: 'an_activity',
        activity_id: 'A11',
        what: {
          activity: 'open_their_ticket',
          bond: 'B1',
          their_ticket: bruno_s_ticket,
          name: 'Bruno',
        },
      })
    })
    await until(() => {
      expect(the_words(app)).toContain(in_person.opening_their_ticket('Bruno'))
    })
    await until(() => {
      expect(camera.is_on()).toBe(false)
    })
    // A second scan meanwhile: the camera is off, nothing is asked.
    camera.shows(the_link_of(bruno_s_ticket))

    anna.ends('A11', { ended: 'done', said: { event: 'you_met_in_person', payload: {} } })
    await until(() => {
      expect(the_words(app)).toContain(in_person.bonded_in_person('Bruno'))
    })
    expect(anna.activities_asked()).toHaveLength(2)
    expect(camera.turned_on()).toBe(1)
    the_button(app.shown(), in_person.open_the_contact).click()
    await until(() => {
      expect(the_title(app)).toBe(words.a_contact.title)
    })
    expect(camera.is_on()).toBe(false)
  })

  test('a text with no ticket is told and she scans on; a ticket that cannot be opened is told and she scans again', async () => {
    const anna = anna_with_her_face()
    const camera = a_camera_of_test()
    // S1..S4: the ids drawn by the scans that open nothing, which ask nothing.
    opened = opens_the_app({
      node: anna.node,
      device: a_device_of_test(
        ['A10', 'B1', 'S1', 'S2', 'S3', 'S4', 'A11', 'A12', 'A13', 'B2'],
        camera.scans,
      ),
    })
    const app = opened
    await opens_the_handshake(app)
    await her_ticket_is_ready(anna, app, 'B1')
    await until(() => {
      expect(camera.is_on()).toBe(true)
    })

    camera.shows('ciao')
    await until(() => {
      expect(the_words(app)).toContain(in_person.scanned.no_ticket)
    })
    // In the form of the link, with a name longer than her node takes (64): out of its form.
    camera.shows(the_link_of({ ...bruno_s_ticket, introduced_as: 'B'.repeat(70) }))
    await until(() => {
      expect(the_words(app)).toContain(in_person.scanned.a_ticket_out_of_its_form)
    })
    camera.shows('https://cumino.example/q-/')
    await until(() => {
      expect(the_words(app)).toContain(in_person.scanned.no_ticket)
    })
    camera.shows('https://cumino.example/q-/#ticket=!!!')
    await until(() => {
      expect(the_words(app)).toContain(in_person.scanned.a_ticket_out_of_its_form)
    })
    expect(anna.activities_asked()).toHaveLength(1)
    expect(camera.is_on()).toBe(true)

    camera.shows(the_link_of(bruno_s_ticket))
    await until(() => {
      expect(the_words(app)).toContain(in_person.opening_their_ticket('Bruno'))
    })
    anna.ends('A11', {
      ended: 'cannot_be_done',
      said: { event: 'their_ticket_cannot_be_opened', payload: {} },
    })
    await until(() => {
      expect(the_words(app)).toContain(in_person.their_ticket_cannot_be_opened('Bruno'))
    })
    expect(the_words(app)).toContain(words.common.how_it_ended.cannot_be_done)
    expect(app.shown().querySelector('img')?.getAttribute('alt')).toBe(in_person.the_qr)
    await until(() => {
      expect(camera.is_on()).toBe(true)
    })
    expect(camera.turned_on()).toBe(2)

    camera.shows(the_link_of(bruno_s_ticket))
    await until(() => {
      expect(anna.handed()).toContainEqual({
        asks: 'an_activity',
        activity_id: 'A12',
        what: {
          activity: 'open_their_ticket',
          bond: 'B1',
          their_ticket: bruno_s_ticket,
          name: 'Bruno',
        },
      })
    })
    anna.ends('A12', {
      ended: 'done_already',
      said: { event: 'you_opened_their_ticket_already', payload: {} },
    })
    await until(() => {
      expect(the_words(app)).toContain(in_person.bonded_already('Bruno'))
    })
    expect(anna.activities_asked()).toHaveLength(3)

    // Another hand: a new ticket, for another bond to be, the camera off until it is ready.
    the_button(app.shown(), in_person.shake_another_hand).click()
    await until(() => {
      expect(anna.activities_asked().at(-1)).toEqual({
        activity: 'prepare_a_ticket',
        bond: 'B2',
        face: 'F_a',
      })
    })
    await until(() => {
      expect(the_words(app)).toContain(in_person.getting_the_ticket_ready)
    })
    expect(camera.is_on()).toBe(false)

    // The camera refused: her QR shown, the camera told refused.
    opened.closes()
    const carla = anna_with_her_face()
    opened = opens_the_app({
      node: carla.node,
      device: a_device_of_test(['A20', 'B2'], a_camera_refused),
    })
    const refused = opened
    await opens_the_handshake(refused)
    await her_ticket_is_ready(carla, refused, 'B2')
    await until(() => {
      expect(the_words(refused)).toContain(in_person.the_camera.refused)
    })
  })

  test('"di persona" only when her node said it met them in person (BND-10)', () => {
    const made = (event: string, already = false) =>
      the_words_of_a_bond_made(in_person, {
        shows: 'bonded',
        introduced_as: 'Bruno',
        already,
        said: { event, payload: {} },
      })
    expect(made('you_met_in_person')).toBe(in_person.bonded_in_person('Bruno'))
    for (const at_a_distance of ['you_are_bonded', 'your_introduction_is_sent']) {
      expect(made(at_a_distance)).toBe(in_person.bonded('Bruno'))
      expect(made(at_a_distance)).not.toContain('di persona')
    }
    expect(made('you_opened_their_ticket_already', true)).toBe(in_person.bonded_already('Bruno'))
  })
})
