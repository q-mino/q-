import { afterEach, describe, expect, test } from 'vitest'
import { the_relay_s_http_transports } from '@q-mino/adapters-web'
import * as zz from '@q-mino/domains/library'
import { a_relay_served, type ARelayServed } from './served.ts'

// The relay's HTTP client against the relay's real interface (WEB-6, WEB-7;
// MBX-8, MBX-9, PST-10, PST-11, STK-3, TST-4): the relay's configurator over
// SQLite, served on a port of this machine by each test and closed at its
// end; the client deposits and collects through the page's `fetch`, the
// network's faults injected below it. What the post and the collector are
// told, and what the relay keeps, read back through the holder's collect.

const time_zone = zz.time_zone.parse('UTC')
const the_relay = 'https://relay.q-mino.test'
const R = 'R_of_bruno'
const D = `hash-of-${R}`
const anna_s_sending = 'A'.repeat(42) + 'A'
const the_response = 'B'.repeat(42) + 'A'
const E1 = 'ZW52ZWxvcGUtMQ'
const E2 = 'ZW52ZWxvcGUtMg'

/** The relay's world: its clock at 09:02 of 21 November, the time that passes when the test says, R's hash told apart. */
const a_world = () => ({
  clock: { now: () => zz.date_time.parse('2026-11-21T09:02:00.000Z'), time_zone },
  elapsed: (): Promise<void> => new Promise<void>(() => undefined),
  hash: (secret: string): Promise<string> => Promise.resolve(`hash-of-${secret}`),
})

/** A time that never passes: the relay is never unheard (the longest wait is the client's own tests'). */
const no_time = (): Promise<void> => new Promise<void>(() => undefined)

let open: ARelayServed[] = []

/** A relay served for this test, and the client to it. */
const a_relay = async () => {
  const served = await a_relay_served(a_world(), the_relay)
  open.push(served)
  return {
    served,
    client: the_relay_s_http_transports({ fetch: served.fetch, elapsed: no_time }),
  }
}

afterEach(async () => {
  const closing = open
  open = []
  for (const each of closing) await each.closes()
})

const a_deposit = (operation: string, envelope: string) => ({
  operation,
  deposit_address: D,
  relays: [the_relay],
  envelope,
})
const bruno_s_mailbox = { deposit_address: D, collect_secret: R, relays: [the_relay] }

/** The envelopes the relay keeps at Bruno's mailbox, as the holder collects them. */
const kept_at_bruno_s = async (client: ReturnType<typeof the_relay_s_http_transports>) =>
  (await client.collect(bruno_s_mailbox)).map((each) => each.envelope)

/** Turns of the event loop, each a real timer of 2 ms, until a condition holds: at most about two seconds. */
const until = async (holds: () => boolean, what: string): Promise<void> => {
  for (let round = 0; round < 1000; round += 1) {
    if (holds()) return
    await new Promise<void>((done) => {
      setTimeout(done, 2)
    })
  }
  throw new Error(`${what}: it did not come to pass`)
}

describe("the relay's HTTP client, against the relay served (WEB-7)", () => {
  test('a deposit is kept, and its holder collects it with R; the collect let go', async () => {
    const { served, client } = await a_relay()
    expect(await client.mailbox.deposit(a_deposit(anna_s_sending, E1))).toEqual({ outcome: 'kept' })
    expect(await client.mailbox.deposit(a_deposit(the_response, E2))).toEqual({ outcome: 'kept' })
    const collected = await client.collect(bruno_s_mailbox)
    expect(collected.map((each) => each.envelope)).toEqual([E1, E2])
    expect(new Set(collected.map((each) => each.deposit_id)).size).toBe(2)
    // The collect stays open at the relay until the phone lets it go (MBX-9): the client let it go.
    await until(() => served.answers_open() === 0, "the relay's answers let go")
    // As a collect not let go stays open.
    const held = await served.fetch(`${the_relay}/holder/collect_the_envelopes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${R}` },
      body: JSON.stringify({ version: '1.0.0', input: { deposit_address: D } }),
      signal: new AbortController().signal,
    })
    const reader = held.body?.getReader()
    await reader?.read()
    expect(served.answers_open()).toBe(1)
    await reader?.cancel()
    await until(() => served.answers_open() === 0, 'the collect held, let go')
  })

  test('the same deposit again is the recorded fact; another envelope under its operation is kept already (MBX-1, PST-10)', async () => {
    const { client } = await a_relay()
    expect(await client.mailbox.deposit(a_deposit(anna_s_sending, E1))).toEqual({ outcome: 'kept' })
    expect(await client.mailbox.deposit(a_deposit(anna_s_sending, E1))).toEqual({ outcome: 'kept' })
    expect(await client.mailbox.deposit(a_deposit(anna_s_sending, E2))).toEqual({
      outcome: 'kept_already',
    })
    expect(await kept_at_bruno_s(client)).toEqual([E1])
  })

  test("the relay's refusal is told with what it said: an envelope over its limit (MBX-1)", async () => {
    const { client } = await a_relay()
    expect(await client.mailbox.deposit(a_deposit(anna_s_sending, 'A'.repeat(87_383)))).toEqual({
      outcome: 'refused',
      why: 'invalid_request',
    })
    expect(await kept_at_bruno_s(client)).toEqual([])
  })

  test('a collect with the R of another mailbox throws: the holder refused it (MBX-3, STK-3)', async () => {
    const { client } = await a_relay()
    await expect(
      client.collect({ ...bruno_s_mailbox, collect_secret: 'R_of_anna' }),
    ).rejects.toThrow(`the collect at ${D} began with refused`)
  })

  test('the request lost: `unreachable`, the relay keeps nothing; sent again, kept (TST-4)', async () => {
    const { served, client } = await a_relay()
    served.will('lost')
    expect(await client.mailbox.deposit(a_deposit(anna_s_sending, E1))).toEqual({
      outcome: 'unreachable',
    })
    expect(served.served()).toBe(0)
    expect(await kept_at_bruno_s(client)).toEqual([])
    expect(await client.mailbox.deposit(a_deposit(anna_s_sending, E2))).toEqual({ outcome: 'kept' })
    expect(await kept_at_bruno_s(client)).toEqual([E2])
  })

  test('the answer lost: `unreachable`, the envelope kept; sent again sealed anew, kept already (TST-4, PST-11)', async () => {
    const { served, client } = await a_relay()
    served.will('answer_lost')
    expect(await client.mailbox.deposit(a_deposit(anna_s_sending, E1))).toEqual({
      outcome: 'unreachable',
    })
    expect(await kept_at_bruno_s(client)).toEqual([E1])
    expect(await client.mailbox.deposit(a_deposit(anna_s_sending, E2))).toEqual({
      outcome: 'kept_already',
    })
    expect(await kept_at_bruno_s(client)).toEqual([E1])
  })

  test('the request doubled on the way: one envelope kept, the deposit `kept` (TST-4, DOM-11)', async () => {
    const { served, client } = await a_relay()
    served.will('doubled')
    expect(await client.mailbox.deposit(a_deposit(anna_s_sending, E1))).toEqual({ outcome: 'kept' })
    expect(served.served()).toBe(2)
    expect(await kept_at_bruno_s(client)).toEqual([E1])
  })

  test('an abort, before the relay or after it, is signalled: the deposit throws (TST-4, PST-10)', async () => {
    const { served, client } = await a_relay()
    served.will('aborted_before_the_relay')
    await expect(client.mailbox.deposit(a_deposit(anna_s_sending, E1))).rejects.toThrow(
      'was aborted',
    )
    expect(await kept_at_bruno_s(client)).toEqual([])
    served.will('aborted_after_the_relay')
    await expect(client.mailbox.deposit(a_deposit(anna_s_sending, E1))).rejects.toThrow(
      'was aborted',
    )
    expect(await kept_at_bruno_s(client)).toEqual([E1])
    // Started again, the executor delivers the entry again: the same operation (DOM-14, PST-11).
    expect(await client.mailbox.deposit(a_deposit(anna_s_sending, E2))).toEqual({
      outcome: 'kept_already',
    })
  })

  test('a collect lost, doubled or aborted: it throws, or reads the same deposits again (TST-4, STK-3)', async () => {
    const { served, client } = await a_relay()
    await client.mailbox.deposit(a_deposit(anna_s_sending, E1))
    served.will('lost', 'aborted_before_the_relay', 'doubled')
    await expect(client.collect(bruno_s_mailbox)).rejects.toThrow('the request lost')
    await expect(client.collect(bruno_s_mailbox)).rejects.toThrow('was aborted')
    expect(await kept_at_bruno_s(client)).toEqual([E1])
    await until(() => served.answers_open() === 0, "the relay's answers let go")
  })

  test('the relay down: the deposit `unreachable`, the collect throws', async () => {
    const { served, client } = await a_relay()
    await served.down()
    expect(await client.mailbox.deposit(a_deposit(anna_s_sending, E1))).toEqual({
      outcome: 'unreachable',
    })
    await expect(client.collect(bruno_s_mailbox)).rejects.toThrow('the request lost')
  })
})
