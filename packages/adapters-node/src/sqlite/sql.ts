// The SQL of the relay's storage (ADP-8): a condition, a source and a field
// are one type here, a piece of SQL with its values, so that one algebra
// serves the commands' predicates and the reads' selections, each with one
// translation. The operators compose pieces; the comparison with a cursor
// follows the value order of LIB-9, as the oracle's (`interpreter.ts`).

import type { DatabaseSync, SQLInputValue, SQLOutputValue } from 'node:sqlite'
import type * as zz from '@q-mino/domains/library'

/** A piece of SQL and its values, in the order of its `?`. */
export interface Sql {
  readonly text: string
  readonly values: readonly SQLInputValue[]
}

/** A piece of SQL with its values. */
export const sql = (text: string, ...values: readonly SQLInputValue[]): Sql => ({ text, values })

/** Pieces joined by an operator, each in parentheses; none is the operator's neutral value. */
const joined =
  (operator: string, none: string) =>
  (pieces: readonly Sql[]): Sql =>
    pieces.length === 0
      ? sql(none)
      : {
          text: pieces.map((piece) => `(${piece.text})`).join(` ${operator} `),
          values: pieces.flatMap((piece) => piece.values),
        }

/** AND, OR, NOT over pieces of SQL, conditions or selections alike. */
export const operators = {
  and: joined('AND', '1'),
  or: joined('OR', '0'),
  not: (operand: Sql): Sql => ({ text: `NOT (${operand.text})`, values: operand.values }),
}

/** A value of the order key as SQLite binds it: false before true, as 0 and 1 (LIB-9). */
const bound = (value: unknown): SQLInputValue => {
  if (value === undefined || value === null) return null
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    return value
  }
  throw new Error('a value of an order key is a text, a number or a boolean')
}

/**
 * A field after a value in its direction, by LIB-9: an absent value after
 * any value ascending, before any descending; text by code point, which is
 * SQLite's binary order of UTF-8.
 */
const comes_after = ({ field, direction, value }: zz.OrderKeyValue<Sql>): Sql => {
  const at = `(${field.text})`
  if (value === undefined || value === null) {
    return direction === 'ascending'
      ? sql('0')
      : { text: `${at} IS NOT NULL`, values: field.values }
  }
  return {
    text:
      direction === 'ascending' ? `${at} IS NULL OR ${at} > ?` : `${at} IS NOT NULL AND ${at} < ?`,
    values: [...field.values, ...field.values, bound(value)],
  }
}

/** A field at a value: equal, or both absent. */
const is_at = ({ field, value }: zz.OrderKeyValue<Sql>): Sql => ({
  text: `(${field.text}) IS ?`,
  values: [...field.values, bound(value)],
})

/** The comparison with a cursor (SC-22): the first field that differs decides. */
export const after = (key: readonly zz.OrderKeyValue<Sql>[]): Sql =>
  operators.or(
    key.map((each, i) => operators.and([...key.slice(0, i).map(is_at), comes_after(each)])),
  )

/** A piece's rows. */
export const rows =
  (database: DatabaseSync) =>
  (piece: Sql): readonly Record<string, SQLOutputValue>[] =>
    database.prepare(piece.text).all(...piece.values)

/** A piece run, a write. */
export const run =
  (database: DatabaseSync) =>
  (piece: Sql): void => {
    database.prepare(piece.text).run(...piece.values)
  }

/** Whether a condition holds now. */
export const holds =
  (database: DatabaseSync) =>
  (condition: Sql): boolean =>
    database.prepare(`SELECT (${condition.text}) AS holds`).get(...condition.values)?.['holds'] ===
    1

/** A text column of a row; another value is the storage's fault. */
export const text_of = (
  row: Record<string, SQLOutputValue> | undefined,
  column: string,
): string => {
  const value = row?.[column]
  if (typeof value !== 'string') throw new Error(`the relay's storage: ${column} is not a text`)
  return value
}

/** An integer column of a row; another value is the storage's fault. */
export const integer_of = (
  row: Record<string, SQLOutputValue> | undefined,
  column: string,
): number => {
  const value = row?.[column]
  if (typeof value !== 'number') throw new Error(`the relay's storage: ${column} is not a number`)
  return value
}

/** A JSON column of the storage, parsed. */
const parsed = (text: string): unknown => JSON.parse(text)

// A value the storage wrote as JSON, read back as the type it was written
// from: the casts of the storage, reliable by construction, since every JSON
// column is written in this folder by `JSON.stringify` from a value of that
// type, whose values are JSON (LIB-11).

/** A fact, as `the_log` wrote it. */
export const stored_fact = (text: string): zz.StoredEnvelope => parsed(text) as zz.StoredEnvelope // cast: written from a `StoredEnvelope` by `log.ts`

/** An outbox entry, as `the_outbox` wrote it. */
export const stored_entry = (text: string): zz.StoredEntry => parsed(text) as zz.StoredEntry // cast: written from a `StoredEntry` by `outbox.ts`

/** An entry the executor holds, as `the_outbox` wrote it. */
export const stored_held_entry = (text: string): zz.HeldEntry => parsed(text) as zz.HeldEntry // cast: written from a `HeldEntry` by `outbox.ts`
