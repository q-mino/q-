// The node's database on the browser's IndexedDB (WEB-8, WEB-9; the
// substrate of `adapters-common`'s modules since part B2 of the assistant)
// [Q, C, 27 Nov 2026]: a transaction of the modules is one IndexedDB
// transaction over the stores it names; its reads are IndexedDB's requests,
// awaited inside it; its writes, requests made as they are asked; a body
// that throws aborts it, so that none of its writes is kept (DOM-8). The
// keys are IndexedDB's own, in its order.

import type {
  ABound,
  AKept,
  ANodesDatabase,
  AStoredKey,
  ATransaction,
} from '@q-mino/adapters-common'
import { the_end_of, the_record_of, the_records_of, the_result_of } from './requests.ts'

/** IndexedDB's ranges, given (WEB-5). */
export type AKeyRange = Pick<typeof IDBKeyRange, 'bound' | 'lowerBound' | 'upperBound'>

/** IndexedDB's range of a bound, or none for a bound with no end. */
const the_key_range = (key_range: AKeyRange, range: ABound): IDBKeyRange | undefined =>
  range.lower !== undefined && range.upper !== undefined
    ? key_range.bound(range.lower.key, range.upper.key, range.lower.open, range.upper.open)
    : range.lower !== undefined
      ? key_range.lowerBound(range.lower.key, range.lower.open)
      : range.upper !== undefined
        ? key_range.upperBound(range.upper.key, range.upper.open)
        : undefined

/** A key IndexedDB gave back: one of the keys the modules write, which are numbers, texts and arrays of them. */
const a_stored_key = (key: IDBValidKey): AStoredKey => {
  if (typeof key === 'number' || typeof key === 'string') return key
  if (Array.isArray(key)) return key.map(a_stored_key)
  throw new Error('a key of the node’s database out of form')
}

const in_a_transaction = (transaction: IDBTransaction, key_range: AKeyRange): ATransaction => ({
  get: (store, key) => the_record_of(transaction.objectStore(store).get(key)),
  within: async (store, range) => {
    const kept = transaction.objectStore(store)
    const bound = the_key_range(key_range, range)
    const [keys, values] = await Promise.all([
      the_result_of(kept.getAllKeys(bound)),
      the_records_of(kept.getAll(bound)),
    ])
    return keys.map((key, at): AKept => ({ key: a_stored_key(key), value: values[at] }))
  },
  put: (store, key, value) => {
    transaction.objectStore(store).put(value, key)
  },
  delete: (store, key) => {
    transaction.objectStore(store).delete(key)
  },
})

/** The node's database over an IndexedDB connection, the stores of the modules its object stores. */
export const on_indexeddb = (database: IDBDatabase, key_range: AKeyRange): ANodesDatabase => ({
  stores: () => [...database.objectStoreNames],
  transaction: async (stores, mode, body) => {
    const transaction = database.transaction([...stores], mode)
    const ended = the_end_of(transaction)
    try {
      const result = await body(in_a_transaction(transaction, key_range))
      await ended
      return result
    } catch (fault) {
      try {
        transaction.abort()
      } catch {
        // already committed or aborted: nothing more to undo
      }
      await ended.catch(() => undefined)
      throw fault
    }
  },
})
