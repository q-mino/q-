// The register (AST-3): the assistant's own notebook, `register.sqlite`
// beside the node's storage and outside it. The turns in progress, each with
// its stage (an ADT); the turns closed, by bond, day and how they closed,
// with no text, for the caps (AST-6); the tickets prepared for the stand, by
// day (AST-13). Plain functions over `node:sqlite`, one statement or one
// transaction per change, synced at each commit; the file readable by its
// user only. The closed turns and the tickets of days before yesterday are
// forgotten at the start (the caps read today's). [Q, C, 27 Nov 2026]

import { chmodSync, closeSync, existsSync, mkdirSync, openSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { z } from 'zod'
import { a_note } from '../answerer/index.ts'

/** How a turn closes (AST-3, AST-6). */
export const how_it_closes = z.enum([
  'replied',
  'the_apology',
  'the_notice_of_a_bond_s_cap',
  'the_notice_of_the_day_s_cap',
  'passed_over',
])

export type HowItCloses = z.output<typeof how_it_closes>

/**
 * A turn's stage (AST-3, AST-4): asked, the answerer working, its attempts;
 * kept, the reply (and the note) kept before anything is written; written,
 * the reply in the chat (or none, a turn passed over), the read mark to make.
 */
export const a_stage = z.discriminatedUnion('stage', [
  z.strictObject({ stage: z.literal('asked'), attempts: z.number().int().min(0) }),
  z.strictObject({
    stage: z.literal('kept'),
    reply: z.string().min(1),
    note: a_note.optional(),
    closes_as: how_it_closes,
  }),
  z.strictObject({ stage: z.literal('written'), closes_as: how_it_closes }),
])

export type AStage = z.output<typeof a_stage>

/** A turn in progress (AST-4): its bond, the last message it covers, when its first was filed, its stage. */
export interface ATurnInProgress {
  readonly bond: string
  readonly through: string
  readonly first_at: string
  readonly stage: AStage
}

/** The register, opened. */
export interface TheRegister {
  readonly turns_in_progress: () => readonly ATurnInProgress[]
  readonly the_turn_of: (bond: string) => ATurnInProgress | undefined
  /** A turn opened, or its stage changed. */
  readonly keeps: (turn: ATurnInProgress) => void
  /** A turn closed: out of the turns in progress, its text with it, into the closed ones of its day; in one transaction. */
  readonly closes: (turn: ATurnInProgress, day: string, how: HowItCloses) => void
  /** The turns closed on a day, how they closed, by bond. */
  readonly closed_on: (
    day: string,
  ) => readonly { readonly bond: string; readonly how: HowItCloses }[]
  /** A ticket prepared for the stand on a day (AST-13): it counts in the day's twenty. */
  readonly a_ticket_prepared: (bond: string, day: string) => void
  readonly tickets_prepared_on: (day: string) => number
  readonly close: () => void
}

const a_row_of_a_turn = z.object({
  bond: z.string(),
  through: z.string(),
  first_at: z.string(),
  stage: z.string(),
})

const a_turn_of = (row: unknown): ATurnInProgress => {
  const read = a_row_of_a_turn.parse(row)
  return {
    bond: read.bond,
    through: read.through,
    first_at: read.first_at,
    stage: a_stage.parse(JSON.parse(read.stage)),
  }
}

/** The register opened from its file (made if new), the days before `forget_before` forgotten. */
export const the_register = (file: string, forget_before: string): TheRegister => {
  const folder = dirname(file)
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true, mode: 0o700 })
  // Made if missing, never a descriptor opened on it (B6: closing one drops this process's locks on it).
  try {
    closeSync(openSync(file, 'wx', 0o600))
  } catch (fault) {
    if (!(fault instanceof Error && 'code' in fault && fault.code === 'EEXIST')) throw fault
  }
  chmodSync(file, 0o600)
  const database = new DatabaseSync(file)
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    CREATE TABLE IF NOT EXISTS turns_in_progress (
      bond TEXT PRIMARY KEY, through TEXT NOT NULL, first_at TEXT NOT NULL, stage TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS turns_closed (
      id INTEGER PRIMARY KEY, bond TEXT NOT NULL, day TEXT NOT NULL, how TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS tickets_prepared (
      bond TEXT PRIMARY KEY, day TEXT NOT NULL
    ) STRICT;
  `)
  database.prepare('DELETE FROM turns_closed WHERE day < ?').run(forget_before)
  database.prepare('DELETE FROM tickets_prepared WHERE day < ?').run(forget_before)
  const in_one_transaction = (change: () => void): void => {
    database.exec('BEGIN IMMEDIATE')
    try {
      change()
      database.exec('COMMIT')
    } catch (fault) {
      database.exec('ROLLBACK')
      throw fault
    }
  }
  const keep = database.prepare(
    `INSERT INTO turns_in_progress (bond, through, first_at, stage) VALUES (?, ?, ?, ?)
     ON CONFLICT (bond) DO UPDATE SET through = excluded.through, first_at = excluded.first_at, stage = excluded.stage`,
  )
  return {
    turns_in_progress: () =>
      database
        .prepare(
          'SELECT bond, through, first_at, stage FROM turns_in_progress ORDER BY first_at, bond',
        )
        .all()
        .map(a_turn_of),
    the_turn_of: (bond) => {
      const row = database
        .prepare('SELECT bond, through, first_at, stage FROM turns_in_progress WHERE bond = ?')
        .get(bond)
      return row === undefined ? undefined : a_turn_of(row)
    },
    keeps: (turn) => {
      keep.run(turn.bond, turn.through, turn.first_at, JSON.stringify(turn.stage))
    },
    closes: (turn, day, how) => {
      in_one_transaction(() => {
        database.prepare('DELETE FROM turns_in_progress WHERE bond = ?').run(turn.bond)
        database
          .prepare('INSERT INTO turns_closed (bond, day, how) VALUES (?, ?, ?)')
          .run(turn.bond, day, how)
      })
    },
    closed_on: (day) =>
      database
        .prepare('SELECT bond, how FROM turns_closed WHERE day = ? ORDER BY id')
        .all(day)
        .map((row) => z.object({ bond: z.string(), how: how_it_closes }).parse(row)),
    a_ticket_prepared: (bond, day) => {
      database
        .prepare('INSERT INTO tickets_prepared (bond, day) VALUES (?, ?) ON CONFLICT DO NOTHING')
        .run(bond, day)
    },
    tickets_prepared_on: (day) =>
      z
        .object({ count: z.number() })
        .parse(
          database.prepare('SELECT count(*) AS count FROM tickets_prepared WHERE day = ?').get(day),
        ).count,
    close: () => {
      database.close()
    },
  }
}
