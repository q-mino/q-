// The outbox of the relay's storage and its executor's state (DOM-13,
// DOM-14): every entry at its position, counting every effect's, queued in
// the step of the fact that queued it; the executor's position per effect
// and the entries it holds, durable across a fall. An entry the executor has
// gone past is forgotten (MBX-8): the relay keeps no list of its waits.

import type { DatabaseSync } from 'node:sqlite'
import * as zz from '@q-mino/domains/library'
import type { Waiting } from './log.ts'
import { integer_of, rows, sql, stored_entry, stored_held_entry, text_of } from './sql.ts'

/** The tables of the outbox and of the executor's state. */
export const the_outboxs_tables = `
  CREATE TABLE IF NOT EXISTS entries (
    position INTEGER PRIMARY KEY AUTOINCREMENT,
    effect TEXT NOT NULL,
    version TEXT NOT NULL,
    entry TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS executor_positions (
    effect TEXT PRIMARY KEY,
    position TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS held_entries (
    effect TEXT NOT NULL,
    id TEXT NOT NULL,
    position INTEGER NOT NULL,
    held TEXT NOT NULL,
    PRIMARY KEY (effect, id)
  );
`

const position_at = (count: number): zz.position => zz.position.parse(String(count))

/** The outbox and the executor's state over a database (its tables made). */
export const the_outbox = (database: DatabaseSync, waits: Waiting) => {
  const all = rows(database)
  const the_entries_of = (effect: string, from: number): readonly zz.QueuedEntry[] =>
    all(
      sql(
        'SELECT position, entry FROM entries WHERE effect = ? AND position >= ? ORDER BY position',
        effect,
        from,
      ),
    ).map((row) => ({
      position: position_at(integer_of(row, 'position')),
      entry: stored_entry(text_of(row, 'entry')),
    }))
  const outbox: zz.Outbox = (effect) => (from) => {
    async function* entries(): AsyncGenerator<zz.QueuedEntry> {
      let next = from === undefined ? 1 : Number(from)
      for (;;) {
        const given = the_entries_of(effect, next)
        const last = given.at(-1)
        if (last === undefined) {
          await waits.next()
          continue
        }
        yield* given
        next = Number(last.position) + 1
      }
    }
    return entries()
  }
  const executor: zz.ExecutorState = {
    position: (effect) => {
      const [row] = all(sql('SELECT position FROM executor_positions WHERE effect = ?', effect))
      return Promise.resolve(
        row === undefined ? undefined : zz.position.parse(text_of(row, 'position')),
      )
    },
    advance: (effect) => (to) => {
      database
        .prepare(
          'INSERT INTO executor_positions (effect, position) VALUES (?, ?) ON CONFLICT (effect) DO UPDATE SET position = excluded.position',
        )
        .run(effect, to)
      database
        .prepare('DELETE FROM entries WHERE effect = ? AND position < ?')
        .run(effect, Number(to))
      return Promise.resolve()
    },
    held: (effect) =>
      Promise.resolve(
        all(sql('SELECT held FROM held_entries WHERE effect = ? ORDER BY position', effect)).map(
          (row) => stored_held_entry(text_of(row, 'held')),
        ),
      ),
    hold: (entry) => {
      database
        .prepare(
          'INSERT INTO held_entries (effect, id, position, held) VALUES (?, ?, ?, ?) ON CONFLICT (effect, id) DO UPDATE SET position = excluded.position, held = excluded.held',
        )
        .run(entry.entry.effect, entry.entry.id, Number(entry.position), JSON.stringify(entry))
      return Promise.resolve()
    },
    release: (entry) => {
      database
        .prepare('DELETE FROM held_entries WHERE effect = ? AND id = ?')
        .run(entry.entry.effect, entry.entry.id)
      return Promise.resolve()
    },
    // The relay keeps no trace of a letter discarded: it keeps no logs (CFG-3).
    discarded: () => Promise.resolve(),
  }
  return {
    /** Entries queued, inside the step of the fact that queued them. */
    queue: (entries: readonly zz.StoredEntry[]): void => {
      const insert = database.prepare(
        'INSERT INTO entries (effect, version, entry) VALUES (?, ?, ?)',
      )
      for (const entry of entries) insert.run(entry.effect, entry.version, JSON.stringify(entry))
    },
    outbox,
    executor,
  }
}
