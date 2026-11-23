// An invitation, rendered (UI-5, UI-1, WEB-1; stories 2, 17 and 18 of `ui`'s
// README): a link opened at the start, the invitation accepted or declined,
// her ticket prepared and then his opened on it, one that does not hold told.

import type { HerTicket } from '@q-mino/adapters-web/screens'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as activities_value from '@q-mino/domains/user/activities/_value.ts'
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
  type ANodeOfTest,
  type TheAppOpened,
} from './harness.tsx'

const words = texts.screens
const invitation = words.an_invitation
let opened: TheAppOpened | undefined
afterEach(() => {
  opened?.closes()
  opened = undefined
})

/** The app opened for a story, the one opened before closed. */
const opens = (wiring: Parameters<typeof opens_the_app>[0]): TheAppOpened => {
  opened?.closes()
  opened = opens_the_app(wiring)
  return opened
}

const luca_s_ticket = activities_value.their_ticket.parse({
  key: `${'l'.repeat(42)}A`,
  introduced_as: 'Luca',
  mailbox: { deposit_address: 'D_luca', relays: ['https://relay.example'] },
  secret: `${'l'.repeat(85)}A`,
})
const luca_s_link: ui_value.what_it_holds = { holds: 'a_ticket', ticket: luca_s_ticket }

/** Anna's ticket for a bond to be, ready (its link is not drawn here). */
const anna_s_ticket_for = (bond: string): HerTicket => ({
  ready: ui_value.a_ticket_ready.parse({ bond, expires_at: '2026-11-21T09:10:00.000Z' }),
  link: 'https://cumino.example/q-/#ticket=',
})

const anna_with_her_face = (): ANodeOfTest =>
  a_node_of_test({ faces: [{ face: 'F_a', name: 'Anna' }], the_active_face: 'F_a' })

/** The screens of the way, the shown one last, by their titles. */
const the_way = (app: TheAppOpened): readonly string[] =>
  [...app.root.querySelectorAll('main > div > section > h1')].map((title) => title.textContent)

/** The activities handed with their ids, in order. */
const the_activities_handed = (
  anna: ANodeOfTest,
): readonly { readonly id: string; readonly what: activities_value.what_is_asked }[] =>
  anna
    .handed()
    .flatMap((one) => (one.asks === 'an_activity' ? [{ id: one.activity_id, what: one.what }] : []))

/** She accepts Luca's invitation, as he introduced himself: her ticket is asked for the bond. */
const accepts = async (anna: ANodeOfTest, app: TheAppOpened, bond: string): Promise<void> => {
  await until(() => {
    expect(the_words(app)).toContain(invitation.wants_to_shake_your_hand('Luca'))
  })
  the_button(app.shown(), invitation.accept).click()
  await until(() => {
    expect(anna.activities_asked()).toEqual([{ activity: 'prepare_a_ticket', bond, face: 'F_a' }])
  })
}

describe('an invitation', () => {
  test('a link holding a ticket opens its invitation over her contacts; one with no ticket opens nothing', async () => {
    const anna = anna_with_her_face()
    const app = opens({ node: anna.node, device: a_device_of_test([]), a_link: luca_s_link })
    await until(() => {
      expect(the_way(app)).toEqual([words.my_contacts.title, invitation.title])
    })
    expect(the_title(app)).toBe(invitation.title)
    the_button(app.shown(), words.common.back).click()
    await until(() => {
      expect(the_way(app)).toEqual([words.my_contacts.title])
    })

    // Out of its form: its invitation too, which tells her (story 18).
    const broken = opens({
      node: anna_with_her_face().node,
      device: a_device_of_test([]),
      a_link: { holds: 'a_ticket_out_of_its_form' },
    })
    await until(() => {
      expect(the_way(broken)).toEqual([words.my_contacts.title, invitation.title])
    })

    const no_ticket = opens({
      node: anna_with_her_face().node,
      device: a_device_of_test([]),
      a_link: { holds: 'no_ticket' },
    })
    await until(() => {
      expect(the_way(no_ticket)).toEqual([words.my_contacts.title])
    })

    // With no face, the first face, the link waiting: once made, the invitation over her contacts.
    const bea = a_node_of_test()
    const first = opens({
      node: bea.node,
      device: a_device_of_test(['A1', 'F_b']),
      a_link: luca_s_link,
    })
    await until(() => {
      expect(the_way(first)).toEqual([words.the_first_face.title])
    })
    types(first.shown(), 'name', 'Bea')
    the_button(first.shown(), words.the_first_face.make_it).click()
    await until(() => {
      expect(bea.activities_asked()).toHaveLength(1)
    })
    bea.comes_to_hold((now) => ({ ...now, faces: [{ face: 'F_b', name: 'Bea' }] }))
    bea.ends('A1', { ended: 'done', said: { event: 'your_face_is_being_made', payload: {} } })
    // The server first, once (UI-5); then the start opens the link waiting.
    await until(() => {
      expect(the_way(first)).toEqual([words.the_first_face.title, words.the_server.title])
    })
    the_button(first.shown(), words.the_server.go_on).click()
    await until(() => {
      expect(the_way(first)).toEqual([words.my_contacts.title, invitation.title])
    })
    expect(the_words(first)).toContain(invitation.wants_to_shake_your_hand('Luca'))
  })

  test('accepting prepares her ticket, then opens his once hers is ready; declining asks nothing', async () => {
    const anna = anna_with_her_face()
    const app = opens({
      node: anna.node,
      device: a_device_of_test(['B3', 'A13', 'A14']),
      a_link: luca_s_link,
    })
    await until(() => {
      expect(app.shown().querySelector<HTMLInputElement>('input[name="name"]')?.value).toBe('Luca')
    })
    types(app.shown(), 'name', 'Luca B.')
    await accepts(anna, app, 'B3')
    await until(() => {
      expect(the_words(app)).toContain(invitation.on_its_way('Luca'))
    })
    expect(the_words(app)).toContain(invitation.it_waits_offline)

    anna.comes_to_hold((now) => ({ ...now, tickets: [anna_s_ticket_for('B3')] }))
    await until(() => {
      expect(the_activities_handed(anna)).toEqual([
        { id: 'A13', what: { activity: 'prepare_a_ticket', bond: 'B3', face: 'F_a' } },
        {
          id: 'A14',
          what: {
            activity: 'open_their_ticket',
            bond: 'B3',
            their_ticket: luca_s_ticket,
            name: 'Luca B.',
          },
        },
      ])
    })
    // Her node changes again: his ticket is not opened twice.
    anna.ends('A13', {
      ended: 'done',
      said: { event: 'your_ticket_is_being_prepared', payload: {} },
    })
    await until(() => {
      expect(the_words(app)).toContain(invitation.on_its_way('Luca'))
    })
    anna.ends('A14', { ended: 'done', said: { event: 'you_are_bonded', payload: {} } })
    await until(() => {
      expect(the_words(app)).toContain(invitation.bonded('Luca'))
    })
    expect(the_activities_handed(anna)).toHaveLength(2)

    // An empty name: the button off, accepting asks nothing; declined, back, nothing asked.
    const carla = anna_with_her_face()
    const declined = opens({
      node: carla.node,
      device: a_device_of_test([]),
      a_link: luca_s_link,
    })
    await until(() => {
      expect(the_words(declined)).toContain(invitation.wants_to_shake_your_hand('Luca'))
    })
    types(declined.shown(), 'name', ' ')
    await until(() => {
      expect(the_button(declined.shown(), invitation.accept).disabled).toBe(true)
    })
    the_button(declined.shown(), invitation.accept).click()
    the_button(declined.shown(), invitation.decline).click()
    await until(() => {
      expect(the_way(declined)).toEqual([words.my_contacts.title])
    })
    expect(carla.handed()).toEqual([])
  })

  test('a link out of its form is not an invitation; one used or expired is told', async () => {
    const anna = anna_with_her_face()
    const broken = opens({
      node: anna.node,
      device: a_device_of_test([]),
      a_link: { holds: 'a_ticket_out_of_its_form' },
    })
    await until(() => {
      expect(the_words(broken)).toContain(invitation.not_an_invitation)
    })
    expect(has_a_button(broken.shown(), invitation.accept)).toBe(false)
    expect(anna.handed()).toEqual([])

    // His ticket used or expired: the invitation no longer holds.
    const bruno = anna_with_her_face()
    const used = opens({
      node: bruno.node,
      device: a_device_of_test(['B3', 'A13', 'A14']),
      a_link: luca_s_link,
    })
    await accepts(bruno, used, 'B3')
    bruno.comes_to_hold((now) => ({ ...now, tickets: [anna_s_ticket_for('B3')] }))
    await until(() => {
      expect(bruno.activities_asked()).toHaveLength(2)
    })
    bruno.ends('A14', {
      ended: 'cannot_be_done',
      said: { event: 'their_ticket_cannot_be_opened', payload: {} },
    })
    await until(() => {
      expect(the_words(used)).toContain(invitation.no_longer_holds('Luca'))
    })
    expect(the_words(used)).toContain(words.common.how_it_ended.cannot_be_done)

    // Her ticket that the app cannot prepare: the same, with how.
    const carla = anna_with_her_face()
    const failed = opens({
      node: carla.node,
      device: a_device_of_test(['B4', 'A15', 'A16']),
      a_link: luca_s_link,
    })
    await accepts(carla, failed, 'B4')
    carla.ends('A15', {
      ended: 'the_app_cannot_do_it',
      said: { event: 'invalid_request', payload: {} },
    })
    await until(() => {
      expect(the_words(failed)).toContain(invitation.no_longer_holds('Luca'))
    })
    expect(the_words(failed)).toContain(words.common.how_it_ended.the_app_cannot_do_it)
    expect(carla.activities_asked()).toHaveLength(1)
  })
})
