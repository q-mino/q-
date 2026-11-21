// The node's fact log on IndexedDB (DOM-17, WEB-9): each fact is in its
// domain's store, under its position in the node's one order; the log reads
// every domain's store from a position, in one transaction, and gives the
// facts in that order. After them it follows: woken by the writer's commits,
// which all happen in this tab (WEB-10).

import * as zz from '@q-mino/domains/library'
import { the_name_of, the_node_s_store } from './database.ts'
import { the_record_of, the_records_of, the_result_of } from './requests.ts'

/** The followers of the node's log, woken after each commit. */
export interface ABell {
  readonly next: () => Promise<void>
  readonly ring: () => void
}

export const a_bell = (): ABell => {
  let waiting: (() => void)[] = []
  return {
    next: () =>
      new Promise<void>((woken) => {
        waiting.push(woken)
      }),
    ring: () => {
      const woken = waiting
      waiting = []
      for (const wake of woken) wake()
    },
  }
}

/** What the node's log reads: its database and its business domains' paths. */
export interface TheNodesFacts {
  readonly database: IDBDatabase
  readonly key_range: Pick<typeof IDBKeyRange, 'bound'>
  readonly paths: readonly string[]
  readonly bell: ABell
}

interface AFact {
  readonly position: number
  readonly fact: zz.StoredEnvelope
}

const the_position_in = (key: IDBValidKey): number => {
  const position = Array.isArray(key) ? key[1] : undefined
  if (typeof position !== 'number') throw new Error('a fact kept under a key out of form')
  return position
}

const the_facts_from =
  (node: TheNodesFacts) =>
  async (start: number): Promise<{ readonly facts: readonly AFact[]; readonly last: number }> => {
    const stores = node.paths.map((path) => the_name_of({ of: 'a_domain', path }))
    const transaction = node.database.transaction([the_node_s_store, ...stores], 'readonly')
    const range = node.key_range.bound(['fact', start], ['fact', Number.POSITIVE_INFINITY])
    const [last, ...kept] = await Promise.all([
      the_record_of(transaction.objectStore(the_node_s_store).get('the_last_fact')),
      ...stores.flatMap((store) => [
        the_result_of(transaction.objectStore(store).getAllKeys(range)),
        the_records_of(transaction.objectStore(store).getAll(range)),
      ]),
    ])
    const facts = stores.flatMap((_, at) => {
      const keys = kept[2 * at]
      const values = kept[2 * at + 1]
      if (!Array.isArray(keys) || !Array.isArray(values)) return []
      return keys.map((key: IDBValidKey, index) => ({
        position: the_position_in(key),
        // cast: the adapter's own record, written under a fact's key by `execute_in`
        fact: values[index] as zz.StoredEnvelope,
      }))
    })
    return {
      facts: [...facts].sort((a, b) => a.position - b.position),
      last: typeof last === 'number' ? last : 0,
    }
  }

const as_event = (fact: AFact): zz.LogEvent => ({
  event: 'fact',
  position: zz.position.parse(String(fact.position)),
  fact: fact.fact,
})

/** The node's `FactLog`: from a position, inclusive (DOM-17); then caught up, then live. */
export const the_node_s_log =
  (node: TheNodesFacts): zz.FactLog =>
  (from) => {
    const read = the_facts_from(node)
    async function* the_log(): AsyncGenerator<zz.LogEvent> {
      const first = await read(from === undefined ? 1 : Number(from))
      yield* first.facts.map(as_event)
      yield { event: 'caught_up', position: zz.position.parse(String(first.last)) }
      let after = first.last
      for (;;) {
        const woken = node.bell.next()
        const given = await read(after + 1)
        const last = given.facts.at(-1)
        if (last === undefined) {
          await woken
          continue
        }
        yield* given.facts.map(as_event)
        after = last.position
      }
    }
    return the_log()
  }
