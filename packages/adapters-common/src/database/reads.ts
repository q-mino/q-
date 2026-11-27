// A business domain's reads on the node's database (DOM-18, LIB-9, WEB-8, part 21.2):
// one `readonly` transaction, a consistent snapshot (D66), which reads the
// records a query's source names by key and by range, with the node's
// position, and selects, orders and reads the fields in memory, as the
// oracle does (TST-2): no index (WEB-8). The order is LIB-9's value order,
// written here as the oracle writes it (an interpreter rule the adapters
// follow; an adapter imports no configurator, CFG-4). A read's actions
// (SC-33) are its command fragments, read in the same transaction.

import * as zz from '@q-mino/domains/library'
import { read_in, type ARead, type Fragment, type Records } from './command.ts'
import { the_node_s_store, type ANodesDatabase } from './the_node_s_database.ts'

/** A selection predicate over a candidate of its subject, on the records read (DOM-18). */
export type Selection<candidate> = (records: Records) => (candidate: candidate) => boolean

/** Where a query's candidates are: the records it reads, and its candidates from them. */
export interface Source<candidate> {
  readonly reads: readonly ARead[]
  readonly candidates: (records: Records) => readonly candidate[]
}

/** How a field of an entry reads from a candidate, on the records read. */
export type Field<candidate> = (records: Records) => (candidate: candidate) => unknown

/** AND, OR, NOT over the selections of one subject (LIB-7). */
export const selection_operators = <candidate>() => ({
  and:
    (components: readonly Selection<candidate>[]): Selection<candidate> =>
    (records) =>
    (candidate) =>
      components.every((component) => component(records)(candidate)),
  or:
    (components: readonly Selection<candidate>[]): Selection<candidate> =>
    (records) =>
    (candidate) =>
      components.some((component) => component(records)(candidate)),
  not:
    (operand: Selection<candidate>): Selection<candidate> =>
    (records) =>
    (candidate) =>
      !operand(records)(candidate),
})

const code_points = (text: string): readonly number[] =>
  Array.from(text, (character) => character.codePointAt(0) ?? 0)

/** Text by Unicode code point, no collation (LIB-9). */
const compare_texts = (a: string, b: string): number => {
  const x = code_points(a)
  const y = code_points(b)
  const first_difference = x.findIndex((point, i) => point !== y[i])
  return first_difference === -1
    ? x.length - y.length
    : (x[first_difference] ?? 0) - (y[first_difference] ?? Number.NEGATIVE_INFINITY)
}

/** LIB-9's value order: an absent value after any value, false before true, numbers by value, text by code point. */
export const compare_values = (a: unknown, b: unknown): number =>
  a === undefined || a === null
    ? b === undefined || b === null
      ? 0
      : 1
    : b === undefined || b === null
      ? -1
      : typeof a === 'string' && typeof b === 'string'
        ? compare_texts(a, b)
        : typeof a === 'number' && typeof b === 'number'
          ? a - b
          : typeof a === 'boolean' && typeof b === 'boolean'
            ? Number(a) - Number(b)
            : 0

/** The comparison with a page's cursor (SC-22): a candidate after the order key. */
export const after =
  <candidate>(key: readonly zz.OrderKeyValue<Field<candidate>>[]): Selection<candidate> =>
  (records) =>
  (candidate) =>
    (key
      .map(
        ({ field, direction, value }) =>
          (direction === 'ascending' ? 1 : -1) * compare_values(field(records)(candidate), value),
      )
      .find((comparison) => comparison !== 0) ?? 0) > 0

type Plan<candidate> = zz.PlannedQuery<
  Selection<candidate>,
  Source<candidate>,
  Field<candidate>,
  Fragment
>

/** What the reads need of the node: its database. */
export interface ADomainsReads {
  readonly database: ANodesDatabase
}

/** The entries of a query on the records read: selected, ordered (the identity closes it), read. */
const entries_on =
  <candidate>(plan: Plan<candidate>, selection: Selection<candidate>) =>
  (records: Records): readonly Readonly<Record<string, unknown>>[] => {
    const keeps = selection(records)
    const order = plan.order.map(([field, direction]) => {
      const value = field(records)
      const sign = direction === 'ascending' ? 1 : -1
      return (a: candidate, b: candidate): number => sign * compare_values(value(a), value(b))
    })
    return plan.from
      .candidates(records)
      .filter(keeps)
      .toSorted((a, b) => order.reduce((result, by) => (result !== 0 ? result : by(a, b)), 0))
      .map((candidate) =>
        Object.fromEntries(
          Object.entries(plan.fields).map(([name, field]) => [name, field(records)(candidate)]),
        ),
      )
  }

/** A read in one transaction: the source's records and the node's position; then its actions' leaves, if any (SC-33). */
const in_a_snapshot =
  (node: ADomainsReads) =>
  async <candidate, result>(
    plan: Plan<candidate>,
    reading: (records: Records) => {
      readonly entries: readonly Readonly<Record<string, unknown>>[]
      readonly rest: result
    },
  ): Promise<{
    readonly entries: readonly unknown[]
    readonly rest: result
    readonly position: zz.position
  }> => {
    const last: ARead = { store: the_node_s_store, key: 'the_last_fact' }
    const stores =
      plan.leaves === undefined
        ? [...new Set([the_node_s_store, ...plan.from.reads.map((read) => read.store)])]
        : node.database.stores()
    return node.database.transaction(stores, 'readonly', async (transaction) => {
      const records = await read_in(transaction, [last, ...plan.from.reads])
      const read = reading(records)
      const leaves = plan.leaves
      const entries =
        leaves === undefined
          ? read.entries
          : await (async () => {
              const conditions = read.entries.map((entry) => leaves.of(entry))
              const more = await read_in(
                transaction,
                conditions.flat().flatMap((condition) => condition.reads),
              )
              return read.entries.map((entry, at) => ({
                ...entry,
                [leaves.field]: (conditions[at] ?? []).map((condition) => condition.holds(more)),
              }))
            })()
      const position = records.of(last)
      return {
        entries,
        rest: read.rest,
        position: zz.position.parse(String(typeof position === 'number' ? position : 0)),
      }
    })
  }

/** A domain's `read` and `page` (DOM-18, SC-22), each in one snapshot. */
export const reads_in = (node: ADomainsReads) => ({
  read: async <candidate>(plan: Plan<candidate>) => {
    const { entries, position } = await in_a_snapshot(node)(plan, (records) => ({
      entries: entries_on(plan, plan.selection)(records),
      rest: undefined,
    }))
    return { entries, position }
  },
  page: async <candidate>(
    plan: zz.PlannedPage<Selection<candidate>, Source<candidate>, Field<candidate>, Fragment>,
  ) => {
    const { entries, rest, position } = await in_a_snapshot(node)(plan, (records) => ({
      entries: entries_on(plan, plan.page)(records).slice(0, plan.limit),
      rest: entries_on(plan, plan.selection)(records).length,
    }))
    return { entries, total: rest, position }
  },
})
