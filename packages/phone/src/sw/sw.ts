// The app's service worker (PWA-5), written by hand, with no import: a
// worker has no import map, and the build writes it as a classic script.
// The build puts the precache before this code: its version (the hash of
// the files) and the files of the release, every one of `dist/` but this.
// Installing, the worker takes them all into a cache of its version and
// waits until the page asks for the switch, after the user's gesture (see
// UpdatePrompt); activated, it deletes the caches of the other versions.
// The app's files come from the cache, then from the network; a page of the
// app (a navigation, with its link) is the cached `index.html`.
// [Q, C, 24 Nov 2026]
// Where the browser has the Static Routing API, the worker gives it, at its
// install, the rule for the app's files: the browser answers them from the
// worker's cache by itself, with no fetch event, so a start of ~760 modules
// does not wait for the worker once per module (measured, a start three
// times as slow on a phone's CPU); a page of the app stays the worker's. A
// file the cache misses goes to the network, as with the fetch event.
// [Q, C, 24 Nov 2026]
// A navigation to another page of the precache (the gallery's, off the
// release, WEB-28) is that page, of the same version as the files it
// loads; any other is the app's. [Q, C, 24 Nov 2026]
// The precache taken without a burst (PWA-8) [Q, C, 27 Nov 2026]: until
// then `cache.addAll` asked every file of the release at once, each with
// `cache: 'reload'`, a second time the ~800 the page had just loaded, and
// GitHub Pages refused a part of them ("Failed to fetch", measured on the
// test site: the install failed at the 212th and the 326th file, the
// worker thrown away, its precache asked again at the next opening, and
// every import of an extension left to the network, where its 429 met
// the activation). Now each file is asked with its hash (`integrity`) from
// the browser's HTTP cache first, where the page's start left it (another
// release's copy fails the hash and is asked again from the network), at
// most six at a time, again after a pause while the host refuses it for
// now (a 429, a 5xx, a failure of the network: 1 to 32 seconds, a host's
// `Retry-After` followed up to a minute); a file the release lacks fails
// the install at once. The files taken stay in the cache of the version,
// so an install that failed asks only the others at its next try. And the
// first install takes the page that registered it (`clients.claim`), so
// that the extensions it imports later come from the cache, not from the
// network (PWA-3).

declare let self: ServiceWorkerGlobalScope
/** A file of the release: its path under the scope, its hash as a fetch's `integrity` (`sha256-…`). */
interface AFile {
  readonly path: string
  readonly integrity: string
}
/** Written by the build before this code (`build/compose.ts`). */
declare const the_precache: { readonly version: string; readonly files: readonly AFile[] }

/** The app's caches are named by this prefix, then by their version. */
const the_prefix = 'q-precache-'
const the_cache = `${the_prefix}${the_precache.version}`
const the_address = (file: string): string => new URL(file, self.registration.scope).href
const the_page = the_address('index.html')
/** The pages of the precache, by their address: the app's, and the gallery's off the release. */
const the_pages = new Set(
  the_precache.files
    .filter((file) => file.path.endsWith('.html'))
    .map((file) => the_address(file.path)),
)
/** The page a navigation opens: its own, if the precache has it; else the app's, a link's ticket or a view in its fragment. */
const the_page_of = (request: Request): string => {
  const address = new URL(request.url)
  address.search = ''
  address.hash = ''
  return the_pages.has(address.href) ? address.href : the_page
}

/**
 * The Static Routing API (WICG, Chrome 123; a source by its cache's name,
 * Chrome 131), not yet in TypeScript's lib: what the worker gives it.
 */
interface ARule {
  readonly condition: {
    readonly requestMode?: RequestMode
    readonly requestMethod?: string
    readonly urlPattern?: URLPattern
  }
  readonly source: 'fetch-event' | { readonly cacheName: string }
}
/** An install where the browser takes routes. */
interface AnInstallWithRoutes extends ExtendableEvent {
  readonly addRoutes: (rules: readonly ARule[]) => Promise<void>
}
const takes_routes = (event: ExtendableEvent): event is AnInstallWithRoutes =>
  'addRoutes' in event && typeof event.addRoutes === 'function'

const the_scope = new URL(self.registration.scope)
/**
 * The rules, the first that matches wins: a page of the app to the worker
 * (its `index.html`, a link's ticket in the address); then a file of the
 * app's, with no query, to the cache of this version. The rest, as a query
 * the cache would not match, to the fetch event.
 */
const the_routes: readonly ARule[] = [
  { condition: { requestMode: 'navigate' }, source: 'fetch-event' },
  {
    condition: {
      requestMethod: 'GET',
      urlPattern: new URLPattern({
        protocol: the_scope.protocol.slice(0, -1),
        hostname: the_scope.hostname,
        port: the_scope.port,
        pathname: `${the_scope.pathname}*`,
        search: '',
      }),
    },
    source: { cacheName: the_cache },
  },
]

/** At most this many of the precache's requests in flight. */
const the_requests_at_once = 6
/**
 * The pauses before a file is asked again from the network: none after
 * the first try (from the HTTP cache: its copy may be another release's),
 * then 1, 2, 4, 8, 16 and 32 seconds; refused after the last, the install fails.
 */
const the_pauses: readonly number[] = [0, 1_000, 2_000, 4_000, 8_000, 16_000, 32_000]
/** The longest pause a host's `Retry-After` is followed for. */
const the_longest_pause = 60_000

/** What a try of a file came to. */
type ATry =
  | { readonly came: 'taken'; readonly response: Response }
  /** A 429, a 408, a 5xx, a failure of the network, the hash not met: asked again; `after`, the host's `Retry-After`. */
  | { readonly came: 'refused_for_now'; readonly after: number | undefined }
  /** Any other answer (a 404: the release lacks it). */
  | { readonly came: 'refused'; readonly status: number }

/** The host's `Retry-After` in seconds, as a pause, up to the longest. */
const the_pause_asked = (response: Response): number | undefined => {
  const seconds = Number(response.headers.get('retry-after'))
  return Number.isFinite(seconds) && seconds > 0
    ? Math.min(seconds * 1_000, the_longest_pause)
    : undefined
}

const a_try = async (file: AFile, from: 'force-cache' | 'reload'): Promise<ATry> => {
  try {
    const response = await fetch(
      new Request(the_address(file.path), { cache: from, integrity: file.integrity }),
    )
    if (response.ok) return { came: 'taken', response }
    return response.status === 429 || response.status === 408 || response.status >= 500
      ? { came: 'refused_for_now', after: the_pause_asked(response) }
      : { came: 'refused', status: response.status }
  } catch {
    return { came: 'refused_for_now', after: undefined }
  }
}

const a_pause = (ms: number): Promise<void> =>
  new Promise((done) => {
    setTimeout(done, ms)
  })

/** A file into the cache: from the HTTP cache, then from the network after each pause while refused for now. */
const a_file_taken = async (cache: Cache, file: AFile): Promise<void> => {
  let tried = await a_try(file, 'force-cache')
  for (const pause of the_pauses) {
    if (tried.came !== 'refused_for_now') break
    await a_pause(tried.after ?? pause)
    tried = await a_try(file, 'reload')
  }
  switch (tried.came) {
    case 'taken':
      return cache.put(the_address(file.path), tried.response)
    case 'refused':
      throw new Error(`the precache: ${file.path} answered ${String(tried.status)}`)
    case 'refused_for_now':
      throw new Error(`the precache: ${file.path} refused ${String(the_pauses.length + 1)} times`)
  }
}

/**
 * The files of the release into the cache of its version, those it holds
 * already left (an install before that failed); in lanes, each one file at
 * a time, so at most `the_requests_at_once` in flight; failed with the
 * first file refused, once every lane has ended.
 */
const the_precache_taken = async (): Promise<void> => {
  const cache = await caches.open(the_cache)
  const held = new Set((await cache.keys()).map((request) => request.url))
  const missing = the_precache.files.filter((file) => !held.has(the_address(file.path)))
  const lanes = Array.from({ length: the_requests_at_once }, (_, lane) =>
    missing.filter((_, at) => at % the_requests_at_once === lane),
  )
  const ended = await Promise.allSettled(
    lanes.map(async (lane) => {
      for (const file of lane) await a_file_taken(cache, file)
    }),
  )
  const failed = ended.find((one) => one.status === 'rejected')
  if (failed !== undefined) throw failed.reason
}

self.addEventListener('install', (event: ExtendableEvent) => {
  if (takes_routes(event)) event.waitUntil(event.addRoutes(the_routes))
  event.waitUntil(the_precache_taken())
})

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((names) =>
          Promise.all(
            names
              .filter((name) => name.startsWith(the_prefix) && name !== the_cache)
              .map((name) => caches.delete(name)),
          ),
        ),
      // The page that registered the first install, until then from the
      // network, now the worker's: its later imports come from the cache.
      // At an update the pages are the new worker's already (SKIP_WAITING).
      self.clients.claim(),
    ]),
  )
})

/** What the cache answers for a request of the app's: a navigation is its page (`the_page_of`). */
const the_cached = async (request: Request): Promise<Response | undefined> => {
  const cache = await caches.open(the_cache)
  return request.mode === 'navigate'
    ? cache.match(the_page_of(request))
    : cache.match(request, { ignoreSearch: true })
}

// A browser with no routes, a page of the app, a request with a query.
self.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return
  event.respondWith(the_cached(request).then((cached) => cached ?? fetch(request)))
})

// The page asks for the switch only after the user's gesture (see UpdatePrompt).
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data: unknown = event.data
  if (typeof data === 'object' && data !== null && 'type' in data && data.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})
