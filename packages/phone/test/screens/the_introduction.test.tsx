// The introduction, rendered (UI-6; story 29 of `ui`'s README): read again
// from the menu, its three cards turned back and forth, «Indietro» and no
// «Salta», back where she was after the last; where she is among the cards
// for a screen reader; read the first time, «Salta» and no «Indietro», and a
// refresh during it opens it again from her contacts (WEB-25).

import { afterEach, describe, expect, test } from 'vitest'
import {
  a_device_of_test,
  a_history_of_test,
  a_node_of_test,
  has_a_button,
  opens_the_app,
  texts,
  the_button,
  the_title,
  types,
  until,
  type TheAppOpened,
} from './harness.tsx'

const words = texts.screens
const its = words.the_introduction
let opened: TheAppOpened | undefined
afterEach(() => {
  opened?.closes()
  opened = undefined
})

const on = async (app: TheAppOpened, title: string): Promise<void> => {
  await until(() => {
    expect(the_title(app)).toBe(title)
  })
}

/** The card shown: its case and its title. */
const the_card = (app: TheAppOpened): { state: string | null; title: string } => {
  const card = app.shown().querySelector('[data-part="card"]')
  return {
    state: card?.getAttribute('data-state') ?? null,
    title: card?.querySelector('h2')?.textContent ?? '',
  }
}

const shows = async (
  app: TheAppOpened,
  card: 'what_cumino_is' | 'how_the_letters_travel' | 'the_extensions',
): Promise<void> => {
  await until(() => {
    expect(the_card(app)).toEqual({ state: card, title: its.the_cards[card].title })
  })
}

describe('the introduction', () => {
  test('read again from the menu: its cards back and forth, then back where she was', async () => {
    const anna = a_node_of_test({ faces: [{ face: 'F_a', name: 'Anna' }], the_active_face: 'F_a' })
    opened = opens_the_app({ node: anna.node, device: a_device_of_test([]) })
    const app = opened
    await on(app, words.my_contacts.title)
    the_button(app.shown(), words.my_contacts.the_menu).click()
    await until(() => {
      expect(has_a_button(app.shown(), words.my_contacts.the_entries.the_introduction)).toBe(true)
    })
    the_button(app.shown(), words.my_contacts.the_entries.the_introduction).click()
    await on(app, its.title)
    await shows(app, 'what_cumino_is')
    expect(has_a_button(app.shown(), words.common.back)).toBe(true)
    expect(has_a_button(app.shown(), its.skip)).toBe(false)
    expect(has_a_button(app.shown(), its.to_the_card_before)).toBe(false)
    const dots = app.shown().querySelector('[data-part="cards"]')
    expect(dots?.getAttribute('aria-label')).toBe(its.where_she_is(1, 3))
    expect(dots?.querySelectorAll('li[aria-current="step"]')).toHaveLength(1)
    the_button(app.shown(), its.to_the_next_card).click()
    await shows(app, 'how_the_letters_travel')
    expect(app.shown().textContent).toContain(its.it_informs)
    the_button(app.shown(), its.to_the_card_before).click()
    await shows(app, 'what_cumino_is')
    the_button(app.shown(), its.to_the_next_card).click()
    await shows(app, 'how_the_letters_travel')
    the_button(app.shown(), its.to_the_next_card).click()
    await shows(app, 'the_extensions')
    expect(has_a_button(app.shown(), its.to_the_next_card)).toBe(false)
    the_button(app.shown(), its.back_where_she_was).click()
    await on(app, words.my_contacts.title)
    expect(anna.handed()).toEqual([])
  })

  test('read the first time: skippable on to the server, no «Indietro»; a refresh opens it again from her contacts', async () => {
    const anna = a_node_of_test()
    const history = a_history_of_test()
    opened = opens_the_app({
      node: anna.node,
      device: a_device_of_test(['A1', 'F_a']),
      the_history: history,
    })
    let app = opened
    await on(app, words.the_first_face.title)
    types(app.shown(), 'name', 'Anna')
    the_button(app.shown(), words.the_first_face.make_it).click()
    await until(() => {
      expect(anna.activities_asked()).toHaveLength(1)
    })
    anna.comes_to_hold((now) => ({
      ...now,
      faces: [{ face: 'F_a', name: 'Anna' }],
      the_active_face: 'F_a',
    }))
    anna.ends('A1', { ended: 'done', said: { event: 'your_face_is_being_made', payload: {} } })
    await on(app, its.title)
    await shows(app, 'what_cumino_is')
    expect(has_a_button(app.shown(), its.skip)).toBe(true)
    expect(has_a_button(app.shown(), words.common.back)).toBe(false)
    expect(history.the_address()).toBe('#/introduzione')
    // A refresh: the same view, read again, over her contacts.
    opened.closes()
    opened = opens_the_app({ node: anna.node, device: a_device_of_test([]), the_history: history })
    app = opened
    await on(app, its.title)
    expect(has_a_button(app.shown(), its.skip)).toBe(false)
    expect(has_a_button(app.shown(), words.common.back)).toBe(true)
    the_button(app.shown(), words.common.back).click()
    await on(app, words.my_contacts.title)
  })
})
