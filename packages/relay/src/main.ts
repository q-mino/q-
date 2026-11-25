// The relay's main (REL-1): its settings from the environment, the relay
// started on this machine, and its stop at `SIGTERM` (systemd's) or `SIGINT`.
// It writes only what the process does: one line when it listens, one when
// it stops, and its faults; nothing about the requests it serves (CFG-3).
// A setting out of form: its faults, and exit code 78 (`EX_CONFIG`), which
// systemd can be told not to restart. [Q, C, 25 Nov 2026]
//
// Usage: node relay.mjs (the build's, REL-5), or node src/main.ts.

import { statfs } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import { the_build } from './build_info.ts'
import { the_settings_of, type Environment } from './settings.ts'
import { the_disk_s_reading_lasts, the_relay_started, type TheMachine } from './start.ts'

/** The exit code of a relay whose settings are out of form (`sysexits.h`). */
export const out_of_form = 78

/** This machine: its system's volumes, its monotonic time, the disk read again every few seconds. */
export const this_machine: TheMachine = {
  read_the_volume: (path) => statfs(path),
  monotonic: () => performance.now(),
  the_disk_is_read_again_after: the_disk_s_reading_lasts,
}

/** The relay run from an environment, on a machine, until a signal stops it. */
export const run = async (environment: Environment, machine: TheMachine): Promise<void> => {
  const read = the_settings_of(environment)
  if (read.read === 'faults') {
    for (const fault of read.faults) console.error(`the relay's settings: ${fault}`)
    process.exitCode = out_of_form
    return
  }
  const running = await the_relay_started(read.settings)(machine)
  // The signals heard before the line that says it listens: whoever reads
  // that line may stop it at once.
  let stopping: Promise<void> | undefined
  const stop = (): void => {
    stopping ??= running.stops().then(() => {
      console.log('the relay stopped')
    })
  }
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
  console.log(`the relay ${the_build.version} (${the_build.commit}) listens on ${running.origin}`)
}

if (import.meta.main) await run(process.env, this_machine)
