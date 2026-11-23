import { describe, expect, test } from 'vitest'
import {
  the_longest_wait_for_the_relay,
  the_relay_s_http_transports,
  type AFetch,
  type AnAnswer,
  type ARequest,
} from '../../src/index.ts'

// The relay's HTTP client (WEB-6), over a `fetch` the test plays: what it
// asks the relay (MBX-9), and how it tells each answer in the words of the
// port it serves (PST-10, STK-3), the transport's faults injected (TST-4):
// the request lost, the answer lost, an abort, the relay unheard. Against
// the relay's real interface it is proved in `memory` (WEB-7).

const relay = 'https://relay.cumino.example'
const D = 'D-of-bruno'
const R = 'R-of-bruno'
const operation = 'A'.repeat(42) + 'A'
const envelope = 'ZW52ZWxvcGU'

const a_deposit = (relays: readonly string[] = [relay]) => ({
  operation,
  deposit_address: D,
  relays: [...relays],
  envelope,
})
const a_mailbox = { deposit_address: D, collect_secret: R, relays: [relay] }

/** A body of these chunks of text, then its end, or the fault it breaks with. */
const a_body = (chunks: readonly string[], then: 'ends' | 'stays_open' | Error = 'ends') => {
  const encoder = new TextEncoder()
  let let_go = false
  let at = 0
  const body = new ReadableStream<Uint8Array>({
    pull: (controller) => {
      const chunk = chunks[at]
      at += 1
      if (chunk !== undefined) controller.enqueue(encoder.encode(chunk))
      else if (then === 'ends') controller.close()
      else if (then !== 'stays_open') controller.error(then)
      else return new Promise<void>(() => undefined)
      return undefined
    },
    cancel: () => {
      let_go = true
    },
  })
  return { body, was_let_go: () => let_go }
}

/** Lines of JSON, as the relay's interface writes them. */
const ndjson = (...events: readonly unknown[]): string =>
  events.map((event) => `${JSON.stringify(event)}\n`).join('')

/** A `fetch` the test plays, which keeps what it was asked. */
const a_fetch = (answer: (request: ARequest) => Promise<AnAnswer>) => {
  const asked: { address: string; request: ARequest }[] = []
  const fetch: AFetch = (address, request) => {
    asked.push({ address, request })
    return answer(request)
  }
  return { fetch, asked }
}

/** An answer of the relay: 200, these lines. */
const answering = (status: number, ...chunks: readonly string[]) =>
  a_fetch(() => Promise.resolve({ status, body: a_body(chunks).body }))

/** The time that passes as the test says: each wait over when it lets it. */
const a_time_that_passes = () => {
  const waits: { milliseconds: number; over: () => void }[] = []
  return {
    elapsed: (milliseconds: number): Promise<void> =>
      new Promise<void>((over) => {
        waits.push({ milliseconds, over })
      }),
    every_wait_over: (): readonly number[] =>
      waits.splice(0).map((each) => (each.over(), each.milliseconds)),
  }
}

/** A time that never passes: the relay is never unheard. */
const no_time = (): Promise<void> => new Promise<void>(() => undefined)

/** Turns of the event loop, each a real timer. */
const turns = async (count: number): Promise<void> => {
  for (let turn = 0; turn < count; turn += 1)
    await new Promise<void>((done) => {
      setTimeout(done, 0)
    })
}

const the_body_of = (request: ARequest): unknown => JSON.parse(request.body)

describe("the relay's HTTP client: the post's mailbox port (WEB-6, PST-10)", () => {
  test('a deposit is posted to the depositor, showing nothing; the envelope kept is `kept`', async () => {
    const { fetch, asked } = answering(
      200,
      ndjson({
        event: 'the_envelope_is_kept',
        payload: { deposited_at: '2026-11-21T09:02:00.000Z' },
      }),
    )
    const { mailbox } = the_relay_s_http_transports({ fetch, elapsed: no_time })
    expect(await mailbox.deposit(a_deposit())).toEqual({ outcome: 'kept' })
    expect(asked).toHaveLength(1)
    expect(asked[0]?.address).toBe(`${relay}/depositor/deposit_an_envelope`)
    expect(asked[0]?.request.method).toBe('POST')
    expect(asked[0]?.request.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(the_body_of(asked[0]?.request ?? fail())).toEqual({
      version: '1.0.0',
      operation,
      input: { deposit_address: D, envelope },
    })
  })

  test("a relay's address keeps its path, its last slash or not", async () => {
    for (const [at, address] of [
      [
        'https://q.example.org:8443/relay/',
        'https://q.example.org:8443/relay/depositor/deposit_an_envelope',
      ],
      [
        'https://q.example.org:8443/relay',
        'https://q.example.org:8443/relay/depositor/deposit_an_envelope',
      ],
    ] as const) {
      const { fetch, asked } = answering(
        200,
        ndjson({ event: 'the_envelope_is_kept', payload: {} }),
      )
      await the_relay_s_http_transports({ fetch, elapsed: no_time }).mailbox.deposit(
        a_deposit([at]),
      )
      expect(asked[0]?.address).toBe(address)
    }
  })

  test("the relay's answer in the post's words: kept already, refused with what it said, nothing said", async () => {
    const told = async (...chunks: readonly string[]) =>
      the_relay_s_http_transports({
        fetch: answering(200, ...chunks).fetch,
        elapsed: no_time,
      }).mailbox.deposit(a_deposit())
    expect(await told(ndjson({ event: 'identity_already_used' }))).toEqual({
      outcome: 'kept_already',
    })
    expect(await told(ndjson({ event: 'invalid_request', reason: 'input_not_in_schema' }))).toEqual(
      {
        outcome: 'refused',
        why: 'invalid_request',
      },
    )
    expect(await told(ndjson({ event: 'version_not_supported' }))).toEqual({
      outcome: 'refused',
      why: 'version_not_supported',
    })
    expect(await told()).toEqual({ outcome: 'refused', why: 'no_event' })
    expect(await told('<html>a page</html>\n')).toEqual({
      outcome: 'refused',
      why: 'an answer out of form',
    })
  })

  test('lines come in any chunks: split, joined, a character across two, the last with no newline', async () => {
    const line = JSON.stringify({ event: 'the_envelope_is_kept', payload: { note: 'Zoë 🐕' } })
    const bytes = new TextEncoder().encode(line)
    const split = bytes.indexOf(0xf0) + 2
    const fetch: AFetch = () =>
      Promise.resolve({
        status: 200,
        body: new ReadableStream<Uint8Array>({
          start: (controller) => {
            controller.enqueue(bytes.slice(0, 5))
            controller.enqueue(bytes.slice(5, split))
            controller.enqueue(bytes.slice(split))
            controller.close()
          },
        }),
      })
    expect(
      await the_relay_s_http_transports({ fetch, elapsed: no_time }).mailbox.deposit(a_deposit()),
    ).toEqual({
      outcome: 'kept',
    })
    const two_in_one = ndjson({ event: 'something_before' }, { event: 'identity_already_used' })
    expect(
      await the_relay_s_http_transports({
        fetch: answering(200, two_in_one).fetch,
        elapsed: no_time,
      }).mailbox.deposit(a_deposit()),
    ).toEqual({ outcome: 'kept_already' })
  })

  test('a status other than 200: no answer when it says to try again, else refused', async () => {
    const told = async (status: number) =>
      the_relay_s_http_transports({
        fetch: answering(status, JSON.stringify({ fault: 'body' })).fetch,
        elapsed: no_time,
      }).mailbox.deposit(a_deposit())
    expect(await told(400)).toEqual({ outcome: 'refused', why: 'status 400' })
    expect(await told(404)).toEqual({ outcome: 'refused', why: 'status 404' })
    for (const status of [408, 429, 500, 502, 503, 504])
      expect(await told(status)).toEqual({ outcome: 'unreachable' })
  })

  test('the request lost, or its answer lost on the way: no answer, `unreachable` (TST-4)', async () => {
    const lost = a_fetch(() => Promise.reject(new TypeError('fetch failed')))
    expect(
      await the_relay_s_http_transports({ fetch: lost.fetch, elapsed: no_time }).mailbox.deposit(
        a_deposit(),
      ),
    ).toEqual({ outcome: 'unreachable' })
    const answer_lost = a_fetch(() =>
      Promise.resolve({
        status: 200,
        body: a_body(['{"event":"the_env'], new TypeError('terminated')).body,
      }),
    )
    expect(
      await the_relay_s_http_transports({
        fetch: answer_lost.fetch,
        elapsed: no_time,
      }).mailbox.deposit(a_deposit()),
    ).toEqual({ outcome: 'unreachable' })
  })

  test('the relay as last met: answered, or not, each change told, an abort none (UI-5)', async () => {
    let answers: () => Promise<AnAnswer> = () => Promise.reject(new TypeError('fetch failed'))
    const changing = a_fetch(() => answers())
    const transports = the_relay_s_http_transports({ fetch: changing.fetch, elapsed: no_time })
    const told: string[] = []
    const stop = transports.the_relay.when_it_changes(() => {
      told.push(transports.the_relay.last())
    })
    expect(transports.the_relay.last()).toBe('not_met_yet')
    expect(await transports.mailbox.deposit(a_deposit())).toEqual({ outcome: 'unreachable' })
    expect(await transports.mailbox.deposit(a_deposit())).toEqual({ outcome: 'unreachable' })
    answers = () =>
      Promise.resolve({
        status: 200,
        body: a_body([ndjson({ event: 'the_envelope_is_kept', payload: {} })]).body,
      })
    expect(await transports.mailbox.deposit(a_deposit())).toEqual({ outcome: 'kept' })
    answers = () => Promise.resolve({ status: 503, body: a_body([]).body })
    expect(await transports.mailbox.deposit(a_deposit())).toEqual({ outcome: 'unreachable' })
    answers = () => Promise.reject(new DOMException('the page let it go', 'AbortError'))
    await expect(transports.mailbox.deposit(a_deposit())).rejects.toThrow('aborted')
    expect(told).toEqual(['did_not_answer', 'answered', 'did_not_answer'])
    stop()
    answers = () =>
      Promise.resolve({
        status: 200,
        body: a_body([ndjson({ event: 'the_envelope_is_kept', payload: {} })]).body,
      })
    await transports.mailbox.deposit(a_deposit())
    expect(told).toHaveLength(3)
    expect(transports.the_relay.last()).toBe('answered')
  })

  test('an abort the client did not ask for is signalled: the deposit throws (ADP-4, PST-10, TST-4)', async () => {
    const aborted = a_fetch(() =>
      Promise.reject(new DOMException('the page let it go', 'AbortError')),
    )
    await expect(
      the_relay_s_http_transports({ fetch: aborted.fetch, elapsed: no_time }).mailbox.deposit(
        a_deposit(),
      ),
    ).rejects.toThrow(`the deposit at ${D} was aborted`)
    const aborted_on_the_way = a_fetch(() =>
      Promise.resolve({
        status: 200,
        body: a_body([], new DOMException('let go', 'AbortError')).body,
      }),
    )
    await expect(
      the_relay_s_http_transports({
        fetch: aborted_on_the_way.fetch,
        elapsed: no_time,
      }).mailbox.deposit(a_deposit()),
    ).rejects.toThrow(`the deposit at ${D} was aborted`)
  })

  test('the relay unheard for the longest wait: the request let go, `unreachable`', async () => {
    const time = a_time_that_passes()
    const hanging = a_fetch(
      (request) =>
        new Promise<AnAnswer>((_, failed) => {
          request.signal.addEventListener('abort', () => {
            failed(new DOMException('let go', 'AbortError'))
          })
        }),
    )
    const deposited = the_relay_s_http_transports({
      fetch: hanging.fetch,
      elapsed: time.elapsed,
    }).mailbox.deposit(a_deposit())
    await turns(2)
    expect(time.every_wait_over()).toEqual([the_longest_wait_for_the_relay])
    expect(await deposited).toEqual({ outcome: 'unreachable' })
    expect(hanging.asked[0]?.request.signal.aborted).toBe(true)

    const silent_body = a_body([], 'stays_open')
    const then_silent = a_fetch(() => Promise.resolve({ status: 200, body: silent_body.body }))
    const told = the_relay_s_http_transports({
      fetch: then_silent.fetch,
      elapsed: time.elapsed,
    }).mailbox.deposit(a_deposit())
    await turns(2)
    expect(time.every_wait_over()).toEqual([
      the_longest_wait_for_the_relay,
      the_longest_wait_for_the_relay,
    ])
    expect(await told).toEqual({ outcome: 'unreachable' })
    expect(then_silent.asked[0]?.request.signal.aborted).toBe(true)
  })

  test('a mailbox with no relay is a fault of the wiring: it throws', async () => {
    const { fetch, asked } = answering(200)
    await expect(
      the_relay_s_http_transports({ fetch, elapsed: no_time }).mailbox.deposit(a_deposit([])),
    ).rejects.toThrow(`the mailbox at ${D} has no relay`)
    expect(asked).toHaveLength(0)
  })
})

describe("the relay's HTTP client: the collect port (WEB-6, STK-3)", () => {
  const a_snapshot = {
    event: 'snapshot',
    entries: [
      { deposit_id: 'deposit-1', deposited_at: '2026-11-21T09:02:00.000Z', envelope: 'RTE' },
      { deposit_id: 'deposit-2', deposited_at: '2026-11-21T09:20:00.000Z', envelope: 'RTI' },
    ],
    total: 2,
    position: '7',
  }

  test("a collect shows R as a bearer credential; the snapshot's deposits, the stream let go", async () => {
    const body = a_body([ndjson(a_snapshot), ndjson({ event: 'caught_up' })], 'stays_open')
    const { fetch, asked } = a_fetch(() => Promise.resolve({ status: 200, body: body.body }))
    const { collect } = the_relay_s_http_transports({ fetch, elapsed: no_time })
    expect(await collect(a_mailbox)).toEqual([
      { deposit_id: 'deposit-1', envelope: 'RTE' },
      { deposit_id: 'deposit-2', envelope: 'RTI' },
    ])
    expect(body.was_let_go()).toBe(true)
    expect(asked[0]?.address).toBe(`${relay}/holder/collect_the_envelopes`)
    expect(asked[0]?.request.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${R}`,
    })
    expect(the_body_of(asked[0]?.request ?? fail())).toEqual({
      version: '1.0.0',
      input: { deposit_address: D },
    })
  })

  test('an empty mailbox is an empty snapshot', async () => {
    const body = a_body([ndjson({ event: 'snapshot', entries: [], total: 0 })], 'stays_open')
    const { fetch } = a_fetch(() => Promise.resolve({ status: 200, body: body.body }))
    expect(
      await the_relay_s_http_transports({ fetch, elapsed: no_time }).collect(a_mailbox),
    ).toEqual([])
    expect(body.was_let_go()).toBe(true)
  })

  test('a collect that does not begin with a snapshot throws, the stream let go (ACollect)', async () => {
    for (const [first, why] of [
      [ndjson({ event: 'not_found' }), 'began with not_found'],
      [
        ndjson({ event: 'refused', reasons: ['the_collect_secret_is_the_mailboxs'] }),
        'began with refused',
      ],
      [
        ndjson({ event: 'snapshot', entries: [{ deposit_id: 'd' }] }),
        'began with a snapshot out of form',
      ],
      ['no json\n', 'began with an answer out of form'],
    ] as const) {
      const body = a_body([first], 'stays_open')
      const { fetch } = a_fetch(() => Promise.resolve({ status: 200, body: body.body }))
      await expect(
        the_relay_s_http_transports({ fetch, elapsed: no_time }).collect(a_mailbox),
      ).rejects.toThrow(why)
      expect(body.was_let_go()).toBe(true)
    }
    const ended = a_fetch(() => Promise.resolve({ status: 200, body: a_body([]).body }))
    await expect(
      the_relay_s_http_transports({ fetch: ended.fetch, elapsed: no_time }).collect(a_mailbox),
    ).rejects.toThrow(`the collect at ${D} ended`)
  })

  test('a collect lost, refused by status, aborted or unheard throws: the collector tries at its next pass', async () => {
    const throws = async (fetch: AFetch, why: string, elapsed = no_time) => {
      await expect(
        the_relay_s_http_transports({ fetch, elapsed }).collect(a_mailbox),
      ).rejects.toThrow(why)
    }
    await throws(
      a_fetch(() => Promise.reject(new TypeError('fetch failed'))).fetch,
      'the request lost',
    )
    await throws(answering(400, '{"fault":"authorization"}').fetch, 'status 400')
    await throws(answering(503).fetch, 'status 503')
    await throws(
      a_fetch(() => Promise.reject(new DOMException('let go', 'AbortError'))).fetch,
      `the collect at ${D} was aborted`,
    )
    await throws(
      a_fetch(() =>
        Promise.resolve({ status: 200, body: a_body(['{"ev'], new TypeError('terminated')).body }),
      ).fetch,
      'terminated',
    )
    const time = a_time_that_passes()
    const silent = a_body([], 'stays_open')
    const collected = the_relay_s_http_transports({
      fetch: a_fetch(() => Promise.resolve({ status: 200, body: silent.body })).fetch,
      elapsed: time.elapsed,
    }).collect(a_mailbox)
    await turns(2)
    time.every_wait_over()
    await expect(collected).rejects.toThrow('the relay unheard')
  })

  test('a collect doubled by the network reads the same deposits twice (TST-4)', async () => {
    let calls = 0
    const fetch: AFetch = () => {
      calls += 1
      return Promise.resolve({ status: 200, body: a_body([ndjson(a_snapshot)], 'stays_open').body })
    }
    const { collect } = the_relay_s_http_transports({ fetch, elapsed: no_time })
    const [first, second] = [await collect(a_mailbox), await collect(a_mailbox)]
    expect(second).toEqual(first)
    expect(calls).toBe(2)
  })
})

function fail(): never {
  throw new Error('no request was asked')
}
