// Messaging's part, the chat (MSG-7, MSG-6, MSG-13, MSG-15; part M5 of
// messaging), on the app's screens: story 19 of messaging's README, each
// case as the screens' tests prove it (`phone/test/screens/the_chat.test.tsx`),
// its part imported from its package as the composition root imports it,
// its leaves answered by the chats of a story. Her contacts with the line
// of each chat (no message, hers in each stage, theirs with how many to
// read); a contact's screen; the conversation on the whole screen, empty,
// with its stages and annotations, not delivered and written again, a long
// text, with no network, with a text being written.

import { TheScreens } from '@q-mino/adapters-web/screens'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import { AScreenStory, type TheStorysHand } from '../../a_screen_story.tsx'
import {
  a_phone_of_a_story,
  messaging_carried,
  messaging_seen,
  minutes_after_ten,
  mine,
  ten_in_rome,
  the_chats_of_a_story,
  theirs,
  type AChatOfAStory,
  type WhatTheNodeHolds,
} from '../../../the_node_of_a_story/index.ts'

export default { title: 'Screens/The chat', component: TheScreens }

/** A contact of hers, by its bond and name. */
const a_contact = (bond: string, name: string): ui_value.a_contact_seen =>
  ui_value.a_contact_seen.parse({
    bond,
    name,
    introduced_as: name,
    confirmation: { state: 'received', at: ten_in_rome },
  })

/** Anna with these contacts, messaging active and offered to each. */
const anna_with = (contacts: readonly ui_value.a_contact_seen[]): Partial<WhatTheNodeHolds> => ({
  faces: [{ face: 'F_a', name: 'Anna' }],
  the_active_face: 'F_a',
  contacts: [...contacts],
  cards: contacts.map((contact) =>
    ui_value.a_contact_card.parse({
      ...contact,
      handshake: { way: 'in_person', at: ten_in_rome },
      their_relays: [],
    }),
  ),
  extensions: [messaging_seen('active')],
  offers: [{ extension: 'messaging', bonds: contacts.map((contact) => contact.bond) }],
  offered: contacts.map((contact) => ({
    bond: contact.bond,
    offered: [{ extension: 'messaging', majors: [1] }],
  })),
})

const bruno = a_contact('L_b', 'Bruno')
const carla = a_contact('L_c', 'Carla')

/** Yesterday and today with Bruno: his, hers delivered, hers on its way. */
const bruno_s_chat: AChatOfAStory = {
  bond: 'L_b',
  messages: [
    theirs('B1', 1, 'Domani ci vediamo al campo?', minutes_after_ten(-24 * 60 + 40)),
    mine('M1', 2, 'Sì, alle 10. Porto io il pallone', minutes_after_ten(-24 * 60 + 45), {
      stage: 'delivered',
      at: minutes_after_ten(-24 * 60 + 50),
    }),
    theirs('B2', 3, 'Perfetto 👍', minutes_after_ten(-24 * 60 + 52)),
    mine('M2', 4, 'Sono arrivata, tu dove sei?', minutes_after_ten(-12), {
      stage: 'delivered',
      at: minutes_after_ten(-11),
    }),
    theirs('B3', 5, 'Arrivo, cinque minuti', minutes_after_ten(-6), minutes_after_ten(-25)),
    theirs('B4', 6, 'Sono al cancello', minutes_after_ten(-3)),
  ],
  read_up_to: 4,
}

/** The same, her answer on its way: the conversation as she reads it. */
const bruno_s_chat_answered: AChatOfAStory = {
  ...bruno_s_chat,
  messages: [...bruno_s_chat.messages, mine('M3', 7, 'Ti vedo!', minutes_after_ten(-1))],
  read_up_to: 6,
}

/** The story: her contacts, the chats it holds, on a phone online or with no network, and her gestures. */
const the_chat = (props: {
  contacts: readonly ui_value.a_contact_seen[]
  chats: readonly AChatOfAStory[]
  network?: 'online' | 'offline'
  plays?: (hand: TheStorysHand) => Promise<void>
}) => {
  const chats = the_chats_of_a_story(props.chats)
  return (
    <AScreenStory
      holds={anna_with(props.contacts)}
      parts={messaging_carried(a_phone_of_a_story(props.network ?? 'online'))}
      answers={chats.answers}
      plays={async (hand) => {
        await hand.until(
          () =>
            hand
              .shown()
              .querySelector('.the-chat[data-where="in_its_place"]:not([data-state="reading"])') !==
            null,
        )
        await props.plays?.(hand)
      }}
    />
  )
}

/** She takes the chat on a contact's row to the whole screen, and waits for the conversation. */
const opens_the_conversation_of = async (hand: TheStorysHand, name: string): Promise<void> => {
  const row = [...hand.shown().querySelectorAll<HTMLElement>('li.row')].find(
    (li) => li.querySelector('[data-part="title"]')?.textContent === name,
  )
  const gesture = row?.querySelector<HTMLButtonElement>('.slot [data-part="head"] .gesture')
  if (gesture === undefined || gesture === null) throw new Error(`no chat on the row of ${name}`)
  gesture.click()
  await hand.until(
    () =>
      row?.querySelector(
        '.the-chat[data-where="on_the_whole_screen"]:not([data-state="reading"])',
      ) !== null,
  )
}

/** Her contacts: the line of each chat, theirs with how many to read, hers in each stage, one with no message. */
export const her_contacts_with_their_chats = {
  render: () => {
    const stages = [
      ['L_d', 'Dario', 'Ci sentiamo stasera', { stage: 'on_its_way' }],
      [
        'L_e',
        'Elena',
        'Mi mandi gli appunti?',
        { stage: 'no_receipt', at: minutes_after_ten(-60) },
      ],
      [
        'L_f',
        'Franco',
        'Buon compleanno!',
        { stage: 'could_not_be_delivered', at: minutes_after_ten(-60) },
      ],
      [
        'L_g',
        'Giulia',
        'A che ora parte il treno?',
        { stage: 'called_off', at: minutes_after_ten(-60) },
      ],
      ['L_i', 'Ivo', 'Hai visto la partita?', { stage: 'held' }],
      ['L_l', 'Luca', 'Ok, a domani', { stage: 'put_aside' }],
    ] as const
    return the_chat({
      contacts: [
        bruno,
        carla,
        ...stages.map(([bond, name]) => a_contact(bond, name)),
        a_contact('L_m', 'Marta'),
      ],
      chats: [
        bruno_s_chat,
        {
          bond: 'L_c',
          messages: [
            mine('C1', 1, 'Grazie per ieri, a presto!', minutes_after_ten(-24 * 60), {
              stage: 'delivered',
              at: minutes_after_ten(-24 * 60 + 3),
            }),
          ],
          read_up_to: 0,
        },
        ...stages.map(([bond, , text, stage], at) => ({
          bond,
          messages: [
            mine(`S${String(at)}`, 1, text, minutes_after_ten(-3 * 24 * 60 - at * 60), stage),
          ],
          read_up_to: 0,
        })),
      ],
    })
  },
}

/** Bruno's screen: the chat in its line, under its slot's head. */
export const a_contact_s_screen = {
  render: () =>
    the_chat({
      contacts: [bruno],
      chats: [bruno_s_chat],
      plays: async (hand) => {
        hand.taps('Bruno')
        await hand.until(
          () =>
            hand.shown().querySelector('h2')?.textContent === 'Bruno' &&
            hand
              .shown()
              .querySelector('.slot[data-place="a_bond"] .the-chat[data-state="read"]') !== null,
        )
      },
    }),
}

/** The conversation with Bruno on the whole screen: yesterday and today, his on the start, hers at the end with where each stands. */
export const the_conversation = {
  render: () =>
    the_chat({
      contacts: [bruno],
      chats: [bruno_s_chat_answered],
      plays: async (hand) => {
        await opens_the_conversation_of(hand, 'Bruno')
      },
    }),
}

/** With Carla, no message yet. */
export const the_conversation_empty = {
  render: () =>
    the_chat({
      contacts: [carla],
      chats: [],
      plays: async (hand) => {
        await opens_the_conversation_of(hand, 'Carla')
      },
    }),
}

/** Hers not delivered, each in its words, with «Invia di nuovo». */
const not_delivered: AChatOfAStory = {
  bond: 'L_b',
  messages: [
    mine('N1', 1, 'Mi mandi gli appunti di storia?', minutes_after_ten(-8 * 24 * 60), {
      stage: 'no_receipt',
      at: minutes_after_ten(-24 * 60),
    }),
    mine('N2', 2, 'Ci sei?', minutes_after_ten(-24 * 60), {
      stage: 'could_not_be_delivered',
      at: minutes_after_ten(-24 * 60 + 1),
    }),
    mine('N3', 3, 'Domani alle 9', minutes_after_ten(-60), { stage: 'held' }),
    mine('N4', 4, 'Ok', minutes_after_ten(-50), { stage: 'put_aside' }),
    mine('N5', 5, 'Scusa, ho spento tutto', minutes_after_ten(-40), {
      stage: 'called_off',
      at: minutes_after_ten(-39),
    }),
  ],
  read_up_to: 0,
}

export const messages_not_delivered = {
  render: () =>
    the_chat({
      contacts: [bruno],
      chats: [not_delivered],
      plays: async (hand) => {
        await opens_the_conversation_of(hand, 'Bruno')
      },
    }),
}

/** «Invia di nuovo» on the one held: the same text, a message of its own, on its way at the bottom. */
export const written_again = {
  render: () =>
    the_chat({
      contacts: [bruno],
      chats: [not_delivered],
      plays: async (hand) => {
        await opens_the_conversation_of(hand, 'Bruno')
        const held = hand
          .shown()
          .querySelector<HTMLElement>(
            '[data-part="a-message"][data-state="held"] [data-part="send-again"]',
          )
        held?.click()
        await hand.until(
          () => hand.shown().querySelectorAll('[data-part="a-message"]').length === 6,
        )
      },
    }),
}

/** The annotations of his last message and of hers, opened at a tap. */
export const the_annotations = {
  render: () =>
    the_chat({
      contacts: [bruno],
      chats: [bruno_s_chat],
      plays: async (hand) => {
        await opens_the_conversation_of(hand, 'Bruno')
        const metas = [
          ...hand
            .shown()
            .querySelectorAll<HTMLButtonElement>('[data-part="a-message"] [data-part="meta"]'),
        ]
        metas.at(-2)?.click()
        await hand.until(
          () => hand.shown().querySelector('[data-part="annotations"]:not([hidden])') !== null,
        )
      },
    }),
}

/** A long text, whole, and one written over many lines in the field. */
export const a_long_text = {
  render: () =>
    the_chat({
      contacts: [bruno],
      chats: [
        {
          bond: 'L_b',
          messages: [
            theirs(
              'L1',
              1,
              'Allora, ricapitolo per tutti: ci troviamo sabato alle 9 davanti alla stazione, ' +
                'chi arriva prima prende i biglietti per tutti (sono 4,50 a testa), poi il treno delle 9:24 ' +
                'fino a Orvieto. Portate qualcosa da mangiare, l’acqua e una giacca perché la sera fa freddo. ' +
                'Se piove si rimanda a domenica, stesso orario. Ditemi entro giovedì chi c’è!',
              minutes_after_ten(-20),
            ),
          ],
          read_up_to: 1,
        },
      ],
      plays: async (hand) => {
        await opens_the_conversation_of(hand, 'Bruno')
        hand.shown().querySelector<HTMLTextAreaElement>('textarea')?.focus()
        const field = hand.shown().querySelector<HTMLTextAreaElement>('textarea')
        if (field !== null) {
          field.value = 'Io ci sono!\nPorto anche mia sorella,\nva bene?'
          field.dispatchEvent(new Event('input', { bubbles: true }))
        }
        await hand.until(
          () =>
            hand.shown().querySelector<HTMLButtonElement>('[data-part="send"]')?.disabled === false,
        )
      },
    }),
}

/** With no network: hers on its way «partirà appena possibile», the note above the field. */
export const with_no_network = {
  render: () =>
    the_chat({
      contacts: [bruno],
      network: 'offline',
      chats: [
        {
          bond: 'L_b',
          messages: [
            theirs('O1', 1, 'Mi chiami quando esci?', minutes_after_ten(-30)),
            mine('O2', 2, 'Esco ora, ti chiamo dal treno', minutes_after_ten(-2)),
          ],
          read_up_to: 1,
        },
      ],
      plays: async (hand) => {
        await opens_the_conversation_of(hand, 'Bruno')
      },
    }),
}
