// Fixtures shared by the stories of the contact, the extensions and what
// happened (UI-5; WEB-29), the shapes of `phone/test/screens`.

import * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as user_value from '@q-mino/domains/user/_value.ts'
import { ten_in_rome, type WhatTheNodeHolds } from '../../../the_node_of_a_story/index.ts'
import type { TheStorysHand } from '../../a_screen_story.tsx'
import { texts } from '../../../texts/index.ts'

export const words = texts.screens

export const bruno_s_card = ui_value.a_contact_card.parse({
  bond: 'L_b',
  name: 'Bruno',
  introduced_as: 'Bruno',
  confirmation: { state: 'received', at: ten_in_rome },
  handshake: { way: 'in_person', at: ten_in_rome },
  their_relays: ['wss://relay.example'],
})

export const carla_s_card = ui_value.a_contact_card.parse({
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

type a_point = user_value.a_manifest['extension_points'][number]

/** The manifest of ping pong: its action `ping` on a bond, and the points a story adds. */
export const the_manifest = (
  version: string,
  more: readonly a_point[] = [],
): user_value.a_manifest =>
  user_value.a_manifest.parse({
    name: 'ping_pong',
    version,
    sees: { known: [] },
    touches: ['the_port_of_requests'],
    extension_points: [{ point: 'action', name: 'ping', place: 'a_bond' }, ...more],
    leaves_on_known: ['usecase/ping'],
    majors: { self: [1], known: [1] },
  })

export const what_ping_pong_asks: user_value.what_an_extension_asks[] = [
  { asks: 'to_send_requests_on_your_bonds' },
  { asks: 'to_answer_your_bonds', leaves: ['usecase/ping'] },
  { asks: 'a_place_on_your_screens', point: 'action', name: 'ping', place: 'a_bond' },
  { asks: 'all_that_cumino_reaches' },
  { asks: 'its_parts_act_with_no_tap' },
]

/** Ping pong 0.1.0 as her node lists it. */
export const ping_pong = (
  is: ui_value.an_extension_seen['is'],
  more: readonly a_point[] = [],
  manifest: user_value.a_manifest = the_manifest('0.1.0', more),
  what_it_asks: user_value.what_an_extension_asks[] = what_ping_pong_asks,
): ui_value.an_extension_seen =>
  ui_value.an_extension_seen.parse({
    extension: 'ping_pong',
    version: manifest.version,
    is,
    manifest,
    what_it_asks,
  })

/** Anna, her face F_a. */
export const anna: Partial<WhatTheNodeHolds> = {
  faces: [{ face: 'F_a', name: 'Anna' }],
  the_active_face: 'F_a',
}

/** Anna with her bonds with Bruno and Carla; ping pong active, offered to Bruno only. */
export const anna_with_contacts: Partial<WhatTheNodeHolds> = {
  ...anna,
  contacts: [seen(bruno_s_card), seen(carla_s_card)],
  cards: [bruno_s_card, carla_s_card],
  extensions: [ping_pong('active')],
  offers: [{ extension: 'ping_pong', bonds: ['L_b'] }],
  offered: [{ bond: 'L_b', offered: [{ extension: 'ping_pong', majors: [1] }] }],
}

export const the_draft_of_carla: ui_value.a_draft_for = {
  for: 'the_name_i_give_a_bond',
  bond: 'L_c',
}

/** She opens a contact from her contacts, by its name, and waits for its card. */
export const opens_the_contact = async (hand: TheStorysHand, name: string): Promise<void> => {
  await hand.until_it_says(name)
  hand.taps(name)
  await hand.until(() => hand.shown().querySelector('h2')?.textContent === name)
}

/** She opens the menu of her contacts, then an entry of it. */
export const opens_an_entry = async (hand: TheStorysHand, entry: string): Promise<void> => {
  await hand.until(() =>
    [...hand.shown().querySelectorAll('button')].some(
      (one) => one.textContent.trim() === words.my_contacts.the_menu,
    ),
  )
  hand.taps(words.my_contacts.the_menu)
  await hand.until(() => hand.shown().querySelector('nav') !== null)
  hand.taps(entry)
}

/** She opens the extension, by its name, from the extensions. */
export const opens_the_extension = async (hand: TheStorysHand, name: string): Promise<void> => {
  await opens_an_entry(hand, words.my_contacts.the_entries.the_extensions)
  await hand.until_it_says(name)
  hand.taps(name)
  await hand.until(() => hand.shown().querySelector('h2')?.textContent === name)
}

/** An activity of the kernel told as done. */
export const said = (event: string) => ({ event, payload: {} })
