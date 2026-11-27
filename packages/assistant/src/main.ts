// The assistant's main (AST-14, CFG-1): its settings from the environment,
// its node started over its storage (AST-2), its register (AST-3), the
// stand's key (AST-13), the copy (AST-11), the answerer (AST-7); its first
// start (AST-2), then its looks at its pace, the copy made again each day
// and the stand topped up every five minutes; its stop at `SIGTERM` (the
// container's, or systemd's) or `SIGINT`: the answerer's process ended, the
// turn in progress left as the register has it, the node stopped, the
// databases closed. Its journal: a line at the start and at the stop, the
// copy, each turn by its outcome and duration, the faults by kind; never a
// text, a name or a bond. A setting out of form: exit 78 (`EX_CONFIG`).
// Another assistant over the same node: said, and exit 1. [Q, C, 28 Nov 2026]
//
// Usage: node assistant.mjs (the build's), or node src/main.ts.

import { execFileSync } from 'node:child_process'
import { mkdirSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { ids_drawn_at_random, the_device_s_clock, the_time_that_passes } from '@q-mino/adapters-web'
import { claude, scripted, the_system_prompt_file, type Answers } from './answerer/index.ts'
import { the_build, type TheBuild } from './build_info.ts'
import { a_copy_made, the_words_in, type ACopy } from './copy/index.ts'
import { the_node_started } from './node/index.ts'
import { the_register } from './register/index.ts'
import { the_settings_of, type Environment, type Settings } from './settings.ts'
import { the_stand_over_http, the_stand_s_key } from './stand/index.ts'
import { over_a_phone, the_assistant, the_day_of, the_zone } from './the_assistant/index.ts'

/** The exit code of an assistant whose settings are out of form (`sysexits.h`). */
export const out_of_form = 78

/** How often the stand is topped up (AST-13), in milliseconds. */
const the_stand_every = 5 * 60_000

/** The root of the repository, where the sources are run (`node src/main.ts`): the copy's `repo/` unless named. */
const the_sources_root = join(import.meta.dirname, '..', '..', '..')

/** The build of this run: the bundle's, or the checkout's commit read from git. */
const this_build = (): TheBuild => {
  if (the_build.commit !== '0000000000000000000000000000000000000000') return the_build
  try {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: import.meta.dirname,
      encoding: 'utf8',
    }).trim()
    return { ...the_build, commit }
  } catch {
    return the_build
  }
}

const why_of = (fault: unknown): string => (fault instanceof Error ? fault.message : String(fault))

/** A copy made now, told in the journal: how many files, those left out and missing by path. */
const a_copy_told = (settings: Settings, journal: (line: string) => void, stamp: string): ACopy => {
  const copy = a_copy_made(
    {
      source: settings.source,
      repository: settings.repository,
      never_copied: the_words_in(settings.never_copied),
    },
    join(settings.data, 'copy'),
    stamp,
  )
  journal(`the copy made: ${String(copy.files)} files`)
  for (const path of copy.left_out)
    journal(`the copy leaves out ${path}: it holds a word never copied`)
  for (const path of copy.missing) journal(`the copy misses ${path}: not in the source`)
  return copy
}

/** The assistant run from an environment until a signal stops it. */
export const run = async (environment: Environment): Promise<void> => {
  const read = the_settings_of(environment, the_sources_root)
  if (read.read === 'faults') {
    for (const fault of read.faults) console.error(`the assistant's settings: ${fault}`)
    process.exitCode = out_of_form
    return
  }
  const settings = read.settings
  const journal = (line: string): void => {
    console.log(line)
  }
  mkdirSync(settings.data, { recursive: true, mode: 0o700 })
  const clock = the_device_s_clock(the_zone)
  const elapsed = the_time_that_passes
  const started = await the_node_started({
    file: join(settings.data, 'node.sqlite'),
    relay: settings.relay,
    clock,
    elapsed,
    fetch,
    collect_every: settings.collect_every * 1000,
    journal,
  })
  if (started.node === 'another_connection') {
    console.error(
      `another assistant runs over ${join(settings.data, 'node.sqlite')}: this one stops`,
    )
    process.exitCode = 1
    return
  }
  const yesterday = the_day_of(new Date(Date.now() - 86_400_000).toISOString())
  const register = the_register(join(settings.data, 'register.sqlite'), yesterday)
  const { key, drawn } = the_stand_s_key(join(settings.data, 'stand.key'), started.primitives)
  journal(`the stand's key${drawn ? ', drawn now' : ''}, its public half: ${key.public_key}`)
  let copy = a_copy_told(settings, journal, String(Date.now()))
  let copy_day = the_day_of(clock.now())
  const stopping = new AbortController()
  const answers: Answers =
    settings.answerer === 'claude'
      ? claude(
          { model: settings.model, effort: settings.effort, seconds: settings.seconds },
          {
            cage: settings.cage,
            claude: realpathSync(settings.claude),
            configuration: settings.claude_configuration,
            system_prompt: the_system_prompt_file(),
            data: settings.data,
            source: settings.source,
          },
          stopping.signal,
        )
      : scripted()
  const assistant = the_assistant({
    node: over_a_phone(started.phone, clock),
    register,
    answers,
    the_copy: () => copy.folder,
    notes: settings.notes,
    stand: the_stand_over_http({
      relay: settings.relay,
      stand: settings.stand,
      key,
      sign: started.primitives.sign,
      fetch,
    }),
    app: settings.app,
    draws_an_id: ids_drawn_at_random(globalThis.crypto),
    waits_until: async (holds, what) => {
      for (let round = 0; round < 480; round += 1) {
        if (await holds()) return
        await elapsed(250)
      }
      throw new Error(`${what}: not in two minutes`)
    },
    journal,
    numbers: settings.numbers,
  })
  const build = this_build()
  const { made } = await assistant.first_start()
  journal(
    `the assistant ${build.version} (${build.commit}) started: its answerer ${settings.answerer}${settings.answerer === 'claude' ? ` (${settings.model}, ${settings.effort}, caged by ${settings.cage})` : ''}, its copy ${String(copy.files)} files${made.length === 0 ? '' : `; made now: ${made.join(', ')}`}`,
  )
  let on = true
  let wakes = (): void => undefined
  const asleep = new Promise<void>((resolve) => {
    wakes = resolve
  })
  const looks = async (): Promise<void> => {
    let the_stand_last = Number.NEGATIVE_INFINITY
    while (on) {
      if (the_day_of(clock.now()) !== copy_day) {
        try {
          copy = a_copy_told(settings, journal, String(Date.now()))
          copy_day = the_day_of(clock.now())
        } catch (fault) {
          journal(`the copy was not made again: ${why_of(fault)}`)
        }
      }
      try {
        await assistant.a_look()
      } catch (fault) {
        journal(`a look failed: ${why_of(fault)}`)
      }
      if (!stopping.signal.aborted && performance.now() - the_stand_last >= the_stand_every) {
        the_stand_last = performance.now()
        try {
          await assistant.the_stand_topped_up()
        } catch (fault) {
          journal(`the stand was not topped up: ${why_of(fault)}`)
        }
      }
      await Promise.race([elapsed(settings.look_every * 1000), asleep])
    }
  }
  const looking = looks()
  let the_stop: Promise<void> | undefined
  const stop = (): void => {
    the_stop ??= (async () => {
      on = false
      stopping.abort()
      wakes()
      await looking
      await started.stops()
      register.close()
      journal('the assistant stopped')
    })()
  }
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
}

if (import.meta.main) await run(process.env)
