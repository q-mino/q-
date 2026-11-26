import type * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import { z } from 'zod'

// The state adapter of messaging over its partition (EXT-14, MSG-7, MSG-13;
// part M2), a copy of ping pong's (an extension's package imports no
// other's, GR-10), with the reads ping pong does not have: the library's
// ports for adapters (LIB-14) served by the one storage the kernel gives
// it, `its_storage`, which reads keys or a range and commits a batch
// atomically. Its commands, their fact log (which the streams of its reads
// are composed from, LIB-8), its outbox, the executor's state, whose
// letters discarded it keeps too (MSG-13: a message put aside); and its
// reads, each over the ranges its selection narrows it to (a chat's folder,
// for a bond), selected, ordered and read in memory, as the oracle does.
//
// The partition's keys, strings in the order of their code units:
// - `meta/facts`, `meta/entries`: how many facts and outbox entries it holds;
// - `fact/<position>`: a fact as stored, its envelope, at its position, the
//   count of facts, twelve digits (`000000000001`), so that the order of
//   the keys is theirs;
// - `operation/<[scope, id]>`: the position of the fact an operation
//   recorded (DOM-11), the pair as JSON, so that no scope and id meet;
// - `entry/<effect>/<position>`: an outbox entry as stored, at the position
//   that counts every entry, under its effect, read as a range;
// - `executor/position/<effect>`, `executor/held/<effect>/<position>`: the
//   executor's position per effect and the entries it holds (DOM-14);
//   `executor/discarded/<effect>/<entry>`: the trace of a letter discarded,
//   by its entry's id, as `encodeURIComponent` writes it;
// - `version/<[path, version]>`: a path and a version a fact or an entry
//   was written at (DOM-22);
// - `state/…`: the business's records, its adapter's (`chats.ts`).
// A fact, its writes, its operation, its entries and the counts go in one
// commit (DOM-8), one command at a time (DOM-9); a read reads its ranges
// between two commands, so that what it reads is one state, at the
// position of its last fact (D66).

/** What a fragment or a write sees of the partition: the value at a key it read, if present. */
export type Seen = (key: string) => boundary.Json | undefined

/** A condition over the partition: the keys it reads, and whether it holds on what they hold. */
export interface Fragment {
  readonly reads: readonly string[]
  readonly holds: (seen: Seen) => boolean
}

/** A fact's write: the keys it reads, and the writes it makes on what they hold. */
export interface Write {
  readonly reads: readonly string[]
  readonly writes: (seen: Seen) => readonly boundary.a_write[]
}

/** A count as twelve digits: the order of the keys is the order of the counts. */
const padded = (count: number): string => String(count).padStart(12, '0')

/** The keys of the partition. */
const keys = {
  facts: 'meta/facts',
  entries: 'meta/entries',
  fact: (position: string): string => `fact/${position}`,
  operation: (operation: zz.Operation): string =>
    `operation/${JSON.stringify([operation.scope, operation.id])}`,
  entries_of: (effect: string): string => `entry/${effect}/`,
  executor_position: (effect: string): string => `executor/position/${effect}`,
  held_of: (effect: string): string => `executor/held/${effect}/`,
  discarded_of: (effect: string): string => `executor/discarded/${effect}/`,
  version: (stored: zz.StoredVersion): string =>
    `version/${JSON.stringify([stored.path, stored.version])}`,
} as const

/** The range of the keys under a prefix that ends with `/`: from it, before its successor (EXT-14). */
export const under = (prefix: string, from?: string): boundary.a_read => ({
  read: 'range',
  from: from ?? prefix,
  before: `${prefix.slice(0, -1)}0`,
})

/**
 * What this adapter committed, read back as its type, by the kind of its
 * key: the partition holds at each key only what this adapter wrote there
 * (EXT-14: the kernel carries it, never writes it), as JSON.
 */
const kept = {
  fact: (value: boundary.Json): zz.StoredEnvelope => value as never, // cast: a `fact/` key holds a fact as this adapter stored it (EXT-14)
  entry: (value: boundary.Json): zz.StoredEntry => value as never, // cast: an `entry/` key holds an outbox entry as this adapter stored it (EXT-14)
  held: (value: boundary.Json): zz.HeldEntry => value as never, // cast: an `executor/held/` key holds a held entry as this adapter stored it (EXT-14)
}

/** The keys under which the executor keeps the letters of an effect it holds, and those discarded (MSG-13). */
export const the_executor_s = {
  held: keys.held_of,
  discarded: keys.discarded_of,
} as const

/** The entry's id a held letter keeps, as this adapter stored it, and whether it is a dead letter (MSG-13). */
export const the_entry_of_a_held = (
  value: boundary.Json,
): { readonly id: string; readonly dead: boolean } => {
  const held = kept.held(value)
  return { id: held.entry.id, dead: held.held === 'dead_letter' }
}

/** What a read sees of the partition: the entries under each range it read, by the range's prefix. */
export type Records = (prefix: string) => readonly boundary.an_entry[]

/**
 * A selection over a candidate of its subject (DOM-18), on the records read:
 * whether it keeps the candidate; and, when it can tell, the ranges its
 * candidates are under (`within`), so that a read reads those alone: a
 * chat's folder for the messages of a bond, the index a store would give.
 */
export interface Selection<candidate> {
  readonly within?: readonly string[]
  readonly keeps: (records: Records) => (candidate: candidate) => boolean
}

/** Where a query's candidates are: the ranges it reads (all of them, unless its selection narrows them), the ranges it reads besides, and its candidates from them. */
export interface Source<candidate> {
  readonly under: readonly string[]
  readonly besides: readonly string[]
  readonly candidates: (records: Records, within: readonly string[]) => readonly candidate[]
}

/** How a field of an entry reads from a candidate. */
export type Field<candidate> = (candidate: candidate) => unknown

/** AND, OR, NOT over the selections of one subject (LIB-7): AND within any of its components' ranges, OR within all of them, NOT within none it can tell. */
export const selection_operators = <candidate>() => ({
  and: (components: readonly Selection<candidate>[]): Selection<candidate> => {
    const within = components.find((component) => component.within !== undefined)?.within
    return {
      ...(within === undefined ? {} : { within }),
      keeps: (records) => (candidate) =>
        components.every((component) => component.keeps(records)(candidate)),
    }
  },
  or: (components: readonly Selection<candidate>[]): Selection<candidate> => {
    const every = components.every((component) => component.within !== undefined)
    return {
      ...(every ? { within: components.flatMap((component) => component.within ?? []) } : {}),
      keeps: (records) => (candidate) =>
        components.some((component) => component.keeps(records)(candidate)),
    }
  },
  not: (operand: Selection<candidate>): Selection<candidate> => ({
    keeps: (records) => (candidate) => !operand.keeps(records)(candidate),
  }),
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

/** LIB-9's value order, as the oracle writes it: an absent value after any value, false before true, numbers by value, text by code point. */
const compare_values = (a: unknown, b: unknown): number =>
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
export const after = <candidate>(
  key: readonly zz.OrderKeyValue<Field<candidate>>[],
): Selection<candidate> => ({
  keeps: () => (candidate) =>
    (key
      .map(
        ({ field, direction, value }) =>
          (direction === 'ascending' ? 1 : -1) * compare_values(field(candidate), value),
      )
      .find((comparison) => comparison !== 0) ?? 0) > 0,
})

type Plan<candidate> = zz.PlannedQuery<Selection<candidate>, Source<candidate>, Field<candidate>>

/** A count kept at a key; none is zero. */
const count = (value: boundary.Json | undefined): number => (typeof value === 'number' ? value : 0)

/** A path and a version as a key names them. */
const stored_version = z.tuple([z.string(), zz.semver])

/** The name of an executor's letter: its effect's path and its entry's id (EXT-2). */
export const the_name_of_a_letter = (entry: zz.QueuedEntry): string =>
  `${entry.entry.effect}/${entry.entry.id}`

/**
 * The adapter over a partition: its command adapter's parts (`algebra`,
 * `execute`, `recorded`, with the business's fragments and writes), its
 * fact log, its outbox, its executor's state, the versions it keeps.
 */
export const a_partition = (storage: boundary.Ports['its_storage']) => {
  /** Some keys read: the values present. A refusal is a technical outcome, thrown (DOM-15). */
  const read = async (asked: boundary.a_read): Promise<readonly boundary.an_entry[]> => {
    const answer = await storage.read(asked)
    if (answer.answer === 'refused') throw new Error(`its storage refused a read: ${answer.why}`)
    return answer.entries
  }
  const values_at = async (asked: readonly string[]): Promise<ReadonlyMap<string, boundary.Json>> =>
    new Map((await read({ read: 'keys', keys: asked })).map((entry) => [entry.key, entry.value]))
  /** A batch committed, all or none. A refusal is a technical outcome, thrown (DOM-15). */
  const commit = async (writes: readonly boundary.a_write[]): Promise<void> => {
    const answer = await storage.commit(writes)
    if (answer.answer === 'refused') throw new Error(`its storage refused a commit: ${answer.why}`)
  }

  // One writer (DOM-9): the commands run one at a time; the outbox and the
  // log wait for the next commit, counted, so that one landing while they
  // read is not missed.
  let turn: Promise<unknown> = Promise.resolve()
  const serially = <result>(step: () => Promise<result>): Promise<result> => {
    const run = turn.then(step, step)
    turn = run.catch(() => undefined)
    return run
  }
  let commits = 0
  let waiting: (() => void)[] = []
  const committed = (): void => {
    commits += 1
    const woken = waiting
    waiting = []
    for (const wake of woken) wake()
  }
  const a_commit_after = (seen: number): Promise<void> =>
    commits > seen
      ? Promise.resolve()
      : new Promise((wake) => {
          waiting.push(wake)
        })

  const recorded: zz.RecordedBy = async (operation) => {
    const found = (await values_at([keys.operation(operation)])).get(keys.operation(operation))
    if (typeof found !== 'string') return undefined
    const fact = (await values_at([keys.fact(found)])).get(keys.fact(found))
    return fact === undefined
      ? undefined
      : { outcome: 'recorded', position: zz.position.parse(found), fact: kept.fact(fact) }
  }

  const execute: zz.Execute<Fragment, Write> = (plan) =>
    serially(async (): Promise<zz.Execution> => {
      const already = await recorded(plan.operation)
      if (already !== undefined) return already
      const branches = plan.branches.map((branch) => {
        if ('elements' in branch)
          throw new Error('a branch over a list comes with its case (SC-54)')
        return branch
      })
      const values = await values_at([
        ...new Set([
          keys.facts,
          keys.entries,
          ...branches.flatMap((branch) => [
            ...branch.condition.reads,
            ...branch.leaves.flatMap((leaf) => leaf.reads),
            ...branch.writes.flatMap((write) => write.reads),
          ]),
        ]),
      ])
      const seen: Seen = (key) => values.get(key)
      const applied = branches.findIndex((branch) => branch.condition.holds(seen))
      const branch = branches[applied]
      if (branch === undefined) {
        return {
          outcome: 'rejected',
          leaves: branches.map((each) => each.leaves.map((leaf) => leaf.holds(seen))),
        }
      }
      // Each part's writes see those before it (DOM-10).
      const after = new Map(values)
      const writes = branch.writes.flatMap((write) => {
        const made = write.writes((key) => after.get(key))
        for (const each of made) {
          if (each.write === 'set') after.set(each.key, each.value)
          else after.delete(each.key)
        }
        return made
      })
      const facts = count(values.get(keys.facts)) + 1
      const position = padded(facts)
      const entries = count(values.get(keys.entries))
      const versions = [
        ...branch.fact.parts.map((part) => ({ path: part.path, version: part.version })),
        ...branch.entries.map((entry) => ({ path: entry.effect, version: entry.version })),
      ]
      await commit([
        ...writes,
        { write: 'set', key: keys.fact(position), value: zz.as_json(branch.fact) },
        { write: 'set', key: keys.operation(plan.operation), value: position },
        ...branch.entries.map((entry, index): boundary.a_write => ({
          write: 'set',
          key: `${keys.entries_of(entry.effect)}${padded(entries + index + 1)}`,
          value: zz.as_json(entry),
        })),
        ...[...new Set(versions.map(keys.version))].map((key): boundary.a_write => ({
          write: 'set',
          key,
          value: true,
        })),
        { write: 'set', key: keys.facts, value: facts },
        { write: 'set', key: keys.entries, value: entries + branch.entries.length },
      ])
      committed()
      return {
        outcome: 'applied',
        branch: applied,
        elements: [],
        position: zz.position.parse(position),
      }
    })

  /** The conditions of the business over the partition (AND, OR, NOT), and its predicates' fragments. */
  const algebra = <fragments>(predicate: fragments) => ({
    predicate,
    and: (components: readonly Fragment[]): Fragment => ({
      reads: components.flatMap((component) => component.reads),
      holds: (seen) => components.every((component) => component.holds(seen)),
    }),
    or: (components: readonly Fragment[]): Fragment => ({
      reads: components.flatMap((component) => component.reads),
      holds: (seen) => components.some((component) => component.holds(seen)),
    }),
    not: (operand: Fragment): Fragment => ({
      reads: operand.reads,
      holds: (seen) => !operand.holds(seen),
    }),
  })

  /** Entries under a prefix from a key on, inclusive, then each new one as it is committed: a key and its value. */
  const from_on = (prefix: string, from: string | undefined): AsyncIterable<boundary.an_entry> => ({
    async *[Symbol.asyncIterator]() {
      let next = from === undefined ? undefined : `${prefix}${from}`
      for (;;) {
        const seen = commits
        const listed = await read(under(prefix, next))
        for (const entry of listed) yield entry
        const last = listed.at(-1)
        if (last !== undefined)
          next = `${prefix}${padded(Number(last.key.slice(prefix.length)) + 1)}`
        else await a_commit_after(seen)
      }
    },
  })

  /** The outbox, effect by effect (DOM-14): its entries from a position on, inclusive, then each new one. */
  const outbox: zz.Outbox = (effect) => (from) => ({
    async *[Symbol.asyncIterator]() {
      for await (const entry of from_on(keys.entries_of(effect), from)) {
        yield {
          position: zz.position.parse(entry.key.slice(keys.entries_of(effect).length)),
          entry: kept.entry(entry.value),
        }
      }
    },
  })

  /** The fact log (DOM-17): the facts kept from a position on, then "caught up", then each new one. */
  const log: zz.FactLog = (from) => ({
    async *[Symbol.asyncIterator]() {
      const kept_now = await read(under('fact/', from === undefined ? undefined : keys.fact(from)))
      for (const entry of kept_now) {
        yield {
          event: 'fact',
          position: zz.position.parse(entry.key.slice('fact/'.length)),
          fact: kept.fact(entry.value),
        }
      }
      const last = kept_now.at(-1)?.key.slice('fact/'.length)
      yield {
        event: 'caught_up',
        position: zz.position.parse(last ?? padded(Number(from ?? '1') - 1)),
      }
      for await (const entry of from_on(
        'fact/',
        last === undefined ? from : padded(Number(last) + 1),
      )) {
        yield {
          event: 'fact',
          position: zz.position.parse(entry.key.slice('fact/'.length)),
          fact: kept.fact(entry.value),
        }
      }
    },
  })

  /**
   * The executor's state (DOM-14), kept in the partition so that an executor
   * started again finds its positions and its letters; its dead letters told
   * to the kernel as they are held, and as they are let go (EXT-2, F6).
   */
  const executor = (notices: boundary.Notices): zz.ExecutorState => ({
    position: async (effect) => {
      const found = (await values_at([keys.executor_position(effect)])).get(
        keys.executor_position(effect),
      )
      return typeof found === 'string' ? zz.position.parse(found) : undefined
    },
    advance: (effect) => async (to) => {
      await commit([{ write: 'set', key: keys.executor_position(effect), value: to }])
    },
    held: async (effect) =>
      (await read(under(keys.held_of(effect)))).map((entry) => kept.held(entry.value)),
    hold: async (entry) => {
      await commit([
        {
          write: 'set',
          key: `${keys.held_of(entry.entry.effect)}${entry.position}`,
          value: zz.as_json(entry),
        },
      ])
      if (entry.held === 'dead_letter') {
        notices.dead_letter({
          letter: the_name_of_a_letter(entry),
          of: 'an_effect',
          path: entry.entry.effect,
          entry: entry.entry,
          cause: entry.cause,
        })
      }
    },
    release: async (entry) => {
      const key = `${keys.held_of(entry.entry.effect)}${entry.position}`
      const was = (await values_at([key])).get(key)
      await commit([{ write: 'delete', key }])
      if (was !== undefined && kept.held(was).held === 'dead_letter') {
        notices.released(the_name_of_a_letter(entry))
      }
    },
    discarded: async (trace) => {
      await commit([
        {
          write: 'set',
          key: `${keys.discarded_of(trace.letter.entry.effect)}${encodeURIComponent(trace.letter.entry.id)}`,
          value: zz.as_json({ by: trace.by, reason: trace.reason }),
        },
      ])
    },
  })

  /** The paths and versions its facts and entries were written at (DOM-22). */
  const stored_versions: zz.StoredVersions = async () =>
    (await read(under('version/'))).map((entry) => {
      const [path, version] = stored_version.parse(JSON.parse(entry.key.slice('version/'.length)))
      return { path, version }
    })

  /**
   * The entries of a planned query, read between two commands (D66): the
   * ranges its selection narrows it to (or its source's), and those it reads
   * besides; its candidates kept by the selection, in the order (the
   * identity closes it), read field by field; with the position of the last
   * fact, at most `limit` of those a page's selection keeps, and the total.
   */
  const in_a_snapshot = <candidate>(
    plan: Plan<candidate>,
    page: { readonly selection: Selection<candidate>; readonly limit?: number },
  ) =>
    serially(async () => {
      const within = plan.selection.within ?? plan.from.under
      const prefixes = [...new Set([...within, ...plan.from.besides])]
      const [values, ...ranges] = await Promise.all([
        values_at([keys.facts]),
        ...prefixes.map((prefix) => read(under(prefix))),
      ])
      const by_prefix = new Map(prefixes.map((prefix, at) => [prefix, ranges[at] ?? []]))
      const records: Records = (prefix) => by_prefix.get(prefix) ?? []
      const candidates = plan.from.candidates(records, within)
      const order = plan.order.map(([field, direction]) => {
        const sign = direction === 'ascending' ? 1 : -1
        return (a: candidate, b: candidate): number => sign * compare_values(field(a), field(b))
      })
      const entries_of = (selection: Selection<candidate>) =>
        candidates
          .filter(selection.keeps(records))
          .toSorted((a, b) => order.reduce((result, by) => (result !== 0 ? result : by(a, b)), 0))
          .map((candidate) =>
            Object.fromEntries(
              Object.entries(plan.fields).map(([name, field]) => [name, field(candidate)]),
            ),
          )
      return {
        entries: entries_of(page.selection).slice(0, page.limit),
        total: entries_of(plan.selection).length,
        position: zz.position.parse(padded(count(values.get(keys.facts)))),
      }
    })

  /** The reads of its queries (DOM-18, SC-22): whole, or a page with its total. */
  const reads = {
    read: async <candidate>(plan: Plan<candidate>) => {
      const { entries, position } = await in_a_snapshot(plan, { selection: plan.selection })
      return { entries, position }
    },
    page: <candidate>(
      plan: zz.PlannedPage<Selection<candidate>, Source<candidate>, Field<candidate>>,
    ) =>
      in_a_snapshot(plan, {
        selection: plan.page,
        ...(plan.limit === undefined ? {} : { limit: plan.limit }),
      }),
  }

  return { algebra, execute, recorded, log, outbox, executor, stored_versions, reads }
}
