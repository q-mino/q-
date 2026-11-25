// `node scripts/end_to_end.mjs`: Cumino from end to end, on a published
// site and its relay (step 24, part 3): two nodes, each a headless Chrome of
// its own (two `--user-data-dir`, two origins of storage that share nothing),
// driven over the DevTools protocol as `scripts/screens.mjs` drives the
// gallery, with no dependency.
//
// The round, as a person does it on the screens, by their Italian words:
//   1. Anna's first face, then Bruno's (one profile loaded at a time: a cold
//      load is ~900 requests, and GitHub Pages answers 429 to many of them).
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
//
// First the site's release (`phone/src/build_info.js`, past the CDN's cache):
// its commit, which must be `--commit`'s when given, and its relay, which must
// be `--relay`. A request answered 429 is counted; a page (or the release)
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
  browser.listen((message) => {
    if (message.sessionId !== sessionId) return
    if (message.method === 'Network.responseReceived' && message.params.response.status === 429) {
      report.too_many_requests[label] += 1
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
      const input = document.querySelector(${JSON.stringify(selector)});
      if (!input) return false;
      input.focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)});
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

const activate_ping_pong = async (node) => {
  await from_the_menu(node, 'Estensioni', 'Estensioni')
  await tap(node, 'Ping pong', { contains: true })
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
      (await step('Anna activates ping pong', () => activate_ping_pong(anna))) &&
      (await step('Anna offers it to Bruno', () => offer_ping_pong(anna, 'Bruno')))
    if (anna_s) {
      await step('Anna pings Bruno, who has not activated it: silence', async () => {
        const seconds = await a_ping(anna, 'Bruno', 'nessuna risposta', silence_wait_ms)
        report.silence_seconds = seconds
        return `«nessuna risposta» after ${seconds.toFixed(1)} s`
      })
    }
    const bruno_s =
      (await step('Bruno activates ping pong', () => activate_ping_pong(bruno))) &&
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
  }
} catch (fault) {
  report.steps.push({ step: 'the round', outcome: 'failed', why: String(fault) })
  console.log(`FAIL  the round: ${fault}`)
}
report.ended_at = new Date().toISOString()
writeFileSync(out_file, JSON.stringify(report, null, 2))
console.log(
  `answers 429: ${JSON.stringify(report.too_many_requests)}; loads: ${JSON.stringify(report.loads)}; report: ${out_file}`,
)
const all_ok = report.steps.length === 13 && report.steps.every((one) => one.outcome === 'ok')
clean_all()
process.exit(all_ok ? 0 : 1)
