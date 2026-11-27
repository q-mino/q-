// A business domain's command port on the node's database (DOM-8, DOM-9,
// DOM-11, WEB-9): the library's `Execute` and `RecordedBy` over the domain's
// store, on IndexedDB and on SQLite alike (`the_node_s_database.ts`).
// A fragment and a write declare the keys they read, as the partition-backed
// adapter of an extension (EXT-14), and decide on them synchronously, by type:
// so a command is one transaction, which reads the writer's term, its
// operation and every key its branches name, decides, and writes its fact,
// its operation, its entries, its versions and its parts' writes, awaiting
// nothing but its own requests (WEB-9). The database runs the writer's
// transactions one after another, since each holds the node's store.

import * as zz from '@q-mino/domains/library'
import {
  the_name_of,
  the_node_s_store,
  the_term_holds,
  type ABound,
  type AKept,
  type ANodesDatabase,
  type AStoredKey,
  type ATransaction,
} from './the_node_s_database.ts'

/** A key a fragment or a write reads: in its domain's store, or another's (GR-3). */
export interface AKey {
  readonly store: string
  readonly key: AStoredKey
}

/**
 * The records under a prefix of keys, in a store (`['state', 'face']`: every
 * face): what a predicate over a set reads ("the user has a face"), and a
 * query's source (WEB-8: read by range, selected in memory).
 */
export interface ARange {
  readonly store: string
  readonly prefix: readonly AStoredKey[]
}

/** What a fragment, a write or a query reads: a key, or the records under a prefix. */
export type ARead = AKey | ARange

/** The records read, by key (a key not present reads `undefined`), and under a prefix (in the store's order). */
export interface Records {
  readonly of: (key: AKey) => unknown
  readonly all: (range: ARange) => readonly unknown[]
}

/** A predicate's fragment: the keys it reads, and whether it holds on them. */
export interface Fragment {
  readonly reads: readonly ARead[]
  readonly holds: (records: Records) => boolean
}

/** A record of the command's own store set or deleted: never another domain's (DOM-8). */
export type APut =
  | { readonly put: 'set'; readonly key: AStoredKey; readonly value: unknown }
  | { readonly put: 'delete'; readonly key: AStoredKey }

/** A fact's write: the keys it reads, and its records from them, at the fact's position. */
export interface Write {
  readonly reads: readonly ARead[]
  readonly puts: (
    records: Records,
    recording: { readonly position: zz.position },
  ) => readonly APut[]
}

/** The boolean operators over fragments (LIB-7): the keys of each, the value of all. */
export const the_operators: Pick<zz.Algebra<never, Fragment>, 'and' | 'or' | 'not'> = {
  and: (components) => ({
    reads: components.flatMap((component) => component.reads),
    holds: (records) => components.every((component) => component.holds(records)),
  }),
  or: (components) => ({
    reads: components.flatMap((component) => component.reads),
    holds: (records) => components.some((component) => component.holds(records)),
  }),
  not: (operand) => ({ reads: operand.reads, holds: (records) => !operand.holds(records) }),
}

/** The keys of a domain's store kept by the adapter, beside its business's `state` records. */
export const the_keys = {
  fact: (position: number): AStoredKey => ['fact', position],
  operation: (operation: zz.Operation): AStoredKey => ['operation', operation.scope, operation.id],
  entry: (effect: string, position: number): AStoredKey => ['entry', effect, position],
  version: (path: string, version: zz.Semver): AStoredKey => ['version', path, version],
} as const

/** The node's counters in its store: the last fact's position, the last entry's (one order each). */
const the_last_fact = 'the_last_fact'
const the_last_entry = 'the_last_entry'

const a_count = (value: unknown): number => (typeof value === 'number' ? value : 0)

const the_text_of = (read: ARead): string =>
  'key' in read ? JSON.stringify([read.store, read.key]) : JSON.stringify([read.store, read.prefix])

/** The range of a prefix: every array key that begins with it (an id is never an array). */
export const the_range_of = (prefix: readonly AStoredKey[]): ABound => ({
  lower: { key: [...prefix], open: false },
  upper: { key: [...prefix, []], open: true },
})

/** Whether a key begins with a prefix, part by part. */
const begins_with = (key: AStoredKey, prefix: readonly AStoredKey[]): boolean =>
  Array.isArray(key) && prefix.every((part, at) => JSON.stringify(key[at]) === JSON.stringify(part))

/** What a business domain's command port needs of the node. */
export interface ADomainsStore {
  readonly database: ANodesDatabase
  /** The writer's term (WEB-10). */
  readonly term: number
  /** The business domain's path (`bonds/address_book`): its store's name. */
  readonly path: string
  /** Called after each commit: the node's log wakes its followers (WEB-9). */
  readonly committed: () => void
}

type Branch = zz.PlannedCommandBranch<Fragment, Write>

const the_reads_of = (branch: Branch): readonly ARead[] => [
  ...branch.condition.reads,
  ...branch.leaves.flatMap((leaf) => leaf.reads),
  ...('elements' in branch
    ? branch.elements.flatMap((element) =>
        element.flatMap((each) => [
          ...each.condition.reads,
          ...each.leaves.flatMap((l) => l.reads),
        ]),
      )
    : branch.writes.flatMap((write) => write.reads)),
]

/** The records read, and each range's with their keys. */
export interface RecordsRead extends Records {
  readonly kept_under: (range: ARange) => readonly AKept[]
}

/** Reads every key and range named, each once, in the transaction. */
export const read_in = async (
  transaction: ATransaction,
  reads: readonly ARead[],
): Promise<RecordsRead> => {
  const unique = [...new Map(reads.map((read) => [the_text_of(read), read])).values()]
  const values = await Promise.all(
    unique.map((read): Promise<unknown> =>
      'key' in read
        ? transaction.get(read.store, read.key)
        : transaction.within(read.store, the_range_of(read.prefix)),
    ),
  )
  const found = new Map(unique.map((read, at) => [the_text_of(read), values[at]]))
  const kept_under = (range: ARange): readonly AKept[] => {
    const given = found.get(the_text_of(range))
    if (!Array.isArray(given)) throw new Error(`a range not read: ${the_text_of(range)}`)
    // cast: the list `read_in` built above for this range, of `AKept`
    return given as readonly AKept[]
  }
  return {
    of: (key) => found.get(the_text_of(key)),
    all: (range) => kept_under(range).map((kept) => kept.value),
    kept_under,
  }
}

/** The records a command reads, its writes laid over them as they are made (DOM-10). */
const laid_over = (
  read: RecordsRead,
  store: string,
  after: ReadonlyMap<string, AKept>,
): Records => ({
  of: (key) => {
    const written = key.store === store ? after.get(JSON.stringify(key.key)) : undefined
    return written === undefined ? read.of(key) : written.value
  },
  all: (range) => {
    const before = read.kept_under(range)
    if (range.store !== store) return before.map((kept) => kept.value)
    const under = [...after.values()].filter((kept) => begins_with(kept.key, range.prefix))
    const changed = new Set(under.map((kept) => JSON.stringify(kept.key)))
    return [
      ...before.filter((kept) => !changed.has(JSON.stringify(kept.key))),
      ...under.filter((kept) => kept.value !== undefined),
    ].map((kept) => kept.value)
  },
})

const the_fact_recorded = async (
  transaction: ATransaction,
  store: string,
  operation: zz.Operation,
): Promise<zz.AlreadyRecorded | undefined> => {
  const position = await transaction.get(store, the_keys.operation(operation))
  if (typeof position !== 'number') return undefined
  const fact = await transaction.get(store, the_keys.fact(position))
  return {
    outcome: 'recorded',
    position: zz.position.parse(String(position)),
    // cast: the adapter's own record, written under the fact's key by `execute_in` below
    fact: fact as zz.StoredEnvelope,
  }
}

/** Reads the fact an operation recorded, if any, outside a command (DOM-11: the leaf's and the port's lookups). */
export const recorded_in =
  (domain: Pick<ADomainsStore, 'database' | 'path'>): zz.RecordedBy =>
  (operation) => {
    const store = the_name_of({ of: 'a_domain', path: domain.path })
    return domain.database.transaction([store], 'readonly', (transaction) =>
      the_fact_recorded(transaction, store, operation),
    )
  }

const the_leaves_of = (branch: Branch, records: Records): readonly boolean[] => [
  ...branch.leaves.map((leaf) => leaf.holds(records)),
  ...('elements' in branch
    ? branch.elements.flatMap((element) =>
        element.flatMap((each) => each.leaves.map((leaf) => leaf.holds(records))),
      )
    : []),
]

/** A business domain's `Execute`: one transaction per command (DOM-8, DOM-9, DOM-11, WEB-9). */
export const execute_in =
  (domain: ADomainsStore): zz.Execute<Fragment, Write> =>
  async (plan) => {
    const store = the_name_of({ of: 'a_domain', path: domain.path })
    const node = (key: AStoredKey): AKey => ({ store: the_node_s_store, key })
    const reads: readonly ARead[] = [
      node(the_last_fact),
      node(the_last_entry),
      ...plan.branches.flatMap(the_reads_of),
    ]
    const stores = [...new Set([store, the_node_s_store, ...reads.map((key) => key.store)])]
    const result = await domain.database.transaction(
      stores,
      'readwrite',
      async (transaction): Promise<zz.Execution> => {
        await the_term_holds(transaction, domain.term)
        const recorded = await the_fact_recorded(transaction, store, plan.operation)
        if (recorded !== undefined) return recorded
        const records = await read_in(transaction, reads)
        const chosen = (branch: Branch): readonly number[] =>
          'elements' in branch
            ? branch.elements.map((element) =>
                element.findIndex((each) => each.condition.holds(records)),
              )
            : []
        const applied = plan.branches.findIndex(
          (branch) =>
            branch.condition.holds(records) && chosen(branch).every((index) => index !== -1),
        )
        const branch = plan.branches[applied]
        if (branch === undefined) {
          return {
            outcome: 'rejected',
            leaves: plan.branches.map((planned) => the_leaves_of(planned, records)),
          }
        }
        const elements = chosen(branch)
        const write = 'elements' in branch ? branch.applies(elements) : branch
        const more =
          'elements' in branch
            ? await read_in(
                transaction,
                write.writes.flatMap((each) => each.reads),
              )
            : records
        const position = a_count(records.of(node(the_last_fact))) + 1
        const first_entry = a_count(records.of(node(the_last_entry))) + 1
        const recording = { position: zz.position.parse(String(position)) }
        const after = new Map<string, AKept>()
        const seen = laid_over(more, store, after)
        for (const each of write.writes)
          for (const put of each.puts(seen, recording)) {
            after.set(JSON.stringify(put.key), {
              key: put.key,
              value: put.put === 'set' ? put.value : undefined,
            })
            if (put.put === 'set') transaction.put(store, put.key, put.value)
            else transaction.delete(store, put.key)
          }
        transaction.put(store, the_keys.fact(position), write.fact)
        transaction.put(store, the_keys.operation(plan.operation), position)
        for (const part of write.fact.parts)
          transaction.put(store, the_keys.version(part.path, part.version), true)
        write.entries.forEach((entry, at) => {
          transaction.put(store, the_keys.entry(entry.effect, first_entry + at), entry)
          transaction.put(store, the_keys.version(entry.effect, entry.version), true)
        })
        transaction.put(the_node_s_store, the_last_fact, position)
        transaction.put(the_node_s_store, the_last_entry, first_entry + write.entries.length - 1)
        return { outcome: 'applied', branch: applied, elements, position: recording.position }
      },
    )
    if (result.outcome === 'applied') domain.committed()
    return result
  }
