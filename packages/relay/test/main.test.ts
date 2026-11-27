import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import { libsodium_primitives } from '@q-mino/adapters-common'
import { the_deposit_address_of } from '@q-mino/domains/seals/safe/_dsl.ts'
import { bundle } from '../build/bundle.ts'
import { lines_of, reading } from './harness.ts'
import { a_folder, a_relay_process, a_relay_that_ends, kill_what_runs } from './processes.ts'

// The relay's main in a process of its own (REL-1..REL-6), on a database in
// a folder of the test: a deposit and a collect over HTTP, on a socket; the
// collect that stays open and hears the next deposit; a restart that finds
// the envelopes; the stop at SIGTERM with a collect open; the disk full,
// then free again (its volume a file the test writes); `GET /`; the
// settings out of form; and the build, run by `node` alone outside the
// workspace.

// Each test has twenty seconds: it starts a process of its own (`node` on
// the main's TypeScript), which takes seconds on a machine the whole suite
// loads (CI, 28 Nov 2026: two tests over vitest's default five, with the
// node's database on SQLite run beside them).
vi.setConfig({ testTimeout: 20_000 })

const the_main = join(import.meta.dirname, '..', 'src', 'main.ts')
const on_a_disk_of_a_file = join(import.meta.dirname, 'fixtures', 'a_relay_on_a_disk_of_a_file.ts')

/** Bruno's collect secret R, 32 bytes in base64url, and its D, hashed as the relay hashes it (SEA-4). */
const R_b = 'YnJ1bm8tY29sbGVjdC1zZWNyZXQtb2YtMzItYnl0ZXM'
let D_b = ''
beforeAll(async () => {
  D_b = the_deposit_address_of(await libsodium_primitives())(R_b)
})

const E1 = 'c2VhbGVkLWZvci1icnVuby0x'
const E2 = 'c2VhbGVkLWZvci1icnVuby0y'

const posted = (body: unknown, headers: Readonly<Record<string, string>> = {}): RequestInit => ({
  method: 'POST',
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json', ...headers },
})
const deposits = (origin: string, operation: string, envelope = E1) =>
  fetch(
    `${origin}/depositor/deposit_an_envelope`,
    posted({ version: '1.0.0', operation, input: { deposit_address: D_b, envelope } }),
  )
const collects = (origin: string) =>
  fetch(
    `${origin}/holder/collect_the_envelopes`,
    posted(
      { version: '1.0.0', input: { deposit_address: D_b } },
      { Authorization: `Bearer ${R_b}` },
    ),
  )

const the_envelopes = (snapshot: unknown): readonly unknown[] => {
  if (typeof snapshot !== 'object' || snapshot === null || !('entries' in snapshot)) {
    throw new Error('no snapshot')
  }
  const entries = snapshot.entries
  if (!Array.isArray(entries)) throw new Error('a snapshot with no entries')
  return entries.map((entry: unknown) =>
    typeof entry === 'object' && entry !== null && 'envelope' in entry ? entry.envelope : entry,
  )
}

const folders: { readonly removed: () => void }[] = []
const a_test_folder = () => {
  const folder = a_folder()
  folders.push(folder)
  return folder.path
}
afterEach(() => {
  kill_what_runs()
  for (const folder of folders.splice(0)) folder.removed()
})

describe("the relay's main, in a process of its own (REL-1)", () => {
  test('a deposit and a collect on a socket; a collect left open hears the next deposit', async () => {
    const folder = a_test_folder()
    const relay = await a_relay_process(the_main, {
      CUMINO_RELAY_DATABASE: join(folder, 'relay.sqlite'),
    })
    const deposited = await deposits(relay.origin, 'anna-deposit-1')
    expect(deposited.status).toBe(200)
    expect(await lines_of(deposited)).toMatchObject([{ event: 'the_envelope_is_kept' }])
    const bruno = reading(await collects(relay.origin))
    expect(the_envelopes(await bruno.next())).toEqual([E1])
    expect(await bruno.next()).toMatchObject({ event: 'caught_up' })
    const next = bruno.next()
    await lines_of(await deposits(relay.origin, 'anna-deposit-2', E2))
    expect(await next).toMatchObject({ event: 'fact', entry: { envelope: E2 } })
    await bruno.let_go()
    expect(await relay.stopped()).toBe(0)
    expect(relay.faults()).toBe('')
  })

  test('a relay started again finds the envelopes it kept', async () => {
    const database = join(a_test_folder(), 'relay.sqlite')
    const first = await a_relay_process(the_main, { CUMINO_RELAY_DATABASE: database })
    await lines_of(await deposits(first.origin, 'anna-deposit-1'))
    expect(await first.stopped()).toBe(0)
    const again = await a_relay_process(the_main, { CUMINO_RELAY_DATABASE: database })
    const bruno = reading(await collects(again.origin))
    expect(the_envelopes(await bruno.next())).toEqual([E1])
    await bruno.let_go()
    await lines_of(await deposits(again.origin, 'anna-deposit-1'))
    const read_again = reading(await collects(again.origin))
    expect(the_envelopes(await read_again.next())).toEqual([E1])
    await read_again.let_go()
    expect(await again.stopped()).toBe(0)
  })

  test('at SIGTERM it lets an open collect go, closes its database and exits with 0', async () => {
    const database = join(a_test_folder(), 'relay.sqlite')
    const relay = await a_relay_process(the_main, { CUMINO_RELAY_DATABASE: database })
    await lines_of(await deposits(relay.origin, 'anna-deposit-1'))
    const bruno = reading(await collects(relay.origin))
    await bruno.next()
    await bruno.next()
    const let_go = expect(bruno.next()).rejects.toThrow()
    expect(await relay.stopped('SIGTERM')).toBe(0)
    await let_go
    expect(relay.lines()).toEqual([
      expect.stringMatching(/^the relay \S+ \(\w+\) listens on http:\/\/127\.0\.0\.1:\d+$/),
      'the relay stopped',
    ])
    expect(relay.faults()).toBe('')
    await expect(fetch(relay.origin)).rejects.toThrow()
    // The database closed cleanly: a relay started on it takes it as it is.
    const again = await a_relay_process(the_main, { CUMINO_RELAY_DATABASE: database })
    expect(await again.stopped('SIGINT')).toBe(0)
  })

  test("GET / tells the relay's version, its commit and the source of that commit, nothing else (REL-4)", async () => {
    const relay = await a_relay_process(the_main, {
      CUMINO_RELAY_DATABASE: join(a_test_folder(), 'relay.sqlite'),
    })
    const about = await fetch(relay.origin)
    expect(about.status).toBe(200)
    expect(await about.json()).toEqual({
      version: '0.0.0',
      commit: '0000000000000000000000000000000000000000',
      source: 'https://github.com/q-mino/q-/tree/0000000000000000000000000000000000000000',
    })
    expect(await relay.stopped()).toBe(0)
  })

  test('a stand with no inviter yet (INV-6, INV-7): its page says the assistant is not there yet', async () => {
    const relay = await a_relay_process(the_main, {
      CUMINO_RELAY_DATABASE: join(a_test_folder(), 'relay.sqlite'),
      CUMINO_RELAY_STANDS: JSON.stringify([
        { name: 'assistente', app: 'https://q-mino-prova.github.io/q-/' },
      ]),
    })
    const page = await fetch(`${relay.origin}/assistente`)
    expect(page.status).toBe(200)
    expect(page.headers.get('content-type')).toMatch(/^text\/html/)
    const text = await page.text()
    expect(text).toMatch(/^<!doctype html><html lang="it">/)
    expect(text).toContain('non è ancora arrivato')
    expect(text).not.toContain('<form')
    expect((await fetch(`${relay.origin}/altro`)).status).toBe(404)
    expect(await relay.stopped()).toBe(0)
  })

  test('settings out of form: it does not start, says why, and exits with 78', async () => {
    const a_port = await a_relay_that_ends(the_main, {
      CUMINO_RELAY_PORT: 'eighty',
      CUMINO_RELAY_DATABASE: join(a_test_folder(), 'relay.sqlite'),
    })
    expect(a_port.exit).toBe(78)
    expect(a_port.faults).toMatch(/the relay's settings: CUMINO_RELAY_PORT: a whole number/)
    const no_database = await a_relay_that_ends(the_main, {})
    expect(no_database.exit).toBe(78)
    expect(no_database.faults).toMatch(
      /the relay's settings: CUMINO_RELAY_DATABASE: no database, and no STATE_DIRECTORY/,
    )
    const a_stand = await a_relay_that_ends(the_main, {
      CUMINO_RELAY_DATABASE: join(a_test_folder(), 'relay.sqlite'),
      CUMINO_RELAY_STANDS: '[{"name":"assistente"}]',
    })
    expect(a_stand.exit).toBe(78)
    expect(a_stand.faults).toMatch(/the relay's settings: CUMINO_RELAY_STANDS/)
  })
})

describe('the disk (REL-3)', () => {
  test('below the free space it keeps, a deposit is refused with 507; a collect still answers; freed, it takes deposits again', async () => {
    const folder = a_test_folder()
    const the_disk = join(folder, 'disk.json')
    const volume = (bavail: number) => {
      writeFileSync(the_disk, JSON.stringify({ bsize: 4096, blocks: 1_000_000, bavail }))
    }
    volume(500_000)
    const relay = await a_relay_process(on_a_disk_of_a_file, {
      CUMINO_RELAY_DATABASE: join(folder, 'relay.sqlite'),
      CUMINO_RELAY_KEEP_FREE_BYTES: '0',
      CUMINO_RELAY_KEEP_FREE_PERCENT: '10',
      Q_TEST_THE_DISK: the_disk,
    })
    await lines_of(await deposits(relay.origin, 'anna-deposit-1'))
    volume(99_999)
    const refused = await deposits(relay.origin, 'anna-deposit-2', E2)
    expect(refused.status).toBe(507)
    expect(await refused.json()).toEqual({ fault: 'the_relay_is_full' })
    const bruno = reading(await collects(relay.origin))
    expect(the_envelopes(await bruno.next())).toEqual([E1])
    await bruno.let_go()
    volume(100_000)
    const taken = await deposits(relay.origin, 'anna-deposit-2', E2)
    expect(taken.status).toBe(200)
    expect(await lines_of(taken)).toMatchObject([{ event: 'the_envelope_is_kept' }])
    expect(await relay.stopped()).toBe(0)
    expect(relay.faults()).toBe('')
  })
})

describe('the build (REL-5)', () => {
  test('one module that node runs alone, outside the workspace, with its version and commit', async () => {
    const folder = a_test_folder()
    const values = {
      version: 'v0.1.0-test',
      commit: '1234567890abcdef1234567890abcdef12345678',
      repository: 'https://github.com/q-mino/q-',
    }
    await bundle(folder, values)
    const relay = await a_relay_process(join(folder, 'relay.mjs'), {
      CUMINO_RELAY_DATABASE: join(folder, 'relay.sqlite'),
    })
    expect(await (await fetch(relay.origin)).json()).toEqual({
      version: values.version,
      commit: values.commit,
      source: `https://github.com/q-mino/q-/tree/${values.commit}`,
    })
    await lines_of(await deposits(relay.origin, 'anna-deposit-1'))
    const bruno = reading(await collects(relay.origin))
    expect(the_envelopes(await bruno.next())).toEqual([E1])
    await bruno.let_go()
    expect(await relay.stopped()).toBe(0)
    expect(relay.lines()[0]).toBe(
      `the relay ${values.version} (${values.commit}) listens on ${relay.origin}`,
    )
    expect(relay.faults()).toBe('')
  })
})
