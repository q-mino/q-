// The assistant's settings, from its environment (AST-14, REL-1's form):
// read once, at the start; a setting out of form is a fault of the start,
// and the assistant does not start (exit 78). Its folders by default under
// the home (`~/.local/share/cumino-assistente/`, `~/.config/cumino-assistente/`);
// in the container, named (`deploy/assistant/compose.yaml`).
// [Q, C, 27 Nov 2026]; the cage and the documents' folder, 28 Nov 2026.

import { join } from 'node:path'
import * as z from 'zod'
import type { ACage } from './answerer/index.ts'
import type { TheNumbers } from './the_assistant/index.ts'

/** The environment, as the process has it. */
export type Environment = Readonly<Record<string, string | undefined>>

/** What the assistant is started with. */
export interface Settings {
  readonly relay: string
  /** The page the stand's links open (the test site). */
  readonly app: string
  readonly stand: string
  readonly answerer: 'claude' | 'scripted'
  readonly cage: ACage
  /** Claude Code's binary. */
  readonly claude: string
  readonly model: string
  readonly effort: string
  /** The time of an answer, in seconds (AST-6). */
  readonly seconds: number
  readonly numbers: TheNumbers
  /** The node's data: `node.sqlite`, `register.sqlite`, `stand.key`, `copy/`. */
  readonly data: string
  /** The bot's Claude Code configuration. */
  readonly claude_configuration: string
  /** The laptop's words never copied (AST-11). */
  readonly never_copied: string
  /** The project's notes, the copy's source (AST-11). */
  readonly source: string
  /** The repository's documents, the copy's `repo/` (AST-11). */
  readonly repository: string
  /** Where the notes of the requests are written (AST-12). */
  readonly notes: string
  /** How often the assistant looks at its chats, and the collector passes, in seconds. */
  readonly look_every: number
  readonly collect_every: number
}

/** The settings read: the assistant's, or the faults of those out of form. */
export type SettingsRead =
  | { readonly read: 'settings'; readonly settings: Settings }
  | { readonly read: 'faults'; readonly faults: readonly string[] }

/** The names of the settings in the environment. */
export const names = {
  relay: 'CUMINO_ASSISTANT_RELAY',
  app: 'CUMINO_ASSISTANT_APP',
  stand: 'CUMINO_ASSISTANT_STAND',
  answerer: 'CUMINO_ASSISTANT_ANSWERER',
  cage: 'CUMINO_ASSISTANT_CAGE',
  claude: 'CUMINO_ASSISTANT_CLAUDE',
  model: 'CUMINO_ASSISTANT_MODEL',
  effort: 'CUMINO_ASSISTANT_EFFORT',
  seconds: 'CUMINO_ASSISTANT_SECONDS',
  attempts: 'CUMINO_ASSISTANT_ATTEMPTS',
  turns_per_bond: 'CUMINO_ASSISTANT_TURNS_PER_BOND',
  turns_per_day: 'CUMINO_ASSISTANT_TURNS_PER_DAY',
  on_the_stand: 'CUMINO_ASSISTANT_ON_THE_STAND',
  tickets_per_day: 'CUMINO_ASSISTANT_TICKETS_PER_DAY',
  data: 'CUMINO_ASSISTANT_DATA',
  configuration: 'CUMINO_ASSISTANT_CONFIG',
  source: 'CUMINO_ASSISTANT_SOURCE',
  repository: 'CUMINO_ASSISTANT_REPOSITORY',
  notes: 'CUMINO_ASSISTANT_NOTES',
  look_every: 'CUMINO_ASSISTANT_LOOK_EVERY',
  collect_every: 'CUMINO_ASSISTANT_COLLECT_EVERY',
  home: 'HOME',
} as const

const a_whole_number = (from: number, to: number) =>
  z
    .string()
    .regex(/^\d+$/, 'a whole number')
    .transform(Number)
    .pipe(z.number().int().min(from).max(to))

const a_folder = z.string().regex(/^\//, 'an absolute path')

const the_environment = z.object({
  [names.relay]: z
    .url({ protocol: /^https?$/ })
    .default('https://relay.cumino.aleclofabbro.it')
    .transform((url) => url.replace(/\/+$/, '')),
  [names.app]: z.url({ protocol: /^https$/ }).default('https://q-mino-prova.github.io/q-/'),
  [names.stand]: z
    .string()
    .regex(/^[a-z_]{1,32}$/, 'a name of a to z and _, 1 to 32')
    .default('assistente'),
  [names.answerer]: z.enum(['claude', 'scripted']).default('claude'),
  [names.cage]: z.enum(['bwrap', 'the_container']).default('bwrap'),
  [names.claude]: a_folder.optional(),
  [names.model]: z
    .string()
    .regex(/^[a-z0-9.\-[\]]{1,64}$/, 'a model of Claude Code')
    .default('sonnet'),
  [names.effort]: z.enum(['low', 'medium', 'high', 'xhigh', 'max']).default('low'),
  [names.seconds]: a_whole_number(10, 3600).default(180),
  [names.attempts]: a_whole_number(1, 10).default(2),
  [names.turns_per_bond]: a_whole_number(0, 10_000).default(15),
  [names.turns_per_day]: a_whole_number(0, 100_000).default(60),
  [names.on_the_stand]: a_whole_number(0, 100).default(5),
  [names.tickets_per_day]: a_whole_number(0, 1000).default(20),
  [names.data]: a_folder.optional(),
  [names.configuration]: a_folder.optional(),
  [names.source]: a_folder.optional(),
  [names.repository]: a_folder.optional(),
  [names.notes]: a_folder.optional(),
  [names.look_every]: a_whole_number(1, 3600).default(10),
  [names.collect_every]: a_whole_number(1, 3600).default(5),
  [names.home]: a_folder.optional(),
})

/** The assistant's settings from its environment, or why not; the repository's root where the sources are, unless named. */
export const the_settings_of = (
  environment: Environment,
  the_sources_root: string,
): SettingsRead => {
  const parsed = the_environment.safeParse(environment)
  if (!parsed.success)
    return {
      read: 'faults',
      faults: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    }
  const read = parsed.data
  const home = read[names.home]
  const under_home = (...path: string[]): string | undefined =>
    home === undefined ? undefined : join(home, ...path)
  const data = read[names.data] ?? under_home('.local', 'share', 'cumino-assistente')
  const configuration = read[names.configuration] ?? under_home('.config', 'cumino-assistente')
  const source = read[names.source] ?? under_home('my-brain', 'wt', 'q', 'projects', 'q')
  const notes = read[names.notes] ?? (source === undefined ? undefined : join(source, 'richieste'))
  const claude =
    read[names.claude] ??
    (read[names.cage] === 'the_container'
      ? '/usr/local/bin/claude'
      : under_home('.local', 'bin', 'claude'))
  const faults = [
    ...(data === undefined ? [`${names.data}: no folder, and no ${names.home}`] : []),
    ...(configuration === undefined
      ? [`${names.configuration}: no folder, and no ${names.home}`]
      : []),
    ...(source === undefined ? [`${names.source}: no folder, and no ${names.home}`] : []),
    ...(claude === undefined ? [`${names.claude}: no binary, and no ${names.home}`] : []),
  ]
  if (
    faults.length > 0 ||
    data === undefined ||
    configuration === undefined ||
    source === undefined ||
    notes === undefined ||
    claude === undefined
  )
    return { read: 'faults', faults }
  return {
    read: 'settings',
    settings: {
      relay: read[names.relay],
      app: read[names.app],
      stand: read[names.stand],
      answerer: read[names.answerer],
      cage: read[names.cage],
      claude,
      model: read[names.model],
      effort: read[names.effort],
      seconds: read[names.seconds],
      numbers: {
        turns_per_bond: read[names.turns_per_bond],
        turns_per_day: read[names.turns_per_day],
        attempts: read[names.attempts],
        on_the_stand: read[names.on_the_stand],
        tickets_per_day: read[names.tickets_per_day],
        takeable_for_hours: 24,
        logged_out_pause_minutes: 10,
      },
      data,
      claude_configuration: join(configuration, 'claude'),
      never_copied: join(configuration, 'never-copied.txt'),
      source,
      repository: read[names.repository] ?? the_sources_root,
      notes,
      look_every: read[names.look_every],
      collect_every: read[names.collect_every],
    },
  }
}
