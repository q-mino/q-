// A business domain's command port on IndexedDB (DOM-8, DOM-9, DOM-11,
// WEB-9): the library's `Execute` and `RecordedBy` over the domain's store.
// A fragment and a write declare the keys they read, as the partition-backed
// adapter of an extension (EXT-14), and decide on them synchronously, by type:
// so a command is one transaction, which reads the writer's term, its
// operation and every key its branches name, decides, and writes its fact,
// its operation, its entries, its versions and its parts' writes, awaiting
// nothing but its own requests (WEB-9). IndexedDB runs the writer's
// transactions one after another, since each holds the node's store.

import * as zz from '@q-mino/domains/library'
import { the_name_of, the_node_s_store } from './database.ts'
import { the_end_of, the_record_of } from './requests.ts'
import { the_term_holds } from './the_writer.ts'

/** A key a fragment or a write reads: in its domain's store, or another's (GR-3). */
export interface AKey {
  readonly store: string
  readonly key: IDBValidKey
}

/** The records a command read, by key; a key not present reads `undefined`. */
export interface Records {
  readonly of: (key: AKey) => unknown
}

/** A predicate's fragment: the keys it reads, and whether it holds on them. */
export interface Fragment {
  readonly reads: readonly AKey[]
  readonly holds: (records: Records) => boolean
}

/** A record of the command's own store set or deleted: never another domain's (DOM-8). */
export type APut =
  | { readonly put: 'set'; readonly key: IDBValidKey; readonly value: unknown }
  | { readonly put: 'delete'; readonly key: IDBValidKey }

/** A fact's write: the keys it reads, and its records from them, at the fact's position. */
export interface Write {
  readonly reads: readonly AKey[]
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
  fact: (position: number): IDBValidKey => ['fact', position],
  operation: (operation: zz.Operation): IDBValidKey => ['operation', operation.scope, operation.id],
  entry: (effect: string, position: number): IDBValidKey => ['entry', effect, position],
  version: (path: string, version: zz.Semver): IDBValidKey => ['version', path, version],
} as const

/** The node's counters in its store: the last fact's position, the last entry's (one order each). */
const the_last_fact = 'the_last_fact'
const the_last_entry = 'the_last_entry'

const a_count = (value: unknown): number => (typeof value === 'number' ? value : 0)

const the_text_of = (key: AKey): string => JSON.stringify([key.store, key.key])

/** What a business domain's command port needs of the node. */
export interface ADomainsStore {
  readonly database: IDBDatabase
  /** The writer's term (WEB-10). */
  readonly term: number
  /** The business domain's path (`bonds/address_book`): its store's name. */
  readonly path: string
  /** Called after each commit: the node's log wakes its followers (WEB-9). */
  readonly committed: () => void
}

type Branch = zz.PlannedCommandBranch<Fragment, Write>

const the_reads_of = (branch: Branch): readonly AKey[] => [
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

const read_keys = async (transaction: IDBTransaction, keys: readonly AKey[]): Promise<Records> => {
  const unique = [...new Map(keys.map((key) => [the_text_of(key), key])).values()]
  const values = await Promise.all(
    unique.map((key) => the_record_of(transaction.objectStore(key.store).get(key.key))),
  )
  const found = new Map(unique.map((key, at) => [the_text_of(key), values[at]]))
  return { of: (key) => found.get(the_text_of(key)) }
}

const the_fact_recorded = async (
  records: IDBObjectStore,
  operation: zz.Operation,
): Promise<zz.AlreadyRecorded | undefined> => {
  const position: unknown = await the_record_of(records.get(the_keys.operation(operation)))
  if (typeof position !== 'number') return undefined
  const fact: unknown = await the_record_of(records.get(the_keys.fact(position)))
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
    return the_fact_recorded(
      domain.database.transaction(store, 'readonly').objectStore(store),
      operation,
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
    const node = (key: IDBValidKey): AKey => ({ store: the_node_s_store, key })
    const reads = [
      node(the_last_fact),
      node(the_last_entry),
      ...plan.branches.flatMap(the_reads_of),
    ]
    const stores = [...new Set([store, the_node_s_store, ...reads.map((key) => key.store)])]
    const transaction = domain.database.transaction(stores, 'readwrite')
    const ended = the_end_of(transaction)
    const kept = transaction.objectStore(store)
    try {
      await the_term_holds(transaction, domain.term)
      const recorded = await the_fact_recorded(kept, plan.operation)
      if (recorded !== undefined) {
        await ended
        return recorded
      }
      const records = await read_keys(transaction, reads)
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
        await ended
        return {
          outcome: 'rejected',
          leaves: plan.branches.map((planned) => the_leaves_of(planned, records)),
        }
      }
      const elements = chosen(branch)
      const write = 'elements' in branch ? branch.applies(elements) : branch
      const more =
        'elements' in branch
          ? await read_keys(
              transaction,
              write.writes.flatMap((each) => each.reads),
            )
          : records
      const position = a_count(records.of(node(the_last_fact))) + 1
      const first_entry = a_count(records.of(node(the_last_entry))) + 1
      const recording = { position: zz.position.parse(String(position)) }
      const after = new Map<string, unknown>()
      const seen: Records = {
        of: (key) => {
          const text = the_text_of(key)
          return after.has(text) ? after.get(text) : more.of(key)
        },
      }
      for (const each of write.writes)
        for (const put of each.puts(seen, recording)) {
          after.set(the_text_of({ store, key: put.key }), put.put === 'set' ? put.value : undefined)
          if (put.put === 'set') kept.put(put.value, put.key)
          else kept.delete(put.key)
        }
      kept.put(write.fact, the_keys.fact(position))
      kept.put(position, the_keys.operation(plan.operation))
      for (const part of write.fact.parts) kept.put(true, the_keys.version(part.path, part.version))
      write.entries.forEach((entry, at) => {
        kept.put(entry, the_keys.entry(entry.effect, first_entry + at))
        kept.put(true, the_keys.version(entry.effect, entry.version))
      })
      const counts = transaction.objectStore(the_node_s_store)
      counts.put(position, the_last_fact)
      counts.put(first_entry + write.entries.length - 1, the_last_entry)
      await ended
      domain.committed()
      return { outcome: 'applied', branch: applied, elements, position: recording.position }
    } catch (fault) {
      await ended.catch(() => undefined)
      throw fault
    }
  }
