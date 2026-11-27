import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { libsodium_primitives } from '@q-mino/adapters-common'
import { always_room, the_relays_storage } from '@q-mino/adapters-node'
import * as zz from '@q-mino/domains/library'
import { relay } from '@q-mino/relay'
import { afterAll, describe, expect, test } from 'vitest'
import { scripted } from '../src/answerer/index.ts'
import { the_register } from '../src/register/index.ts'
import { the_stand_over_http, the_stand_s_key, type AFetch } from '../src/stand/index.ts'
import { the_assistant, the_numbers } from '../src/the_assistant/index.ts'
import { a_node_of_test } from './a_node_of_test.ts'

// The stand, from the assistant (AST-13; README story 3; INV-5): its key
// drawn once and kept, readable by its user only; its client against the
// relay's own HTTP interface (B4's, by `app.request`, on SQLite in memory),
// which checks the signature; the stand topped up to five, at most twenty
// tickets a day, over a node of test.

const folders: string[] = []
const closing: (() => void)[] = []
afterAll(() => {
  for (const close of closing.splice(0)) close()
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true })
})
const a_folder = (): string => {
  const folder = mkdtempSync(join(tmpdir(), 'cumino-stand-'))
  folders.push(folder)
  return folder
}

const app = 'https://q-mino-prova.github.io/q-/'

/** The relay of the project with the stand `assistente` and its inviter's key, at Thursday 9:00. */
const the_relay_with = async (inviter: string) => {
  const primitives = await libsodium_primitives()
  const storage = the_relays_storage(':memory:')
  closing.push(() => {
    storage.close()
  })
  let instant = zz.date_time.parse('2026-11-28T09:00:00.000Z')
  const the_relay = await relay(storage)({
    clock: { now: () => instant, time_zone: zz.time_zone.parse('UTC') },
    elapsed: () => new Promise<void>(() => undefined),
    hash: (secret) => Promise.resolve(`hash-of-${secret}`),
    room: always_room,
    stands: [{ name: 'assistente', inviter, app }],
    signature_holds: primitives.signature_holds,
  })
  const fetch: AFetch = async (url, init) =>
    the_relay.http.request(url.replace('https://relay.q-mino.test', ''), init)
  return {
    fetch,
    at: (to: string) => {
      instant = zz.date_time.parse(to)
    },
  }
}

describe('the stand', () => {
  test('the stand’s key drawn once, kept readable by its user only', async () => {
    const primitives = await libsodium_primitives()
    const file = join(a_folder(), 'data', 'stand.key')
    const first = the_stand_s_key(file, primitives)
    expect(first.drawn).toBe(true)
    expect(first.key.public_key).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(statSync(file).mode & 0o777).toBe(0o600)
    const again = the_stand_s_key(file, primitives)
    expect(again).toEqual({ key: first.key, drawn: false })
    expect(readFileSync(file, 'utf8')).not.toContain(first.key.public_key)
  })

  test('the stand topped up to five, at most twenty tickets a day', async () => {
    const primitives = await libsodium_primitives()
    const folder = a_folder()
    const { key } = the_stand_s_key(join(folder, 'stand.key'), primitives)
    const the_relay = await the_relay_with(key.public_key)
    const stand = the_stand_over_http({
      relay: 'https://relay.q-mino.test',
      stand: 'assistente',
      key,
      sign: primitives.sign,
      fetch: the_relay.fetch,
    })
    const node = a_node_of_test()
    const register = the_register(join(folder, 'register.sqlite'), '2026-11-27')
    closing.push(() => {
      register.close()
    })
    let ids = 0
    const assistant = the_assistant({
      node: node.side,
      register,
      answers: scripted(),
      the_copy: () => folder,
      notes: join(folder, 'richieste'),
      stand,
      app,
      draws_an_id: () => {
        ids += 1
        return `T${String(ids)}`
      },
      waits_until: async (holds, what) => {
        if (!(await holds())) throw new Error(`${what}: not now`)
      },
      journal: () => undefined,
      numbers: { ...the_numbers, tickets_per_day: 7 },
    })
    await assistant.first_start()
    expect(await assistant.the_stand_topped_up()).toBe(5)
    expect(await stand.counts(node.side.now())).toEqual({ counted: 'counted', takeable: 5 })
    // Its next look finds five, and leaves none.
    expect(await assistant.the_stand_topped_up()).toBe(0)
    // Two taken by passers-by (the page's POST): two more, and the day's cap reached at seven.
    for (let taken = 0; taken < 2; taken += 1)
      await the_relay.fetch('https://relay.q-mino.test/assistente', { method: 'POST' })
    expect(await stand.counts(node.side.now())).toEqual({ counted: 'counted', takeable: 3 })
    expect(await assistant.the_stand_topped_up()).toBe(2)
    await the_relay.fetch('https://relay.q-mino.test/assistente', { method: 'POST' })
    expect(await assistant.the_stand_topped_up()).toBe(0)
    expect(register.tickets_prepared_on('2026-11-28')).toBe(7)
    // The next day (Rome): topped up again.
    node.at('2026-11-28T23:30:00.000Z')
    the_relay.at('2026-11-28T23:30:00.000Z')
    expect(await assistant.the_stand_topped_up()).toBe(1)
  })

  test('a leave with another key: not found; the stand out of reach: told', async () => {
    const primitives = await libsodium_primitives()
    const folder = a_folder()
    const { key } = the_stand_s_key(join(folder, 'stand.key'), primitives)
    const another = the_stand_s_key(join(folder, 'another.key'), primitives).key
    const the_relay = await the_relay_with(another.public_key)
    const leave = {
      operation: 'assistant/leave/T1',
      ticket: 'dGlja2V0',
      takeable_until: '2026-11-29T09:00:00.000Z',
    }
    const wiring = {
      relay: 'https://relay.q-mino.test',
      stand: 'assistente',
      key,
      sign: primitives.sign,
    }
    expect(await the_stand_over_http({ ...wiring, fetch: the_relay.fetch }).leaves(leave)).toEqual({
      left: 'not_found',
    })
    const unreachable = the_stand_over_http({
      ...wiring,
      fetch: () => Promise.reject(new TypeError('fetch failed')),
    })
    expect(await unreachable.leaves(leave)).toEqual({ left: 'out_of_reach', fault: 'fetch failed' })
    expect(await unreachable.counts('2026-11-28T09:00:00.000Z')).toEqual({
      counted: 'out_of_reach',
      fault: 'fetch failed',
    })
  })
})
