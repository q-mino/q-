// The relay's settings, from its environment (REL-1): the port it listens on
// (on 127.0.0.1 only, a proxy before it), where its database is, and the free
// space its disk keeps (REL-3). Each has a default but the database, which
// is under the state directory systemd gives (`STATE_DIRECTORY`), or named.
// Read once, at the start: a setting out of form is a fault of the start,
// and the relay does not start. [Q, C, 25 Nov 2026]

import { join } from 'node:path'
import * as z from 'zod'

/** What the relay is started with. */
export interface Settings {
  /** The port on 127.0.0.1; 0, one the system picks (the tests'). */
  readonly port: number
  /** The database's file (MBX-8). */
  readonly database: string
  /** The free space the disk keeps, below which a deposit is refused (REL-3). */
  readonly kept_free: { readonly bytes: number; readonly percent: number }
}

/** The settings read: the relay's, or the faults of those out of form. */
export type SettingsRead =
  | { readonly read: 'settings'; readonly settings: Settings }
  | { readonly read: 'faults'; readonly faults: readonly string[] }

/** The environment, as the process has it. */
export type Environment = Readonly<Record<string, string | undefined>>

/** The names of the settings in the environment. */
export const names = {
  port: 'CUMINO_RELAY_PORT',
  database: 'CUMINO_RELAY_DATABASE',
  kept_free_bytes: 'CUMINO_RELAY_KEEP_FREE_BYTES',
  kept_free_percent: 'CUMINO_RELAY_KEEP_FREE_PERCENT',
  state_directory: 'STATE_DIRECTORY',
} as const

/** The defaults: the port, and the greater of 1 GiB and a tenth of the disk (REL-3). */
export const defaults = {
  port: 8080,
  kept_free_bytes: 1024 ** 3,
  kept_free_percent: 10,
  database_in_the_state_directory: 'relay.sqlite',
} as const

const a_whole_number = (from: number, to: number) =>
  z
    .string()
    .regex(/^\d+$/, 'a whole number')
    .transform(Number)
    .pipe(z.number().int().min(from).max(to))

const the_environment = z.object({
  [names.port]: a_whole_number(0, 65_535).default(defaults.port),
  [names.database]: z.string().min(1).optional(),
  [names.kept_free_bytes]: a_whole_number(0, Number.MAX_SAFE_INTEGER).default(
    defaults.kept_free_bytes,
  ),
  [names.kept_free_percent]: a_whole_number(0, 100).default(defaults.kept_free_percent),
  [names.state_directory]: z.string().optional(),
})

/** The database's file: named, or in the first state directory systemd gives. */
const the_database = (
  named: string | undefined,
  state_directory: string | undefined,
): string | undefined => {
  if (named !== undefined) return named
  const first = state_directory?.split(':')[0]
  return first === undefined || first === ''
    ? undefined
    : join(first, defaults.database_in_the_state_directory)
}

/** The relay's settings from its environment, or why not. */
export const the_settings_of = (environment: Environment): SettingsRead => {
  const parsed = the_environment.safeParse(environment)
  if (!parsed.success) {
    return {
      read: 'faults',
      faults: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    }
  }
  const read = parsed.data
  const database = the_database(read[names.database], read[names.state_directory])
  if (database === undefined) {
    return {
      read: 'faults',
      faults: [`${names.database}: no database, and no ${names.state_directory} to put it in`],
    }
  }
  return {
    read: 'settings',
    settings: {
      port: read[names.port],
      database,
      kept_free: { bytes: read[names.kept_free_bytes], percent: read[names.kept_free_percent] },
    },
  }
}
