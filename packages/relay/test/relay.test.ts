import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'
import * as zz from '@q-mino/domains/library'
import { a_relay, lines_of, over_http, quiet, reading } from './harness.ts'

// The relay as its configurator wires it (CFG-3, MBX-8, MBX-9): its HTTP
// interface through the desk, its storage on SQLite kept across a restart,
// what it forgets, and that it writes nothing about who came. The relay's
// stories run on the same wiring as its conformance suite
// (`packages/memory/test/relay/on_sqlite.test.ts`).

const R_b = 'bruno-collect-secret'
const D_b = 'hash-of-bruno-collect-secret'
const E1 = 'c2VhbGVkLWZvci1icnVuby0x'
const E2 = 'c2VhbGVkLWZvci1icnVuby0y'

const a_deposit = (operation: string, envelope = E1, deposit_address = D_b) => ({
  version: '1.0.0',
  operation,
  input: { deposit_address, envelope },
})
const a_collect = (from?: string) => ({
  version: '1.0.0',
  input: { deposit_address: D_b },
  ...(from === undefined ? {} : { from }),
})
const kept_at = (instant: string) => ({
  event: 'the_envelope_is_kept',
  payload: { deposited_at: instant },
})

describe('the HTTP interface, through the desk (MBX-9)', () => {
  test('a deposit is kept, and its holder collects it, live, until the phone lets it go', async () => {
    const relay = await a_relay(':memory:', '2026-11-16T09:02:00.000Z')
    const http = over_http(relay.http)
    const deposited = await http.deposits(a_deposit('anna-deposit-1'))
    expect(deposited.status).toBe(200)
    expect(deposited.headers.get('content-type')).toBe('application/x-ndjson')
    expect(await lines_of(deposited)).toEqual([kept_at('2026-11-16T09:02:00.000Z')])
    const bruno = reading(await http.collects(a_collect(), R_b))
    expect(await bruno.next()).toMatchObject({
      event: 'snapshot',
      entries: [{ deposited_at: '2026-11-16T09:02:00.000Z', envelope: E1 }],
      total: 1,
    })
    expect(await bruno.next()).toMatchObject({ event: 'caught_up' })
    relay.at('2026-11-16T09:20:00.000Z')
    const next = bruno.next()
    await lines_of(await http.deposits(a_deposit('anna-deposit-2', E2)))
    expect(await next).toMatchObject({
      event: 'fact',
      entry: { deposited_at: '2026-11-16T09:20:00.000Z', envelope: E2 },
    })
    await bruno.let_go()
    relay.storage.close()
  })

  test('a deposit sent again, at once or later, is the same deposit', async () => {
    const relay = await a_relay(':memory:', '2026-11-16T09:02:00.000Z')
    const http = over_http(relay.http)
    const [first, again] = await Promise.all([
      http.deposits(a_deposit('anna-deposit-1')),
      http.deposits(a_deposit('anna-deposit-1')),
    ])
    relay.at('2026-11-16T09:07:00.000Z')
    const later = await http.deposits(a_deposit('anna-deposit-1'))
    for (const response of [first, again, later]) {
      expect(await lines_of(response)).toEqual([kept_at('2026-11-16T09:02:00.000Z')])
    }
    const snapshot = await reading(await http.collects(a_collect(), R_b)).next()
    expect(snapshot).toMatchObject({ event: 'snapshot', total: 1 })
    relay.storage.close()
  })

  test('only the collect secret of a mailbox collects it', async () => {
    const relay = await a_relay()
    const http = over_http(relay.http)
    await lines_of(await http.deposits(a_deposit('anna-deposit-1')))
    expect(await lines_of(await http.collects(a_collect()))).toEqual([{ event: 'not_found' }])
    expect(await lines_of(await http.collects(a_collect(), 'carla-collect-secret'))).toEqual([
      { event: 'refused', reasons: ['the_collect_secret_is_the_mailboxs'] },
    ])
    relay.storage.close()
  })

  test("the tree's answers cross as they are: an input not in its schema, a version not spoken", async () => {
    const relay = await a_relay()
    const http = over_http(relay.http)
    expect(
      await lines_of(await http.deposits(a_deposit('anna-deposit-1', 'not base64url+'))),
    ).toEqual([{ event: 'invalid_request', reason: 'input_not_in_schema' }])
    expect(
      await lines_of(await http.deposits({ ...a_deposit('anna-deposit-2'), version: '9.0.0' })),
    ).toMatchObject([{ event: 'version_not_supported' }])
    relay.storage.close()
  })

  test('a request the interface cannot read reaches no tree', async () => {
    const relay = await a_relay()
    const http = over_http(relay.http)
    const faults = [
      await http.deposits('not json'),
      await http.deposits({ input: { deposit_address: D_b, envelope: E1 } }),
      await http.deposits({ ...a_deposit('anna-deposit-1'), sent_by: 'anna' }),
      await http.collects({ input: { deposit_address: D_b } }, R_b),
      await http.deposits(a_deposit('anna-deposit-2'), { Authorization: 'Basic YW5uYQ==' }),
    ]
    expect(faults.map((response) => response.status)).toEqual([400, 400, 400, 400, 400])
    expect(await Promise.all(faults.map((response) => response.json()))).toEqual([
      { fault: 'body' },
      { fault: 'body' },
      { fault: 'body' },
      { fault: 'body' },
      { fault: 'authorization' },
    ])
    expect((await relay.http.request('/depositor', { method: 'POST' })).status).toBe(404)
    expect(await reading(await http.collects(a_collect(), R_b)).next()).toMatchObject({
      event: 'snapshot',
      total: 0,
    })
    relay.storage.close()
  })

  test("the browser's preflight is answered, and a POST carries its origin: CORS open to every origin, no gate", async () => {
    const relay = await a_relay()
    const preflight = await relay.http.request('/holder/collect_the_envelopes', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://q-mino.github.io',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type',
      },
    })
    expect(preflight.status).toBe(204)
    expect(Object.fromEntries(preflight.headers)).toMatchObject({
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST',
      'access-control-allow-headers': 'Authorization,Content-Type',
      'access-control-max-age': '86400',
    })
    expect(preflight.headers.has('access-control-allow-credentials')).toBe(false)
    const http = over_http(relay.http)
    const deposited = await http.deposits(a_deposit('anna-deposit-1'), {
      Origin: 'https://another.example',
    })
    expect(deposited.status).toBe(200)
    expect(deposited.headers.get('access-control-allow-origin')).toBe('*')
    await lines_of(deposited)
    relay.storage.close()
  })

  test('a collect from a position is read again (MBX-8)', async () => {
    const relay = await a_relay()
    const http = over_http(relay.http)
    await lines_of(await http.deposits(a_deposit('anna-deposit-1')))
    const snapshot = await reading(await http.collects(a_collect(), R_b)).next()
    if (typeof snapshot !== 'object' || snapshot === null || !('position' in snapshot)) {
      throw new Error('no snapshot')
    }
    const from = snapshot.position
    if (typeof from !== 'string') throw new Error('a position is a text')
    expect(await lines_of(await http.collects(a_collect(from), R_b))).toEqual([
      { event: 'position_unavailable' },
    ])
    relay.storage.close()
  })
})

describe('the room on the disk (REL-3) and what the relay says of itself (REL-4)', () => {
  test('a disk with too little room refuses a deposit before any tree hears it; a collect still answers', async () => {
    const relay = await a_relay()
    const http = over_http(relay.http)
    await lines_of(await http.deposits(a_deposit('anna-deposit-1')))
    relay.disk('too_little')
    const refused = await http.deposits(a_deposit('anna-deposit-2', E2))
    expect(refused.status).toBe(507)
    expect(refused.headers.get('access-control-allow-origin')).toBe('*')
    expect(await refused.json()).toEqual({ fault: 'the_relay_is_full' })
    expect(await http.deposits('not json')).toHaveProperty('status', 507)
    expect(await reading(await http.collects(a_collect(), R_b)).next()).toMatchObject({
      event: 'snapshot',
      total: 1,
    })
    relay.disk('enough')
    expect(await lines_of(await http.deposits(a_deposit('anna-deposit-2', E2)))).toEqual([
      kept_at('2026-11-16T00:00:00.000Z'),
    ])
    relay.storage.close()
  })

  test("GET / says the relay's version, its commit and the source of that commit", async () => {
    const relay = await a_relay()
    const about = await relay.http.request('/')
    expect(about.status).toBe(200)
    expect(await about.json()).toEqual({
      version: '0.0.0',
      commit: '0000000000000000000000000000000000000000',
      source: 'https://github.com/q-mino/q-/tree/0000000000000000000000000000000000000000',
    })
    expect((await relay.http.request('/', { method: 'POST' })).status).toBe(404)
    relay.storage.close()
  })
})

describe("the relay's storage (MBX-8)", () => {
  const folders: string[] = []
  afterEach(() => {
    for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true })
  })

  test('what it keeps is kept across a restart', async () => {
    const folder = mkdtempSync(join(tmpdir(), 'q-relay-'))
    folders.push(folder)
    const file = join(folder, 'relay.sqlite')
    const before = await a_relay(file, '2026-11-16T09:02:00.000Z')
    await lines_of(await over_http(before.http).deposits(a_deposit('anna-deposit-1')))
    before.storage.close()
    const after = await a_relay(file, '2026-11-16T10:00:00.000Z')
    const http = over_http(after.http)
    expect(await lines_of(await http.deposits(a_deposit('anna-deposit-1')))).toEqual([
      kept_at('2026-11-16T09:02:00.000Z'),
    ])
    expect(await reading(await http.collects(a_collect(), R_b)).next()).toMatchObject({
      event: 'snapshot',
      entries: [{ envelope: E1 }],
    })
    after.storage.close()
  })

  test('it forgets a deposit a day after its discard: its retry is a new deposit', async () => {
    const relay = await a_relay(':memory:', '2026-11-16T09:00:00.000Z')
    const http = over_http(relay.http)
    await lines_of(await http.deposits(a_deposit('anna-deposit-1')))
    relay.at('2026-11-17T09:00:00.000Z')
    await lines_of(await http.deposits(a_deposit('anna-deposit-2', E2)))
    const executor = relay.waits()
    // Monday, a week on: E1 is discarded, still remembered; its retry is the deposit.
    await relay.pass('2026-11-23T09:00:00.000Z')
    expect(await lines_of(await http.deposits(a_deposit('anna-deposit-1')))).toEqual([
      kept_at('2026-11-16T09:00:00.000Z'),
    ])
    // Tuesday: E2 is discarded, a day after E1, which the relay forgets: its
    // facts and its row. The log keeps no position before E2's deposit.
    await relay.pass('2026-11-24T09:00:00.000Z')
    const log = relay.log(undefined)[Symbol.asyncIterator]()
    expect((await log.next()).value).toEqual({ event: 'position_unavailable' })
    expect(await lines_of(await http.deposits(a_deposit('anna-deposit-2', E2)))).toEqual([
      kept_at('2026-11-17T09:00:00.000Z'),
    ])
    relay.at('2026-11-24T10:00:00.000Z')
    expect(await lines_of(await http.deposits(a_deposit('anna-deposit-1')))).toEqual([
      kept_at('2026-11-24T10:00:00.000Z'),
    ])
    expect(await reading(await http.collects(a_collect(), R_b)).next()).toMatchObject({
      event: 'snapshot',
      entries: [{ envelope: E1, deposited_at: '2026-11-24T10:00:00.000Z' }],
    })
    await executor.stop()
    relay.storage.close()
  })
})

describe('a relay with nothing more to keep (MBX-8)', () => {
  test('it forgets all the same when its configurator asks', async () => {
    const relay = await a_relay(':memory:', '2026-11-16T09:00:00.000Z')
    const http = over_http(relay.http)
    await lines_of(await http.deposits(a_deposit('anna-deposit-1')))
    const executor = relay.waits()
    await relay.pass('2026-11-23T09:00:00.000Z')
    relay.storage.forget_what_is_past(zz.date_time.parse('2026-11-24T08:59:00.000Z'))
    expect(await lines_of(await http.deposits(a_deposit('anna-deposit-1')))).toEqual([
      kept_at('2026-11-16T09:00:00.000Z'),
    ])
    relay.storage.forget_what_is_past(zz.date_time.parse('2026-11-24T09:00:00.000Z'))
    const log = relay.log(undefined)[Symbol.asyncIterator]()
    expect((await log.next()).value).toEqual({ event: 'position_unavailable' })
    relay.at('2026-11-24T09:30:00.000Z')
    expect(await lines_of(await http.deposits(a_deposit('anna-deposit-1')))).toEqual([
      kept_at('2026-11-24T09:30:00.000Z'),
    ])
    await executor.stop()
    relay.storage.close()
  })
})

describe('no access logs (CFG-3)', () => {
  test('the relay writes nothing about the requests it serves', async () => {
    const written = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) =>
      vi.spyOn(console, level),
    )
    const relay = await a_relay()
    const http = over_http(relay.http)
    await lines_of(await http.deposits(a_deposit('anna-deposit-1')))
    await lines_of(await http.collects(a_collect()))
    await lines_of(await http.collects(a_collect(), 'carla-collect-secret'))
    await http.deposits('not json')
    await quiet()
    for (const spy of written) expect(spy).not.toHaveBeenCalled()
    for (const spy of written) spy.mockRestore()
    relay.storage.close()
  })
})
