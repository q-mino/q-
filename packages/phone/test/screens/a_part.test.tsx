// A part of an extension's, drawn (K-3, K-13, WEB-23, EXT-4; part M4 of
// messaging): greetings' part, the test extension's, imported from its
// package as the composition root imports one, on a contact's screen and on
// its row in her contacts; through the kernel's fence and her node's door;
// a part not carried, the app's fault; a part's follows ended once its
// screen is no longer the one shown, and opened again when it is.

import type { APartsComponent, ThePartsOfTheApp } from '@q-mino/adapters-web/screens'
import type * as boundary from '@q-mino/boundary'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { afterEach, describe, expect, test } from 'vitest'
import {
  greetings_carried,
  greetings_seen,
  greetings_words,
} from '../../src/the_node_of_a_story/index.ts'
import {
  a_device_of_test,
  a_node_of_test,
  opens_the_app,
  ten_in_rome,
  texts,
  the_button,
  until,
  type HowItAnswersTheParts,
  type TheAppOpened,
  type WhatTheNodeHolds,
} from './harness.tsx'

const words = texts.screens
/** The ids the kernel draws for the parts' exchanges, in order (EXT-4: they pair an exchange only). */
const the_ids = Array.from({ length: 16 }, (_, at) => `P${String(at + 1)}`)
const the_slot = words.common.the_points.the_slot
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

const bruno_s_card = ui_value.a_contact_card.parse({
  ...bruno,
  handshake: { way: 'in_person', at: ten_in_rome },
  their_relays: ['wss://relay.example'],
})

/** Anna, her bonds with Bruno and Carla; greetings active, offered to Bruno only. */
const anna: Partial<WhatTheNodeHolds> = {
  faces: [{ face: 'F_a', name: 'Anna' }],
  the_active_face: 'F_a',
  contacts: [bruno, carla],
  cards: [bruno_s_card],
  extensions: [greetings_seen('active')],
  offers: [{ extension: 'greetings', bonds: ['L_b'] }],
  offered: [{ bond: 'L_b', offered: [{ extension: 'greetings', majors: [1] }] }],
}

/** The row of her contacts whose title holds these words. */
const the_row = (app: TheAppOpened, name: string): HTMLElement => {
  const row = [...app.shown().querySelectorAll<HTMLElement>('li.row')].find(
    (li) => li.querySelector('[data-part="title"]')?.textContent === name,
  )
  if (row === undefined) throw new Error(`no row "${name}"`)
  return row
}

/** The text of an element, its spaces as one. */
const the_text_of = (element: Element): string => element.textContent.replace(/\s+/g, ' ').trim()

describe('a part of an extension’s, drawn (K-3)', () => {
  test('on a row of her contacts: greetings’ slot, its line, on the bond offered to it only (K-13)', async () => {
    const node = a_node_of_test(anna)
    opened = opens_the_app({
      node: node.node,
      device: a_device_of_test(the_ids),
      words: { greetings: greetings_words },
      the_parts: greetings_carried,
    })
    const app = opened
    await until(() => {
      expect(the_row(app, 'Bruno').querySelector('.the-greetings')?.textContent).toBe(
        'Un saluto, a tutto schermo.',
      )
    })
    const row = the_row(app, 'Bruno')
    expect(row.querySelector('.mark')?.getAttribute('aria-label')).toBe(
      words.common.the_mark_of('Saluti'),
    )
    expect(row.querySelector('.slot')?.getAttribute('data-place')).toBe('a_bond_in_my_contacts')
    expect(the_row(app, 'Carla').querySelector('.mark')).toBeNull()
    // No action on a row: greetings' «Saluta» is on the contact's screen only.
    expect(
      [...row.querySelectorAll('button')].map((button) => button.textContent.trim()),
    ).not.toContain('Saluta')
  })

  test('on a contact’s screen: at her tap on the whole screen, «Saluta» through the fence and her node’s door, its event told', async () => {
    const node = a_node_of_test(anna)
    opened = opens_the_app({
      node: node.node,
      device: a_device_of_test(the_ids),
      words: { greetings: greetings_words },
      the_parts: greetings_carried,
    })
    const app = opened
    await until(() => {
      expect(the_row(app, 'Bruno')).toBeDefined()
    })
    the_button(the_row(app, 'Bruno'), 'Bruno').click()
    await until(() => {
      expect(app.shown().querySelector('.slot[data-place="a_bond"] .the-greetings')).not.toBeNull()
    })
    const slot = app.shown().querySelector<HTMLElement>('.slot[data-place="a_bond"]')
    if (slot === null) throw new Error('no slot')
    the_button(slot, the_slot.takes_the_screen).click()
    await until(() => {
      expect(slot.dataset['state']).toBe('on_the_whole_screen')
      expect(slot.querySelector('.the-greetings button')).not.toBeNull()
    })
    the_button(slot, 'Saluta da qui').click()
    await until(() => {
      expect(slot.querySelector('[role="status"]')?.textContent).toBe(
        'Saluto partito: aspetta la risposta.',
      )
    })
    expect(node.asked_by_the_parts()).toEqual([
      {
        fenced: 'served',
        exchange: 'invoke',
        id: 'P1',
        invokes: {
          of: 'an_extension',
          extension: 'greetings',
          persona: 'self',
          use_case: 'usecase/greet_a_bond',
          version: '1.0.0',
        },
        input: { bond: 'L_b' },
      },
    ])
    expect(node.fenced()).toEqual([])
  })

  test('a part the app does not carry is the app’s fault in its place; a module that does not load, its own', async () => {
    const not_carried: ThePartsOfTheApp = () => ({ part: 'not_carried' })
    const not_loading: ThePartsOfTheApp = () => ({
      part: 'carried',
      imports: () => Promise.reject(new Error('429')),
    })
    for (const [parts, fault] of [
      [not_carried, words.common.the_points.no_document],
      [not_loading, words.common.the_points.the_part_does_not_load],
    ] as const) {
      opened?.closes()
      const node = a_node_of_test(anna)
      opened = opens_the_app({
        node: node.node,
        device: a_device_of_test(the_ids),
        words: { greetings: greetings_words },
        the_parts: parts,
      })
      const app = opened
      await until(() => {
        expect(the_text_of(the_row(app, 'Bruno'))).toContain(fault)
      })
    }
  })

  test('a part that falls while drawn is the app’s fault in its place, the rest of the screen drawn', async () => {
    const falls: APartsComponent = () => {
      throw new Error('a part that falls')
    }
    const node = a_node_of_test(anna)
    opened = opens_the_app({
      node: node.node,
      device: a_device_of_test(the_ids),
      words: { greetings: greetings_words },
      the_parts: () => ({ part: 'carried', imports: () => Promise.resolve(falls) }),
    })
    const app = opened
    await until(() => {
      expect(the_text_of(the_row(app, 'Bruno'))).toContain(words.common.the_points.the_part_fell)
    })
    expect(the_text_of(the_row(app, 'Carla'))).not.toContain(words.common.the_points.the_part_fell)
  })

  test('its follows are ended once its screen is not the one shown, and it follows again once it is (K-4)', async () => {
    let follows = 0
    // A read's flow: its snapshot, then no change; the extension's side ends it at its next event (K-4's limit).
    const answers: HowItAnswersTheParts = async function* (served) {
      if (served.exchange !== 'follow') return
      follows += 1
      yield { event: 'snapshot', entries: [] }
      await new Promise<void>(() => undefined)
    }
    /** A part that follows a read while its screen is shown, and tells how many snapshots it read. */
    const a_part_that_follows: APartsComponent = (given: boundary.WhatAPartIsGiven) => {
      const read = useSignal(0)
      useEffect(() => {
        if (!given.shown) return
        const flow = given.door.follow({
          use_case: 'greetings/usecase/the_greetings_of_a_bond',
          version: '1.0.0',
          input: {},
        })
        void (async () => {
          for await (const told of flow) if (told.told === 'an_event') read.value += 1
        })()
      }, [given.shown])
      return <p class="a-follow">{String(read.value)}</p>
    }
    const node = a_node_of_test(anna, answers)
    opened = opens_the_app({
      node: node.node,
      device: a_device_of_test(the_ids),
      words: { greetings: greetings_words },
      the_parts: () => ({ part: 'carried', imports: () => Promise.resolve(a_part_that_follows) }),
    })
    const app = opened
    await until(() => {
      expect(the_row(app, 'Bruno').querySelector('.a-follow')?.textContent).toBe('1')
      expect(follows).toBe(1)
    })
    // Bruno's screen on top: her contacts kept under it, not shown, the row's follow ended at once for the part.
    the_button(the_row(app, 'Bruno'), 'Bruno').click()
    // The part is drawn before its follow is asked (the fence reads the extensions first): wait for both.
    await until(() => {
      expect(app.shown().querySelector('.a-follow')).not.toBeNull()
      expect(follows).toBe(2)
    })
    // Back: her contacts shown again, its part follows again; Bruno's screen gone, its part's follow ended.
    the_button(app.shown(), words.common.back).click()
    await until(() => {
      expect(follows).toBe(3)
    })
    expect(node.fenced()).toEqual([])
  })
})
