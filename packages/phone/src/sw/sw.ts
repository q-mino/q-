import { cleanupOutdatedCaches, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (string | PrecacheEntry)[] }

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// The page asks for the switch only after the user's gesture (see UpdatePrompt).
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data: unknown = event.data
  if (typeof data === 'object' && data !== null && 'type' in data && data.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})
