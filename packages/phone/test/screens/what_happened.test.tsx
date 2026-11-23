// What happened, rendered (UI-5; F6, USR-8, EXT-16; story 23 of `ui`'s
// README): nothing; or what is in progress, the kernel's news, and each
// extension's in its mark; a held letter sent again once, then put aside.

import * as user_value from '@q-mino/domains/user/_value.ts'
import * as activities_value from '@q-mino/domains/user/activities/_value.ts'
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
const news = words.what_happened.the_news
let opened: TheAppOpened | undefined
afterEach(() => {
  opened?.closes()
  opened = undefined
})

const anna: Partial<WhatTheNodeHolds> = {
  faces: [{ face: 'F_a', name: 'Anna' }],
  the_active_face: 'F_a',
}

/** A section of the screen shown, by its label: the kernel's, or a mark. */
const the_section = (app: TheAppOpened, label: string): HTMLElement => {
  const found = [...app.shown().querySelectorAll<HTMLElement>('section')].find(
    (section) => section.getAttribute('aria-label') === label,
  )
  if (found === undefined) throw new Error(`no section "${label}"`)
  return found
}

const the_letter = (within: HTMLElement, what: string): HTMLElement => {
  const found = [...within.querySelectorAll<HTMLElement>('li')].find((li) =>
    li.textContent.includes(what),
  )
  if (found === undefined) throw new Error(`no letter "${what}"`)
  return found
}

describe('what happened', () => {
  test('what happened shows what is in progress, the kernel’s news, and each extension’s in its mark; a held letter is sent again once', async () => {
    // Nothing: nothing happened.
    const quiet = a_node_of_test(anna)
    opened = opens_the_app({ node: quiet.node, device: a_device_of_test([]) })
    const first = opened
    await until(() => {
      expect(has_a_button(first.shown(), words.my_contacts.the_menu)).toBe(true)
    })
    the_button(first.shown(), words.my_contacts.the_menu).click()
    the_button(first.shown(), words.my_contacts.the_entries.what_happened).click()
    await until(() => {
      expect(the_words(first)).toContain(words.what_happened.nothing_happened)
    })
    first.closes()

    const the_kernel_s_letter = user_value.a_held_letter.parse({
      whose: { of: 'the_kernel', office: 'bonds' },
      letter: 'K1',
      what: 'La conferma a Bruno',
      why: { why: 'it_could_not_be_delivered', because: 'il relay non risponde' },
    })
    const ping_pong_s_letter = user_value.a_held_letter.parse({
      whose: { of: 'an_extension', extension: 'ping_pong' },
      letter: 'P1',
      what: 'Un ping a un contatto tolto',
      why: { why: 'what_came_back_was_refused' },
    })
    const anna_s = a_node_of_test({
      ...anna,
      activities: [
        activities_value.activity_card.parse({
          activity_id: 'A1',
          what: { activity: 'rename_a_bond', bond: 'L_b', name: 'Bruno B.' },
          asked_at: ten_in_rome,
          stage: { stage: 'in_progress' },
        }),
      ],
      held_letters: [the_kernel_s_letter, ping_pong_s_letter],
      happened: [
        { happened: 'a_letter_could_not_be_opened' },
        { happened: 'an_extension_fell', extension: 'ping_pong', fall: 'the_first' },
      ],
    })
    opened = opens_the_app({ node: anna_s.node, device: a_device_of_test(['A18', 'A19']) })
    const app = opened
    await until(() => {
      expect(has_a_button(app.shown(), words.my_contacts.something_happened(2, 2))).toBe(true)
    })
    the_button(app.shown(), words.my_contacts.something_happened(2, 2)).click()
    await until(() => {
      expect(the_title(app)).toBe(words.what_happened.title)
      expect(the_words(app)).toContain(words.what_happened.the_activities.rename_a_bond)
    })
    const the_kernel_s = the_section(app, words.what_happened.the_kernels)
    expect(the_kernel_s.textContent).toContain('La conferma a Bruno')
    expect(the_kernel_s.textContent).toContain(news.why_it_is_held.it_could_not_be_delivered)
    expect(the_kernel_s.textContent).toContain('il relay non risponde')
    expect(the_kernel_s.textContent).toContain(news.happened.a_letter_could_not_be_opened)
    expect(the_kernel_s.textContent).not.toContain('Un ping a un contatto tolto')
    const ping_pong_s = the_section(app, words.common.the_mark_of('Ping pong'))
    expect(ping_pong_s.textContent).toContain('Un ping a un contatto tolto')
    expect(ping_pong_s.textContent).toContain(news.why_it_is_held.what_came_back_was_refused)
    expect(ping_pong_s.textContent).toContain(
      `${news.happened.an_extension_fell}: ${news.the_fall.the_first}`,
    )
    expect(ping_pong_s.textContent).not.toContain('La conferma a Bruno')

    // Sent again with A18; again while in progress, nothing.
    const the_ping = () =>
      the_letter(
        the_section(app, words.common.the_mark_of('Ping pong')),
        'Un ping a un contatto tolto',
      )
    the_button(the_ping(), news.send_it_again).click()
    await until(() => {
      expect(the_button(the_ping(), news.send_it_again).disabled).toBe(true)
      expect(the_ping().textContent).toContain(words.common.in_progress)
    })
    the_button(the_ping(), news.send_it_again).click()
    await until(() => {
      expect(anna_s.activities_asked()).toEqual([
        {
          activity: 'send_a_held_letter_again',
          whose: { of: 'an_extension', extension: 'ping_pong' },
          letter: 'P1',
        },
      ])
      expect(the_words(app)).toContain(words.what_happened.the_activities.send_a_held_letter_again)
    })

    // Her reason typed while her node changes stays; put aside with A19 once A18 ended.
    types(the_ping(), 'because', 'non serve')
    anna_s.ends('A18', { ended: 'done', said: { event: 'the_letter_is_sent_again', payload: {} } })
    await until(() => {
      expect(the_button(the_ping(), news.put_it_aside).disabled).toBe(false)
      expect(the_ping().textContent).toContain(words.common.how_it_ended.done)
    })
    expect(the_ping().querySelector<HTMLInputElement>('input[name="because"]')?.value).toBe(
      'non serve',
    )
    the_button(the_ping(), news.put_it_aside).click()
    await until(() => {
      expect(anna_s.activities_asked()).toEqual([
        {
          activity: 'send_a_held_letter_again',
          whose: { of: 'an_extension', extension: 'ping_pong' },
          letter: 'P1',
        },
        {
          activity: 'put_a_held_letter_aside',
          whose: { of: 'an_extension', extension: 'ping_pong' },
          letter: 'P1',
          because: 'non serve',
        },
      ])
    })
  })
})
