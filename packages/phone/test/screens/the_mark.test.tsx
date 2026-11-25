// The kernel's mark, the slot and the corner (EXT-16, WEB-30), in a DOM of
// test: marks nested tell the chain of their names; a slot hands its part
// its subject; taken to the whole screen and given back, its part is the
// same element, never drawn again (what it holds stays as it was), the
// corner telling the chain; the gallery's two extensions, one inside the
// other, drawn.

import { Gesture, Mark, Slot, type TheWordsOfASlot } from '@q-mino/adapters-web/design'
import { render, type VNode } from 'preact'
import { afterEach, describe, expect, test } from 'vitest'
import { the_gallery } from '../../src/texts/index.ts'
import { the_button, until } from './harness.tsx'

const words: TheWordsOfASlot = the_gallery.samples.the_slot
const nothing = { does: 'taps', taps: () => undefined } as const

const drawn = (node: VNode): HTMLElement => {
  const root = document.createElement('div')
  document.body.append(root)
  render(node, root)
  return root
}

afterEach(() => {
  document.body.replaceChildren()
})

const TwoMarks = () => (
  <Mark name="Messaggi" title="Estensione «Messaggi»">
    <Slot place="a_bond" subject={{ name: 'Bruno' }} label="La conversazione" words={words}>
      {(contact) => (
        <>
          <p data-test="theirs">{contact.name}</p>
          <Mark name="Dadi" title="Estensione «Dadi»">
            <Gesture kind="extension" label="Tira" does={nothing} />
            <Slot place="a_bond" subject={{ name: 'Bruno' }} label="Un tiro" words={words}>
              {(contact) => <p data-test="a-throw">{contact.name}</p>}
            </Slot>
          </Mark>
        </>
      )}
    </Slot>
  </Mark>
)

const the_slot = (page: HTMLElement, label: string): HTMLElement => {
  const slot = page.querySelector<HTMLElement>(`.slot[aria-label="${label}"]`)
  if (slot === null) throw new Error(`no slot ${label}`)
  return slot
}

const the_head = (slot: HTMLElement): HTMLElement => {
  const head = slot.querySelector<HTMLElement>(
    ':scope > [data-part="head"], :scope > [data-part="corner"]',
  )
  if (head === null) throw new Error('no head')
  return head
}

describe('the kernel’s mark and its slots', () => {
  test('a slot hands its part its subject; the mark’s tag says whose it is', () => {
    const page = drawn(<TwoMarks />)
    expect(page.querySelector('[data-test="theirs"]')?.textContent).toBe('Bruno')
    expect(page.querySelector('.mark > [data-part="tag"]')?.textContent).toBe(
      'Estensione «Messaggi»',
    )
    expect(page.querySelectorAll('.mark .mark')).toHaveLength(1)
    expect(the_button(page, 'Tira').dataset['kind']).toBe('extension')
  })

  test('to the whole screen and back: the same part, the chain in the corner, the focus on the gesture back', async () => {
    const page = drawn(<TwoMarks />)
    const outer = the_slot(page, 'La conversazione')
    const theirs = page.querySelector('[data-test="theirs"]')
    the_button(the_head(outer), words.takes_the_screen).click()
    await until(() => {
      expect(outer.dataset['state']).toBe('on_the_whole_screen')
    })
    expect(the_head(outer).querySelector('[data-part="chain"]')?.textContent).toBe('Messaggi')
    await until(() => {
      expect(document.activeElement?.textContent).toBe(words.gives_it_back)
    })
    // Never drawn again: what the part holds stays as it was.
    expect(page.querySelector('[data-test="theirs"]')).toBe(theirs)

    // An extension inside it, to the whole screen too: the chain of the two.
    const inner = the_slot(page, 'Un tiro')
    the_button(the_head(inner), words.takes_the_screen).click()
    await until(() => {
      expect(inner.dataset['state']).toBe('on_the_whole_screen')
    })
    const chain = [...the_head(inner).querySelectorAll('[data-part="chain"] > li')].map(
      (one) => one.textContent,
    )
    expect(chain).toEqual(['Messaggi', 'Dadi'])

    the_button(the_head(inner), words.gives_it_back).click()
    the_button(the_head(outer), words.gives_it_back).click()
    await until(() => {
      expect(outer.dataset['state']).toBe('in_its_place')
      expect(inner.dataset['state']).toBe('in_its_place')
    })
    await until(() => {
      expect(document.activeElement?.textContent).toBe(words.takes_the_screen)
    })
    expect(page.querySelector('[data-test="theirs"]')).toBe(theirs)
  })
})
