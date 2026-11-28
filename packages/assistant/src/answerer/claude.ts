// The `claude` answerer (AST-7, AST-9): Claude Code, `claude -p`, in its
// cage (AST-8), a process of its own for each attempt, in a process group
// of its own (ended whole when its time is over); the prompt on standard
// input, never on the command line (which `ps` shows); its JSON read back:
// the structured output at the top of `--output-format json`'s result
// (`structured_output`, checked with version 2.1.302 on 28 Nov 2026), "Not
// logged in" told by its `result`. [Q, C, 27 Nov 2026]

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { z } from 'zod'
import {
  replied_if_it_fits,
  the_answer_s_json_schema,
  the_prompt_of,
  type AnAnswer,
  type Answers,
} from './the_answer.ts'
import {
  in_the_cage,
  the_deny_rules,
  the_settings_of,
  type ACage,
  type ACommandLine,
} from './the_cage.ts'

/** How Claude Code is started (AST-9, AST-14): the model, the effort, the time of an answer. */
export interface ClaudesSettings {
  readonly model: string
  readonly effort: string
  readonly seconds: number
}

/** Where the answerer's things are, and how it is caged (AST-8). */
export interface ClaudesPlace {
  readonly cage: ACage
  readonly claude: string
  readonly configuration: string
  readonly system_prompt: string
  /** In the container, what the deny rules name beside the copy (AST-8): the node's data, the source of the copy. */
  readonly data: string
  readonly source: string
}

/** Claude Code's arguments (AST-9), the system prompt where the cage puts it; in the container, the deny rules. */
export const claude_s_arguments =
  (settings: ClaudesSettings, deny: readonly string[]) =>
  (where: { readonly system_prompt: string }): readonly string[] => [
    '-p',
    '--model',
    settings.model,
    '--effort',
    settings.effort,
    '--tools',
    'Read,Grep,Glob',
    '--allowedTools',
    'Read,Grep,Glob',
    '--permission-mode',
    'dontAsk',
    '--permission-prompts',
    'none',
    '--restricted',
    '--strict-mcp-config',
    '--disable-slash-commands',
    '--no-chrome',
    '--no-session-persistence',
    '--output-format',
    'json',
    '--json-schema',
    the_answer_s_json_schema(),
    '--system-prompt-file',
    where.system_prompt,
    ...(deny.length === 0 ? [] : ['--settings', the_settings_of(deny)]),
  ]

/** The command line of an attempt over a copy (AST-8, AST-9). */
export const the_command_line = (
  settings: ClaudesSettings,
  place: ClaudesPlace,
  copy: string,
  present: (path: string) => boolean = existsSync,
): ACommandLine =>
  in_the_cage(
    place.cage,
    {
      claude: place.claude,
      copy,
      configuration: place.configuration,
      system_prompt: place.system_prompt,
    },
    claude_s_arguments(
      settings,
      place.cage === 'the_container'
        ? the_deny_rules({
            data: place.data,
            source: place.source,
            configuration: place.configuration,
          })
        : [],
    ),
    present,
  )

/** Claude Code's result, as far as the answerer reads it (`--output-format json`). */
const a_result = z.object({
  is_error: z.boolean(),
  result: z.string().optional(),
  structured_output: z.unknown().optional(),
})

/** What Claude Code says when its configuration has no login (its `result`, 2.1.302: «Not logged in · Please run /login»). */
const not_logged_in = /not logged in|please run \/login|invalid api key|oauth token has expired/i

/** The first line of a text, at most 200 characters: a fault as the journal tells it. */
const the_first_line = (text: string): string => (text.trim().split('\n')[0] ?? '').slice(0, 200)

/**
 * An attempt's output read (AST-7, AST-9): not logged in, from the result
 * or the fault; the structured output parsed, out of its form if it does
 * not; failed otherwise.
 */
export const the_answer_in = (output: string, fault: string, exit: number | null): AnAnswer => {
  const json = ((): unknown => {
    try {
      const parsed: unknown = JSON.parse(output)
      return parsed
    } catch {
      return undefined
    }
  })()
  const result = a_result.safeParse(json)
  const told = result.success ? (result.data.result ?? '') : ''
  if (not_logged_in.test(told) || not_logged_in.test(fault)) return { answer: 'not_logged_in' }
  if (!result.success) return { answer: 'failed', exit, fault: the_first_line(fault || output) }
  if (result.data.is_error) return { answer: 'failed', exit, fault: the_first_line(told || fault) }
  return result.data.structured_output === undefined
    ? { answer: 'out_of_its_form' }
    : replied_if_it_fits(result.data.structured_output)
}

/** The most of Claude Code's output read (a result is a few KiB). */
const the_most_read = 1024 * 1024

/** A process run to its end or its time (AST-6): its output, its fault, its exit; over its time, its group ended. */
export const run_with_its_time = (
  line: ACommandLine,
  input: string,
  seconds: number,
  stopping?: AbortSignal,
): Promise<
  | {
      readonly ran: 'to_its_end'
      readonly output: string
      readonly fault: string
      readonly exit: number | null
    }
  | { readonly ran: 'over_its_time' }
  | { readonly ran: 'stopped' }
  | { readonly ran: 'not_started'; readonly fault: string }
> =>
  new Promise((ends) => {
    if (stopping?.aborted === true) {
      ends({ ran: 'stopped' })
      return
    }
    const child = spawn(line.file, [...line.args], {
      cwd: line.cwd,
      env: { ...line.env },
      detached: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let output = ''
    let fault = ''
    let over = false
    let stopped = false
    const the_group_ended = (): void => {
      if (child.pid === undefined) return
      try {
        process.kill(-child.pid, 'SIGKILL')
      } catch {
        // The group has ended already.
      }
    }
    const timer = setTimeout(() => {
      over = true
      the_group_ended()
    }, seconds * 1000)
    const on_stop = (): void => {
      stopped = true
      the_group_ended()
    }
    stopping?.addEventListener('abort', on_stop, { once: true })
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      if (output.length < the_most_read) output += chunk
    })
    child.stderr.on('data', (chunk: string) => {
      if (fault.length < the_most_read) fault += chunk
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      stopping?.removeEventListener('abort', on_stop)
      ends({ ran: 'not_started', fault: error.message })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      stopping?.removeEventListener('abort', on_stop)
      ends(
        stopped
          ? { ran: 'stopped' }
          : over
            ? { ran: 'over_its_time' }
            : { ran: 'to_its_end', output, fault, exit: code },
      )
    })
    child.stdin.on('error', () => {
      // A process that ended before reading its input: its exit tells it.
    })
    child.stdin.end(input)
  })

/** The `claude` answerer (AST-7): each turn one attempt, in its cage, over the copy of now; its process ended when the node stops (AST-14). */
export const claude =
  (settings: ClaudesSettings, place: ClaudesPlace, stopping?: AbortSignal): Answers =>
  async (turn, copy) => {
    const ran = await run_with_its_time(
      the_command_line(settings, place, copy),
      the_prompt_of(turn),
      settings.seconds,
      stopping,
    )
    if (ran.ran === 'stopped') return { answer: 'stopped' }
    if (ran.ran === 'over_its_time') return { answer: 'over_its_time' }
    if (ran.ran === 'not_started') return { answer: 'failed', exit: null, fault: ran.fault }
    return the_answer_in(ran.output, ran.fault, ran.exit)
  }
