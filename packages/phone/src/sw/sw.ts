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

declare let self: ServiceWorkerGlobalScope
/** Written by the build before this code (`build/compose.ts`). */
declare const the_precache: { readonly version: string; readonly files: readonly string[] }

/** The app's caches are named by this prefix, then by their version. */
const the_prefix = 'q-precache-'
const the_cache = `${the_prefix}${the_precache.version}`
const the_address = (file: string): string => new URL(file, self.registration.scope).href
const the_page = the_address('index.html')

self.addEventListener('install', (event: ExtendableEvent) => {
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
