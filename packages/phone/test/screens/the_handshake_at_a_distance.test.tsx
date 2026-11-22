// The handshake at a distance, rendered (UI-5, WEB-1; story 16 of `ui`'s
// README): the flaw told first, a link made of a ticket of hers, shown to
// copy and share once ready, one that cannot be prepared told.

import { the_link_of_a_ticket } from '@q-mino/adapters-web'
import type { HerTicket } from '@q-mino/adapters-web/screens'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { afterEach, describe, expect, test } from 'vitest'
import {
  a_device_of_test,
  a_sharing_of_test,
  a_node_of_test,
  has_a_button,
  opens_the_app,
  texts,
  the_button,
  the_title,
  the_words,
  until,
  type TheAppOpened,
} from './harness.tsx'

const words = texts.screens
const at_a_distance = words.the_handshake_at_a_distance
let opened: TheAppOpened | undefined
afterEach(() => {
  opened?.closes()
  opened = undefined
})

/** Anna's ticket for a bond to be, ready, and its link. */
const anna_s_ticket_for = (bond: string): HerTicket => ({
  ready: ui_value.a_ticket_ready.parse({ bond, expires_at: '2026-11-23T10:00:00+01:00' }),
  link: the_link_of_a_ticket('https://cumino.example/q-/')(
    activities_value.their_ticket.parse({
      key: `${'a'.repeat(42)}A`,
      introduced_as: 'Anna',
      mailbox: { deposit_address: `D_${bond}`, relays: ['https://relay.example'] },
      secret: `${'a'.repeat(85)}A`,
    }),
  ),
})

describe('the handshake at a distance', () => {
  test('where the phone has no share, the link is copied, and she is told it is copied', async () => {
    const anna = a_node_of_test({
      faces: [{ face: 'F_a', name: 'Anna' }],
      the_active_face: 'F_a',
      tickets: [anna_s_ticket_for('B2')],
    })
    const sharing = a_sharing_of_test(false)
    opened = opens_the_app({
      node: anna.node,
      device: a_device_of_test(['A12', 'B2'], undefined, sharing),
    })
    const app = opened
    await until(() => {
      expect(the_title(app)).toBe(words.my_contacts.title)
    })
    the_button(app.shown(), words.my_contacts.the_entries.the_handshake_at_a_distance).click()
    await until(() => {
      expect(has_a_button(app.shown(), at_a_distance.make_a_link)).toBe(true)
    })
    the_button(app.shown(), at_a_distance.make_a_link).click()
    await until(() => {
      expect(anna.activities_asked()).toHaveLength(1)
    })
    anna.ends('A12', {
      ended: 'done',
      said: { event: 'your_ticket_is_being_prepared', payload: {} },
    })
    await until(() => {
      expect(has_a_button(app.shown(), at_a_distance.copy_the_link)).toBe(true)
    })
    expect(has_a_button(app.shown(), at_a_distance.share_the_link)).toBe(false)
    the_button(app.shown(), at_a_distance.copy_the_link).click()
    await until(() => {
      expect(the_words(app)).toContain(at_a_distance.the_link_is_copied)
    })
    expect(sharing.copied()).toEqual([anna_s_ticket_for('B2').link])
  })

  test('the flaw is told first; making a link prepares a ticket, and once ready the link is shown', async () => {
    const anna = a_node_of_test({ faces: [{ face: 'F_a', name: 'Anna' }], the_active_face: 'F_a' })
    const sharing = a_sharing_of_test(true)
    opened = opens_the_app({
      node: anna.node,
      device: a_device_of_test(['A12', 'B2', 'A13', 'B3', 'A14', 'B4'], undefined, sharing),
    })
    const app = opened
    await until(() => {
      expect(the_title(app)).toBe(words.my_contacts.title)
    })
    the_button(app.shown(), words.my_contacts.the_entries.the_handshake_at_a_distance).click()
    await until(() => {
      expect(the_title(app)).toBe(at_a_distance.title)
    })
    await until(() => {
      expect(the_words(app)).toContain(at_a_distance.the_flaw)
    })
    expect(anna.activities_asked()).toEqual([])

    const make = the_button(app.shown(), at_a_distance.make_a_link)
    make.click()
    await until(() => {
      expect(anna.activities_asked()).toEqual([
        { activity: 'prepare_a_ticket', bond: 'B2', face: 'F_a' },
      ])
    })
    await until(() => {
      expect(the_words(app)).toContain(at_a_distance.getting_the_link_ready)
    })
    // While in progress there is no gesture: a second tap asks nothing, and draws no id.
    expect(has_a_button(app.shown(), at_a_distance.make_a_link)).toBe(false)
    make.click()

    const ready = anna_s_ticket_for('B2')
    anna.comes_to_hold((now) => ({ ...now, tickets: [ready] }))
    anna.ends('A12', {
      ended: 'done',
      said: { event: 'your_ticket_is_being_prepared', payload: {} },
    })
    await until(() => {
      expect(app.shown().querySelector<HTMLInputElement>('input[name="link"]')?.value).toBe(
        ready.link,
      )
    })
    expect(app.shown().querySelector<HTMLInputElement>('input[name="link"]')?.readOnly).toBe(true)
    // Shared with the phone's share (WEB-18).
    the_button(app.shown(), at_a_distance.share_the_link).click()
    await until(() => {
      expect(sharing.shared()).toEqual([ready.link])
    })

    // Another link, for another bond; it cannot be prepared, and she makes it again.
    the_button(app.shown(), at_a_distance.make_another).click()
    await until(() => {
      expect(the_words(app)).toContain(at_a_distance.getting_the_link_ready)
    })
    anna.ends('A13', {
      ended: 'cannot_be_done',
      said: { event: 'the_ticket_cannot_be_prepared', payload: {} },
    })
    await until(() => {
      expect(the_words(app)).toContain(at_a_distance.the_link_cannot_be_prepared)
    })
    expect(the_words(app)).toContain(words.common.how_it_ended.cannot_be_done)
    the_button(app.shown(), at_a_distance.try_again).click()
    await until(() => {
      expect(anna.activities_asked()).toEqual([
        { activity: 'prepare_a_ticket', bond: 'B2', face: 'F_a' },
        { activity: 'prepare_a_ticket', bond: 'B3', face: 'F_a' },
        { activity: 'prepare_a_ticket', bond: 'B4', face: 'F_a' },
      ])
    })
    expect(
      anna.handed().flatMap((one) => (one.asks === 'an_activity' ? [one.activity_id] : [])),
    ).toEqual(['A12', 'A13', 'A14'])
  })
})
