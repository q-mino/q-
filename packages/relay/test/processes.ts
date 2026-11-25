// The relay's main in a process of its own (REL-6): started by `node` on a
// database in a folder of the test, its lines read until it listens, and
// stopped by a signal, as systemd starts and stops it.

import { spawn, type ChildProcess } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** A folder of the test's, outside the repository, removed at its end. */
export const a_folder = () => {
  const path = mkdtempSync(join(tmpdir(), 'q-relay-'))
  return {
    path,
    removed: () => {
      rmSync(path, { recursive: true, force: true })
    },
  }
}

/** A relay's process: where it listens, what it wrote, and its end. */
export interface ARelaysProcess {
  readonly origin: string
  /** Its lines on stdout so far. */
  readonly lines: () => readonly string[]
  /** Its stderr so far, but Node's warnings on SQLite. */
  readonly faults: () => string
  /** A signal sent, its exit: its code, or the signal that ended it. */
  readonly stopped: (signal?: NodeJS.Signals) => Promise<number | NodeJS.Signals>
}

/** The process's exit, by its code or its signal. */
const exit_of = (child: ChildProcess): Promise<number | NodeJS.Signals> =>
  new Promise((exits) => {
    if (child.exitCode !== null) exits(child.exitCode)
    else if (child.signalCode !== null) exits(child.signalCode)
    else
      child.once('exit', (code, signal) => {
        exits(code ?? signal ?? 'SIGKILL')
      })
  })

/** Every process a test started, killed at its end if it still runs. */
const started: ChildProcess[] = []

export const kill_what_runs = (): void => {
  for (const child of started.splice(0)) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
  }
}

/**
 * A relay's main started by `node`, with an environment of its own (the
 * port 0: the system picks one), once it says where it listens; or its exit,
 * if it ends first, with what it wrote.
 */
export const a_relay_process = async (
  entry: string,
  environment: Readonly<Record<string, string>>,
): Promise<ARelaysProcess> => {
  const child = spawn(process.execPath, [entry], {
    env: { PATH: process.env['PATH'] ?? '', CUMINO_RELAY_PORT: '0', ...environment },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  started.push(child)
  const lines: string[] = []
  let pending = ''
  let faults = ''
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (chunk: string) => {
    faults += chunk
  })
  const origin = new Promise<string>((listens, fails) => {
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      pending += chunk
      for (let end = pending.indexOf('\n'); end !== -1; end = pending.indexOf('\n')) {
        const line = pending.slice(0, end)
        pending = pending.slice(end + 1)
        lines.push(line)
        const listening = / listens on (http:\/\/127\.0\.0\.1:\d+)$/.exec(line)?.[1]
        if (listening !== undefined) listens(listening)
      }
    })
    child.once('exit', (code, signal) => {
      fails(new Error(`the relay ended (${String(code ?? signal)}) before it listened:\n${faults}`))
    })
  })
  return {
    origin: await origin,
    lines: () => lines,
    faults: () =>
      faults
        .split('\n')
        .filter((line) => !/ExperimentalWarning: SQLite|--trace-warnings|^$/.test(line))
        .join('\n'),
    stopped: async (signal = 'SIGTERM') => {
      child.kill(signal)
      return exit_of(child)
    },
  }
}

/** A relay's main that ends by itself (its settings out of form): its exit and its stderr. */
export const a_relay_that_ends = async (
  entry: string,
  environment: Readonly<Record<string, string>>,
): Promise<{ readonly exit: number | NodeJS.Signals; readonly faults: string }> => {
  const child = spawn(process.execPath, [entry], {
    env: { PATH: process.env['PATH'] ?? '', ...environment },
    stdio: ['ignore', 'ignore', 'pipe'],
  })
  started.push(child)
  let faults = ''
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (chunk: string) => {
    faults += chunk
  })
  // Its end once its stderr is read whole ('close', not 'exit').
  const exit = await new Promise<number | NodeJS.Signals>((ends) => {
    child.once('close', (code, signal) => {
      ends(code ?? signal ?? 'SIGKILL')
    })
  })
  return { exit, faults }
}
