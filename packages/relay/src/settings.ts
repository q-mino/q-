// The relay's settings, from its environment (REL-1): the port it listens on
// (on 127.0.0.1 only, a proxy before it), where its database is, the free
// space its disk keeps (REL-3), and its stands (INV-6). Each has a default but the database, which
// is under the state directory systemd gives (`STATE_DIRECTORY`), or named.
// Read once, at the start: a setting out of form is a fault of the start,
// and the relay does not start. [Q, C, 25 Nov 2026]

import { join } from 'node:path'
import * as z from 'zod'

/**
 * A stand of the relay (INV-6): its name, also its page's path; its
 * inviter's public key, Ed25519 in base64url (SEA-1's form), or none yet
 * (the page then says the assistant is not there yet, and no leave
 * verifies); the app its links open.
 */
export interface Stand {
  readonly name: string
  readonly inviter: string | undefined
  readonly app: string
}

/** What the relay is started with. */
export interface Settings {
  /** The port on 127.0.0.1; 0, one the system picks (the tests'). */
  readonly port: number
  /** The database's file (MBX-8). */
  readonly database: string
  /** The free space the disk keeps, below which a deposit is refused (REL-3). */
  readonly kept_free: { readonly bytes: number; readonly percent: number }
  /** The stands it keeps and serves a page of (INV-6, INV-7); by default none. */
  readonly stands: readonly Stand[]
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
  stands: 'CUMINO_RELAY_STANDS',
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

/** The paths of the relay's own, which no stand's page may take (MBX-9, INV-5). */
const the_relay_s_paths = ['depositor', 'holder', 'inviter', 'passer_by']

/** A stand as the settings write it (INV-6). */
const a_stand = z.strictObject({
  name: z
    .string()
    .regex(/^[a-z_]{1,32}$/, 'a name of a to z and _, 1 to 32')
    .refine((name) => !the_relay_s_paths.includes(name), "a path of the relay's own"),
  inviter: z
    .string()
    .regex(/^[A-Za-z0-9_-]{43}$/, 'an Ed25519 public key in base64url')
    .optional(),
  app: z.url({ protocol: /^https$/, hostname: z.regexes.domain }),
})

/** The stands, a JSON list, each name once. */
const the_stands = z
  .string()
  .transform((text, context): unknown => {
    try {
      const parsed: unknown = JSON.parse(text)
      return parsed
    } catch {
      context.addIssue({ code: 'custom', message: 'a JSON list of stands' })
      return z.NEVER
    }
  })
  .pipe(
    z
      .array(a_stand)
      .refine(
        (stands) => new Set(stands.map((stand) => stand.name)).size === stands.length,
        'each stand named once',
      ),
  )

const the_environment = z.object({
  [names.port]: a_whole_number(0, 65_535).default(defaults.port),
  [names.database]: z.string().min(1).optional(),
  [names.kept_free_bytes]: a_whole_number(0, Number.MAX_SAFE_INTEGER).default(
    defaults.kept_free_bytes,
  ),
  [names.kept_free_percent]: a_whole_number(0, 100).default(defaults.kept_free_percent),
  [names.stands]: the_stands.optional(),
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
      stands: (read[names.stands] ?? []).map((stand) => ({
        name: stand.name,
        inviter: stand.inviter,
        app: stand.app,
      })),
    },
  }
}
