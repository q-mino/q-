// The node's consumers on the node's database (DOM-14, DOM-16, DOM-22, WEB-8, WEB-10;
// part 21.2): the outbox of an effect, read from its domain's store, where
// its command wrote the entry; the executors' state and the reactions'
// consumers', in the node's store, each commit with the writer's term; the
// versions the node keeps, the union of every domain's. On the model of the
// oracle's cell (TST-2) and of the relay's storage on SQLite (MBX-8).

import * as zz from '@q-mino/domains/library'
import { the_range_of } from './command.ts'
import type { ABell } from './log.ts'
import { the_store_of } from './records.ts'
import {
  the_node_s_store,
  the_term_holds,
  type ANodesDatabase,
  type AStoredKey,
  type ATransaction,
} from './the_node_s_database.ts'

/** What the consumers need of the node: its database, the writer's term, the bell of its commits. */
export interface TheNodesConsumers {
  readonly database: ANodesDatabase
  readonly term: number
  readonly bell: ABell
  /** The business domains' paths: their stores hold the facts, the entries and the versions. */
  readonly paths: readonly string[]
}

/** The business domain whose command queues an effect: its path, before `/effect/`. */
const the_domain_of_an_effect = (effect: string): string => effect.split('/effect/')[0] ?? effect

const a_position = (count: number): zz.position => zz.position.parse(String(count))

const the_number_in = (key: AStoredKey, at: number): number => {
  const part = Array.isArray(key) ? key[at] : undefined
  if (typeof part !== 'number') throw new Error('a record kept under a key out of form')
  return part
}

/**
 * The outbox (DOM-14): an effect's entries from a position on, inclusive,
 * in the node's order of entries, then each new one as a commit queues it.
 */
export const the_node_s_outbox =
  (node: TheNodesConsumers): zz.Outbox =>
  (effect) =>
  (from) => {
    const store = the_store_of(the_domain_of_an_effect(effect))
    const read = (start: number): Promise<readonly zz.QueuedEntry[]> =>
      node.database.transaction([store], 'readonly', async (transaction) => {
        const kept = await transaction.within(store, {
          lower: { key: ['entry', effect, start], open: false },
          upper: { key: ['entry', effect, Number.POSITIVE_INFINITY], open: false },
        })
        return kept.map((record) => ({
          position: a_position(the_number_in(record.key, 2)),
          // cast: the adapter's own record, written under an entry's key by `execute_in`
          entry: record.value as zz.StoredEntry,
        }))
      })
    async function* the_entries(): AsyncGenerator<zz.QueuedEntry> {
      let next = from === undefined ? 1 : Number(from)
      for (;;) {
        const woken = node.bell.next()
        const given = await read(next)
        const last = given.at(-1)
        if (last === undefined) {
          await woken
          continue
        }
        yield* given
        next = Number(last.position) + 1
      }
    }
    return the_entries()
  }

/** A record of the node's store set or deleted, in a commit of the consumers. */
type ANodesWrite = (transaction: ATransaction) => void

/** One commit in the node's store, with the writer's term (WEB-10). */
const in_the_node_s_store =
  (node: TheNodesConsumers) =>
  (write: ANodesWrite): Promise<void> =>
    node.database.transaction([the_node_s_store], 'readwrite', async (transaction) => {
      await the_term_holds(transaction, node.term)
      write(transaction)
    })

/** A record of the node's store, read alone. */
const in_the_node = (node: TheNodesConsumers, key: AStoredKey): Promise<unknown> =>
  node.database.transaction([the_node_s_store], 'readonly', (transaction) =>
    transaction.get(the_node_s_store, key),
  )

/** The records of the node's store under a prefix, in its order. */
const under = (
  node: TheNodesConsumers,
  prefix: readonly AStoredKey[],
): Promise<readonly unknown[]> =>
  node.database.transaction([the_node_s_store], 'readonly', async (transaction) =>
    (await transaction.within(the_node_s_store, the_range_of(prefix))).map(
      (record) => record.value,
    ),
  )

const a_position_kept = (value: unknown): zz.position | undefined =>
  typeof value === 'number' ? a_position(value) : undefined

/** The executors' durable state (DOM-14), in the node's store: a position per effect, its held entries by their key. */
export const the_executors_state = (node: TheNodesConsumers): zz.ExecutorState => {
  const commit = in_the_node_s_store(node)
  const held_key = (entry: zz.QueuedEntry): AStoredKey => [
    'executor',
    'held',
    entry.entry.effect,
    entry.entry.id,
  ]
  return {
    position: async (effect) =>
      a_position_kept(await in_the_node(node, ['executor', 'position', effect])),
    advance: (effect) => (to) =>
      commit((transaction) => {
        transaction.put(the_node_s_store, ['executor', 'position', effect], Number(to))
      }),
    held: async (effect) =>
      // cast: the adapter's own records, written by `hold` below
      ((await under(node, ['executor', 'held', effect])) as readonly zz.HeldEntry[]).toSorted(
        (a, b) => Number(a.position) - Number(b.position),
      ),
    hold: (entry) =>
      commit((transaction) => {
        transaction.put(the_node_s_store, held_key(entry), entry)
      }),
    release: (entry) =>
      commit((transaction) => {
        transaction.delete(the_node_s_store, held_key(entry))
      }),
    discarded: (trace) =>
      commit((transaction) => {
        transaction.put(
          the_node_s_store,
          ['executor', 'discarded', trace.letter.entry.effect, trace.letter.entry.id],
          trace,
        )
      }),
  }
}

/** Every entry the executors hold, in the order of the outbox: what the user is told (USR-8). */
export const the_entries_held =
  (node: TheNodesConsumers) => async (): Promise<readonly zz.HeldEntry[]> =>
    // cast: the adapter's own records, written by `the_executors_state`
    ((await under(node, ['executor', 'held'])) as readonly zz.HeldEntry[]).toSorted(
      (a, b) => Number(a.position) - Number(b.position),
    )

const the_part_named = (part: zz.ReactionPart): AStoredKey[] => [
  part.reaction,
  part.fact.operation.scope,
  part.fact.operation.id,
  part.part,
]

const the_part_s_key = (part: zz.ReactionPart): AStoredKey => [
  'reaction',
  'held',
  ...the_part_named(part),
]

const in_the_log_s_order = (a: zz.HeldPart, b: zz.HeldPart): number =>
  Number(a.position) - Number(b.position) || a.part - b.part

/** The reactions' consumers' durable state (DOM-16), in the node's store: a position per reaction, its held parts by their key. */
export const the_reactions_state = (node: TheNodesConsumers): zz.ReactionState => {
  const commit = in_the_node_s_store(node)
  return {
    position: async (reaction) =>
      a_position_kept(await in_the_node(node, ['reaction', 'position', reaction])),
    advance: (reaction) => (to) =>
      commit((transaction) => {
        transaction.put(the_node_s_store, ['reaction', 'position', reaction], Number(to))
      }),
    held: async (reaction) =>
      // cast: the adapter's own records, written by `hold` below
      ((await under(node, ['reaction', 'held', reaction])) as readonly zz.HeldPart[]).toSorted(
        in_the_log_s_order,
      ),
    hold: (part) =>
      commit((transaction) => {
        transaction.put(the_node_s_store, the_part_s_key(part), part)
      }),
    release: (part) =>
      commit((transaction) => {
        transaction.delete(the_node_s_store, the_part_s_key(part))
      }),
    discarded: (trace) =>
      commit((transaction) => {
        transaction.put(
          the_node_s_store,
          ['reaction', 'discarded', ...the_part_named(trace.letter)],
          trace,
        )
      }),
  }
}

/** Every part the reactions' consumers hold, in the log's order. */
export const the_parts_held =
  (node: TheNodesConsumers) => async (): Promise<readonly zz.HeldPart[]> =>
    // cast: the adapter's own records, written by `the_reactions_state`
    ((await under(node, ['reaction', 'held'])) as readonly zz.HeldPart[]).toSorted(
      in_the_log_s_order,
    )

/** The versions the node keeps (DOM-22): every domain's, by path and version, distinct. */
export const the_versions_kept =
  (node: TheNodesConsumers): zz.StoredVersions =>
  async () => {
    const stores = node.paths.map(the_store_of)
    const kept = await node.database.transaction(stores, 'readonly', (transaction) =>
      Promise.all(stores.map((store) => transaction.within(store, the_range_of(['version'])))),
    )
    return kept.flat().map(({ key }) => {
      const [, path, version] = Array.isArray(key) ? key : []
      if (typeof path !== 'string' || typeof version !== 'string')
        throw new Error('a version kept under a key out of form')
      return { path, version: zz.semver.parse(version) }
    })
  }

/** The node's position: the last fact's (DOM-17), as a snapshot reads it. */
export const the_node_s_position = (node: TheNodesConsumers) => async (): Promise<zz.position> => {
  const last = await in_the_node(node, 'the_last_fact')
  return a_position(typeof last === 'number' ? last : 0)
}
