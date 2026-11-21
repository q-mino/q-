// An extension's partition on IndexedDB (EXT-14, WEB-12): its own store of
// the node's database, under its name, which the kernel's adapter alone opens.
// Keys are the extension's strings (IndexedDB orders them by code units, as
// EXT-14 asks), values its JSON. A commit is one transaction: the writer's
// term, the partition's size, then its writes in order, all or none.

import * as boundary from '@q-mino/boundary'
import { the_name_of, the_node_s_store } from './database.ts'
import { no_room, the_end_of, the_record_of, the_records_of, the_result_of } from './requests.ts'
import { the_term_holds } from './the_writer.ts'

/** The key of a partition's size in the node's store. */
const the_size_of = (name: string): string[] => ['the_size_of_a_partition', name]

/** A partition's measure, the oracle's (EXT-14): the characters of its keys and of its values' JSON. */
const the_characters_of = (key: string, value: boundary.Json | undefined): number =>
  value === undefined ? 0 : key.length + JSON.stringify(value).length

/** What the kernel's adapter needs of the node to serve a partition. */
export interface TheNodesPartitions {
  readonly database: IDBDatabase
  readonly key_range: Pick<typeof IDBKeyRange, 'bound' | 'lowerBound' | 'upperBound'>
  /** The writer's term: a commit of a tab that is no longer the writer throws (WEB-10). */
  readonly term: number
  /** The largest size of a partition, in characters (the configuration's). */
  readonly characters: number
}

const a_range = (
  key_range: TheNodesPartitions['key_range'],
  read: Extract<boundary.a_read, { read: 'range' }>,
): IDBKeyRange | undefined =>
  read.from !== undefined && read.before !== undefined
    ? key_range.bound(read.from, read.before, false, true)
    : read.from !== undefined
      ? key_range.lowerBound(read.from)
      : read.before !== undefined
        ? key_range.upperBound(read.before, true)
        : undefined

const the_value_of = (value: unknown): boundary.Json | undefined =>
  value === undefined ? undefined : boundary.json.parse(value)

/** The storage the kernel gives an extension (`its_storage`), over its store. */
export const the_partition_of =
  (node: TheNodesPartitions) =>
  (name: string): boundary.Ports['its_storage'] => {
    const store = the_name_of({ of: 'an_extension', name })
    const read = async (asked: boundary.a_read): Promise<boundary.an_answer_to_a_read> => {
      const transaction = node.database.transaction(store, 'readonly')
      const partition = transaction.objectStore(store)
      if (asked.read === 'keys') {
        const values = await Promise.all(asked.keys.map((key) => the_record_of(partition.get(key))))
        const entries = asked.keys.flatMap((key, at) => {
          const value = the_value_of(values[at])
          return value === undefined ? [] : [{ key, value }]
        })
        return { answer: 'read', entries }
      }
      const range = a_range(node.key_range, asked)
      const [keys, values] = await Promise.all([
        the_result_of(partition.getAllKeys(range)),
        the_records_of(partition.getAll(range)),
      ])
      const entries = keys.map((key, at) => ({
        key: boundary.a_key.parse(key),
        value: boundary.json.parse(values[at]),
      }))
      return { answer: 'read', entries }
    }
    const commit = async (writes: boundary.a_commit): Promise<boundary.an_answer_to_a_commit> => {
      const transaction = node.database.transaction([store, the_node_s_store], 'readwrite')
      const partition = transaction.objectStore(store)
      const counts = transaction.objectStore(the_node_s_store)
      const ended = the_end_of(transaction)
      try {
        await the_term_holds(transaction, node.term)
        const keys = [...new Set(writes.map((write) => write.key))]
        const [size, ...before] = await Promise.all([
          the_record_of(counts.get(the_size_of(name))),
          ...keys.map((key) => the_record_of(partition.get(key))),
        ])
        const after = new Map(keys.map((key, at) => [key, the_value_of(before[at])]))
        for (const write of writes)
          after.set(write.key, write.write === 'set' ? write.value : undefined)
        const grown = keys.reduce(
          (sum, key, at) =>
            sum +
            the_characters_of(key, after.get(key)) -
            the_characters_of(key, the_value_of(before[at])),
          0,
        )
        const now = (typeof size === 'number' ? size : 0) + grown
        if (now > node.characters) {
          transaction.abort()
          await ended.catch(() => undefined)
          return { answer: 'refused', why: 'the_partition_is_full' }
        }
        for (const write of writes)
          if (write.write === 'set') partition.put(write.value, write.key)
          else partition.delete(write.key)
        counts.put(now, the_size_of(name))
        await ended
        return { answer: 'committed' }
      } catch (fault) {
        await ended.catch(() => undefined)
        if (no_room(fault)) return { answer: 'refused', why: 'the_partition_is_full' }
        throw fault
      }
    }
    return { read, commit }
  }
