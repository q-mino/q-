// A business domain's records in its store (WEB-8): under `['state', kind,
// ...ids]`, each a value of the domain as its `_value.ts` gives it, parsed
// when read, so that a record out of form fails where it is read. The
// helpers a domain's module builds its fragments, writes and sources with
// (WEB-9, part 21.2): a key, every record of a kind, a record parsed, a
// record set or deleted in the command's own store (DOM-8, by type: a put
// names no store).

import type { z } from 'zod'
import type { AKey, APut, ARange, Fragment, Records } from './command.ts'
import { the_name_of } from './database.ts'

/** The store of a business domain, by its path. */
export const the_store_of = (path: string): string => the_name_of({ of: 'a_domain', path })

/** The records of a business domain: a kind's record by its ids, every record of a kind. */
export const the_records_of_a_domain = (path: string) => {
  const store = the_store_of(path)
  return {
    store,
    /** A record of a kind, by its ids. */
    a: (kind: string, ...ids: readonly IDBValidKey[]): AKey => ({
      store,
      key: ['state', kind, ...ids],
    }),
    /** Every record of a kind (under its ids, if given). */
    every: (kind: string, ...ids: readonly IDBValidKey[]): ARange => ({
      store,
      prefix: ['state', kind, ...ids],
    }),
  }
}

/** A record read, parsed with its schema; `undefined` where there is none. */
export const parsed =
  <schema extends z.ZodType>(schema: schema) =>
  (record: unknown): z.output<schema> | undefined =>
    record === undefined ? undefined : schema.parse(record)

/** Every record read under a range, parsed with its schema. */
export const every_parsed =
  <schema extends z.ZodType>(schema: schema) =>
  (records: Records, range: ARange): readonly z.output<schema>[] =>
    records.all(range).map((record) => schema.parse(record))

/** A fragment over one record: read under its key, parsed, and judged. */
export const on_a_record =
  <schema extends z.ZodType>(schema: schema) =>
  (key: AKey, holds: (value: z.output<schema> | undefined) => boolean): Fragment => ({
    reads: [key],
    holds: (records) => holds(parsed(schema)(records.of(key))),
  })

/** A fragment over every record of a range, parsed, and judged together. */
export const on_the_records =
  <schema extends z.ZodType>(schema: schema) =>
  (range: ARange, holds: (values: readonly z.output<schema>[]) => boolean): Fragment => ({
    reads: [range],
    holds: (records) => holds(every_parsed(schema)(records, range)),
  })

/** A record of the command's own store set to a value. */
export const set = (key: AKey, value: unknown): APut => ({ put: 'set', key: key.key, value })

/** A record of the command's own store deleted. */
export const deleted = (key: AKey): APut => ({ put: 'delete', key: key.key })
