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

declare let self: ServiceWorkerGlobalScope
/** Written by the build before this code (`build/compose.ts`). */
declare const the_precache: { readonly version: string; readonly files: readonly string[] }

/** The app's caches are named by this prefix, then by their version. */
const the_prefix = 'q-precache-'
const the_cache = `${the_prefix}${the_precache.version}`
const the_address = (file: string): string => new URL(file, self.registration.scope).href
const the_page = the_address('index.html')

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

self.addEventListener('install', (event: ExtendableEvent) => {
  if (takes_routes(event)) event.waitUntil(event.addRoutes(the_routes))
  event.waitUntil(
    caches
      .open(the_cache)
      .then((cache) =>
        cache.addAll(
          the_precache.files.map((file) => new Request(the_address(file), { cache: 'reload' })),
        ),
      ),
  )
})

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith(the_prefix) && name !== the_cache)
            .map((name) => caches.delete(name)),
        ),
      ),
  )
})

/** What the cache answers for a request of the app's: a page of the app is its `index.html`. */
const the_cached = async (request: Request): Promise<Response | undefined> => {
  const cache = await caches.open(the_cache)
  return request.mode === 'navigate'
    ? cache.match(the_page)
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
