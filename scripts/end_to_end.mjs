// `node scripts/end_to_end.mjs`: Cumino from end to end, on a published
// site and its relay (step 24, part 3): two nodes, each a headless Chrome of
// its own (two `--user-data-dir`, two origins of storage that share nothing),
// driven over the DevTools protocol as `scripts/screens.mjs` drives the
// gallery, with no dependency.
//
// The round, as a person does it on the screens, by their Italian words:
//   1. Anna's first face, then Bruno's (one profile loaded at a time: a cold
//      load is ~800 requests and the worker's ~190, PWA-8, and GitHub Pages
//      refuses an address that asks too much).
//      The page's policy must name the relay (`connect-src`), and screen 1c
//      the relay and its public configuration.
//   2. The handshake at a distance: Anna makes the link, Bruno opens it and
//      accepts; each sees the other among the contacts (the confirmation
//      went through the relay).
//   3. Anna activates ping pong and offers it to Bruno; Bruno has not
//      activated it: her ping meets silence ("nessuna risposta", PNG-4's 60
//      seconds, the screen's 70).
//   4. Bruno activates it and offers it to Anna; Anna's ping gets its pong
//      through the relay, and the time from the tap to the pong is measured;
//      then Bruno's ping to Anna, the same way back.
//   5. Messaging (its README's story 20; part M6, 27 Nov 2026): both
//      activate it; Anna writes «Ciao Bruno» while his page is closed
//      («in uscita»); Bruno opens it, his row of Anna reads «1 da leggere»,
//      his conversation the message with its annotations; Anna's reads
//      «consegnato»; Bruno answers, her row and her conversation show it, his
//      reads «consegnato»; both reload, and both chats are as they were.
// After the first faces, both apps installed (PWA-8): the worker activated
// with its whole precache, the page its own. The service worker's requests
// are watched on its own target (attached as it starts): how many, how many
// from the network, its 429s and failures, its states.
//
// First the site's release (`phone/src/build_info.js`, past the CDN's cache):
// its commit, which must be `--commit`'s when given, and its relay, which must
// be `--relay`. A request answered 429 is counted, the first five with their
// headers (`refused` in the report: a 429 the HTTP cache may keep); a page (or the release)
// that does not come is asked again after a pause, 30 s and then doubled, at
// most `--tries` times (default 4). Every wait is bounded, so the
// run always ends; Chrome and its profiles are removed at the end, also on
// errors and signals. The report: a line per step on stdout, the whole as
// JSON in `--out` (default `end-to-end.json` in the system's temporary
// folder). Exit code 0 if every step is ok, 1 otherwise.
//
// Usage: node scripts/end_to_end.mjs [--url <the site>] [--relay <origin>]
//   [--commit <sha>] [--out <file>] [--tries <n>]
//   default: --url https://q-mino-prova.github.io/q-/
//            --relay https://relay.cumino.aleclofabbro.it
// [Q, C, 25 Nov 2026]
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import console from 'node:console'
import process from 'node:process'
import { clearTimeout, setTimeout } from 'node:timers'
import { URL } from 'node:url'

// Node's global, which ESLint's globals do not list.
const { WebSocket, fetch } = globalThis

const args = process.argv.slice(2)
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
const site = option('--url') ?? 'https://q-mino-prova.github.io/q-/'
const relay = option('--relay') ?? 'https://relay.cumino.aleclofabbro.it'
const out_file = resolve(option('--out') ?? join(tmpdir(), 'end-to-end.json'))
const tries = Number(option('--tries') ?? '4')
const commit = option('--commit')
const chrome_path = process.env.CHROME ?? '/usr/bin/google-chrome'

const user_agent =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/130.0.0.0 Mobile Safari/537.36'
const startup_wait_ms = 20_000
const call_wait_ms = 30_000
const open_wait_ms = 60_000
// The pause before a load again, doubled at each: 30 s, 60 s, 120 s.
const pause_before = (attempt) => 30_000 * 2 ** (attempt - 1)
// The relay's round (the confirmation of a handshake, a ping): its post sends
// again on its own clock, so a minute and a half.
const relay_wait_ms = 90_000
// PNG-4: a ping's 60 seconds from its delivery, the screen's 70 from the tap.
const silence_wait_ms = 100_000
// The worker's install: its precache at most six at a time, again after its
// pauses while the host refuses (PWA-8): two minutes.
const worker_wait_ms = 120_000

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))
// A promise that fails with `message` if it takes longer than `ms`.
const bounded = (promise, ms, message) => {
  let timer
  const limit = new Promise((_, fail) => {
    timer = setTimeout(() => fail(new Error(message)), ms)
  })
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer))
}

// What must be cleaned at the end, whatever the end: Chrome and its profiles.
const cleanups = []
const clean_all = () => {
  while (cleanups.length > 0) {
    try {
      cleanups.pop()()
    } catch {
      // already gone
    }
  }
}
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    clean_all()
    process.exit(128 + (signal === 'SIGINT' ? 2 : signal === 'SIGTERM' ? 15 : 1))
  })
}
process.on('exit', clean_all)

const report = {
  site,
  relay,
  started_at: new Date().toISOString(),
  steps: [],
  too_many_requests: {},
  refused: {},
  worker: {},
  loads: {},
  faults: [],
}

// One DevTools connection to a browser; a page's commands go with its
// sessionId (flat sessions); its events to the listeners.
const connect = async (ws_url) => {
  const socket = new WebSocket(ws_url)
  await bounded(
    new Promise((done, fail) => {
      socket.addEventListener('open', done, { once: true })
      socket.addEventListener('error', () => fail(new Error('DevTools socket error')), {
        once: true,
      })
    }),
    startup_wait_ms,
    'DevTools socket did not open',
  )
  let next_id = 0
  const waiting = new Map()
  const listeners = []
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id === undefined) {
      for (const listener of listeners) listener(message)
      return
    }
    const call = waiting.get(message.id)
    if (!call) return
    waiting.delete(message.id)
    if (message.error) call.fail(new Error(`${call.method}: ${message.error.message}`))
    else call.done(message.result)
  })
  const send = (method, params = {}, session_id) =>
    bounded(
      new Promise((done, fail) => {
        const id = ++next_id
        waiting.set(id, { method, done, fail })
        socket.send(JSON.stringify({ id, method, params, sessionId: session_id }))
      }),
      call_wait_ms,
      `${method} did not answer in ${call_wait_ms} ms`,
    )
  return { send, listen: (listener) => listeners.push(listener), close: () => socket.close() }
}

// Chrome with a profile of its own: one node, its storage shared with no other.
const launch_chrome = async (label) => {
  const profile = mkdtempSync(join(tmpdir(), `end-to-end-${label}-`))
  cleanups.push(() => rmSync(profile, { recursive: true, force: true, maxRetries: 5 }))
  const child = spawn(
    chrome_path,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'], detached: true },
  )
  // The whole group: Chrome's helper processes go with it.
  cleanups.push(() => process.kill(-child.pid, 'SIGKILL'))
  let seen = ''
  const ws_url = await bounded(
    new Promise((done, fail) => {
      child.stderr.on('data', (chunk) => {
        seen += chunk.toString()
        const match = /DevTools listening on (ws:\/\/\S+)/.exec(seen)
        if (match) done(match[1])
      })
      child.on('error', fail)
      child.on('exit', (code) => fail(new Error(`Chrome exited (${code}):\n${seen}`)))
    }),
    startup_wait_ms,
    `Chrome was not ready in ${startup_wait_ms} ms`,
  )
  return connect(ws_url)
}

// A node: a phone's page in its own Chrome.
const open_node = async (label) => {
  const browser = await launch_chrome(label)
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true })
  const page = (method, params) => browser.send(method, params, sessionId)
  report.too_many_requests[label] = 0
  report.refused[label] = []
  report.worker[label] = {
    requests: 0,
    from_the_network: 0,
    too_many_requests: 0,
    failed: { count: 0, first: [] },
    states: [],
  }
  // The service worker's own requests (its precache) are a target of their
  // own: attached as it starts, before its first request, then let go.
  const workers = new Set()
  const asked = new Map()
  browser.listen((message) => {
    if (message.method !== 'Target.attachedToTarget') return
    const { sessionId: worker, targetInfo } = message.params
    if (targetInfo.type === 'service_worker' && targetInfo.url.startsWith(site)) {
      workers.add(worker)
      void browser.send('Network.enable', {}, worker).catch(() => undefined)
    }
    void browser.send('Runtime.runIfWaitingForDebugger', {}, worker).catch(() => undefined)
  })
  await browser.send('Target.setAutoAttach', {
    autoAttach: true,
    waitForDebuggerOnStart: true,
    flatten: true,
  })
  // The first refusals, as the browser saw them: their address, their
  // headers (a 429 the HTTP cache may keep), whose request.
  const refused = (whose, response) => {
    if (report.refused[label].length >= 5) return
    report.refused[label].push({
      whose,
      url: response.url.replace(site, ''),
      from_the_disk_cache: response.fromDiskCache === true,
      headers: response.headers,
    })
  }
  browser.listen((message) => {
    if (workers.has(message.sessionId) && message.method === 'Network.requestWillBeSent') {
      asked.set(message.params.requestId, message.params.request.url.replace(site, ''))
      return
    }
    if (workers.has(message.sessionId) && message.method === 'Network.loadingFailed') {
      const failed = report.worker[label].failed
      failed.count += 1
      if (failed.first.length < 5) {
        failed.first.push({
          url: asked.get(message.params.requestId),
          error: message.params.errorText,
          canceled: message.params.canceled === true,
        })
      }
      return
    }
    if (workers.has(message.sessionId) && message.method === 'Network.responseReceived') {
      const response = message.params.response
      report.worker[label].requests += 1
      if (response.fromDiskCache !== true) report.worker[label].from_the_network += 1
      if (response.status === 429) {
        report.worker[label].too_many_requests += 1
        report.too_many_requests[label] += 1
        refused('worker', response)
      }
      return
    }
    if (message.sessionId !== sessionId) return
    if (message.method === 'Network.responseReceived' && message.params.response.status === 429) {
      report.too_many_requests[label] += 1
      refused('page', message.params.response)
    }
    if (message.method === 'ServiceWorker.workerVersionUpdated') {
      for (const version of message.params.versions) {
        const states = report.worker[label].states
        if (version.scriptURL.startsWith(site) && states.at(-1) !== version.status) {
          states.push(version.status)
        }
      }
    }
    if (message.method === 'ServiceWorker.workerErrorReported') {
      report.faults.push({
        node: label,
        fault: `worker: ${message.params.errorMessage.errorMessage}`,
      })
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      report.faults.push({
        node: label,
        fault: message.params.args.map((one) => one.value ?? one.description ?? '').join(' '),
      })
    }
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      report.faults.push({
        node: label,
        fault: `${message.params.entry.text} ${message.params.entry.url ?? ''}`,
      })
    }
    if (message.method === 'Runtime.exceptionThrown') {
      report.faults.push({
        node: label,
        fault:
          message.params.exceptionDetails.exception?.description ??
          message.params.exceptionDetails.text,
      })
    }
  })
  await page('Page.enable')
  await page('Runtime.enable')
  await page('Network.enable')
  await page('Log.enable')
  await page('ServiceWorker.enable')
  await page('Emulation.setDeviceMetricsOverride', {
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    mobile: true,
  })
  await page('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await page('Emulation.setUserAgentOverride', { userAgent: user_agent })
  return { label, page }
}

const evaluate = async (node, expression) => {
  const { result, exceptionDetails } = await node.page('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (exceptionDetails) {
    throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text)
  }
  return result.value
}
const quietly = (node, expression) => evaluate(node, expression).catch(() => undefined)

// The text of what she sees: the screen on top (the last one not hidden).
const the_screen = `[...document.querySelectorAll('main, [data-screen], body')].filter((e) => !e.closest('[inert],[hidden],[aria-hidden=true]')).pop()`
const its_text = (node) =>
  quietly(node, `(${the_screen})?.innerText.replace(/\\s+/g, ' ').trim().slice(0, 400) ?? ''`)
const the_title = (node) =>
  quietly(
    node,
    `[...document.querySelectorAll('h1')].filter((e) => !e.closest('[inert],[hidden],[aria-hidden=true]')).pop()?.textContent.trim() ?? null`,
  )
const until = async (node, expression, ms) => {
  const end = Date.now() + ms
  while (Date.now() < end) {
    if (await quietly(node, expression)) return true
    await sleep(200)
  }
  return false
}
const until_the_title = (node, title, ms) =>
  until(
    node,
    `[...document.querySelectorAll('h1')].filter((e) => !e.closest('[inert],[hidden],[aria-hidden=true]')).pop()?.textContent.trim() === ${JSON.stringify(title)}`,
    ms,
  )
const until_the_text = (node, text, ms) =>
  until(node, `document.body.innerText.includes(${JSON.stringify(text)})`, ms)

// Her tap: the smallest visible control whose text is `label`, or contains it.
const tap = async (node, label, { contains = false, within } = {}) => {
  const tapped = await evaluate(
    node,
    `(() => {
      const label = ${JSON.stringify(label)}, contains = ${contains}, within = ${JSON.stringify(within ?? null)};
      const scope = within === null ? document : [...document.querySelectorAll('li, [role=listitem], section, article')].filter((e) => e.innerText.includes(within)).sort((a, b) => a.innerText.length - b.innerText.length)[0];
      if (!scope) return false;
      const all = [...scope.querySelectorAll('button, a, [role=button], [role=menuitem], [role=link]')].filter((e) => {
        const text = e.textContent.trim();
        return (contains ? text.includes(label) : text === label) && e.getClientRects().length > 0 && !e.closest('[inert],[hidden],[aria-hidden=true]') && !e.disabled;
      });
      if (all.length === 0) return false;
      const least = Math.min(...all.map((e) => e.textContent.length));
      all.filter((e) => e.textContent.length === least).pop().click();
      return true;
    })()`,
  )
  if (!tapped)
    throw new Error(`no "${label}" to tap on «${await the_title(node)}»: ${await its_text(node)}`)
  await sleep(400)
}
const type_into = (node, selector, value) =>
  evaluate(
    node,
    `(() => {
      const input = [...document.querySelectorAll(${JSON.stringify(selector)})].find((e) => !e.closest('[hidden],[inert]'));
      if (!input) return false;
      input.focus();
      const its = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
      Object.getOwnPropertyDescriptor(its.prototype, 'value').set.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`,
  )

// The site opened: loaded again after a pause while it does not open (a
// cold load's 429s), at most `tries` times.
const open_the_site = async (node, url, title) => {
  for (let attempt = 1; attempt <= tries; attempt++) {
    report.loads[node.label] = attempt
    const before = report.too_many_requests[node.label]
    await node.page('Page.navigate', { url })
    if (await until_the_title(node, title, open_wait_ms)) return attempt
    const refused = report.too_many_requests[node.label] - before
    console.log(
      `      ${node.label}: «${title}» not shown at load ${attempt} (${refused} answers 429)`,
    )
    if (attempt < tries) await sleep(pause_before(attempt))
  }
  throw new Error(`«${title}» not shown after ${tries} loads: ${await its_text(node)}`)
}

const step = async (name, does) => {
  const started = Date.now()
  try {
    const said = await does()
    const done = { step: name, outcome: 'ok', seconds: (Date.now() - started) / 1000, said }
    report.steps.push(done)
    console.log(`ok    ${name} (${done.seconds.toFixed(1)} s)${said ? `: ${said}` : ''}`)
    return true
  } catch (fault) {
    const failed = {
      step: name,
      outcome: 'failed',
      seconds: (Date.now() - started) / 1000,
      why: fault instanceof Error ? fault.message : String(fault),
    }
    report.steps.push(failed)
    console.log(`FAIL  ${name}: ${failed.why}`)
    return false
  }
}

const back_to_the_contacts = async (node) => {
  for (let i = 0; i < 6 && (await the_title(node)) !== 'I miei contatti'; i++) {
    await tap(node, 'Indietro').catch(() => undefined)
    await sleep(600)
  }
  if ((await the_title(node)) !== 'I miei contatti') {
    throw new Error(`not back to the contacts: «${await the_title(node)}»`)
  }
}
const from_the_menu = async (node, entry, title) => {
  await back_to_the_contacts(node)
  await tap(node, 'Menu')
  await tap(node, entry)
  if (!(await until_the_title(node, title, 10_000))) {
    throw new Error(`«${title}» not shown: «${await the_title(node)}»`)
  }
}

// Her first face, the introduction skipped, the server's screen read.
const the_first_face = async (node, name) => {
  await open_the_site(node, site, 'Il tuo primo volto')
  const policy = await evaluate(
    node,
    `document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content ?? ''`,
  )
  const connect_src = /connect-src ([^;]*)/.exec(policy)?.[1] ?? ''
  if (!connect_src.split(' ').includes(new URL(relay).origin)) {
    throw new Error(`the policy does not name ${relay}: connect-src ${connect_src}`)
  }
  await type_into(node, 'input[name=name]', name)
  await tap(node, 'Crea il volto')
  if (!(await until_the_title(node, 'Come funziona Cumino', 20_000))) {
    throw new Error(`no introduction: ${await its_text(node)}`)
  }
  await tap(node, 'Salta')
  if (!(await until_the_title(node, 'Il server', 10_000))) {
    throw new Error(`no server's screen: ${await its_text(node)}`)
  }
  const server = await its_text(node)
  if (!server.includes(new URL(relay).host)) throw new Error(`screen 1c: ${server}`)
  const configuration = await quietly(
    node,
    `[...document.querySelectorAll('a')].map((a) => a.href).find((href) => href.endsWith('/docs/relay.md')) ?? null`,
  )
  if (!configuration) throw new Error('screen 1c has no link to docs/relay.md')
  await tap(node, 'Continua')
  if (!(await until_the_title(node, 'I miei contatti', 10_000))) {
    throw new Error(`not at the contacts: ${await its_text(node)}`)
  }
  return `connect-src ${connect_src}; 1c links ${configuration}`
}

const activate = async (node, extension) => {
  await from_the_menu(node, 'Estensioni', 'Estensioni')
  await tap(node, extension, { contains: true })
  await tap(node, 'Accendila')
  await tap(node, 'Accetto')
  if (!(await until_the_text(node, 'Spegnila', 15_000))) {
    throw new Error(`not active: ${await its_text(node)}`)
  }
}
const open_the_contact = async (node, name) => {
  await back_to_the_contacts(node)
  await tap(node, name, { contains: true })
  if (!(await until_the_title(node, 'Un contatto', 10_000))) {
    throw new Error(`«Un contatto» not shown: ${await its_text(node)}`)
  }
}
// Offered to every bond at its activation (EXT-7); offered by her tap if not.
const offer_ping_pong = async (node, to) => {
  await open_the_contact(node, to)
  if (!(await until_the_text(node, 'Ritira l’offerta', 3_000))) await tap(node, 'Offrila')
  if (!(await until_the_text(node, 'Ritira l’offerta', 15_000))) {
    throw new Error(`not offered: ${await its_text(node)}`)
  }
}
// Her ping from the contact's screen: what her screen reads after it, and when.
const a_ping = async (node, to, outcome, ms) => {
  await open_the_contact(node, to)
  const tapped = Date.now()
  await tap(node, 'Ping')
  const outcomes = [
    'pong!',
    'nessuna risposta',
    'non può rispondere',
    'ping annullato',
    'il ping non può partire',
  ]
  const end = tapped + ms
  while (Date.now() < end) {
    const text = (await quietly(node, 'document.body.innerText')) ?? ''
    const read = outcomes.find((one) => text.includes(one))
    if (read !== undefined) {
      const seconds = (Date.now() - tapped) / 1000
      if (read !== outcome)
        throw new Error(`«${read}» after ${seconds.toFixed(1)} s, not «${outcome}»`)
      return seconds
    }
    await sleep(100)
  }
  throw new Error(`no outcome in ${ms / 1000} s: ${await its_text(node)}`)
}

// Her app installed (PWA-5, PWA-8): the worker activated with the whole
// precache, and her page its own, so that what she imports later (an
// extension at its activation) comes from the cache, not from the host.
const the_app_installed = async (node) => {
  const installed = await until(
    node,
    `(async () => { const r = await navigator.serviceWorker.getRegistration(); return r?.active?.state === 'activated' && navigator.serviceWorker.controller !== null })()`,
    worker_wait_ms,
  )
  const worker = report.worker[node.label]
  if (!installed) {
    throw new Error(
      `not installed in ${worker_wait_ms / 1000} s: the worker ${worker.states.join(' → ')}, ${worker.failed.count} failed (${JSON.stringify(worker.failed.first)})`,
    )
  }
  return `the worker ${worker.states.join(' → ')}; ${worker.requests} files, ${worker.from_the_network} from the network`
}

// The chat (messaging's part, MSG-7, MSG-15): on a contact's screen, its
// slot taken to the whole screen; given back with Escape. Every query of the
// chat is of the screen shown: the screens under it stay in the page,
// hidden, with their own slots (the home's rows).
/** The elements of `selector` on the screen shown, as an expression. */
const all_shown = (selector) =>
  `[...document.querySelectorAll(${JSON.stringify(selector)})].filter((e) => !e.closest('[hidden],[inert]'))`
/** The first of them, as an expression. */
const shown = (selector) => `${all_shown(selector)}[0]`
const the_chat_slot = `.slot:has(.the-chat)`
const the_conversation = `.the-chat[data-where="on_the_whole_screen"]`
const open_the_chat = async (node, name) => {
  await open_the_contact(node, name)
  const gesture = shown(`${the_chat_slot} [data-part="head"] .gesture`)
  if (!(await until(node, `!!${gesture}`, 30_000))) {
    throw new Error(`no chat on «Un contatto»: ${await its_text(node)}`)
  }
  await evaluate(node, `${gesture}.click()`)
  if (
    !(await until(node, `!!${shown(`${the_conversation} textarea[name="the_message"]`)}`, 15_000))
  ) {
    throw new Error(`no conversation: ${await its_text(node)}`)
  }
}
const give_the_chat_back = async (node) => {
  for (const type of ['keyDown', 'keyUp']) {
    await node.page('Input.dispatchKeyEvent', {
      type,
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
    })
  }
  await sleep(400)
}
const write_in_the_chat = async (node, text) => {
  await type_into(node, `${the_conversation} textarea[name="the_message"]`, text)
  const send = shown(`${the_conversation} button[data-part="send"]`)
  if (!(await until(node, `${send}?.disabled === false`, 5_000))) {
    throw new Error(`«Invia» not enabled: ${await its_text(node)}`)
  }
  await evaluate(node, `${send}.click()`)
}
/** The field of the conversation and its note, for a fault's report. */
const the_field = (node) =>
  quietly(
    node,
    `(() => { const c = ${shown(the_conversation)}; return c === undefined ? 'no conversation' : 'the field «' + c.querySelector('textarea')?.value + '», its note ' + c.querySelector('[data-part="note"][role="status"]')?.dataset.state + ': ' + c.innerText.replace(/\\s+/g, ' ').trim().slice(0, 300) })()`,
  )
/** The messages of the conversation shown: whose, its state, its text; in the order of their texts. */
const the_messages_in = `${all_shown(`${the_conversation} [data-part="a-message"]`)}.map((m) => ({ whose: m.dataset.whose, state: m.dataset.state, text: m.querySelector('[data-part="text"]')?.textContent ?? '' })).sort((a, b) => a.text.localeCompare(b.text))`
const the_messages = (node) => quietly(node, the_messages_in)
const a_message_is = (whose, text, state) =>
  `${all_shown(`${the_conversation} [data-part="a-message"][data-whose="${whose}"]${state === undefined ? '' : `[data-state="${state}"]`}`)}.some((m) => m.querySelector('[data-part="text"]')?.textContent === ${JSON.stringify(text)})`
/** The line of the chat on her contact's row, on her contacts' screen. */
const the_line = (node) =>
  quietly(
    node,
    `(() => { const line = ${shown('.the-chat[data-where="in_its_place"]')}; return line === undefined ? null : { state: line.dataset.state, to_read: line.dataset.toRead ?? null, text: line.innerText.replace(/\\s+/g, ' ').trim() } })()`,
  )
const until_the_line = async (node, text, to_read, ms) => {
  const end = Date.now() + ms
  while (Date.now() < end) {
    const line = await the_line(node)
    if (line?.text.includes(text) && (to_read === undefined || line.text.includes(to_read)))
      return line
    await sleep(200)
  }
  throw new Error(
    `the row's line is not «${text}${to_read ? ` … ${to_read}` : ''}» in ${ms / 1000} s: ${JSON.stringify(await the_line(node))}`,
  )
}

let anna
let bruno
try {
  await step("the site's release", async () => {
    let response
    for (let attempt = 1; attempt <= tries; attempt++) {
      response = await fetch(new URL(`phone/src/build_info.js?at=${Date.now()}`, site), {
        cache: 'no-store',
      })
      if (response.status !== 429) break
      report.too_many_requests.the_release = (report.too_many_requests.the_release ?? 0) + 1
      if (attempt < tries) await sleep(pause_before(attempt))
    }
    if (!response.ok) throw new Error(`build_info.js: ${response.status}`)
    const text = await response.text()
    const said = (key) => new RegExp(`"${key}": "([^"]*)"`).exec(text)?.[1]
    report.release = { commit: said('commit'), relay: said('relay'), channel: said('channel') }
    if (commit !== undefined && report.release.commit !== commit) {
      throw new Error(`the site serves ${report.release.commit}, not ${commit}`)
    }
    if (report.release.relay !== relay) {
      throw new Error(`the site declares ${report.release.relay}, not ${relay}`)
    }
    return `${report.release.channel} ${report.release.commit} on ${report.release.relay}`
  })
  anna = await open_node('anna')
  const anna_ok = await step("Anna's first face", () => the_first_face(anna, 'Anna'))
  bruno = await open_node('bruno')
  const bruno_ok = await step("Bruno's first face", () => the_first_face(bruno, 'Bruno'))
  if (anna_ok && bruno_ok) {
    await step('Both apps installed, their pages the workers’ (PWA-8)', async () => {
      const annas = await the_app_installed(anna)
      const brunos = await the_app_installed(bruno)
      return `Anna: ${annas}; Bruno: ${brunos}`
    })
  }
  let link
  const handshake =
    anna_ok &&
    bruno_ok &&
    (await step('Anna makes the link', async () => {
      await from_the_menu(anna, 'Stretta di mano a distanza', 'Stretta di mano a distanza')
      await tap(anna, 'Crea il link')
      if (!(await until(anna, `!!document.querySelector('input[name=link]')?.value`, 30_000))) {
        throw new Error(`no link: ${await its_text(anna)}`)
      }
      link = await evaluate(anna, `document.querySelector('input[name=link]').value`)
      return link.slice(0, 60) + '…'
    })) &&
    (await step('Bruno opens it and accepts', async () => {
      await bruno.page('Page.navigate', { url: link })
      if (!(await until_the_title(bruno, 'Un invito', 30_000))) {
        throw new Error(`no invitation: ${await its_text(bruno)}`)
      }
      await tap(bruno, 'Accetta')
      await back_to_the_contacts(bruno).catch(() => undefined)
      if (!(await until_the_text(bruno, 'Anna', relay_wait_ms))) {
        throw new Error(`Anna not among Bruno's contacts: ${await its_text(bruno)}`)
      }
    })) &&
    (await step('Anna has Bruno among her contacts, through the relay', async () => {
      await back_to_the_contacts(anna)
      if (!(await until_the_text(anna, 'Bruno', relay_wait_ms))) {
        throw new Error(`Bruno not among Anna's contacts: ${await its_text(anna)}`)
      }
    }))
  if (handshake) {
    const anna_s =
      (await step('Anna activates ping pong', () => activate(anna, 'Ping pong'))) &&
      (await step('Anna offers it to Bruno', () => offer_ping_pong(anna, 'Bruno')))
    if (anna_s) {
      await step('Anna pings Bruno, who has not activated it: silence', async () => {
        const seconds = await a_ping(anna, 'Bruno', 'nessuna risposta', silence_wait_ms)
        report.silence_seconds = seconds
        return `«nessuna risposta» after ${seconds.toFixed(1)} s`
      })
    }
    const bruno_s =
      (await step('Bruno activates ping pong', () => activate(bruno, 'Ping pong'))) &&
      (await step('Bruno offers it to Anna', () => offer_ping_pong(bruno, 'Anna')))
    if (anna_s && bruno_s) {
      await step('Anna pings Bruno: the pong, through the relay', async () => {
        const seconds = await a_ping(anna, 'Bruno', 'pong!', relay_wait_ms)
        report.ping_to_pong_seconds = seconds
        return `«pong!» ${seconds.toFixed(1)} s after the tap`
      })
      await step('Bruno pings Anna: the pong, the other way', async () => {
        const seconds = await a_ping(bruno, 'Anna', 'pong!', relay_wait_ms)
        report.ping_to_pong_back_seconds = seconds
        return `«pong!» ${seconds.toFixed(1)} s after the tap`
      })
    }
    // Story 20 of messaging (its README): the chat of their bond, from end
    // to end through the relay.
    const both =
      (await step('Anna activates messaging', () => activate(anna, 'Messaggi'))) &&
      (await step('Bruno activates messaging', () => activate(bruno, 'Messaggi')))
    let opened = 0
    const chat =
      both &&
      (await step('Anna writes to Bruno, his page closed: «in uscita»', async () => {
        await bruno.page('Page.navigate', { url: 'about:blank' })
        await open_the_chat(anna, 'Bruno')
        await write_in_the_chat(anna, 'Ciao Bruno')
        if (!(await until(anna, a_message_is('mine', 'Ciao Bruno', 'on_its_way'), 15_000))) {
          throw new Error(
            `not «in uscita»: ${JSON.stringify(await the_messages(anna))}; ${await the_field(anna)}`,
          )
        }
      })) &&
      (await step('Bruno opens his page: Anna’s row, «1 da leggere»', async () => {
        opened = Date.now()
        await open_the_site(bruno, site, 'I miei contatti')
        const line = await until_the_line(bruno, 'Ciao Bruno', '1 da leggere', relay_wait_ms)
        if (line.to_read !== 'some') throw new Error(`the line: ${JSON.stringify(line)}`)
        const seconds = (Date.now() - opened) / 1000
        report.row_to_read_seconds = seconds
        return `«${line.text}» ${seconds.toFixed(1)} s after the opening`
      })) &&
      (await step('Bruno’s conversation: «Ciao Bruno» with its annotations', async () => {
        await open_the_chat(bruno, 'Anna')
        if (!(await until(bruno, a_message_is('theirs', 'Ciao Bruno', 'received'), 15_000))) {
          throw new Error(`no «Ciao Bruno»: ${JSON.stringify(await the_messages(bruno))}`)
        }
        await evaluate(
          bruno,
          `${shown(`${the_conversation} [data-part="a-message"][data-whose="theirs"] button[data-part="meta"]`)}.click()`,
        )
        const annotations = await evaluate(
          bruno,
          `[...document.querySelectorAll('${the_conversation} [data-part="annotations"]:not([hidden])')].map((dl) => dl.innerText.replace(/\\s+/g, ' ').trim()).join(' | ')`,
        )
        for (const said of [
          'Firma',
          'valida: è di un tuo contatto',
          'Casella',
          'quella del vostro legame',
          'Ora dichiarata',
        ]) {
          if (!annotations.includes(said))
            throw new Error(`no «${said}» in its annotations: ${annotations}`)
        }
        return annotations.slice(0, 200)
      })) &&
      (await step('Anna’s message: «consegnato»', async () => {
        if (!(await until(anna, a_message_is('mine', 'Ciao Bruno', 'delivered'), relay_wait_ms))) {
          throw new Error(`not «consegnato»: ${JSON.stringify(await the_messages(anna))}`)
        }
        const stage = await evaluate(
          anna,
          `${shown(`${the_conversation} [data-part="a-message"][data-whose="mine"] [data-part="stage"]`)}.textContent.trim()`,
        )
        if (stage !== 'consegnato') throw new Error(`the stage reads «${stage}»`)
        const seconds = (Date.now() - opened) / 1000
        report.delivered_seconds = seconds
        return `«${stage}» ${seconds.toFixed(1)} s after Bruno’s opening`
      })) &&
      (await step('Bruno answers: Anna’s row, her conversation, his «consegnato»', async () => {
        await give_the_chat_back(anna)
        await back_to_the_contacts(anna)
        const written = Date.now()
        await write_in_the_chat(bruno, 'Ciao Anna')
        const line = await until_the_line(anna, 'Ciao Anna', '1 da leggere', relay_wait_ms)
        const seconds = (Date.now() - written) / 1000
        await open_the_chat(anna, 'Bruno')
        if (!(await until(anna, a_message_is('theirs', 'Ciao Anna', 'received'), 15_000))) {
          throw new Error(`no «Ciao Anna»: ${JSON.stringify(await the_messages(anna))}`)
        }
        if (!(await until(bruno, a_message_is('mine', 'Ciao Anna', 'delivered'), relay_wait_ms))) {
          throw new Error(`his not «consegnato»: ${JSON.stringify(await the_messages(bruno))}`)
        }
        const delivered = (Date.now() - written) / 1000
        report.answer_row_seconds = seconds
        report.answer_delivered_seconds = delivered
        return `«${line.text}» ${seconds.toFixed(1)} s after his «Invia», «consegnato» at ${delivered.toFixed(1)} s`
      }))
    if (chat) {
      await step('Both reload: both chats as they were', async () => {
        const expected = {
          anna: [
            { whose: 'mine', state: 'delivered', text: 'Ciao Bruno' },
            { whose: 'theirs', state: 'received', text: 'Ciao Anna' },
          ],
          bruno: [
            { whose: 'theirs', state: 'received', text: 'Ciao Bruno' },
            { whose: 'mine', state: 'delivered', text: 'Ciao Anna' },
          ],
        }
        for (const [node, other] of [
          [anna, 'Bruno'],
          [bruno, 'Anna'],
        ]) {
          await node.page('Page.reload', {})
          // The page opens again at her contacts, or at the screen of its address (WEB-25).
          if (!(await until(node, `${shown('h1')} !== undefined`, open_wait_ms))) {
            throw new Error(`${node.label}: not open again: ${await its_text(node)}`)
          }
          await back_to_the_contacts(node)
          const line = await until_the_line(node, 'Ciao Anna', undefined, 30_000)
          if (line.to_read !== 'none')
            throw new Error(`${node.label}'s line: ${JSON.stringify(line)}`)
          await open_the_chat(node, other)
          const wanted = JSON.stringify(
            [...expected[node.label]].sort((a, b) => a.text.localeCompare(b.text)),
          )
          if (
            !(await until(
              node,
              `JSON.stringify(${the_messages_in}) === ${JSON.stringify(wanted)}`,
              15_000,
            ))
          ) {
            throw new Error(
              `${node.label}'s chat after the reload: ${JSON.stringify(await the_messages(node))}`,
            )
          }
        }
      })
    }
  }
} catch (fault) {
  report.steps.push({ step: 'the round', outcome: 'failed', why: String(fault) })
  console.log(`FAIL  the round: ${fault}`)
}
report.ended_at = new Date().toISOString()
writeFileSync(out_file, JSON.stringify(report, null, 2))
console.log(
  `answers 429: ${JSON.stringify(report.too_many_requests)}; loads: ${JSON.stringify(report.loads)}; the worker: ${JSON.stringify(report.worker)}; report: ${out_file}`,
)
// The round's steps: the release, the faces, the install, the handshake (3),
// ping pong (7), messaging (story 20: 7).
const all_ok = report.steps.length === 22 && report.steps.every((one) => one.outcome === 'ok')
clean_all()
process.exit(all_ok ? 0 : 1)
