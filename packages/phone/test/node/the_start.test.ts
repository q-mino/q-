import {
  the_device_s_clock,
  the_device_s_zone,
  the_time_that_passes,
  type ARealmsDocument,
} from '@q-mino/adapters-web'
import ping_pong_manifest from '@q-mino/ping_pong/manifest.json' with { type: 'json' }
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, describe, expect, test } from 'vitest'
import { the_start, type TheBrowser, type TheStart } from '../../src/node/index.ts'

// The PWA's start (PWA-2) in Node: the browser's IndexedDB is fake-indexeddb's
// (a new factory per test: a fresh browser), its locks Node's Web Locks, its
// page a document with no window, by the parts a realm's frame uses (no realm
// runs in Node: WEB-21), its network refusing every request (no relay before
// step 24): the node composes, runs and stops; a second tab composes nothing until
// it takes the node; a composition fault stops the start with every fault.
// The realms run in a browser only (the preview, PWA-6): ping pong stays off.

/** A page's document where no realm is placed (ping pong stays off in Node): a frame made or held there is a fault of the test. */
const a_document_with_no_realm: ARealmsDocument = {
  defaultView: null,
  createElement: () => {
    throw new Error('no realm is placed in Node')
  },
  body: {
    append: () => {
      throw new Error('no realm is placed in Node')
    },
  },
}

const a_browser = (indexed_db = new IDBFactory()): TheBrowser => ({
  indexed_db,
  key_range: IDBKeyRange,
  locks: navigator.locks,
  storage: undefined,
  fetch: () => Promise.reject(new TypeError('no network in the test')),
  crypto,
  document: a_document_with_no_realm,
})

const a_configuration = (extensions: readonly unknown[]) => ({
  name: `cumino ${crypto.randomUUID()}`,
  relay: 'https://relay.cumino.test',
  page: 'https://cumino.test/q-/',
  extensions: extensions.map((manifest) => ({ manifest, script: '' })),
  characters: 1_000_000,
})

const time = { clock: the_device_s_clock(the_device_s_zone()), elapsed: the_time_that_passes }

/** The nodes a test started, stopped at its end: no consumer outlives it. */
const started: TheStart[] = []

afterEach(async () => {
  for (const start of started.splice(0)) if (start.start === 'running') await start.node.stops()
})

const starts = async (
  browser: TheBrowser,
  configuration: ReturnType<typeof a_configuration>,
  how: 'if_no_tab_is' | 'use_here' = 'if_no_tab_is',
): Promise<TheStart> => {
  const start = await the_start(browser, configuration, time)(how)
  started.push(start)
  return start
}

describe('the start of the PWA', () => {
  test('a node composes over the browser’s storage, with ping pong preinstalled and off, and runs', async () => {
    const start = await starts(a_browser(), a_configuration([ping_pong_manifest]))
    expect(start.start).toBe('running')
    if (start.start !== 'running') return
    expect(await start.node.her.her_faces()).toEqual([])
    const [ping_pong] = await start.node.her.the_extensions()
    expect(ping_pong).toMatchObject({ extension: 'ping_pong', is: 'not_active' })
    expect(start.node.the_storage).toBe('not_told')
  })

  test('a second tab composes nothing until it takes the node; the first then stops, used elsewhere', async () => {
    const browser = a_browser()
    const configuration = a_configuration([ping_pong_manifest])
    const first = await starts(browser, configuration)
    expect(first.start).toBe('running')
    expect((await starts(browser, configuration)).start).toBe('another_tab')
    const second = await starts(browser, configuration, 'use_here')
    expect(second.start).toBe('running')
    if (first.start !== 'running') return
    expect(await first.node.stopped).toBe('used_elsewhere')
  })

  test('an extension whose manifest is wrong is refused at composition: the node does not start, and says why for every extension', async () => {
    const browser = a_browser()
    const configuration = a_configuration([
      { ...ping_pong_manifest, boundary_version: '2.0.0' },
      { ...ping_pong_manifest, name: 'pong_ping', touches: ['the_port_of_requests', 'its_camera'] },
    ])
    const start = await starts(browser, configuration)
    expect(start).toMatchObject({ start: 'it_does_not_start' })
    if (start.start !== 'it_does_not_start') return
    // Each fault by its extension and its case, told in her words (PWA-5); the message, whole, under "Perché".
    expect(start.why).toMatchObject({
      why: 'an_extension_does_not_compose',
      faults: [
        { extension: 'ping_pong', fault: 'a_boundary_major_not_spoken' },
        { extension: 'pong_ping', fault: 'the_manifest_does_not_parse' },
      ],
    })
    const lines = start.why.message.split('\n')
    expect(lines.some((line) => line.startsWith('ping_pong:') && line.includes('2'))).toBe(true)
    expect(lines.some((line) => line.startsWith('pong_ping:'))).toBe(true)
    // The writer let go: the release that composes starts on the same node.
    expect(
      (
        await starts(browser, {
          ...configuration,
          extensions: [{ manifest: ping_pong_manifest, script: '' }],
        })
      ).start,
    ).toBe('running')
  })
})
