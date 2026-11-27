// The node's database on SQLite (`node:sqlite`; part B2 of the assistant,
// AST-2, ADP-6, ADP-8, MBX-8) [Q, C, 27 Nov 2026]: the substrate of
// `adapters-common`'s modules in Node, one file per node. Its stores are
// records of one table, under the store's name and the key's encoding in
// IndexedDB's order (`key.ts`), each value its JSON (LIB-11: the values are
// JSON). A transaction is SQLite's (`BEGIN IMMEDIATE` … `COMMIT`, WAL with
// `synchronous = FULL`), its body's writes rolled back if it throws (DOM-8).
// One process writes the file: the connection holds SQLite's exclusive lock
// for its whole life (`locking_mode = EXCLUSIVE`), so that another opening
// of the file, in this process or another, is refused (DOM-9, WEB-10's
// single writer). Inside the process the transactions run one after
// another, each to its end before the next begins: a serial writer by
// construction, as the relay's (MBX-8).

import { chmodSync, closeSync, existsSync, mkdirSync, openSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite'
import {
  the_name_of,
  the_node_s_store,
  type ABound,
  type AKept,
  type ANodesDatabase,
  type AStoredKey,
  type ATransaction,
} from '@q-mino/adapters-common'
import { encoded } from './key.ts'

/** The one table of the node's records. */
const the_records_table = `
  CREATE TABLE IF NOT EXISTS records (
    store TEXT NOT NULL,
    key BLOB NOT NULL,
    shown TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (store, key)
  ) WITHOUT ROWID;
`

/** SQLite's codes of a database another connection holds, and of a full disk. */
const busy = 5
const locked = 6
const full = 13

/** A fault of SQLite with its code, as `node:sqlite` throws it. */
const the_code_of = (fault: unknown): number | undefined =>
  fault instanceof Error && 'errcode' in fault && typeof fault.errcode === 'number'
    ? fault.errcode
    : undefined

/** A full disk told as the modules know it (`no_room`): the device has no room for a commit. */
const told = (fault: unknown): unknown => {
  if (the_code_of(fault) !== full) return fault
  const no_room = new Error('the disk of the node’s database is full', { cause: fault })
  no_room.name = 'QuotaExceededError'
  return no_room
}

/** Who holds the file: this connection, or another (in this process or another one). */
export type TheFileHeld =
  { readonly held: 'here'; readonly database: DatabaseSync } | { readonly held: 'elsewhere' }

/**
 * When the file is synced to the disk: at each commit (`synchronous =
 * FULL`, the node's: a commit answered is on the disk, MBX-8), or at WAL's
 * checkpoints only (`NORMAL`: a commit may be lost at a fall of the power,
 * never the file's consistency), for the suites, whose thousands of commits
 * would wait each for the disk. [Q, C, 27 Nov 2026] Rejected: the file on a
 * memory disk for the suites (`/dev/shm`: not on every machine).
 */
export type WhenItSyncs = 'each_commit' | 'at_checkpoints'

/**
 * The file opened and held: its folder made, readable by its user only (it
 * keeps the face's private key, SEA-7), the file too; WAL, synced as asked,
 * the exclusive lock taken at once by a first write.
 */
export const hold_the_file = (location: string, syncs: WhenItSyncs): TheFileHeld => {
  const folder = dirname(location)
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true, mode: 0o700 })
  closeSync(openSync(location, 'a', 0o600))
  chmodSync(location, 0o600)
  const database = new DatabaseSync(location, { timeout: 0 })
  try {
    database.exec('PRAGMA locking_mode = EXCLUSIVE')
    database.exec('PRAGMA journal_mode = WAL')
    database.exec(`PRAGMA synchronous = ${syncs === 'each_commit' ? 'FULL' : 'NORMAL'}`)
    database.exec(`BEGIN IMMEDIATE; ${the_records_table} COMMIT;`)
    return { held: 'here', database }
  } catch (fault) {
    database.close()
    const code = the_code_of(fault)
    if (code === busy || code === locked) return { held: 'elsewhere' }
    throw fault
  }
}

/** A record's value as the table keeps it: its JSON. */
const the_json_of = (value: unknown): string => {
  const json = JSON.stringify(value)
  // `JSON.stringify` gives `undefined` for a value that has no JSON (`undefined`, a function).
  if (typeof json !== 'string') throw new Error('a record of the node’s database is JSON')
  return json
}

/** A column read as a text, or the storage's fault. */
const a_text = (value: unknown, column: string): string => {
  if (typeof value !== 'string') throw new Error(`the node’s database: ${column} is not a text`)
  return value
}

/** A key read back from its shown form, the JSON it was written with (numbers, texts, arrays). */
const a_stored_key = (shown: string): AStoredKey => {
  const key: unknown = JSON.parse(shown)
  const valid = (part: unknown): part is AStoredKey =>
    typeof part === 'number' ||
    typeof part === 'string' ||
    (Array.isArray(part) && part.every(valid))
  if (!valid(key)) throw new Error('a key of the node’s database out of form')
  return key
}

/** The condition and the values of a range of keys over the encoded column. */
const the_range = (range: ABound): { readonly text: string; readonly values: SQLInputValue[] } => {
  const parts: string[] = []
  const values: SQLInputValue[] = []
  if (range.lower !== undefined) {
    parts.push(range.lower.open ? 'key > ?' : 'key >= ?')
    values.push(encoded(range.lower.key))
  }
  if (range.upper !== undefined) {
    parts.push(range.upper.open ? 'key < ?' : 'key <= ?')
    values.push(encoded(range.upper.key))
  }
  return { text: parts.map((part) => ` AND ${part}`).join(''), values }
}

/** The node's database over a file held here, its stores those of the release's domains and the node's. */
export const on_sqlite = (
  database: DatabaseSync,
  paths: readonly string[],
): ANodesDatabase & { readonly at_work: () => boolean } => {
  const statements = new Map<string, StatementSync>()
  const prepared = (text: string): StatementSync => {
    const kept = statements.get(text)
    if (kept !== undefined) return kept
    const statement = database.prepare(text)
    statements.set(text, statement)
    return statement
  }
  const in_a_transaction = (live: () => boolean): ATransaction => {
    const alive = (): void => {
      if (!live()) throw new Error('a transaction of the node’s database used after its end')
    }
    return {
      get: (store, key) => {
        alive()
        const row = prepared('SELECT value FROM records WHERE store = ? AND key = ?').get(
          store,
          encoded(key),
        )
        return Promise.resolve(
          row === undefined ? undefined : JSON.parse(a_text(row['value'], 'value')),
        )
      },
      within: (store, range) => {
        alive()
        const where = the_range(range)
        const rows = prepared(
          `SELECT shown, value FROM records WHERE store = ?${where.text} ORDER BY key`,
        ).all(store, ...where.values)
        return Promise.resolve(
          rows.map((row): AKept => ({
            key: a_stored_key(a_text(row['shown'], 'shown')),
            value: JSON.parse(a_text(row['value'], 'value')),
          })),
        )
      },
      put: (store, key, value) => {
        alive()
        prepared(
          `INSERT INTO records (store, key, shown, value) VALUES (?, ?, ?, ?)
           ON CONFLICT (store, key) DO UPDATE SET value = excluded.value`,
        ).run(store, encoded(key), JSON.stringify(key), the_json_of(value))
      },
      delete: (store, key) => {
        alive()
        prepared('DELETE FROM records WHERE store = ? AND key = ?').run(store, encoded(key))
      },
    }
  }
  let last: Promise<unknown> = Promise.resolve()
  let in_flight = 0
  return {
    stores: () => [the_node_s_store, ...paths.map((path) => the_name_of({ of: 'a_domain', path }))],
    transaction: (_stores, mode, body) => {
      in_flight += 1
      const run = async () => {
        let live = true
        database.exec(mode === 'readwrite' ? 'BEGIN IMMEDIATE' : 'BEGIN')
        try {
          const result = await body(in_a_transaction(() => live))
          live = false
          database.exec('COMMIT')
          return result
        } catch (fault) {
          live = false
          if (database.isTransaction) database.exec('ROLLBACK')
          throw told(fault)
        } finally {
          in_flight -= 1
        }
      }
      const result = last.then(run, run)
      last = result.catch(() => undefined)
      return result
    },
    at_work: () => in_flight > 0,
  }
}
