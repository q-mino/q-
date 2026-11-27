// Messaging's part, the chat (MSG-7, MSG-6, MSG-13, MSG-15; part M5 of
// messaging), imported from its package as the composition root imports
// it, drawn by the kernel in its two slots and answered by the chats of a
// story through the kernel's fence and her node's door: stories 10, 11 and
// 19 of messaging's README, on the screens. The line on a contact's row and
// on a contact's screen; the conversation on the whole screen, its stages
// in words, its annotations, «Invia di nuovo», the field, the older pages,
// read up to the last shown; what a screen reader is told.

import * as ui_value from '@q-mino/domains/ui/_value.ts'
import { afterEach, describe, expect, test } from 'vitest'
import {
  a_phone_of_a_story,
  messaging_carried,
  messaging_seen,
  messaging_words,
  minutes_after_ten,
  mine,
  the_chats_of_a_story,
  theirs,
  type AChatOfAStory,
  type a_stage_of_a_story,
  type TheChatsOfAStory,
} from '../../src/the_node_of_a_story/index.ts'
import {
  a_device_of_test,
  a_node_of_test,
  opens_the_app,
  ten_in_rome,
  texts,
  the_button,
  until,
  type TheAppOpened,
  type WhatTheNodeHolds,
} from './harness.tsx'

const words = texts.screens
const the_slot = words.common.the_points.the_slot
/** The ids the kernel draws for the parts' exchanges, in order. */
const the_ids = Array.from({ length: 400 }, (_, at) => `P${String(at + 1)}`)
let opened: TheAppOpened | undefined
afterEach(() => {
  opened?.closes()
  opened = undefined
})

const bruno = ui_value.a_contact_seen.parse({
  bond: 'L_b',
  name: 'Bruno',
  introduced_as: 'Bruno',
  confirmation: { state: 'received', at: ten_in_rome },
})

const carla = ui_value.a_contact_seen.parse({
  bond: 'L_c',
  name: 'Carla',
  introduced_as: 'Carla',
  confirmation: { state: 'received', at: ten_in_rome },
})

/** Anna, her bonds with Bruno and Carla; messaging active, offered to both. */
const anna: Partial<WhatTheNodeHolds> = {
  faces: [{ face: 'F_a', name: 'Anna' }],
  the_active_face: 'F_a',
  contacts: [bruno, carla],
  cards: [
    ui_value.a_contact_card.parse({
      ...bruno,
      handshake: { way: 'in_person', at: ten_in_rome },
      their_relays: [],
    }),
  ],
  extensions: [messaging_seen('active')],
  offers: [{ extension: 'messaging', bonds: ['L_b', 'L_c'] }],
  offered: [{ bond: 'L_b', offered: [{ extension: 'messaging', majors: [1] }] }],
}

/** The app opened on Anna's contacts, its chats the story's, on a phone of the story. */
const opens = (chats: TheChatsOfAStory, network: 'online' | 'offline' = 'online'): TheAppOpened => {
  const node = a_node_of_test(anna, chats.answers)
  opened = opens_the_app({
    node: node.node,
    device: a_device_of_test(the_ids),
    words: { messaging: messaging_words },
    the_parts: messaging_carried(a_phone_of_a_story(network)),
  })
  return opened
}

/** The row of her contacts whose title holds this name. */
const the_row = (app: TheAppOpened, name: string): HTMLElement => {
  const row = [...app.shown().querySelectorAll<HTMLElement>('li.row')].find(
    (li) => li.querySelector('[data-part="title"]')?.textContent === name,
  )
  if (row === undefined) throw new Error(`no row "${name}"`)
  return row
}

/** The text of an element, its spaces as one. */
const the_text_of = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim()

/** The line of a contact's row, once the chat is read. */
const the_line_of = (app: TheAppOpened, name: string): HTMLElement | null =>
  the_row(app, name).querySelector<HTMLElement>('.the-chat[data-where="in_its_place"]')

/** She takes the chat of a contact's row to the whole screen; the conversation, once drawn. */
const opens_the_conversation = async (app: TheAppOpened, name: string): Promise<HTMLElement> => {
  await until(() => {
    expect(the_line_of(app, name)?.dataset['state']).not.toBe('reading')
  })
  const slot = the_row(app, name).querySelector<HTMLElement>('.slot')
  if (slot === null) throw new Error('no slot')
  the_button(slot, the_slot.takes_the_screen).click()
  await until(() => {
    expect(slot.dataset['state']).toBe('on_the_whole_screen')
    expect(slot.querySelector('.the-chat[data-where="on_the_whole_screen"]')).not.toBeNull()
  })
  return slot
}

/** The messages of a conversation, each as a screen reader reads it, in their order. */
const the_messages_of = (slot: HTMLElement): readonly string[] =>
  [...slot.querySelectorAll('[data-part="a-message"]')].map((li) => {
    // Its annotations, hidden until a tap, are not what it reads as.
    const read = li.cloneNode(true)
    if (!(read instanceof Element)) return ''
    for (const annotations of read.querySelectorAll('dl')) annotations.remove()
    return the_text_of(read)
  })

/** She types in the conversation's field. */
const writes_in = (slot: HTMLElement, text: string): HTMLTextAreaElement => {
  const field = slot.querySelector<HTMLTextAreaElement>('textarea[name="the_message"]')
  if (field === null) throw new Error('no field')
  field.focus()
  field.value = text
  field.dispatchEvent(new Event('input', { bubbles: true }))
  return field
}

/** The asked leaves of the chats, by their name. */
const asked_of = (chats: TheChatsOfAStory, use_case: string) =>
  chats.asked().filter((one) => one.use_case === use_case)

/** Bruno's chat, his bond `L_b`. */
const bruno_s = (messages: AChatOfAStory['messages'], read_up_to = 0): AChatOfAStory => ({
  bond: 'L_b',
  messages,
  read_up_to,
})

describe('the chat on a contact’s row (story 11, MSG-15)', () => {
  test('the row of Bruno’s contact: the last message and two to read; read in the conversation, none', async () => {
    const chats = the_chats_of_a_story([
      bruno_s([
        mine('M1', 1, 'dove sei?', minutes_after_ten(-30), {
          stage: 'delivered',
          at: minutes_after_ten(-29),
        }),
      ]),
    ])
    const app = opens(chats)
    await until(() => {
      expect(the_text_of(the_line_of(app, 'Bruno'))).toBe('Tu: dove sei? consegnato 09:30')
    })
    // Carla's chat has no message yet.
    expect(the_text_of(the_line_of(app, 'Carla'))).toBe('Ancora nessun messaggio')
    // Bruno writes twice while her contacts are open.
    chats.change('L_b', (chat) => ({
      ...chat,
      messages: [
        ...chat.messages,
        theirs('B1', 2, 'arrivo', minutes_after_ten(-5), minutes_after_ten(-35)),
        theirs('B2', 3, 'sono sotto', minutes_after_ten(-1)),
      ],
    }))
    await until(() => {
      expect(the_text_of(the_line_of(app, 'Bruno'))).toBe('sono sotto 2 da leggere 09:59')
    })
    expect(the_line_of(app, 'Bruno')?.dataset['toRead']).toBe('some')
    // She opens the conversation from the row: both shown, read up to the second.
    const slot = await opens_the_conversation(app, 'Bruno')
    await until(() => {
      expect(the_messages_of(slot)).toHaveLength(3)
      expect(asked_of(chats, 'usecase/read_a_chat')).toEqual([
        { use_case: 'usecase/read_a_chat', input: { bond: 'L_b', up_to: 'B2' } },
      ])
    })
    // The conversation names its contact at the top, in the kernel's words.
    expect(the_text_of(slot.querySelector('[data-part="corner"] [data-part="about"]'))).toBe(
      'Bruno',
    )
    // Back in its place: none to read.
    the_button(slot, the_slot.gives_it_back).click()
    await until(() => {
      expect(the_text_of(the_line_of(app, 'Bruno'))).toBe('sono sotto 09:59')
    })
  })

  test('the last message of hers in each stage, in words beside its glyph (MSG-13)', async () => {
    // Its glyph: what went wrong an alert; what she did herself (called off, put aside) a quiet minus (part M7).
    const stages: readonly [a_stage_of_a_story, string, string][] = [
      [{ stage: 'on_its_way' }, 'in uscita', 'clock'],
      [{ stage: 'delivered', at: ten_in_rome }, 'consegnato', 'check_check'],
      [{ stage: 'no_receipt', at: ten_in_rome }, 'nessuna ricevuta', 'circle_alert'],
      [{ stage: 'could_not_be_delivered', at: ten_in_rome }, 'non consegnabile', 'circle_alert'],
      [{ stage: 'called_off', at: ten_in_rome }, 'annullato', 'circle_minus'],
      [{ stage: 'held' }, 'fermo', 'circle_alert'],
      [{ stage: 'put_aside' }, 'messo da parte', 'circle_minus'],
    ]
    const chats = the_chats_of_a_story([
      bruno_s([mine('M1', 1, 'Ciao Bruno', minutes_after_ten(-60))]),
    ])
    const app = opens(chats)
    for (const [stage, said, glyph] of stages) {
      chats.change('L_b', (chat) => ({
        ...chat,
        messages: [mine('M1', 1, 'Ciao Bruno', minutes_after_ten(-60), stage)],
      }))
      await until(() => {
        const the_stage = the_line_of(app, 'Bruno')?.querySelector<HTMLElement>(
          '[data-part="stage"]',
        )
        expect(the_stage?.dataset['state']).toBe(stage.stage)
        expect(the_text_of(the_stage)).toBe(said)
        expect(
          the_stage?.querySelector('svg[aria-hidden="true"]')?.getAttribute('data-glyph'),
        ).toBe(glyph)
      })
    }
  })
})

describe('the conversation (stories 10 and 19, MSG-7)', () => {
  test('the chat followed: its snapshot, then each change; followed again once shown again (story 10, K-4, G-2)', async () => {
    const chats = the_chats_of_a_story([
      bruno_s(
        [
          theirs('B1', 1, 'ci sei domani?', minutes_after_ten(-24 * 60)),
          mine('M1', 2, 'sì, alle 10', minutes_after_ten(-24 * 60 + 5), {
            stage: 'delivered',
            at: minutes_after_ten(-24 * 60 + 6),
          }),
          mine('M2', 3, 'dove sei?', minutes_after_ten(-10)),
        ],
        1,
      ),
    ])
    const app = opens(chats)
    const slot = await opens_the_conversation(app, 'Bruno')
    await until(() => {
      expect(the_messages_of(slot)).toEqual([
        'Ieri Il tuo contatto, ieri alle 10:00: ci sei domani? 10:00, dettagli',
        'Tu, ieri alle 10:05: sì, alle 10 10:05 consegnato, dettagli',
        'Oggi Tu, oggi alle 09:50: dove sei? 09:50 in uscita, dettagli',
      ])
    })
    // Its list named, each message by who and when, to a screen reader; the days for the eye.
    expect(slot.querySelector('[data-part="all"] > ol')?.getAttribute('aria-label')).toBe(
      'Messaggi della chat',
    )
    expect(slot.querySelector('[data-part="day"]')?.getAttribute('aria-hidden')).toBe('true')
    // M2 delivered, and Bruno answers: each change as it comes, the newest at the bottom, told politely.
    chats.change('L_b', (chat) => ({
      ...chat,
      messages: [
        ...chat.messages.slice(0, 2),
        mine('M2', 3, 'dove sei?', minutes_after_ten(-10), {
          stage: 'delivered',
          at: minutes_after_ten(-2),
        }),
        theirs('B2', 4, 'arrivo', minutes_after_ten(-1)),
      ],
    }))
    await until(() => {
      expect(the_messages_of(slot).at(-2)).toBe(
        'Oggi Tu, oggi alle 09:50: dove sei? 09:50 consegnato, dettagli',
      )
      expect(the_messages_of(slot).at(-1)).toBe(
        'Il tuo contatto, oggi alle 09:59: arrivo 09:59, dettagli',
      )
    })
    const status = slot.querySelector('.the-chat > [role="status"]')
    expect(the_text_of(status)).toBe('Nuovo messaggio: arrivo Tuo messaggio, consegnato: dove sei?')
    const follows = asked_of(chats, 'usecase/a_chat').length
    // Given back, then on the whole screen again: followed anew (G-2's remedy).
    the_button(slot, the_slot.gives_it_back).click()
    await until(() => {
      expect(slot.dataset['state']).toBe('in_its_place')
    })
    the_button(slot, the_slot.takes_the_screen).click()
    await until(() => {
      expect(asked_of(chats, 'usecase/a_chat').length).toBe(follows + 1)
      expect(the_messages_of(slot)).toHaveLength(4)
    })
  })

  test('empty, then written from the field: «Invia» off for spaces, the field emptied, the focus kept on it (story 19)', async () => {
    const chats = the_chats_of_a_story([])
    const app = opens(chats)
    const slot = await opens_the_conversation(app, 'Carla')
    await until(() => {
      expect(the_text_of(slot.querySelector('[data-part="all"]'))).toBe(
        'Ancora nessun messaggio: scrivi il primo.',
      )
    })
    // The field labelled; «Invia» named in words, off while the text is blank.
    const label = slot.querySelector('[data-part="field"] label')
    expect(the_text_of(label?.querySelector('[data-part="for-a-screen-reader"]'))).toBe(
      'Scrivi un messaggio',
    )
    const send = the_button(slot, 'Invia')
    expect(send.disabled).toBe(true)
    const field = writes_in(slot, '   ')
    await until(() => {
      expect(send.disabled).toBe(true)
    })
    writes_in(slot, 'Ciao Carla')
    await until(() => {
      expect(send.disabled).toBe(false)
    })
    send.click()
    await until(() => {
      expect(asked_of(chats, 'usecase/write_a_message')).toEqual([
        { use_case: 'usecase/write_a_message', input: { bond: 'L_c', text: 'Ciao Carla' } },
      ])
      expect(the_messages_of(slot)).toEqual([
        'Oggi Tu, oggi alle 10:01: Ciao Carla 10:01 in uscita, dettagli',
      ])
    })
    expect(field.value).toBe('')
    expect(document.activeElement).toBe(field)
  })

  test('a message not delivered, told in words, and written again as a message of its own (story 19, MSG-13)', async () => {
    const chats = the_chats_of_a_story([
      bruno_s([
        mine('M1', 1, 'Ciao Bruno', minutes_after_ten(-7 * 24 * 60), {
          stage: 'no_receipt',
          at: minutes_after_ten(-1),
        }),
        mine('M2', 2, 'ci sei?', minutes_after_ten(-30), { stage: 'held' }),
        mine('M3', 3, 'ok', minutes_after_ten(-20), {
          stage: 'delivered',
          at: minutes_after_ten(-19),
        }),
      ]),
    ])
    const app = opens(chats)
    const slot = await opens_the_conversation(app, 'Bruno')
    await until(() => {
      expect(the_messages_of(slot)).toHaveLength(3)
    })
    const [first, second, third] = [
      ...slot.querySelectorAll<HTMLElement>('[data-part="a-message"]'),
    ]
    expect(the_text_of(first?.querySelector('[data-part="stage"]'))).toBe(
      'nessuna ricevuta in 7 giorni',
    )
    expect(the_text_of(second?.querySelector('[data-part="stage"]'))).toBe('fermo')
    expect(first?.dataset['state']).toBe('no_receipt')
    // «Invia di nuovo» on a message not delivered, not on one delivered.
    expect(third?.querySelector('[data-part="send-again"]')).toBeNull()
    if (first === undefined) throw new Error('no first message')
    the_button(first, 'Invia di nuovo').click()
    await until(() => {
      expect(asked_of(chats, 'usecase/write_a_message')).toEqual([
        { use_case: 'usecase/write_a_message', input: { bond: 'L_b', text: 'Ciao Bruno' } },
      ])
      expect(the_messages_of(slot)).toHaveLength(4)
    })
    // The first left as it closed.
    expect(the_text_of(first.querySelector('[data-part="stage"]'))).toBe(
      'nessuna ricevuta in 7 giorni',
    )
  })

  test('her messages in each of the seven stages, each in words with its glyph, «Invia di nuovo» under those not delivered (story 19, MSG-13)', async () => {
    const stages: readonly [a_stage_of_a_story, string, string, boolean][] = [
      [{ stage: 'on_its_way' }, 'in uscita', 'clock', false],
      [{ stage: 'delivered', at: minutes_after_ten(-1) }, 'consegnato', 'check_check', false],
      [
        { stage: 'no_receipt', at: minutes_after_ten(-1) },
        'nessuna ricevuta in 7 giorni',
        'circle_alert',
        true,
      ],
      [
        { stage: 'could_not_be_delivered', at: minutes_after_ten(-1) },
        'non consegnabile',
        'circle_alert',
        true,
      ],
      [{ stage: 'called_off', at: minutes_after_ten(-1) }, 'annullato', 'circle_minus', true],
      [{ stage: 'held' }, 'fermo', 'circle_alert', true],
      [{ stage: 'put_aside' }, 'messo da parte', 'circle_minus', true],
    ]
    const chats = the_chats_of_a_story([
      bruno_s(
        stages.map(([stage], at) =>
          mine(
            `M${String(at + 1)}`,
            at + 1,
            `messaggio ${String(at + 1)}`,
            minutes_after_ten(-10 + at),
            stage,
          ),
        ),
      ),
    ])
    const app = opens(chats)
    const slot = await opens_the_conversation(app, 'Bruno')
    await until(() => {
      expect(the_messages_of(slot)).toHaveLength(stages.length)
    })
    const drawn = [...slot.querySelectorAll<HTMLElement>('[data-part="a-message"]')]
    expect(
      drawn.map((one) => {
        const stage = one.querySelector<HTMLElement>('[data-part="stage"]')
        return [
          one.dataset['state'],
          the_text_of(stage),
          stage?.querySelector('svg')?.getAttribute('data-glyph'),
          one.querySelector('[data-part="send-again"]') !== null,
        ]
      }),
    ).toEqual(stages.map(([stage, said, glyph, again]) => [stage.stage, said, glyph, again]))
  })

  test('the annotations of a message at a tap: theirs what her node can tell, hers where it stands (story 19, MSG-6)', async () => {
    const chats = the_chats_of_a_story([
      bruno_s([
        theirs('B1', 1, 'arrivo', minutes_after_ten(15), minutes_after_ten(-30)),
        mine('M1', 2, 'ok', minutes_after_ten(16), {
          stage: 'delivered',
          at: minutes_after_ten(20),
        }),
      ]),
    ])
    const app = opens(chats)
    const slot = await opens_the_conversation(app, 'Bruno')
    await until(() => {
      expect(the_messages_of(slot)).toHaveLength(2)
    })
    const [his, hers] = [...slot.querySelectorAll<HTMLElement>('[data-part="a-message"]')]
    if (his === undefined || hers === undefined) throw new Error('no messages')
    const meta = his.querySelector<HTMLButtonElement>('[data-part="meta"]')
    expect(meta?.getAttribute('aria-expanded')).toBe('false')
    expect(his.querySelector('dl')?.hidden).toBe(true)
    meta?.click()
    await until(() => {
      expect(meta?.getAttribute('aria-expanded')).toBe('true')
      expect(his.querySelector('dl')?.hidden).toBe(false)
    })
    expect(meta?.getAttribute('aria-controls')).toBe(his.querySelector('dl')?.id)
    expect(
      [...his.querySelectorAll('dl > dt')].map(
        (dt) => `${the_text_of(dt)}: ${the_text_of(dt.nextElementSibling)}`,
      ),
    ).toEqual([
      'Ricevuto: oggi alle 10:15, secondo il tuo telefono',
      'Ora dichiarata: oggi alle 09:30, secondo il suo telefono',
      'Firma: valida: è di un tuo contatto',
      'Casella: quella del vostro legame',
    ])
    // A tap on her bubble opens hers, and closes his.
    hers.querySelector<HTMLElement>('[data-part="text"]')?.click()
    await until(() => {
      expect(hers.querySelector('dl')?.hidden).toBe(false)
      expect(his.querySelector('dl')?.hidden).toBe(true)
    })
    expect(
      [...hers.querySelectorAll('dl > dt')].map(
        (dt) => `${the_text_of(dt)}: ${the_text_of(dt.nextElementSibling)}`,
      ),
    ).toEqual([
      'Scritto: oggi alle 10:16',
      'Stato: consegnato: la ricevuta del tuo contatto è arrivata',
      'Aggiornato: oggi alle 10:20, secondo il tuo telefono',
    ])
  })

  test('a long text whole; with no network, on its way «partirà appena possibile» (story 19)', async () => {
    const long = 'Una lettera lunga. '.repeat(200).trim()
    const chats = the_chats_of_a_story([bruno_s([mine('M1', 1, long, minutes_after_ten(-1))])])
    const app = opens(chats, 'offline')
    const slot = await opens_the_conversation(app, 'Bruno')
    await until(() => {
      expect(slot.querySelector('[data-part="text"]')?.textContent).toBe(long)
    })
    expect(the_text_of(slot.querySelector('[data-part="stage"]'))).toBe(
      'in uscita: partirà appena possibile',
    )
    expect(the_text_of(slot.querySelector('[data-part="note"][data-state="no_network"]'))).toBe(
      'Il telefono non ha rete: i messaggi partiranno appena possibile.',
    )
  })

  test('a long chat a page at a time, the newest first; the older ones as she goes up (story 19, K-9)', async () => {
    const many = Array.from({ length: 120 }, (_, at) =>
      at % 2 === 0
        ? theirs(
            `B${String(at)}`,
            at + 1,
            `messaggio ${String(at + 1)}`,
            minutes_after_ten(at - 200),
          )
        : mine(
            `M${String(at)}`,
            at + 1,
            `messaggio ${String(at + 1)}`,
            minutes_after_ten(at - 200),
            {
              stage: 'delivered',
              at: minutes_after_ten(at - 199),
            },
          ),
    )
    const chats = the_chats_of_a_story([bruno_s(many)])
    const app = opens(chats)
    const slot = await opens_the_conversation(app, 'Bruno')
    await until(() => {
      expect(slot.querySelectorAll('[data-part="a-message"]')).toHaveLength(50)
    })
    expect(the_text_of(slot.querySelector('[data-part="a-message"] [data-part="text"]'))).toBe(
      'messaggio 71',
    )
    the_button(slot, 'Messaggi precedenti').click()
    await until(() => {
      expect(slot.querySelectorAll('[data-part="a-message"]')).toHaveLength(100)
    })
    the_button(slot, 'Messaggi precedenti').click()
    await until(() => {
      expect(slot.querySelectorAll('[data-part="a-message"]')).toHaveLength(120)
    })
    expect(slot.querySelector('[data-part="older"]')).toBeNull()
  })
})
