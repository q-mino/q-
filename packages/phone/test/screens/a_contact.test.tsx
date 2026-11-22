// A contact, rendered (UI-5; stories 9, 10, 11 of `ui`'s README): renaming
// it, its name a draft; removing it, confirmed; the extensions offered to it
// or withdrawn, and the question of those in common.

import * as ui_value from '@q-mino/domains/ui/_value.ts'
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
  types,
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

const bruno_s_card = ui_value.a_contact_card.parse({
  bond: 'L_b',
  name: 'Bruno',
  introduced_as: 'Bruno',
  confirmation: { state: 'received', at: ten_in_rome },
  handshake: { way: 'in_person', at: ten_in_rome },
  their_relays: ['wss://relay.example'],
})

const carla_s_card = ui_value.a_contact_card.parse({
  bond: 'L_c',
  name: 'Carla R.',
  introduced_as: 'Carla',
  confirmation: { state: 'awaited' },
  handshake: { way: 'at_a_distance', at: ten_in_rome },
  their_relays: [],
})

const seen = (card: ui_value.a_contact_card): ui_value.a_contact_seen => ({
  bond: card.bond,
  name: card.name,
  introduced_as: card.introduced_as,
  confirmation: card.confirmation,
})

/** Ping pong 0.1.0, its action `ping` on `a_bond`. */
const ping_pong = (is: ui_value.an_extension_seen['is']): ui_value.an_extension_seen =>
  ui_value.an_extension_seen.parse({
    extension: 'ping_pong',
    version: '0.1.0',
    is,
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

/** Anna, her face F_a, her bonds with Bruno and Carla; ping pong active, offered to Bruno only. */
const anna: Partial<WhatTheNodeHolds> = {
  faces: [{ face: 'F_a', name: 'Anna' }],
  the_active_face: 'F_a',
  contacts: [seen(bruno_s_card), seen(carla_s_card)],
  cards: [bruno_s_card, carla_s_card],
  extensions: [ping_pong('active')],
  offers: [{ extension: 'ping_pong', bonds: ['L_b'] }],
  offered: [{ bond: 'L_b', offered: [{ extension: 'ping_pong', majors: [1] }] }],
}

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

const the_name_field = (app: TheAppOpened): HTMLInputElement | null =>
  app.shown().querySelector<HTMLInputElement>('input[name="name"]')

/** The extension's entry on the contact, its spaces collapsed. */
const the_extension_s_entry = (app: TheAppOpened, extension: string): HTMLElement => {
  const found = [
    ...app
      .shown()
      .querySelectorAll<HTMLElement>(`section[aria-label="${words.a_contact.the_extensions}"] li`),
  ].find((li) => li.textContent.startsWith(extension))
  if (found === undefined) throw new Error(`no entry for ${extension}`)
  return found
}

const the_draft_of_carla: ui_value.a_draft_for = { for: 'the_name_i_give_a_bond', bond: 'L_c' }

const said = (event: string) => ({ event, payload: {} })

describe('a contact', () => {
  test('the card tells her name, as introduced when it differs, the handshake, whether they have her and their relays', async () => {
    const anna_s = a_node_of_test(anna)
    opened = opens_the_app({ node: anna_s.node, device: a_device_of_test([]) })
    const app = opened
    await opens_the_contact(app, 'Carla R.')
    const when = words.a_contact.when(ten_in_rome, 'Europe/Rome')
    expect(the_words(app)).toContain(words.a_contact.introduced_as('Carla'))
    expect(the_words(app)).toContain(words.a_contact.the_handshake.at_a_distance(when))
    expect(the_words(app)).toContain(words.a_contact.the_confirmation.awaited)
    expect(the_words(app)).not.toContain(words.a_contact.their_relays)
    the_button(app.shown(), words.common.back).click()
    await opens_the_contact(app, 'Bruno')
    expect(the_words(app)).not.toContain(words.a_contact.introduced_as('Bruno'))
    expect(the_words(app)).toContain(words.a_contact.the_handshake.in_person(when))
    expect(the_words(app)).toContain(words.a_contact.the_confirmation.received)
    expect(the_words(app)).toContain('wss://relay.example')
  })

  test('renaming keeps the bond’s name as a draft, renames it once, and drops the draft when done', async () => {
    const anna_s = a_node_of_test(anna)
    opened = opens_the_app({ node: anna_s.node, device: a_device_of_test(['A3', 'A3bis']) })
    const app = opened
    await opens_the_contact(app, 'Carla R.')
    the_button(app.shown(), words.a_contact.rename_it).click()
    await until(() => {
      expect(the_name_field(app)?.value).toBe('Carla R.')
    })
    types(app.shown(), 'name', 'Carla Rossi')
    await until(() => {
      expect(anna_s.handed()).toContainEqual({
        asks: 'to_keep_a_draft',
        for: the_draft_of_carla,
        text: 'Carla Rossi',
      })
    })
    the_button(app.shown(), words.a_contact.give_the_name).click()
    await until(() => {
      expect(the_button(app.shown(), words.a_contact.renaming).disabled).toBe(true)
    })
    the_button(app.shown(), words.a_contact.renaming).click()
    await until(() => {
      expect(anna_s.activities_asked()).toEqual([
        { activity: 'rename_a_bond', bond: 'L_c', name: 'Carla Rossi' },
      ])
    })
    anna_s.ends('A3', { ended: 'done', said: said('the_bond_is_renamed') })
    await until(() => {
      expect(the_name_field(app)).toBeNull()
      expect(anna_s.handed()).toContainEqual({ asks: 'to_drop_a_draft', for: the_draft_of_carla })
    })
    expect(the_words(app)).toContain(
      `${words.common.how_it_ended.done}: ${words.common.the_kernels_events('the_bond_is_renamed') ?? ''}`,
    )

    // Her draft kept, she starts again with it; she stops: the draft dropped.
    anna_s.comes_to_hold((now) => ({
      ...now,
      drafts: [{ for: the_draft_of_carla, text: 'Carla Ro' }],
    }))
    the_button(app.shown(), words.a_contact.rename_it).click()
    await until(() => {
      expect(the_name_field(app)?.value).toBe('Carla Ro')
    })
    the_button(app.shown(), words.a_contact.stop_renaming).click()
    await until(() => {
      expect(the_name_field(app)).toBeNull()
      expect(
        anna_s
          .handed()
          .filter(
            (one) =>
              one.asks === 'to_drop_a_draft' &&
              JSON.stringify(one.for) === JSON.stringify(the_draft_of_carla),
          ),
      ).toHaveLength(2)
    })
    expect(anna_s.activities_asked()).toHaveLength(1)
  })

  test('removing asks to confirm, removes once, and goes back once removed', async () => {
    const anna_s = a_node_of_test(anna)
    opened = opens_the_app({ node: anna_s.node, device: a_device_of_test(['A4']) })
    const app = opened
    await opens_the_contact(app, 'Bruno')
    expect(has_a_button(app.shown(), words.a_contact.yes_remove_it)).toBe(false)
    the_button(app.shown(), words.a_contact.remove_it).click()
    await until(() => {
      expect(the_words(app)).toContain(words.a_contact.remove_it_really('Bruno'))
    })
    the_button(app.shown(), words.a_contact.keep_it).click()
    await until(() => {
      expect(has_a_button(app.shown(), words.a_contact.remove_it)).toBe(true)
    })
    expect(anna_s.activities_asked()).toEqual([])
    the_button(app.shown(), words.a_contact.remove_it).click()
    await until(() => {
      expect(has_a_button(app.shown(), words.a_contact.yes_remove_it)).toBe(true)
    })
    the_button(app.shown(), words.a_contact.yes_remove_it).click()
    await until(() => {
      expect(anna_s.activities_asked()).toEqual([{ activity: 'remove_a_bond', bond: 'L_b' }])
    })
    await until(() => {
      expect(has_a_button(app.shown(), words.a_contact.yes_remove_it)).toBe(false)
      expect(the_words(app)).toContain(words.common.in_progress)
    })
    anna_s.ends('A4', { ended: 'done', said: said('the_bond_is_removed') })
    await until(() => {
      expect(the_title(app)).toBe(words.my_contacts.title)
    })

    // Given no card, once removed meanwhile: no such contact.
    await opens_the_contact(app, 'Carla R.')
    anna_s.comes_to_hold((now) => ({
      ...now,
      cards: now.cards.filter((card) => card.bond !== 'L_c'),
    }))
    await until(() => {
      expect(the_words(app)).toContain(words.a_contact.no_such_contact)
    })
    expect(anna_s.activities_asked()).toHaveLength(1)
  })

  test('what came back of the last question is shown beside it: waiting, in common by name, none, no answer (UI-5)', async () => {
    const anna_s = a_node_of_test(anna)
    opened = opens_the_app({ node: anna_s.node, device: a_device_of_test([]) })
    const app = opened
    await opens_the_contact(app, 'Bruno')
    const answered = (answer: ui_value.the_extensions_in_common): void => {
      anna_s.comes_to_hold((now) => ({ ...now, in_common: [{ bond: 'L_b', answer }] }))
    }
    expect(the_words(app)).not.toContain(words.a_contact.the_answer.none_in_common)
    answered({ answer: 'waiting' })
    await until(() => {
      expect(the_words(app)).toContain(words.a_contact.the_answer.waiting)
    })
    answered({ answer: 'in_common', extensions: ['ping_pong'] })
    await until(() => {
      expect(the_words(app)).toContain(words.a_contact.the_answer.in_common(['Ping pong']))
    })
    answered({ answer: 'in_common', extensions: [] })
    await until(() => {
      expect(the_words(app)).toContain(words.a_contact.the_answer.none_in_common)
    })
    answered({ answer: 'no_answer', why: 'no_response' })
    await until(() => {
      expect(the_words(app)).toContain(words.a_contact.the_answer.no_answer.no_response)
    })
  })

  test('a strip over the screens while the relay does not answer, gone once it answers (UI-5)', async () => {
    const anna_s = a_node_of_test(anna)
    opened = opens_the_app({ node: anna_s.node, device: a_device_of_test([]) })
    const app = opened
    await opens_the_contact(app, 'Bruno')
    expect(the_words(app)).not.toContain(words.common.the_relay_does_not_answer)
    const met = (now: ui_value.the_relay_met): void => {
      anna_s.comes_to_hold((held) => ({ ...held, the_relay: { ...held.the_relay, met: now } }))
    }
    met('did_not_answer')
    await until(() => {
      expect(app.root.textContent).toContain(words.common.the_relay_does_not_answer)
    })
    met('answered')
    await until(() => {
      expect(app.root.textContent).not.toContain(words.common.the_relay_does_not_answer)
    })
  })

  test('an active extension is offered to the contact or withdrawn, once at a time; one not active is not listed', async () => {
    const anna_s = a_node_of_test(anna)
    opened = opens_the_app({ node: anna_s.node, device: a_device_of_test(['A5', 'A7', 'A6']) })
    const app = opened
    await opens_the_contact(app, 'Bruno')
    await until(() => {
      expect(the_extension_s_entry(app, 'Ping pong').textContent).toContain(words.a_contact.offered)
    })
    expect(the_extension_s_entry(app, 'Ping pong').textContent).not.toContain(
      words.a_contact.not_offered,
    )
    the_button(
      the_extension_s_entry(app, 'Ping pong'),
      words.a_contact.the_offer.withdraw_the_offer,
    ).click()
    await until(() => {
      expect(
        the_button(the_extension_s_entry(app, 'Ping pong'), words.a_contact.the_offer.wait)
          .disabled,
      ).toBe(true)
    })
    await until(() => {
      expect(anna_s.activities_asked()).toEqual([
        { activity: 'withdraw_the_offer_from_a_bond', extension: 'ping_pong', bond: 'L_b' },
      ])
    })

    // The extensions in common, asked with what her node offers Bruno.
    the_button(app.shown(), words.a_contact.ask_for_the_extensions_in_common).click()
    await until(() => {
      expect(anna_s.activities_asked()).toContainEqual({
        activity: 'ask_a_bond_for_the_extensions_in_common',
        bond: 'L_b',
        offered: [{ extension: 'ping_pong', majors: [1] }],
      })
    })
    await until(() => {
      expect(
        the_button(app.shown(), words.a_contact.ask_for_the_extensions_in_common).disabled,
      ).toBe(true)
    })

    // Carla, not offered: she offers it.
    the_button(app.shown(), words.common.back).click()
    await opens_the_contact(app, 'Carla R.')
    await until(() => {
      expect(the_extension_s_entry(app, 'Ping pong').textContent).toContain(
        words.a_contact.not_offered,
      )
    })
    the_button(the_extension_s_entry(app, 'Ping pong'), words.a_contact.the_offer.offer).click()
    await until(() => {
      expect(anna_s.activities_asked()).toContainEqual({
        activity: 'offer_an_extension_to_a_bond',
        extension: 'ping_pong',
        bond: 'L_c',
      })
    })

    // Ping pong not active: not listed.
    anna_s.comes_to_hold((now) => ({ ...now, extensions: [ping_pong('not_active')] }))
    await until(() => {
      expect(the_words(app)).toContain(words.a_contact.no_extension_active)
    })
    expect(() => the_extension_s_entry(app, 'Ping pong')).toThrow()
    expect(anna_s.activities_asked()).toHaveLength(3)
  })
})
