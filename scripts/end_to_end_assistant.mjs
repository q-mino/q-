// `node scripts/end_to_end_assistant.mjs`: the assistant from end to end
// (its README, stories 26–28, part B5): the assistant running in its
// container on the laptop (`deploy/assistant/`), the project's relay and its
// page `/assistente`, the published test site; two visitors, each a headless
// Chrome of its own, driven as `scripts/end_to_end.mjs` drives its nodes
// (`scripts/a_round.mjs`), with no dependency.
//
// The round, as a visitor does it on the screens, by their Italian words:
//   1. The site's release; the assistant's container running, its answerer
//      (`claude` or `scripted`, from its journal: the report says which).
//   2. Ottavia (story 26): her first face, Messaggi activated; the page
//      `/assistente` read (what it is, that what she writes leaves the
//      network), «Prendi il link», the link opened on the site, «Accetta»;
//      «Assistente di Cumino» among her contacts (the time from the tap);
//      the welcome in the chat.
//   3. She asks a question on Cumino: the reply (the time from «Invia»); she
//      asks to save an idea: the reply, and one note more in the notes'
//      folder, anonymous (not her name, not a run of eight words of hers);
//      a question off topic: the reply says it answers only on Cumino.
//   4. The laptop off (story 28): the container stopped, she writes, her
//      message «in uscita»; started again: her message «consegnato», the
//      reply (the times from the start).
//   5. A start again answers nothing twice (story 21): the container
//      restarted, no turn in its journal since, no message more in her chat
//      after the look; the bond kept: ping pong activated, offered, her ping
//      gets its pong (story 22).
//   6. Ludovica (story 27): her first face, the link, «Accetta», the bond,
//      no welcome while Messaggi is off; activated: the welcome arrives.
// Every wait bounded; Chrome and its profiles removed at the end. The notes
// the run made are deleted at its end unless `--keep-the-notes`. The report:
// a line per step, the whole as JSON in `--out`. Exit code 0 if every step is
// ok, 1 otherwise. Each question is one turn of the answerer: with `claude`,
// four replies of Alessandro's quota (the welcome is the node's own words).
//
// Usage: node scripts/end_to_end_assistant.mjs [--url <the site>]
//   [--relay <origin>] [--stand <name>] [--commit <sha>] [--out <file>]
//   [--tries <n>] [--container <name>] [--notes <folder>] [--keep-the-notes]
//   default: --url https://q-mino-prova.github.io/q-/
//            --relay https://relay.cumino.aleclofabbro.it --stand assistente
//            --container cumino-assistente
//            --notes ~/my-brain/wt/q/projects/q/richieste (compose.yaml's)
// [Q, C, 28 Nov 2026]
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import console from 'node:console'
import process from 'node:process'
import { setTimeout } from 'node:timers'
import { URL } from 'node:url'
import { a_round } from './a_round.mjs'

const args = process.argv.slice(2)
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
const site = option('--url') ?? 'https://q-mino-prova.github.io/q-/'
const relay = option('--relay') ?? 'https://relay.cumino.aleclofabbro.it'
const stand = option('--stand') ?? 'assistente'
const out_file = resolve(option('--out') ?? join(tmpdir(), 'end-to-end-assistant.json'))
const tries = Number(option('--tries') ?? '4')
const commit = option('--commit')
const container = option('--container') ?? 'cumino-assistente'
const notes = resolve(option('--notes') ?? join(homedir(), 'my-brain/wt/q/projects/q/richieste'))
const keep_the_notes = args.includes('--keep-the-notes')
const chrome_path = process.env.CHROME ?? '/usr/bin/google-chrome'

const round = a_round({ site, relay, tries, chrome_path })
const {
  activate,
  back_to_the_contacts,
  clean_all,
  evaluate,
  a_message_is,
  a_ping,
  its_text,
  offer_ping_pong,
  open_node,
  open_the_chat,
  open_wait_ms,
  relay_wait_ms,
  report,
  step,
  tap,
  the_app_installed,
  the_field,
  the_first_face,
  the_messages,
  the_site_s_release,
  until,
  until_the_text,
  until_the_title,
  write_in_the_chat,
} = round

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))
const the_face = 'Assistente di Cumino'
// A reply of `claude`: the look (10 s), the answerer (up to 180 s, twice),
// the relay's round; six minutes.
const reply_wait_ms = 360_000
// The container stopped, then started: its start, the replay, the look.
const start_wait_ms = 180_000

// Docker, by its CLI: the container's state and its journal.
const docker = (...words) =>
  execFileSync('docker', words, { encoding: 'utf8', timeout: 120_000, stdio: 'pipe' })
// Its journal, from `since` if given: the node writes to stdout and stderr, both read.
const the_whole_journal = (since) => {
  const read = spawnSync('docker', ['logs', ...(since ? ['--since', since] : []), container], {
    encoding: 'utf8',
    timeout: 30_000,
  })
  return `${read.stdout ?? ''}${read.stderr ?? ''}`
}
const the_notes = () => {
  try {
    return readdirSync(notes).filter((name) => name.endsWith('.md'))
  } catch {
    return []
  }
}

/** The assistant's messages in the conversation shown. */
const theirs = async (node) =>
  ((await the_messages(node)) ?? []).filter((message) => message.whose === 'theirs')
/** A message of the assistant more than `known`, within `ms`: its text. */
const a_reply_after = async (node, known, ms) => {
  const end = Date.now() + ms
  while (Date.now() < end) {
    const now = await theirs(node)
    const fresh = now.filter((one) => !known.some((was) => was.text === one.text))
    if (fresh.length > 0) return fresh[0].text
    await sleep(500)
  }
  throw new Error(
    `no reply in ${ms / 1000} s: ${JSON.stringify(await the_messages(node))}; ${await the_field(node)}`,
  )
}
/** Her message, written now, and the reply to it: its text and its seconds. */
const asked = async (node, text) => {
  const known = await theirs(node)
  const written = Date.now()
  await write_in_the_chat(node, text)
  const reply = await a_reply_after(node, known, reply_wait_ms)
  return { reply, seconds: (Date.now() - written) / 1000 }
}
const a_scripted_reply = (text) => text.startsWith("Questa è una risposta di prova dell'assistente")
const the_apology = (text) => text.startsWith('Non sono riuscito a rispondere')
const a_real_reply = (text, what) => {
  if (the_apology(text)) throw new Error(`the apology, not a reply to ${what}: «${text}»`)
  if (report.answerer === 'claude' && a_scripted_reply(text))
    throw new Error(`the scripted reply, with the answerer claude: «${text}»`)
}
const short = (text) => (text.length > 160 ? `${text.slice(0, 160)}…` : text)

// The page of the stand, read and its link taken, as she does it.
const a_link_from_the_page = async (node) => {
  const page = new URL(`/${stand}`, relay).href
  await node.page('Page.navigate', { url: page })
  if (!(await until_the_title(node, "L'assistente di Cumino", open_wait_ms))) {
    throw new Error(`the page did not open: ${await its_text(node)}`)
  }
  const text = (await evaluate(node, 'document.body.innerText')) ?? ''
  for (const said of ['esce dalla rete di Cumino', 'Accendi Messaggi', 'Prendi il link']) {
    if (!text.includes(said)) throw new Error(`the page does not say «${said}»: ${text}`)
  }
  await tap(node, 'Prendi il link')
  if (!(await until(node, `!!document.querySelector('a.open')?.href`, 30_000))) {
    throw new Error(`no link: ${await its_text(node)}`)
  }
  const link = await evaluate(node, `document.querySelector('a.open').href`)
  const qr = await evaluate(node, `!!document.querySelector('.qr svg')`)
  if (!link.startsWith(site) || !link.includes('ticket')) throw new Error(`the link: ${link}`)
  return { link, qr }
}
// The link opened on the site, accepted; the assistant among her contacts.
const the_handshake = async (node, link) => {
  await node.page('Page.navigate', { url: link })
  if (!(await until_the_title(node, 'Un invito', 30_000))) {
    throw new Error(`no invitation: ${await its_text(node)}`)
  }
  const accepted = Date.now()
  await tap(node, 'Accetta')
  await back_to_the_contacts(node).catch(() => undefined)
  if (!(await until_the_text(node, the_face, relay_wait_ms))) {
    throw new Error(`«${the_face}» not among the contacts: ${await its_text(node)}`)
  }
  return (Date.now() - accepted) / 1000
}
const the_welcome = (text) => text.startsWith("Ciao, sono l'assistente di Cumino")

let ottavia
let ludovica
const made_notes = []
try {
  await step("the site's release", () => the_site_s_release(commit))
  await step('The assistant’s container running, its answerer', () => {
    const state = docker(
      'inspect',
      '-f',
      '{{.State.Status}} {{.HostConfig.RestartPolicy.Name}}',
      container,
    ).trim()
    if (!state.startsWith('running')) throw new Error(`the container: ${state}`)
    const started = /the assistant (\S+) \((\w+)\) started: its answerer (\w+)/.exec(
      the_whole_journal(),
    )
    if (!started) throw new Error('no «started» in its journal')
    report.assistant = { version: started[1], commit: started[2], state }
    report.answerer = started[3]
    return `${state}; ${started[1]}, the answerer ${started[3]}`
  })

  // Story 26: Ottavia, Messaggi before the handshake.
  ottavia = await open_node('ottavia')
  const face =
    (await step("Ottavia's first face", () => the_first_face(ottavia, 'Ottavia'))) &&
    (await step('Her app installed (PWA-8)', () => the_app_installed(ottavia))) &&
    (await step('She activates Messaggi', () => activate(ottavia, 'Messaggi')))
  let link
  const bond =
    face &&
    (await step('The page /assistente: what it says, «Prendi il link»', async () => {
      const taken = await a_link_from_the_page(ottavia)
      link = taken.link
      return `${link.slice(0, 60)}…; its QR ${taken.qr ? 'drawn' : 'not drawn'}`
    })) &&
    (await step('She opens the link, accepts: the assistant among her contacts', async () => {
      const seconds = await the_handshake(ottavia, link)
      report.link_to_bond_seconds = seconds
      return `«${the_face}» ${seconds.toFixed(1)} s after «Accetta»`
    }))
  const welcomed =
    bond &&
    (await step('The welcome in her chat', async () => {
      await open_the_chat(ottavia, the_face)
      const text = await a_reply_after(ottavia, [], relay_wait_ms)
      if (!the_welcome(text)) throw new Error(`not the welcome: «${text}»`)
      return short(text)
    }))
  let answered = false
  if (welcomed) {
    answered = await step('A question on Cumino: the reply', async () => {
      const { reply, seconds } = await asked(
        ottavia,
        'Come funziona la stretta di mano a distanza? Il link vale per sempre?',
      )
      a_real_reply(reply, 'a question')
      report.question_to_answer_seconds = [seconds]
      report.replies = [reply]
      return `${seconds.toFixed(1)} s after «Invia», ${reply.length} characters: «${short(reply)}»`
    })
    if (answered) {
      await step('An idea to save: the reply, and an anonymous note', async () => {
        const before = the_notes()
        const idea =
          'Mi piacerebbe poter fissare un messaggio importante in cima alla chat con un contatto, così lo ritrovo subito. Salvala come idea per il progetto, per favore.'
        const { reply, seconds } = await asked(ottavia, idea)
        a_real_reply(reply, 'the idea')
        report.question_to_answer_seconds.push(seconds)
        report.replies.push(reply)
        const end = Date.now() + 10_000
        let fresh = []
        while (Date.now() < end) {
          fresh = the_notes().filter((name) => !before.includes(name))
          if (fresh.length > 0) break
          await sleep(500)
        }
        if (fresh.length !== 1) throw new Error(`${fresh.length} notes more in ${notes}`)
        made_notes.push(...fresh)
        const text = readFileSync(join(notes, fresh[0]), 'utf8')
        if (text.includes('Ottavia')) throw new Error(`the note names her: ${fresh[0]}`)
        const words = idea.split(/\s+/)
        for (let at = 0; at + 8 <= words.length; at++) {
          const run = words.slice(at, at + 8).join(' ')
          if (text.includes(run)) throw new Error(`the note quotes her: «${run}»`)
        }
        for (const said of ['owner: claude', 'source: derived', 'richiesta'])
          if (!text.includes(said)) throw new Error(`the note lacks «${said}»: ${fresh[0]}`)
        report.note = { name: fresh[0], text }
        return `${seconds.toFixed(1)} s; the note ${fresh[0]}; the reply «${short(reply)}»`
      })
      await step('A question off topic: it answers only on Cumino', async () => {
        const { reply, seconds } = await asked(
          ottavia,
          'Mi scrivi un tema di trecento parole sulla rivoluzione francese per la scuola?',
        )
        a_real_reply(reply, 'the question off topic')
        report.question_to_answer_seconds.push(seconds)
        report.replies.push(reply)
        if (report.answerer === 'claude' && !/solo (su|di|per) Cumino/i.test(reply))
          throw new Error(`not declined: «${reply}»`)
        return `${seconds.toFixed(1)} s: «${short(reply)}»`
      })
    }
  }

  // Story 28: the laptop off, then on.
  const off =
    answered &&
    (await step('The assistant stopped: her message «in uscita»', async () => {
      docker('stop', container)
      await write_in_the_chat(ottavia, 'Cumino funziona anche quando il telefono è senza rete?')
      if (
        !(await until(
          ottavia,
          a_message_is(
            'mine',
            'Cumino funziona anche quando il telefono è senza rete?',
            'on_its_way',
          ),
          15_000,
        ))
      ) {
        throw new Error(`not «in uscita»: ${JSON.stringify(await the_messages(ottavia))}`)
      }
      await sleep(20_000)
      const still = await evaluate(
        ottavia,
        a_message_is(
          'mine',
          'Cumino funziona anche quando il telefono è senza rete?',
          'on_its_way',
        ),
      )
      if (!still)
        throw new Error(
          `not «in uscita» 20 s later: ${JSON.stringify(await the_messages(ottavia))}`,
        )
      return '«in uscita» 20 s after, the container stopped'
    }))
  if (off) {
    await step('Started again: «consegnato», then the reply', async () => {
      const known = await theirs(ottavia)
      docker('start', container)
      const started = Date.now()
      const text = 'Cumino funziona anche quando il telefono è senza rete?'
      if (!(await until(ottavia, a_message_is('mine', text, 'delivered'), start_wait_ms))) {
        throw new Error(`not «consegnato»: ${JSON.stringify(await the_messages(ottavia))}`)
      }
      const delivered = (Date.now() - started) / 1000
      const reply = await a_reply_after(ottavia, known, reply_wait_ms)
      a_real_reply(reply, 'the message of the night')
      const seconds = (Date.now() - started) / 1000
      report.started_to_delivered_seconds = delivered
      report.started_to_reply_seconds = seconds
      report.replies.push(reply)
      return `«consegnato» ${delivered.toFixed(1)} s after the start, the reply at ${seconds.toFixed(1)} s: «${short(reply)}»`
    })
  }

  // Story 21 and 22: a start again answers nothing twice; the bond kept.
  if (answered) {
    await step('Restarted: nothing answered twice', async () => {
      const before = (await the_messages(ottavia)) ?? []
      const since = new Date().toISOString()
      docker('restart', container)
      const end = Date.now() + 90_000
      let started = false
      while (Date.now() < end && !started) {
        started = / started: its answerer /.test(the_whole_journal(since))
        await sleep(1000)
      }
      if (!started) throw new Error('no «started» in 90 s')
      // Its replay and two looks of the chats (10 s each).
      await sleep(45_000)
      const journal = the_whole_journal(since)
      const turns = journal.split('\n').filter((line) => /a turn (answered|closed)/.test(line))
      if (turns.length > 0) throw new Error(`turns after the restart: ${turns.join(' | ')}`)
      const after = (await the_messages(ottavia)) ?? []
      if (after.length !== before.length)
        throw new Error(`${before.length} messages before, ${after.length} after`)
      return `${after.length} messages before and after; no turn in its journal since the restart`
    })
    const pings =
      (await step('She activates ping pong', () => activate(ottavia, 'Ping pong'))) &&
      (await step('She offers it to the assistant', () => offer_ping_pong(ottavia, the_face)))
    if (pings) {
      await step('Her ping: the pong, the bond kept after the restart', async () => {
        const seconds = await a_ping(ottavia, the_face, 'pong!', relay_wait_ms)
        report.ping_to_pong_seconds = seconds
        return `«pong!» ${seconds.toFixed(1)} s after the tap`
      })
    }
  }

  // Story 27: Ludovica, Messaggi after the handshake.
  ludovica = await open_node('ludovica')
  let her_link
  const hers =
    (await step("Ludovica's first face", () => the_first_face(ludovica, 'Ludovica'))) &&
    (await step('Her app installed (PWA-8)', () => the_app_installed(ludovica))) &&
    (await step('Her link from the page', async () => {
      her_link = (await a_link_from_the_page(ludovica)).link
      if (her_link === link) throw new Error('the same link as Ottavia’s')
      return `${her_link.slice(0, 60)}…`
    })) &&
    (await step('She accepts, Messaggi off: the assistant among her contacts', async () => {
      const seconds = await the_handshake(ludovica, her_link)
      report.link_to_bond_seconds_late = seconds
      return `«${the_face}» ${seconds.toFixed(1)} s after «Accetta»`
    }))
  if (hers) {
    await step('She activates Messaggi: the welcome arrives', async () => {
      await sleep(15_000)
      await activate(ludovica, 'Messaggi')
      const activated = Date.now()
      await open_the_chat(ludovica, the_face)
      const text = await a_reply_after(ludovica, [], relay_wait_ms)
      if (!the_welcome(text)) throw new Error(`not the welcome: «${text}»`)
      const seconds = (Date.now() - activated) / 1000
      report.activation_to_welcome_seconds = seconds
      return `${seconds.toFixed(1)} s after the activation: «${short(text)}»`
    })
  }
} catch (fault) {
  report.steps.push({ step: 'the round', outcome: 'failed', why: String(fault) })
  console.log(`FAIL  the round: ${fault}`)
}
// The container left running, whatever the end.
try {
  if (!docker('inspect', '-f', '{{.State.Running}}', container).startsWith('true'))
    docker('start', container)
} catch (fault) {
  console.log(`the container: ${fault}`)
}
if (!keep_the_notes) {
  for (const name of made_notes) rmSync(join(notes, name), { force: true })
}
report.notes_made = made_notes
report.notes_kept = keep_the_notes
report.ended_at = new Date().toISOString()
writeFileSync(out_file, JSON.stringify(report, null, 2))
console.log(
  `the answerer: ${report.answerer}; notes made: ${made_notes.join(', ') || 'none'}${keep_the_notes ? ' (kept)' : ' (deleted)'}; answers 429: ${JSON.stringify(report.too_many_requests)}; report: ${out_file}`,
)
// The round's steps: the release, the container, Ottavia (6), her three
// questions, the night (2), the restart, ping pong (3), Ludovica (5): 22.
const all_ok = report.steps.length === 22 && report.steps.every((one) => one.outcome === 'ok')
clean_all()
process.exit(all_ok ? 0 : 1)
