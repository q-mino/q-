// A relay of the configurator's tests: its storage on SQLite, in memory or
// in a file, its world faked (the clock a test sets, the time that passes
// when it says, the hash of R told apart from R as in the relay's stories),
// and its HTTP interface called with `app.request`, no server started.

import * as zz from '@q-mino/domains/library'
import { the_relays_storage } from '@q-mino/adapters-node'
import { relay } from '../src/index.ts'

const time_zone = zz.time_zone.parse('UTC')

/** The relay's hash of a collect secret, faked: D told apart from R. */
export const hash = (secret: string): Promise<string> => Promise.resolve(`hash-of-${secret}`)

/** Everything already set going has run its course, up to its next wait. */
export const quiet = async (): Promise<void> => {
  for (let turn = 0; turn < 3; turn += 1) {
    await new Promise<void>((done) => {
      setTimeout(done, 0)
    })
  }
}

/** A relay started over a storage at a location, its clock at an instant. */
export const a_relay = async (location = ':memory:', at = '2026-11-16T00:00:00.000Z') => {
  const storage = the_relays_storage(location)
  let instant = zz.date_time.parse(at)
  const waits: (() => void)[] = []
  const the_relay = await relay(storage)({
    clock: { now: () => instant, time_zone },
    elapsed: () =>
      new Promise<void>((over) => {
        waits.push(over)
      }),
    hash,
  })
  return {
    ...the_relay,
    storage,
    /** The relay's clock at an instant. */
    at: (to: string) => {
      instant = zz.date_time.parse(to)
    },
    /** Time passes up to an instant: every wait asked for is over, and what it set going runs. */
    pass: async (to: string) => {
      instant = zz.date_time.parse(to)
      for (const over of waits.splice(0)) over()
      await quiet()
    },
  }
}

/** A request's body, as JSON, and its headers. */
const posted = (body: unknown, headers: Readonly<Record<string, string>> = {}): RequestInit => ({
  method: 'POST',
  body: typeof body === 'string' ? body : JSON.stringify(body),
  headers: { 'Content-Type': 'application/json', ...headers },
})

/** What the phones send the relay over HTTP (MBX-9). */
export const over_http = (app: Awaited<ReturnType<typeof a_relay>>['http']) => ({
  deposits: (body: unknown, headers?: Readonly<Record<string, string>>) =>
    app.request('/depositor/deposit_an_envelope', posted(body, headers)),
  collects: (body: unknown, secret?: string) =>
    app.request(
      '/holder/collect_the_envelopes',
      posted(body, secret === undefined ? {} : { Authorization: `Bearer ${secret}` }),
    ),
})

/** Every line of a response's body, parsed, once it ends. */
export const lines_of = async (response: Response): Promise<readonly unknown[]> =>
  (await response.text())
    .split('\n')
    .filter((line) => line !== '')
    .map((line): unknown => JSON.parse(line))

/** A response's body read line by line, as a phone reads a collect that stays open. */
export const reading = (response: Response) => {
  const body = response.body
  if (body === null) throw new Error('a response with no body')
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  return {
    /** The next line, parsed. */
    next: async (): Promise<unknown> => {
      for (;;) {
        const end = pending.indexOf('\n')
        if (end !== -1) {
          const line = pending.slice(0, end)
          pending = pending.slice(end + 1)
          return JSON.parse(line)
        }
        const chunk = await reader.read()
        if (chunk.done) throw new Error('the response ended')
        const bytes: unknown = chunk.value
        if (!(bytes instanceof Uint8Array)) throw new Error('a body of bytes')
        pending += decoder.decode(bytes, { stream: true })
      }
    },
    /** The phone lets the collect go. */
    let_go: () => reader.cancel(),
  }
}
