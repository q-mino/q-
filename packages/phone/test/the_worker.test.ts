import { runInNewContext } from 'node:vm'
import { describe, expect, test } from 'vitest'
import { the_worker, type APrecache } from '../build/compose.ts'

// The service worker's install and activation (PWA-5, PWA-8), the script
// the build writes run in a context of its own, its host played by the
// test: the scope, the caches, the network (each answer scripted, the
// requests in flight counted), the pauses (recorded, ended at once). The
// precache asked from the HTTP cache with each file's hash, at most six at
// a time, again from the network after a pause while the host refuses it
// for now; a file the release lacks fails the install; the files taken
// stay for the next try; the first install takes the page.

const scope = 'https://q.test/q-/'
const a_precache = (count: number): APrecache => ({
  version: 'v1',
  files: Array.from({ length: count }, (_, at) => ({
    path: `m/${String(at)}.js`,
    integrity: `sha256-${String(at)}`,
  })),
})

/** What the network answers to a try of a file: a status (with its `Retry-After`), or a failure. */
type AnAnswer =
  { readonly answers: number; readonly retry_after?: string } | { readonly answers: 'a_failure' }

interface ARequestSeen {
  readonly url: string
  readonly cache: RequestCache
  readonly integrity: string
}

/** A host for the worker: its handlers, its caches, its network and its pauses, as the test sees them. */
const a_host = (answer: (url: string, tries: number) => AnAnswer) => {
  const handlers = new Map<string, (event: unknown) => void>()
  const stores = new Map<string, Map<string, Response>>()
  const seen: ARequestSeen[] = []
  const pauses: number[] = []
  const tries = new Map<string, number>()
  const claimed: string[] = []
  let in_flight = 0
  let most_in_flight = 0
  const a_store = (name: string) => {
    const store = stores.get(name) ?? new Map<string, Response>()
    stores.set(name, store)
    return {
      keys: () => Promise.resolve([...store.keys()].map((url) => new Request(url))),
      put: (url: string, response: Response) => {
        store.set(url, response)
        return Promise.resolve()
      },
      match: (request: Request) => Promise.resolve(store.get(request.url)),
    }
  }
  const host = {
    self: {
      registration: { scope },
      clients: {
        claim: () => {
          claimed.push('claimed')
          return Promise.resolve()
        },
      },
      addEventListener: (type: string, handler: (event: unknown) => void) => {
        handlers.set(type, handler)
      },
      skipWaiting: () => Promise.resolve(),
    },
    caches: {
      open: (name: string) => Promise.resolve(a_store(name)),
      keys: () => Promise.resolve([...stores.keys()]),
      delete: (name: string) => Promise.resolve(stores.delete(name)),
    },
    fetch: async (request: Request): Promise<Response> => {
      seen.push({ url: request.url, cache: request.cache, integrity: request.integrity })
      const tried = (tries.get(request.url) ?? 0) + 1
      tries.set(request.url, tried)
      in_flight += 1
      most_in_flight = Math.max(most_in_flight, in_flight)
      await new Promise((done) => setImmediate(done))
      in_flight -= 1
      const answered = answer(request.url.slice(scope.length), tried)
      if (answered.answers === 'a_failure') throw new TypeError('Failed to fetch')
      return new Response('', {
        status: answered.answers,
        headers: answered.retry_after === undefined ? {} : { 'retry-after': answered.retry_after },
      })
    },
    setTimeout: (done: () => void, ms: number) => {
      pauses.push(ms)
      setImmediate(done)
    },
    Request,
    Response,
    URL,
    URLPattern,
  }
  /** An event of the worker's, its `waitUntil` promises all settled. */
  const dispatches = async (type: string): Promise<void> => {
    const waits: Promise<unknown>[] = []
    handlers.get(type)?.({ waitUntil: (promise: Promise<unknown>) => waits.push(promise) })
    await Promise.all(waits)
  }
  return {
    host,
    dispatches,
    stores,
    seen,
    pauses,
    claimed,
    most_in_flight: () => most_in_flight,
  }
}

const a_worker_on = (precache: APrecache, answer: (path: string, tries: number) => AnAnswer) => {
  const it = a_host(answer)
  runInNewContext(the_worker(precache), it.host)
  return it
}

describe('the worker’s install: the precache taken without a burst (PWA-8)', () => {
  test('every file into the cache of its version, asked from the HTTP cache with its hash, at most six at a time', async () => {
    const precache = a_precache(40)
    const worker = a_worker_on(precache, () => ({ answers: 200 }))
    await worker.dispatches('install')
    expect([...(worker.stores.get('q-precache-v1')?.keys() ?? [])].sort()).toEqual(
      precache.files.map((file) => `${scope}${file.path}`).sort(),
    )
    expect(worker.seen).toHaveLength(40)
    for (const request of worker.seen) {
      expect(request.cache).toBe('force-cache')
      expect(request.integrity).toBe(
        precache.files.find((file) => `${scope}${file.path}` === request.url)?.integrity,
      )
    }
    expect(worker.most_in_flight()).toBe(6)
    expect(worker.pauses).toEqual([])
  })

  test('a file refused for now (a 429, a failure of the network, its hash not met) asked again from the network after its pause, the host’s Retry-After followed', async () => {
    const worker = a_worker_on(a_precache(3), (path, tries) => {
      if (path === 'm/0.js') return tries === 1 ? { answers: 429 } : { answers: 200 }
      if (path === 'm/1.js') {
        if (tries === 1) return { answers: 'a_failure' }
        if (tries === 2) return { answers: 429, retry_after: '5' }
        return { answers: 200 }
      }
      return { answers: 200 }
    })
    await worker.dispatches('install')
    expect(worker.stores.get('q-precache-v1')?.size).toBe(3)
    const tries_of = (path: string) =>
      worker.seen.filter((request) => request.url === `${scope}${path}`).map((one) => one.cache)
    expect(tries_of('m/0.js')).toEqual(['force-cache', 'reload'])
    expect(tries_of('m/1.js')).toEqual(['force-cache', 'reload', 'reload'])
    expect(tries_of('m/2.js')).toEqual(['force-cache'])
    expect([...worker.pauses].sort((a, b) => a - b)).toEqual([0, 0, 5_000])
  })

  test('a file refused every time: asked eight times over 63 seconds of pauses, then the install fails', async () => {
    const worker = a_worker_on(a_precache(1), () => ({ answers: 429 }))
    await expect(worker.dispatches('install')).rejects.toThrow('m/0.js refused 8 times')
    expect(worker.seen).toHaveLength(8)
    expect(worker.pauses).toEqual([0, 1_000, 2_000, 4_000, 8_000, 16_000, 32_000])
  })

  test('a Retry-After followed up to a minute', async () => {
    const worker = a_worker_on(a_precache(1), (_, tries) =>
      tries === 1 ? { answers: 503, retry_after: '3600' } : { answers: 200 },
    )
    await worker.dispatches('install')
    expect(worker.pauses).toEqual([60_000])
  })

  test('a file the release lacks fails the install at once, its lane stopped; the files taken stay, and the next install asks only the others', async () => {
    const precache = a_precache(10)
    let lacks = true
    const worker = a_worker_on(precache, (path) =>
      path === 'm/3.js' && lacks ? { answers: 404 } : { answers: 200 },
    )
    await expect(worker.dispatches('install')).rejects.toThrow('m/3.js answered 404')
    expect(worker.seen.filter((request) => request.url === `${scope}m/3.js`)).toHaveLength(1)
    // Six lanes: m/3.js and m/9.js are one lane's, stopped at m/3.js.
    expect([...(worker.stores.get('q-precache-v1')?.keys() ?? [])]).not.toContain(`${scope}m/9.js`)
    expect(worker.stores.get('q-precache-v1')?.size).toBe(8)
    lacks = false
    const before = worker.seen.length
    await worker.dispatches('install')
    expect(worker.seen.slice(before).map((request) => request.url)).toEqual([
      `${scope}m/3.js`,
      `${scope}m/9.js`,
    ])
    expect(worker.stores.get('q-precache-v1')?.size).toBe(10)
  })
})

describe('the worker’s activation (PWA-5, PWA-8)', () => {
  test('the other versions’ caches deleted, a cache not the app’s kept, the pages taken', async () => {
    const worker = a_worker_on(a_precache(1), () => ({ answers: 200 }))
    await worker.dispatches('install')
    worker.stores.set('q-precache-v0', new Map())
    worker.stores.set('another', new Map())
    await worker.dispatches('activate')
    expect([...worker.stores.keys()].sort()).toEqual(['another', 'q-precache-v1'])
    expect(worker.claimed).toEqual(['claimed'])
  })
})
