// The fact log of the relay's storage (DOM-17, DOM-11): every fact at its
// position, which SQLite never gives twice (AUTOINCREMENT), with the
// operation that recorded it; the first position the log still keeps, since
// the relay forgets what it discarded (MBX-8); the facts from a position,
// then each new one, as the oracle's cell gives them (MBX-7).

import type { DatabaseSync } from 'node:sqlite'
import * as zz from '@q-mino/domains/library'
import { integer_of, sql, stored_fact, text_of, rows } from './sql.ts'

/** The tables of the log. */
export const the_logs_tables = `
  CREATE TABLE IF NOT EXISTS facts (
    position INTEGER PRIMARY KEY AUTOINCREMENT,
    scope TEXT NOT NULL,
    operation TEXT NOT NULL,
    fact TEXT NOT NULL,
    UNIQUE (scope, operation)
  );
  CREATE TABLE IF NOT EXISTS the_log (
    one INTEGER PRIMARY KEY CHECK (one = 1),
    kept_from INTEGER NOT NULL
  );
  INSERT OR IGNORE INTO the_log (one, kept_from) VALUES (1, 0);
`

/** A position of the store, from SQLite's count. */
const position_at = (count: number): zz.position => zz.position.parse(String(count))

/** Who waits for the next fact or entry, woken once each is committed. */
export interface Waiting {
  readonly next: () => Promise<void>
  readonly wake: () => void
}

/** The waiting of a storage: every reader of a stream that has caught up. */
export const waiting = (): Waiting => {
  let waiting: (() => void)[] = []
  return {
    next: () =>
      new Promise<void>((woken) => {
        waiting.push(woken)
      }),
    wake: () => {
      const woken = waiting
      waiting = []
      for (const wake of woken) wake()
    },
  }
}

/**
 * The log over a database (its tables made): recording a fact, which a
 * command does inside its step; the fact an operation recorded; the store's
 * position, the last fact's even once forgotten; forgetting the positions
 * before one; and the log as a port (`zz.FactLog`).
 */
export const the_log = (database: DatabaseSync, waits: Waiting) => {
  const all = rows(database)
  const kept_from = (): number =>
    integer_of(all(sql('SELECT kept_from FROM the_log WHERE one = 1'))[0], 'kept_from')
  const position = (): zz.position => {
    const [row] = all(sql("SELECT seq FROM sqlite_sequence WHERE name = 'facts'"))
    return position_at(row === undefined ? 0 : integer_of(row, 'seq'))
  }
  const facts_from = (from: number) =>
    all(sql('SELECT position, fact FROM facts WHERE position >= ? ORDER BY position', from)).map(
      (row) => ({
        position: position_at(integer_of(row, 'position')),
        fact: stored_fact(text_of(row, 'fact')),
      }),
    )
  const as_event = (recorded: {
    readonly position: zz.position
    readonly fact: zz.StoredEnvelope
  }): zz.LogEvent => ({ event: 'fact', ...recorded })
  /**
   * The facts after a position, once there is one. A reader that the
   * relay's forgetting overtook, the next fact it needs no longer kept, is
   * told `position_unavailable` (DOM-17).
   */
  async function* live(after: zz.position): AsyncGenerator<zz.LogEvent> {
    for (;;) {
      if (Number(after) + 1 < kept_from()) {
        yield { event: 'position_unavailable' }
        return
      }
      const given = facts_from(Number(after) + 1)
      const last = given.at(-1)
      if (last === undefined) {
        await waits.next()
        continue
      }
      yield* given.map(as_event)
      after = last.position
    }
  }
  const log: zz.FactLog = (from) => {
    async function* from_the_log(): AsyncGenerator<zz.LogEvent> {
      const start = from === undefined ? 1 : Number(from)
      if (start < kept_from()) {
        yield { event: 'position_unavailable' }
        return
      }
      // Read in one go: nothing writes between the two reads (one process, synchronous).
      const kept = facts_from(start)
      const at = position()
      yield* kept.map(as_event)
      yield { event: 'caught_up', position: at }
      yield* live(at)
    }
    return from_the_log()
  }
  return {
    /** A fact recorded, inside the step of its command: its position. */
    record: (fact: zz.StoredEnvelope): zz.position => {
      const result = database
        .prepare('INSERT INTO facts (scope, operation, fact) VALUES (?, ?, ?)')
        .run(fact.operation.scope, fact.operation.id, JSON.stringify(fact))
      return position_at(Number(result.lastInsertRowid))
    },
    /** The fact an operation recorded, if the log still keeps it (DOM-11, MBX-8). */
    recorded_by: (operation: zz.Operation): zz.AlreadyRecorded | undefined => {
      const [row] = all(
        sql(
          'SELECT position, fact FROM facts WHERE scope = ? AND operation = ?',
          operation.scope,
          operation.id,
        ),
      )
      return row === undefined
        ? undefined
        : {
            outcome: 'recorded',
            position: position_at(integer_of(row, 'position')),
            fact: stored_fact(text_of(row, 'fact')),
          }
    },
    position,
    /** The positions before this one, which the log keeps no longer: their facts gone (MBX-8, TST-4). */
    forget: (before: number): void => {
      database.prepare('UPDATE the_log SET kept_from = MAX(kept_from, ?) WHERE one = 1').run(before)
      database.prepare('DELETE FROM facts WHERE position < ?').run(before)
    },
    log,
  }
}
