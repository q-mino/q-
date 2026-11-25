// The first face and the start, rendered (UI-5, UI-6, UI-1; stories 1, 4, 5, 6, 29 of
// `ui`'s README): her gestures on the screens, what they hand her node.

import { afterEach, describe, expect, test } from 'vitest'
import {
  a_device_of_test,
  a_node_of_test,
  opens_the_app,
  texts,
  the_button,
  the_title,
  the_words,
  types,
  until,
  type TheAppOpened,
} from './harness.tsx'

const words = texts.screens
let opened: TheAppOpened | undefined
afterEach(() => {
  opened?.closes()
  opened = undefined
})

describe('the first face', () => {
  test('with no face the app starts at the first face, the button off with no name', async () => {
    const anna = a_node_of_test()
    opened = opens_the_app({ node: anna.node, device: a_device_of_test([]) })
    const app = opened
    await until(() => {
      expect(the_title(app)).toBe(words.the_first_face.title)
    })
    expect(the_button(app.shown(), words.the_first_face.make_it).disabled).toBe(true)
  })

  test('her name is kept as a draft as she types it, and given back at the start', async () => {
    const anna = a_node_of_test({
      drafts: [{ for: { for: 'the_name_of_my_first_face' }, text: 'Ann' }],
    })
    opened = opens_the_app({ node: anna.node, device: a_device_of_test([]) })
    const app = opened
    await until(() => {
      expect(app.shown().querySelector<HTMLInputElement>('input[name="name"]')?.value).toBe('Ann')
    })
    types(app.shown(), 'name', 'Anna')
    await until(() => {
      expect(anna.handed()).toContainEqual({
        asks: 'to_keep_a_draft',
        for: { for: 'the_name_of_my_first_face' },
        text: 'Anna',
      })
    })
    expect(the_button(app.shown(), words.the_first_face.make_it).disabled).toBe(false)
  })

  test('making the first face asks once, and once made the introduction is read, then the server is told, then her contacts', async () => {
    const anna = a_node_of_test()
    opened = opens_the_app({ node: anna.node, device: a_device_of_test(['A1', 'F_a']) })
    const app = opened
    await until(() => {
      expect(the_title(app)).toBe(words.the_first_face.title)
    })
    types(app.shown(), 'name', 'Anna')
    the_button(app.shown(), words.the_first_face.make_it).click()
    await until(() => {
      expect(anna.activities_asked()).toEqual([
        { activity: 'make_my_first_face', face: 'F_a', name: 'Anna' },
      ])
    })
    await until(() => {
      expect(the_button(app.shown(), words.the_first_face.making).disabled).toBe(true)
    })
    anna.comes_to_hold((now) => ({ ...now, faces: [{ face: 'F_a', name: 'Anna' }] }))
    anna.ends('A1', { ended: 'done', said: { event: 'your_face_is_being_made', payload: {} } })
    // The introduction, read the first time (UI-6): its three cards, then on to the server.
    await until(() => {
      expect(the_title(app)).toBe(words.the_introduction.title)
    })
    for (const card of ['what_cumino_is', 'how_the_letters_travel'] as const) {
      await until(() => {
        expect(app.shown().textContent).toContain(words.the_introduction.the_cards[card].title)
      })
      the_button(app.shown(), words.the_introduction.to_the_next_card).click()
    }
    await until(() => {
      expect(app.shown().textContent).toContain(
        words.the_introduction.the_cards.the_extensions.title,
      )
    })
    the_button(app.shown(), words.the_introduction.to_the_server).click()
    // The server, once (1c, UI-5): the relay her letters go through, what it sees and what not.
    await until(() => {
      expect(the_title(app)).toBe(words.the_server.title)
      expect(app.shown().textContent).toContain(
        words.the_server.it_carries_your_letters('https://relay.cumino.test'),
      )
    })
    expect(app.shown().textContent).toContain(words.the_server.it_does_not_see)
    the_button(app.shown(), words.the_server.go_on).click()
    await until(() => {
      expect(the_title(app)).toBe(words.my_contacts.title)
    })
    expect(anna.handed()).toContainEqual({
      asks: 'to_drop_a_draft',
      for: { for: 'the_name_of_my_first_face' },
    })
    expect(anna.handed()).toContainEqual({ asks: 'to_change_face', face: 'F_a' })
    expect(anna.activities_asked()).toHaveLength(1)
  })

  test('a making that cannot be done is told, and she makes it again', async () => {
    const anna = a_node_of_test()
    opened = opens_the_app({
      node: anna.node,
      device: a_device_of_test(['A1', 'F_a', 'A2', 'F_a2']),
    })
    const app = opened
    await until(() => {
      expect(the_title(app)).toBe(words.the_first_face.title)
    })
    types(app.shown(), 'name', 'Anna')
    the_button(app.shown(), words.the_first_face.make_it).click()
    await until(() => {
      expect(anna.activities_asked()).toHaveLength(1)
    })
    anna.ends('A1', {
      ended: 'the_app_cannot_do_it',
      said: { event: 'invalid_request', payload: {} },
    })
    await until(() => {
      expect(the_words(app)).toContain(words.common.how_it_ended.the_app_cannot_do_it)
    })
    the_button(app.shown(), words.the_first_face.make_it).click()
    await until(() => {
      expect(anna.activities_asked()).toEqual([
        { activity: 'make_my_first_face', face: 'F_a', name: 'Anna' },
        { activity: 'make_my_first_face', face: 'F_a2', name: 'Anna' },
      ])
    })
  })
})
