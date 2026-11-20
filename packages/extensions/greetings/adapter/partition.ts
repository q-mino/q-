import type * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import { z } from 'zod'

// The state adapter of an extension over its partition (EXT-14; part
// 12.4): the library's ports for adapters (LIB-14) served by the one
// storage the kernel gives it, `its_storage`, which reads keys or a range
// and commits a batch atomically. Modelled on q-'s oracle (the cell and its
// interpreter), which the extension may not import (GR-10), as small as
// the test extension needs: commands, their fact log, the outbox and the
// executor's state; no reads, no streams, no steps, no branch over a list.
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
// - `version/<[path, version]>`: a path and a version a fact or an entry
//   was written at (DOM-22);
// - `state/…`: the business's records, its adapter's (`greetings.ts`).
// A fact, its writes, its operation, its entries and the counts go in one
// commit (DOM-8), one command at a time (DOM-9).

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
  version: (stored: zz.StoredVersion): string =>
    `version/${JSON.stringify([stored.path, stored.version])}`,
} as const

/** The range of the keys under a prefix that ends with `/`: from it, before its successor (EXT-14). */
const under = (prefix: string, from?: string): boundary.a_read => ({
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
    discarded: () => Promise.resolve(),
  })

  /** The paths and versions its facts and entries were written at (DOM-22). */
  const stored_versions: zz.StoredVersions = async () =>
    (await read(under('version/'))).map((entry) => {
      const [path, version] = stored_version.parse(JSON.parse(entry.key.slice('version/'.length)))
      return { path, version }
    })

  return { algebra, execute, recorded, log, outbox, executor, stored_versions }
}
