// The cell of q-'s oracle (TST-2, V10): where the in-memory state adapter
// keeps the state of every domain of a node and its facts, one command at a
// time (DOM-9). A port, so that a test can look at it, and so that the
// deviations a stream and an executor must bear are injected (TST-4): a
// position it keeps no longer (`forget`), every fact and every entry given
// twice (`redelivered`). On the model of Shed's (`test/shed/scenarios/oracle.ts`).

import * as zz from '@q-mino/domains/library'

/** A recorded fact with its outbox entries and the state it left. */
export interface Step<state> {
  readonly fact: zz.StoredEnvelope
  readonly entries: readonly zz.StoredEntry[]
  readonly state: state
}

/** A recorded fact, at its position, with the state before and after it. */
export interface Recorded<state> {
  readonly position: zz.position
  readonly fact: zz.StoredEnvelope
  readonly before: state
  readonly after: state
}

/**
 * What the cell keeps from a position on: the facts recorded, and its
 * position when asked; or nothing, when it keeps that position no longer (a
 * test injects it, TST-4).
 */
export type History<state> =
  | {
      readonly history: 'kept'
      readonly recorded: readonly Recorded<state>[]
      readonly position: zz.position
    }
  | { readonly history: 'forgotten' }

/**
 * The cell: its state; recording a step; its position, which counts the facts
 * recorded; the facts from a position on, inclusive, and those after it as
 * soon as there is one (DOM-17); the fact an operation recorded, kept for
 * every operation (DOM-11); the outbox, effect by effect, each entry at its
 * position counting every entry (DOM-14); the paths and versions it keeps
 * (DOM-22); the executors' durable state; the trees' trace (F6, PER-14).
 */
export interface Cell<state> {
  readonly get: () => state
  readonly record: (step: Step<state>) => void
  readonly position: () => zz.position
  readonly history: (from: zz.position | undefined) => History<state>
  readonly after: (position: zz.position) => Promise<readonly Recorded<state>[]>
  readonly recorded_by: (operation: zz.Operation) => Recorded<state> | undefined
  readonly outbox: zz.Outbox
  readonly stored_versions: zz.StoredVersions
  readonly executor: zz.ExecutorState
  readonly trace: zz.Trace<unknown>
}

/** What the commands need of the cell: its state, recording a step, its position, the fact an operation recorded. */
export type CommandCell<state> = Pick<Cell<state>, 'get' | 'record' | 'position' | 'recorded_by'>

/** What the reads need of the cell: its state and its position, for a snapshot; its history, for a stream. */
export type ReadCell<state> = Pick<Cell<state>, 'get' | 'position' | 'history' | 'after'>

/** The position of the fact recorded after so many, the first at 1. */
export const position_at = (count: number): zz.position => zz.position.parse(String(count))

/** What a cell is made with: its first state; whether it gives every fact and every entry twice (TST-4). */
export interface Making<state> {
  readonly initial: state
  readonly redelivered?: boolean
}

/** A cell and what a test injects into it, or reads of it: its entries, the positions it forgets, the trace. */
export interface Made<state> extends Cell<state> {
  /** Every entry queued with the facts, in order. */
  readonly entries: () => readonly zz.StoredEntry[]
  /** The positions before this one, which the cell keeps no longer (TST-4). */
  readonly forget: (before: zz.position) => void
  /** What the trees' trace holds, in the order handed (F6, PER-14). */
  readonly traced: () => readonly zz.Traced<unknown>[]
  /** The entries the executor holds, as its state keeps them (DOM-14). */
  readonly held: () => readonly zz.HeldEntry[]
}

/**
 * A new cell (TST-2): the facts it records in order, each at its position,
 * with the state before and after it; the executor's state kept across a
 * fall, so that an executor started again finds its positions and letters.
 */
export const cell = <state>(making: Making<state>): Made<state> => {
  let state = making.initial
  const redelivered = making.redelivered ?? false
  const recorded: Recorded<state>[] = []
  const entries: zz.StoredEntry[] = []
  const waiting: (() => void)[] = []
  const trace: zz.Traced<unknown>[] = []
  let kept_from = 0
  const delivered = <each>(given: readonly each[]): readonly each[] =>
    redelivered ? given.flatMap((one) => [one, one]) : given
  const after = (position: zz.position): readonly Recorded<state>[] =>
    delivered(recorded.filter((each) => Number(each.position) > Number(position)))
  const positions = new Map<string, zz.position>()
  let holding: readonly zz.HeldEntry[] = []
  const same_entry = (a: zz.QueuedEntry) => (b: zz.QueuedEntry) =>
    a.entry.effect === b.entry.effect && a.entry.id === b.entry.id
  const executor: zz.ExecutorState = {
    position: (effect) => Promise.resolve(positions.get(effect)),
    advance: (effect) => (to) => {
      positions.set(effect, to)
      return Promise.resolve()
    },
    held: (effect) => Promise.resolve(holding.filter((each) => each.entry.effect === effect)),
    hold: (entry) => {
      holding = (
        holding.some(same_entry(entry))
          ? holding.map((each) => (same_entry(entry)(each) ? entry : each))
          : [...holding, entry]
      ).toSorted((a, b) => Number(a.position) - Number(b.position))
      return Promise.resolve()
    },
    release: (entry) => {
      holding = holding.filter((each) => !same_entry(entry)(each))
      return Promise.resolve()
    },
    discarded: () => Promise.resolve(),
  }
  const stored = (): readonly zz.StoredVersion[] => {
    const all = [
      ...recorded.flatMap((each) =>
        each.fact.parts.map((part) => ({ path: part.path, version: part.version })),
      ),
      ...entries.map((entry) => ({ path: entry.effect, version: entry.version })),
    ]
    return all.filter(
      (each, i) =>
        all.findIndex((other) => other.path === each.path && other.version === each.version) === i,
    )
  }
  return {
    get: () => state,
    record: (step) => {
      recorded.push({
        position: position_at(recorded.length + 1),
        fact: step.fact,
        before: state,
        after: step.state,
      })
      entries.push(...step.entries)
      state = step.state
      for (const wake of waiting.splice(0)) wake()
    },
    position: () => position_at(recorded.length),
    history: (from) =>
      (from === undefined ? 1 : Number(from)) < kept_from
        ? { history: 'forgotten' }
        : {
            history: 'kept',
            recorded: delivered(
              recorded.filter(
                (each) => from === undefined || Number(each.position) >= Number(from),
              ),
            ),
            position: position_at(recorded.length),
          },
    after: (position) =>
      after(position).length > 0
        ? Promise.resolve(after(position))
        : new Promise((resolve) => {
            waiting.push(() => {
              resolve(after(position))
            })
          }),
    recorded_by: (operation) =>
      recorded.find(
        (each) =>
          each.fact.operation.id === operation.id && each.fact.operation.scope === operation.scope,
      ),
    outbox: (effect) => (from) => ({
      [Symbol.asyncIterator]: () => {
        let index = from === undefined ? 0 : Number(from) - 1
        let again: zz.QueuedEntry | undefined = undefined
        const next = async (): Promise<IteratorResult<zz.QueuedEntry>> => {
          if (again !== undefined) {
            const value = again
            again = undefined
            return { done: false, value }
          }
          for (;;) {
            const entry = entries[index]
            if (entry === undefined) {
              await new Promise<void>((wake) => {
                waiting.push(wake)
              })
              continue
            }
            index += 1
            if (entry.effect !== effect) continue
            const value = { position: position_at(index), entry }
            if (redelivered) again = value
            return { done: false, value }
          }
        }
        return { next }
      },
    }),
    stored_versions: () => Promise.resolve(stored()),
    executor,
    trace: (traced) => {
      trace.push(traced)
    },
    entries: () => entries,
    forget: (before) => {
      kept_from = Number(before)
    },
    traced: () => [...trace],
    held: () => [...holding],
  }
}
