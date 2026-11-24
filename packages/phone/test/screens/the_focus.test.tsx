// The focus at each move of the way (WEB-29): the title of the screen shown,
// after the first; the confirmation of a removal drawn as the screen's state
// says, the browser's close (Escape) told back to it.

import * as ui_value from '@q-mino/domains/ui/_value.ts'
import { afterEach, describe, test } from 'vitest'
import {
  a_device_of_test,
  a_node_of_test,
  expect,
  opens_the_app,
  ten_in_rome,
  texts,
  the_button,
  the_title,
  until,
  type TheAppOpened,
} from './harness.tsx'

const words = texts.screens
let opened: TheAppOpened | undefined
afterEach(() => {
  opened?.closes()
  opened = undefined
})

const anna_with_bruno = () =>
  a_node_of_test({
    faces: [{ face: 'F_a', name: 'Anna' }],
    the_active_face: 'F_a',
    contacts: [
      ui_value.a_contact_seen.parse({
        bond: 'L_b',
        name: 'Bruno',
        introduced_as: 'Bruno',
        confirmation: { state: 'received', at: ten_in_rome },
      }),
    ],
  })

describe('the focus and the questions', () => {
  test('the first screen keeps the page’s focus; each screen opened after has its title focused, back too', async () => {
    const app = opens_the_app({ node: anna_with_bruno().node, device: a_device_of_test([]) })
    opened = app
    await until(() => {
      expect(the_title(app)).toBe(words.my_contacts.title)
    })
    expect(document.activeElement?.tagName).not.toBe('H1')
    the_button(app.shown(), words.my_contacts.the_menu).click()
    await until(() => {
      expect(app.shown().querySelector('nav')).not.toBeNull()
    })
    the_button(app.shown(), words.my_contacts.the_entries.the_extensions).click()
    await until(() => {
      expect(the_title(app)).toBe(words.the_extensions.title)
      expect(document.activeElement?.textContent).toBe(words.the_extensions.title)
    })
    the_button(app.shown(), words.common.back).click()
    await until(() => {
      expect(document.activeElement?.textContent).toBe(words.my_contacts.title)
    })
  })

  test('removing a contact asks a confirmation in a dialog, which holds the screen; Escape is her no', async () => {
    const anna = anna_with_bruno()
    anna.comes_to_hold((now) => ({
      ...now,
      cards: [
        ui_value.a_contact_card.parse({
          bond: 'L_b',
          name: 'Bruno',
          introduced_as: 'Bruno',
          confirmation: { state: 'received', at: ten_in_rome },
          handshake: { way: 'in_person', at: ten_in_rome },
          their_relays: [],
        }),
      ],
    }))
    const app = opens_the_app({ node: anna.node, device: a_device_of_test([]) })
    opened = app
    await until(() => {
      expect(app.shown().textContent).toContain('Bruno')
    })
    the_button(app.shown(), 'Bruno').click()
    await until(() => {
      expect(the_title(app)).toBe(words.a_contact.title)
      expect(app.shown().querySelector('h2')?.textContent).toBe('Bruno')
    })
    expect(app.shown().querySelector('dialog')).toBeNull()
    the_button(app.shown(), words.a_contact.remove_it).click()
    await until(() => {
      expect(app.shown().querySelector('dialog')?.open).toBe(true)
    })
    app
      .shown()
      .querySelector('dialog')
      ?.dispatchEvent(new Event('cancel', { cancelable: true }))
    await until(() => {
      expect(app.shown().querySelector('dialog')).toBeNull()
    })
    expect(anna.handed()).toEqual([])
  })
})
