// The app's frame (PWA-2) and the data of an older test release (WEB-8), in
// a DOM of test with fakes: met at the start or by the screens' first reads,
// the sentence told; on the test channel the gesture stops the node, deletes
// its database and opens the app again, in that order; on the release
// channel the sentence alone. The update's prompt is left out (no service
// worker in a DOM of test).

import { render } from 'solid-js/web'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { App } from '../../src/App.tsx'
import type { TheStart } from '../../src/node/index.ts'
import { texts } from '../../src/texts/index.ts'
import { a_node_of_test, has_a_button, the_button, until } from './harness.tsx'

vi.mock('../../src/UpdatePrompt.tsx', () => ({ UpdatePrompt: () => undefined }))

// The release of the test, its channel chosen by each test (the build writes it, `build_info.ts`).
const the_release = vi.hoisted(() => ({
  version: '0.0.0',
  commit: '0000000000000000000000000000000000000000',
  committed_at: 'unknown',
  channel: 'dev',
  relay: 'https://relay.cumino.test',
  base: '/q-/',
}))
vi.mock('../../src/build_info.ts', () => ({ the_build: the_release }))

const the_build = (channel: 'release' | 'test'): void => {
  the_release.channel = channel
}

let closes: (() => void) | undefined
afterEach(() => {
  closes?.()
  closes = undefined
})

/** The app opened over a start of test, recording, in order, what its wiring was asked. */
const opens = (start: TheStart) => {
  const asked: string[] = []
  const given: { clears: (() => void) | undefined } = { clears: undefined }
  const root = document.createElement('div')
  document.body.append(root)
  const dispose = render(
    () => (
      <App
        starts={() => Promise.resolve(start)}
        screens={(_node, clears) => {
          given.clears = clears
          return <p>the screens</p>
        }}
        reopens={() => {
          asked.push('reopens')
        }}
        clears_the_data={() => {
          asked.push('clears_the_data')
          return Promise.resolve()
        }}
      />
    ),
    root,
  )
  closes = () => {
    dispose()
    root.remove()
  }
  return { root, asked, given }
}

const the_data = {
  why: 'the_data_of_an_older_test_release',
  message: 'a record of the node’s storage does not read',
} as const

/** A node running whose stop is recorded. */
const a_node_running = (asked: () => string[]): TheStart => ({
  start: 'running',
  node: {
    her: a_node_of_test().node,
    the_storage: 'persistent',
    stops: () => {
      asked().push('stops')
      return Promise.resolve()
    },
    stopped: new Promise(() => undefined),
  },
})

describe('the data of an older test release', () => {
  test('met at the start, on the test channel: the sentence and the gesture, which deletes the database and opens the app again', async () => {
    the_build('test')
    const app = opens({ start: 'it_does_not_start', why: the_data })
    await until(() => {
      expect(app.root.textContent).toContain(texts.start.the_data_of_an_older_test_release)
    })
    expect(app.root.querySelector('pre')?.textContent).toBe(the_data.message)
    the_button(app.root, texts.start.clear_the_data_and_start_again).click()
    await until(() => {
      expect(app.asked).toEqual(['clears_the_data', 'reopens'])
    })
  })

  test('met at the start, on the release channel: the sentence alone', async () => {
    the_build('release')
    const app = opens({ start: 'it_does_not_start', why: the_data })
    await until(() => {
      expect(app.root.textContent).toContain(texts.start.the_data_of_an_older_test_release)
    })
    expect(has_a_button(app.root, texts.start.clear_the_data_and_start_again)).toBe(false)
  })

  test('met by the screens, on the test channel: the node stopped, its database deleted, the app opened again', async () => {
    the_build('test')
    const recorded: { asked: string[] } = { asked: [] }
    const app = opens(a_node_running(() => recorded.asked))
    recorded.asked = app.asked
    await until(() => {
      expect(app.root.textContent).toContain('the screens')
    })
    const clears = app.given.clears
    if (clears === undefined) throw new Error('the screens were given no gesture')
    clears()
    await until(() => {
      expect(app.asked).toEqual(['stops', 'clears_the_data', 'reopens'])
    })
    expect(app.root.textContent).toContain(texts.start.opening)
  })

  test('on the release channel the screens are given no gesture', async () => {
    the_build('release')
    const app = opens(a_node_running(() => []))
    await until(() => {
      expect(app.root.textContent).toContain('the screens')
    })
    expect(app.given.clears).toBeUndefined()
  })
})
