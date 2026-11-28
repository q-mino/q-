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
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { writeFileSync } from 'node:fs'
import console from 'node:console'
import process from 'node:process'
import { a_round } from './a_round.mjs'

const args = process.argv.slice(2)
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
const site = option('--url') ?? 'https://q-mino-prova.github.io/q-/'
const relay = option('--relay') ?? 'https://relay.cumino.aleclofabbro.it'
const out_file = resolve(option('--out') ?? join(tmpdir(), 'end-to-end.json'))
const tries = Number(option('--tries') ?? '4')
const commit = option('--commit')
const chrome_path = process.env.CHROME ?? '/usr/bin/google-chrome'

const round = a_round({ site, relay, tries, chrome_path })
const {
  a_message_is,
  a_ping,
  activate,
  back_to_the_contacts,
  clean_all,
  evaluate,
  from_the_menu,
  give_the_chat_back,
  its_text,
  offer_ping_pong,
  open_node,
  open_the_chat,
  open_the_site,
  open_wait_ms,
  relay_wait_ms,
  report,
  shown,
  silence_wait_ms,
  step,
  tap,
  the_app_installed,
  the_conversation,
  the_field,
  the_first_face,
  the_messages,
  the_messages_in,
  until,
  until_the_line,
  until_the_text,
  until_the_title,
  write_in_the_chat,
} = round

let anna
let bruno
try {
  await step("the site's release", async () => {
    return round.the_site_s_release(commit)
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
