// What the handshakes' and the invitation's stories share (UI-5; WEB-29): Anna
// with her face, the tickets as the tests of `phone/test/screens` make them,
// and the way from her contacts to a screen. [Q, C, 24 Nov 2026]

import { the_link_of_a_ticket } from '@q-mino/adapters-web'
import type { HerTicket } from '@q-mino/adapters-web/screens'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { texts } from '../../../texts/index.ts'
import { type WhatTheNodeHolds } from '../../../the_node_of_a_story/index.ts'
import type { TheStorysHand } from '../../a_screen_story.tsx'

/** Anna, her face F_a, the face she acts as. */
export const anna: Partial<WhatTheNodeHolds> = {
  faces: [{ face: 'F_a', name: 'Anna' }],
  the_active_face: 'F_a',
}

export const the_link_of = the_link_of_a_ticket('https://cumino.example/q-/')

/** A ticket as a face shows it, with its name and a letter of its own in its key and secret. */
export const a_ticket = (introduced_as: string, letter: string): activities_value.their_ticket =>
  activities_value.their_ticket.parse({
    key: `${letter.repeat(42)}A`,
    introduced_as,
    mailbox: { deposit_address: `D_${letter}`, relays: ['https://relay.example'] },
    secret: `${letter.repeat(85)}A`,
  })

export const bruno_s_ticket = a_ticket('Bruno', 'b')
export const luca_s_ticket = a_ticket('Luca', 'l')
export const luca_s_link: ui_value.what_it_holds = { holds: 'a_ticket', ticket: luca_s_ticket }

/** Anna's ticket for a bond to be, ready, and its link. */
export const anna_s_ticket_for = (bond: string): HerTicket => ({
  ready: ui_value.a_ticket_ready.parse({ bond, expires_at: '2026-11-21T09:10:00.000Z' }),
  link: the_link_of(a_ticket('Anna', 'a')),
})

/** Until the screen shown is in this case (its `data-state`). */
export const until_it_shows = (hand: TheStorysHand, state: string): Promise<void> =>
  hand.until(() => hand.shown().dataset['state'] === state)

/** From her contacts, she opens a screen by its entry's words. */
export const opens_from_her_contacts = async (
  hand: TheStorysHand,
  entry: string,
  the_title: string,
): Promise<void> => {
  await hand.until_it_says(texts.screens.my_contacts.title)
  hand.taps(entry)
  await hand.until(() => hand.shown().querySelector('header h1')?.textContent === the_title)
}

/** Her ticket for the bond comes to be ready: its QR is shown. */
export const her_ticket_is_ready = async (hand: TheStorysHand, bond: string): Promise<void> => {
  await hand.until(() => hand.node.activities_asked().length > 0)
  hand.node.comes_to_hold((now) => ({ ...now, tickets: [anna_s_ticket_for(bond)] }))
  await hand.until(() => hand.shown().querySelector('img') !== null)
}
