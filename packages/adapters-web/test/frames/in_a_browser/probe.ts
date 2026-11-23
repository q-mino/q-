// A frame's fence, measured in a browser (EXT-13, WEB-23; the Checks of step
// 12 for step 22; part 22.2). Not a test of vitest: a page served by vite
// (`pnpm exec vite packages/adapters-web/test/frames/in_a_browser`), opened
// in a browser under three policies of the app's page (none; `frame-src
// 'none'`; a strict one), each placing frames as the kernel does (its
// document after the kernel's policy, sandboxed with scripts only):
// - one that tries what the kernel's policy and the sandbox close: the
//   storage of the app's origin (local and session storage, IndexedDB,
//   cookies, caches, the service worker), the network (`fetch`, a socket, a
//   beacon, an image), a window, the top's navigation; and WebRTC;
// - four that navigate themselves (to a `data:` document, to a page of the
//   app's origin, by a `<meta>` refresh; to a `data:` document that
//   fetches), each told by the page it reaches.
// What each frame posts is written in the page as JSON, under `results`.
// Nothing leaves the machine: every address is the server's own.

import { the_document_of_a_frame, the_sandbox_of_a_frame } from '../../../src/frames/index.ts'

const here = location.origin
const navigated = `${here}/navigated.html`

/** The frame that tries what the policy and the sandbox close, its results posted when done. */
const what_it_tries = `<!doctype html><script>
const results = {}
const violations = []
document.addEventListener('securitypolicyviolation', (e) => violations.push(e.effectiveDirective + ' ' + e.blockedURI))
const tries = (name, f) => { try { results[name] = String(f()) } catch (e) { results[name] = 'threw ' + e.name } }
tries('origin', () => self.origin)
tries('localStorage', () => localStorage.length)
tries('sessionStorage', () => sessionStorage.length)
tries('cookie', () => { document.cookie = 'probe=1'; return document.cookie })
tries('serviceWorker', () => (navigator.serviceWorker === undefined ? 'absent' : 'present'))
tries('caches', () => typeof caches)
tries('window.open', () => (window.open('about:blank') === null ? 'null' : 'opened'))
tries('top.location', () => { top.location.href = '${navigated}?how=top'; return 'not thrown' })
tries('RTCPeerConnection', () => { const pc = new RTCPeerConnection(); pc.close(); return 'constructed' })
tries('sendBeacon', () => navigator.sendBeacon('${here}/beacon'))
tries('WebSocket', () => { new WebSocket('${here.replace('http', 'ws')}/socket'); return 'constructed' })
const image = new Image()
image.src = '${here}/image.png'
const indexed = new Promise((resolve) => {
  try {
    const opened = indexedDB.open('probe')
    opened.onsuccess = () => resolve('opened')
    opened.onerror = () => resolve('error ' + (opened.error && opened.error.name))
  } catch (e) { resolve('threw ' + e.name) }
})
const fetched = fetch('${navigated}').then((r) => 'reached ' + r.status, (e) => 'refused ' + e.name)
Promise.all([indexed, fetched]).then(([i, f]) => {
  results.indexedDB = i
  results.fetch = f
  setTimeout(() => parent.postMessage({ probe: 'tries', results, violations }, '*'), 500)
})
</script>`

/** The frames that navigate themselves, each a way. */
const the_ways = {
  to_a_data_document: `<!doctype html><script>location.href = 'data:text/html,<script>parent.postMessage({probe:"navigated",how:"data"},"*")<\\/script>'</script>`,
  to_the_apps_origin: `<!doctype html><script>location.href = '${navigated}?how=same_origin'</script>`,
  by_a_refresh: `<!doctype html><meta http-equiv="refresh" content="0;url=${navigated}?how=refresh">`,
  to_a_data_document_that_fetches: `<!doctype html><script>location.href = 'data:text/html,<script>fetch("${navigated}").then(() => parent.postMessage({probe:"data_document_fetched",got:"reached"},"*"), (e) => parent.postMessage({probe:"data_document_fetched",got:"refused " + e.name},"*"))<\\/script>'</script>`,
}

const heard: unknown[] = []
const frames = new Map<MessageEventSource, string>()
window.addEventListener('message', (event: MessageEvent<unknown>) => {
  heard.push({
    from: event.source === null ? 'unknown' : (frames.get(event.source) ?? 'another window'),
    data: event.data,
  })
})

const places = (name: string, file: string): void => {
  const frame = document.createElement('iframe')
  frame.title = name
  frame.sandbox.value = the_sandbox_of_a_frame
  frame.srcdoc = the_document_of_a_frame(file)
  document.body.append(frame)
  if (frame.contentWindow !== null) frames.set(frame.contentWindow, name)
}

places('what_it_tries', what_it_tries)
for (const [way, file] of Object.entries(the_ways)) places(way, file)

const the_results = document.getElementById('results')
setTimeout(() => {
  const policy = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
  if (the_results !== null)
    the_results.textContent = JSON.stringify(
      { the_apps_policy: policy?.getAttribute('content') ?? 'none', heard },
      null,
      2,
    )
}, 3000)
