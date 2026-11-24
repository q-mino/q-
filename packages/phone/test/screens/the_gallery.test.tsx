// The gallery and the design's components (WEB-27, WEB-28), in a DOM of
// test: every story drawn, in both themes, with an id of its own; one asked
// alone; and what each component does with her gesture.

import {
  Field,
  Gesture,
  Icon,
  Notice,
  Row,
  List,
  type WhatAFieldTells,
} from '@q-mino/adapters-web/design'
import { render, type VNode } from 'preact'
import { afterEach, describe, expect, test } from 'vitest'
import { TheGallery, the_file_of, the_files } from '../../src/gallery/index.ts'
import { the_gallery } from '../../src/texts/index.ts'

const drawn = (node: VNode): HTMLElement => {
  const root = document.createElement('div')
  document.body.append(root)
  render(node, root)
  return root
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('the gallery', () => {
  test('every story drawn in Roano and Lavagna, each with an id of its own', () => {
    const page = drawn(
      <TheGallery files={the_files} shows={{ shows: 'everything' }} texts={the_gallery} />,
    )
    const ids = the_files.flatMap((file) => file.stories.map((story) => story.id))
    expect(ids.length).toBeGreaterThan(20)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      const story = page.querySelector(`[data-story="${id}"]`)
      expect(story?.querySelectorAll('[data-theme="light"]')).toHaveLength(1)
      expect(story?.querySelectorAll('[data-theme="dark"]')).toHaveLength(1)
    }
    expect(page.querySelectorAll('nav a')).toHaveLength(the_files.length)
  })

  test('a story asked alone, in one theme; one it does not have, told', () => {
    const page = drawn(
      <TheGallery
        files={the_files}
        shows={{ shows: 'a_story', story: 'design-gesture--a-primary-gesture', themes: ['dark'] }}
        texts={the_gallery}
      />,
    )
    expect(page.querySelectorAll('[data-story]')).toHaveLength(1)
    expect(page.querySelectorAll('[data-theme]')).toHaveLength(1)
    expect(page.querySelector('[data-theme="dark"] .gesture')?.textContent).toBe('Salva il nome')
    const none = drawn(
      <TheGallery
        files={the_files}
        shows={{ shows: 'a_story', story: 'no-such', themes: ['light'] }}
        texts={the_gallery}
      />,
    )
    expect(none.querySelector('[role="alert"]')?.textContent).toBe(
      the_gallery.no_such_story('no-such'),
    )
  })

  test('a file read as CSF reads it: its meta, then its stories in the order written', () => {
    const file = the_file_of({
      default: { title: 'Design/A Thing', component: undefined },
      first_case: { render: () => <p /> },
      SecondCase: { name: 'Named', render: () => <p /> },
      not_a_story: 3,
    })
    expect(file.id).toBe('design-a-thing')
    expect(file.stories.map((story) => [story.id, story.name])).toEqual([
      ['design-a-thing--first-case', 'First case'],
      ['design-a-thing--second-case', 'Named'],
    ])
    expect(() => the_file_of({ first_case: { render: () => <p /> } })).toThrow()
  })
})

describe('the components', () => {
  test('a gesture taps, off it does not, one that submits submits its form', () => {
    let taps = 0
    const page = drawn(
      <>
        <Gesture
          kind="primary"
          label="Uno"
          does={{
            does: 'taps',
            taps: () => {
              taps += 1
            },
          }}
        />
        <Gesture
          kind="dangerous"
          label="Due"
          off
          does={{
            does: 'taps',
            taps: () => {
              taps += 10
            },
          }}
        />
        <form>
          <Gesture kind="secondary" label="Tre" does={{ does: 'submits' }} />
        </form>
      </>,
    )
    const [one, two, three] = [...page.querySelectorAll('button')]
    one?.click()
    two?.click()
    expect(taps).toBe(1)
    expect(one?.dataset['kind']).toBe('primary')
    expect(two?.disabled).toBe(true)
    expect(three?.type).toBe('submit')
  })

  test('a field tells each key, its hint, what is wrong', () => {
    const typed: string[] = []
    const tells = (told: WhatAFieldTells) =>
      drawn(
        <Field
          label="Nome"
          name="name"
          holds={{ holds: 'the_screens', value: '', types: (value) => typed.push(value) }}
          tells={told}
        />,
      )
    const field = tells({ tells: 'a_hint', text: 'Un aiuto' })
    const input = field.querySelector('input')
    if (input === null) throw new Error('no input')
    input.value = 'A'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    expect(typed).toEqual(['A'])
    expect(field.querySelector('[data-part="hint"]')?.textContent).toBe('Un aiuto')
    const faulty = tells({ tells: 'a_fault', text: 'Manca' })
    expect(faulty.querySelector('.field')?.getAttribute('data-state')).toBe('faulty')
    expect(faulty.querySelector('[role="alert"]')?.textContent).toBe('Manca')
    expect(faulty.querySelector('input')?.getAttribute('aria-invalid')).toBe('true')
  })

  test('a row opens by its title, a notice of a fault is an alert, a glyph named is an image', () => {
    let opened = 0
    const page = drawn(
      <>
        <List label="Contatti">
          <Row
            title="Anna"
            opens={() => {
              opened += 1
            }}
          />
        </List>
        <Notice kind="fault">Guasto</Notice>
        <Notice kind="waiting">Aspetto</Notice>
        <Icon glyph="wifi_off" named="Senza rete" />
        <Icon glyph="user" />
      </>,
    )
    page.querySelector<HTMLButtonElement>('button[data-part="title"]')?.click()
    expect(opened).toBe(1)
    expect(page.querySelector('[data-kind="fault"]')?.getAttribute('role')).toBe('alert')
    expect(page.querySelector('[data-kind="waiting"]')?.getAttribute('role')).toBe('status')
    const [named, decorative] = [...page.querySelectorAll(':scope > svg')]
    expect(named?.getAttribute('role')).toBe('img')
    expect(named?.getAttribute('aria-label')).toBe('Senza rete')
    expect(decorative?.getAttribute('aria-hidden')).toBe('true')
  })
})
