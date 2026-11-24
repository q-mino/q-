// `node scripts/screens.mjs`: photographs the gallery page of the app in
// headless Chrome, as an Android phone, in light and dark, one PNG per story
// and theme: `<out>/<story>.light.png`, `<out>/<story>.dark.png`. No
// dependencies: Chrome is driven over the DevTools protocol with Node's own
// `WebSocket` and `fetch`.
//
// The gallery is served by `node packages/phone/build/serve.ts --gallery
// --port <n>` at `http://localhost:<n>/q-/galleria.html`; every story is an
// element with `data-story="<id>"`, and `galleria.html?story=<id>&theme=<t>`
// shows that story alone, setting `document.documentElement.dataset.ready =
// 'yes'` when it is drawn. Without `--url` the script starts that server on a
// free port and stops it at the end (also on errors and signals).
//
// The phone: 412 x 915 css pixels at 2.625 (a Pixel-sized screen), touch, the
// Android Chrome user agent, `prefers-color-scheme` of the theme and, if Chrome
// accepts it, `display-mode: standalone` (the installed PWA). Chrome rejects
// an unknown media feature in `Emulation.setEmulatedMedia`; then the feature is
// dropped silently and the shot goes on without it.
//
// With `--forced-dark` Chrome is launched a second time with
// `WebContentsForceDark` ("darken websites") and each story is photographed
// with light media into `<id>.forced-dark.png`: it shows whether a page that
// declares `color-scheme: light dark` is spoiled by that setting.
//
// Every wait is bounded, so the run always ends. The exit code is 1 if any
// shot failed, or any story of a screen whose play failed (WEB-29).
//
// Usage: node scripts/screens.mjs [--url <gallery url>] [--out <dir>]
//   [--only <substring>] [--forced-dark]
import { spawn } from 'node:child_process'
import { Buffer } from 'node:buffer'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { URL } from 'node:url'
import console from 'node:console'
import process from 'node:process'
import { clearTimeout, setTimeout } from 'node:timers'

const root = join(import.meta.dirname, '..')
// Node's global, which ESLint's globals do not list.
const { WebSocket } = globalThis

const args = process.argv.slice(2)
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
const given_url = option('--url')
const out_dir = resolve(root, option('--out') ?? 'screens')
const only = option('--only')
const forced_dark = args.includes('--forced-dark')
const chrome_path = process.env.CHROME ?? '/usr/bin/google-chrome'

const phone = { width: 412, height: 915, scale: 2.625 }
const user_agent =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/130.0.0.0 Mobile Safari/537.36'
const ready_wait_ms = 10_000
const startup_wait_ms = 20_000
const call_wait_ms = 30_000

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))
// A promise that fails with `message` if it takes longer than `ms`.
const bounded = (promise, ms, message) => {
  let timer
  const limit = new Promise((_, fail) => {
    timer = setTimeout(() => fail(new Error(message)), ms)
  })
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer))
}

// What must be cleaned at the end, whatever the end: child processes and
// the temporary profiles.
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

const free_port = () =>
  new Promise((done, fail) => {
    const probe = createServer()
    probe.on('error', fail)
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address()
      probe.close(() => done(port))
    })
  })

// A child process, with a line reader on one of its streams: resolves with the
// first match of `pattern` in a line.
const spawn_until = (command, command_args, stream_name, pattern, label) => {
  const child = spawn(command, command_args, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  // The whole group: Chrome's helper processes go with it.
  cleanups.push(() => process.kill(-child.pid, 'SIGKILL'))
  let seen = ''
  const found = new Promise((done, fail) => {
    const on_data = (chunk) => {
      seen += chunk.toString()
      const match = pattern.exec(seen)
      if (match) done(match[0])
    }
    child[stream_name].on('data', on_data)
    child.on('error', fail)
    child.on('exit', (code) =>
      fail(new Error(`${label} exited (${code}) before it was ready:\n${seen}`)),
    )
  })
  return {
    child,
    ready: bounded(found, startup_wait_ms, `${label} was not ready in ${startup_wait_ms} ms`),
  }
}

// One DevTools connection to the browser; commands of a page go with its
// sessionId (flat sessions).
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
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
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
  return { send, close: () => socket.close() }
}

// Chrome with a fresh profile; returns the connection to its browser target.
const launch_chrome = async (extra_args) => {
  const profile = mkdtempSync(join(tmpdir(), 'screens-chrome-'))
  // Pushed before Chrome's own kill, so that it runs after it.
  cleanups.push(() => rmSync(profile, { recursive: true, force: true, maxRetries: 5 }))
  const { ready } = spawn_until(
    chrome_path,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      ...extra_args,
      'about:blank',
    ],
    'stderr',
    /DevTools listening on (ws:\/\/\S+)/,
    'Chrome',
  )
  const line = await ready
  return connect(/ws:\/\/\S+/.exec(line)[0])
}

// A page of the phone: a target of its own, its session attached.
const open_phone = async (browser) => {
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true })
  const page = (method, params) => browser.send(method, params, sessionId)
  await page('Page.enable')
  await page('Emulation.setDeviceMetricsOverride', {
    width: phone.width,
    height: phone.height,
    deviceScaleFactor: phone.scale,
    mobile: true,
  })
  await page('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await page('Emulation.setUserAgentOverride', { userAgent: user_agent })
  return page
}

const emulate_media = async (page, scheme) => {
  const features = [{ name: 'prefers-color-scheme', value: scheme }]
  try {
    await page('Emulation.setEmulatedMedia', {
      features: [...features, { name: 'display-mode', value: 'standalone' }],
    })
  } catch {
    // This Chrome does not take `display-mode`: without it.
    await page('Emulation.setEmulatedMedia', { features })
  }
}

const evaluate = async (page, expression) => {
  const { result, exceptionDetails } = await page('Runtime.evaluate', {
    expression,
    returnByValue: true,
  })
  if (exceptionDetails) throw new Error(exceptionDetails.text)
  return result.value
}

const wait_for = async (page, expression, ms, message) => {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    if (await evaluate(page, expression).catch(() => false)) return
    await sleep(100)
  }
  throw new Error(message)
}

const url_of = (gallery, story, theme) => {
  const url = new URL(gallery)
  url.searchParams.set('story', story)
  url.searchParams.set('theme', theme)
  return url.href
}

const gallery_url = (base) => {
  const url = new URL(base)
  if (!url.pathname.endsWith('.html'))
    url.pathname = `${url.pathname.replace(/\/?$/, '/')}galleria.html`
  return url.href
}

// One shot: the story in the theme, the whole page height, into the file.
const shoot = async (page, gallery, story, theme, media, file) => {
  await emulate_media(page, media)
  await page('Page.navigate', { url: url_of(gallery, story, theme) })
  await wait_for(
    page,
    `document.documentElement.dataset.ready === 'yes' && location.search.includes(${JSON.stringify(`story=${story}`)})`,
    ready_wait_ms,
    `the page was not ready in ${ready_wait_ms / 1000} s`,
  )
  const { contentSize } = await page('Page.getLayoutMetrics')
  const { data } = await page('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: phone.width, height: Math.ceil(contentSize.height), scale: 1 },
  })
  writeFileSync(file, Buffer.from(data, 'base64'))
  // A story of a screen whose play did not reach its case (WEB-29): shot, and failed.
  if (await evaluate(page, `document.querySelector('[data-state="its_play_failed"]') !== null`))
    throw new Error('its play failed: the story does not show its case')
}

const stories_of = async (page, gallery) => {
  await page('Page.navigate', { url: gallery })
  await wait_for(
    page,
    `document.querySelector('[data-story]') !== null`,
    ready_wait_ms,
    `no [data-story] element at ${gallery} in ${ready_wait_ms / 1000} s`,
  )
  const ids = await evaluate(
    page,
    `[...new Set([...document.querySelectorAll('[data-story]')].map((e) => e.dataset.story))]`,
  )
  return only ? ids.filter((id) => id.includes(only)) : ids
}

// Every story in its shots, with one Chrome; returns the failed count.
const run_chrome = async (gallery, ids, extra_args, shots) => {
  const browser = await launch_chrome(extra_args)
  let failed = 0
  try {
    const page = await open_phone(browser)
    for (const id of ids) {
      for (const { theme, media, name } of shots) {
        const file = join(out_dir, `${id}.${name}.png`)
        try {
          await shoot(page, gallery, id, theme, media, file)
          console.log(`ok   ${file}`)
        } catch (error) {
          failed += 1
          console.log(`FAIL ${id}.${name}: ${error.message}`)
        }
      }
    }
  } finally {
    browser.close()
  }
  return failed
}

const main = async () => {
  let base = given_url
  if (base === undefined) {
    const port = await free_port()
    const { ready } = spawn_until(
      process.execPath,
      ['packages/phone/build/serve.ts', '--gallery', '--port', String(port)],
      'stdout',
      /http:\/\/(localhost|127\.0\.0\.1):\d+\/q-\//,
      'The gallery server',
    )
    base = await ready
  }
  const gallery = gallery_url(base)
  mkdirSync(out_dir, { recursive: true })

  // The first Chrome lists the stories and takes the light and dark shots.
  const lister = await launch_chrome([])
  let ids
  try {
    ids = await stories_of(await open_phone(lister), gallery)
  } finally {
    lister.close()
  }
  if (ids.length === 0) throw new Error(`no story${only ? ` with "${only}"` : ''} at ${gallery}`)

  let failed = await run_chrome(
    gallery,
    ids,
    [],
    [
      { theme: 'light', media: 'light', name: 'light' },
      { theme: 'dark', media: 'dark', name: 'dark' },
    ],
  )
  let count = ids.length * 2
  if (forced_dark) {
    failed += await run_chrome(
      gallery,
      ids,
      ['--enable-features=WebContentsForceDark'],
      [{ theme: 'light', media: 'light', name: 'forced-dark' }],
    )
    count += ids.length
  }
  console.log(`${count - failed} of ${count} shots in ${out_dir}`)
  return failed === 0 ? 0 : 1
}

main().then(
  (code) => {
    clean_all()
    process.exit(code)
  },
  (error) => {
    console.error(error.message)
    clean_all()
    process.exit(1)
  },
)
