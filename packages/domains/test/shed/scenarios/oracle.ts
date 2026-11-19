// The harness of the scenarios (TST-2, TST-3): one cell of the oracle, the
// in-memory state adapter of the shed, and the ports the library builds over
// it; the clock and the ids injected, so that a scenario says when each
// request is sent and under which operation. A scenario observes only what
// the ports give (TST-3), never the cell's state.
//
// Part 4.1 gives the command ports of `tools` and `loans`; the reads, the
// trees, the executors and the consumers join it with their parts, until the
// configurator runs whole (7.5). Since part 4.2 the harness enters a request
// as an entry does (DOM-11): the library computes its fingerprint. Since
// part 4.3 it enters alone a transition only a step composes in Shed
// (`alone`, SC-55), until the steps have a body (7.4). Since part 4.4 a
// shed may start from what its store kept before a release (`kept`: facts
// and outbox entries of `loans` 1.x), its state rebuilt from that log
// through the library (`replay`, SC-8), with the majors it is given (SC-9)
// and the zone of its calendar (SC-12); the entries it queues are read as
// the executor will read them, at the current shape (`queued`). Since part
// 5.1 the read ports of `tools` and `loans` join the harness, over the same
// cell: their snapshots, a read sent at an instant (`when`), with no
// operation.

import * as wlib from '../wlib.ts'
import {
  loans_command_adapter,
  loans_command_use_cases,
  memory_commands,
  memory_reads,
  rebuilt,
  tools_command_use_cases,
  type CommandCell,
  type ReadCell,
  type Recorded,
  type State,
} from '../adapter/memory/index.ts'
import { majors as loans_majors } from '../business/loans/_majors.ts'
import { majors as tools_majors } from '../business/tools/_majors.ts'
import { registry as loans_registry } from '../business/loans/_registry.ts'
import { registry as tools_registry } from '../business/tools/_registry.ts'
import { notify_a_member_of_the_repair } from '../business/loans/_command.ts'

/** The zone of the shed's calendar, as its configuration declares it (`configurator.ts`, SC-12). */
export const time_zone = wlib.time_zone.parse('America/Toronto')

/** The state of a shed that has nothing yet. */
const nothing: State = {
  tools: new Map(),
  sheets: new Map(),
  sheet_lines: new Map(),
  loans: new Map(),
  reservations: new Map(),
  cancellations: new Map(),
  notice_rounds: new Map(),
  weekly_summaries: new Map(),
  hats: new Map(),
  member_cards: new Map(),
  key_hats: new Map(),
}

/** The position of the fact recorded after so many, the first at 1. */
const position_at = (count: number): wlib.position => wlib.position.parse(String(count))

/**
 * A cell for the commands and the reads: its state, the facts it recorded in
 * order, each at its position, the first at 1, with the state before and
 * after it; the facts from a position on, inclusive, and those after it as
 * soon as there is one (DOM-17); the fact an operation recorded, kept for
 * every operation (DOM-11); the entries queued with the facts, in order,
 * after those it kept.
 */
const command_cell = (
  kept: readonly wlib.StoredEntry[],
): CommandCell &
  ReadCell & {
    readonly entries: () => readonly wlib.StoredEntry[]
  } => {
  let state = nothing
  const recorded: Recorded[] = []
  const entries: wlib.StoredEntry[] = [...kept]
  const waiting: (() => void)[] = []
  const after = (position: wlib.position): readonly Recorded[] =>
    recorded.filter((each) => Number(each.position) > Number(position))
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
    history: (from) => ({
      history: 'kept',
      recorded: recorded.filter(
        (each) => from === undefined || Number(each.position) >= Number(from),
      ),
      position: position_at(recorded.length),
    }),
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
    entries: () => entries,
  }
}

/**
 * What a store kept before a release (SC-8, SC-9): its facts, in the order
 * of its log from position 1, each part at the version it was written at,
 * and the outbox entries queued with them.
 */
export interface Kept {
  readonly facts?: readonly wlib.StoredEnvelope[]
  readonly entries?: readonly wlib.StoredEntry[]
}

/** How a shed starts: what its store kept, the majors its configurator gives, the zone of its calendar. */
export interface Start {
  readonly kept?: Kept
  readonly majors?: readonly wlib.Majors[]
  readonly time_zone?: string
}

/** Values given one at a time, each when asked. */
export const one_at_a_time = <value>(values: readonly value[]): AsyncIterable<value> => ({
  [Symbol.asyncIterator]: () => {
    const each = values[Symbol.iterator]()
    return { next: () => Promise.resolve(each.next()) }
  },
})

/** The log of the facts a store kept, from the first, then the end of what it kept (DOM-17). */
const log_of =
  (facts: readonly wlib.StoredEnvelope[]): wlib.FactLog =>
  () =>
    one_at_a_time<wlib.LogEvent>([
      ...facts.map((fact, i): wlib.LogEvent => ({
        event: 'fact',
        position: position_at(i + 1),
        fact,
      })),
      { event: 'caught_up', position: position_at(facts.length) },
    ])

/** The paths and versions a store keeps, distinct, among its facts' parts and its entries (DOM-22). */
const stored_versions = (kept: Kept): readonly wlib.StoredVersion[] => {
  const all = [
    ...(kept.facts ?? []).flatMap((fact) =>
      fact.parts.map((part) => ({ path: part.path, version: part.version })),
    ),
    ...(kept.entries ?? []).map((entry) => ({ path: entry.effect, version: entry.version })),
  ]
  return all.filter(
    (each, i) =>
      all.findIndex((other) => other.path === each.path && other.version === each.version) === i,
  )
}

/**
 * A transition with no use case of its own, entered alone (SC-55): in Shed
 * only the step of the round of the repair notices composes it, so that no
 * one sends it (DOM-2); the harness declares a use case over it, at a path
 * of its own, so that a scenario reads its fact's envelope before the steps
 * have a body (part 7.4). The harness's entry, not Shed's.
 */
const notify_alone = wlib.builders_at<wlib.RootContext>().command_use_case({
  command: notify_a_member_of_the_repair,
})

/** The path of the use case the harness declares over the notice (`notify_alone`). */
const notify_alone_path = 'business/loans/usecase/notify_a_member_of_the_repair'

/** A request's operation: its id, and the scope the entry composes (hat and `Caller`'s id, DOM-11). */
export interface Sent {
  readonly operation?: string
  readonly scope?: string
}

/**
 * What the entry gives a command's port (DOM-11): the context of its root,
 * the operation, the correlation. The fingerprint is the library's, which
 * it computes where the request enters (`fingerprint_of`).
 */
export type EntryContext = Omit<wlib.CommandRootContext, 'fingerprint'>

/** A command use case's port, as the library builds it. */
type Port<input, event> = (context: wlib.CommandRootContext, input: input) => AsyncIterable<event>

/** The path of every port of a domain, by the object of its port (DOM-24). */
const paths_of_ports = (
  registry: wlib.Registry,
  use_cases: Readonly<Record<string, unknown>>,
  ports: Readonly<Record<string, unknown>>,
): ReadonlyMap<unknown, string> => {
  const paths = new Map<unknown, string>(
    Object.entries(registry).map(([path, entry]) => [entry, path]),
  )
  return new Map(
    Object.entries(ports).map(([name, port]) => {
      const path = paths.get(use_cases[name])
      if (path === undefined) throw new Error(`${name} is not in the registry given`)
      return [port, path]
    }),
  )
}

/**
 * The oracle of the scenarios: the command ports of `tools` and `loans`,
 * each entered as an entry would (DOM-11): the fingerprint computed by the
 * library over the use case's path and its input as sent (LIB-11), here
 * where no leaf is above it; and the context of a request sent at an
 * instant. Each request is a new operation unless the scenario names one;
 * its correlation is its own (the origin, DOM-10).
 */
export const oracle = async (start: Start = {}) => {
  const kept = start.kept ?? {}
  const zone = start.time_zone === undefined ? time_zone : wlib.time_zone.parse(start.time_zone)
  const cell = command_cell(kept.entries ?? [])
  // The versions of the store, checked against what it kept (SC-9); its
  // state rebuilt from its log, each fact kept as it was stored (SC-8): a
  // store that kept no fact has nothing to rebuild.
  const versions = await wlib.versions(start.majors ?? [loans_majors, tools_majors])({
    stored: () => Promise.resolve(stored_versions(kept)),
  })
  const facts = kept.facts ?? []
  const rebuilding =
    facts.length === 0 ? one_at_a_time([]) : rebuilt(versions)(nothing)(log_of(facts))
  for await (const each of rebuilding) {
    const fact = facts[Number(each.position) - 1]
    if (fact === undefined) throw new Error('a rebuild gave a position the log did not keep')
    cell.record({ fact, entries: [], state: each.state })
  }
  const ports = memory_commands(cell)(versions)
  const reads = memory_reads(cell)(versions)
  const alone_registry = {
    ...tools_registry,
    ...loans_registry,
    [notify_alone_path]: notify_alone,
  }
  const alone = wlib.command_use_case_ports({
    registry: alone_registry,
    versions,
    use_cases: { notify_a_member_of_the_repair: notify_alone },
  })(loans_command_adapter(cell))
  const paths = new Map([
    ...paths_of_ports(tools_registry, tools_command_use_cases, ports.tools),
    ...paths_of_ports(loans_registry, loans_command_use_cases, ports.loans),
    ...paths_of_ports(alone_registry, { notify_a_member_of_the_repair: notify_alone }, alone),
  ])
  const entered =
    <input, event>(port: Port<input, event>) =>
    (context: EntryContext, input: input): AsyncIterable<event> => {
      const path = paths.get(port)
      if (path === undefined) throw new Error('a port the oracle did not build')
      return port({ ...context, fingerprint: wlib.fingerprint_of({ path, input }) }, input)
    }
  let operations = 0
  const at = (instant: string, sent: Sent = {}): EntryContext => {
    operations += 1
    const id = sent.operation ?? `op-${String(operations)}`
    return {
      now: wlib.in_zone(zone)(wlib.date_time.parse(instant)),
      time_zone: zone,
      operation: { id: wlib.operation_id.parse(id), scope: sent.scope ?? 'keeper/luca' },
      correlation: wlib.correlation.parse(`correlation-${id}`),
    }
  }
  return {
    tools: {
      add_a_tool: entered(ports.tools.add_a_tool),
      retire_a_tool: entered(ports.tools.retire_a_tool),
      send_a_tool_to_repair: entered(ports.tools.send_a_tool_to_repair),
      put_a_repaired_tool_back_in_service: entered(ports.tools.put_a_repaired_tool_back_in_service),
      close_a_repair: entered(ports.tools.close_a_repair),
      rename_a_tool: entered(ports.tools.rename_a_tool),
      load_the_tools_of_a_sheet: entered(ports.tools.load_the_tools_of_a_sheet),
      load_the_tools_of_a_short_sheet: entered(ports.tools.load_the_tools_of_a_short_sheet),
      continue_the_loading_of_a_sheet: entered(ports.tools.continue_the_loading_of_a_sheet),
      ...reads.tools,
    },
    loans: {
      borrow_a_tool: entered(ports.loans.borrow_a_tool),
      lend_a_booked_tool: entered(ports.loans.lend_a_booked_tool),
      extend_the_loan: entered(ports.loans.extend_the_loan),
      correct_the_tool_of_a_loan: entered(ports.loans.correct_the_tool_of_a_loan),
      reserve_a_tool: entered(ports.loans.reserve_a_tool),
      return_a_tool: entered(ports.loans.return_a_tool),
      remind_the_member_of_the_due_date: entered(ports.loans.remind_the_member_of_the_due_date),
      declare_the_loan_overdue: entered(ports.loans.declare_the_loan_overdue),
      cancel_the_reservations_of_a_tool: entered(ports.loans.cancel_the_reservations_of_a_tool),
      continue_the_cancellation_of_reservations: entered(
        ports.loans.continue_the_cancellation_of_reservations,
      ),
      notify_the_members_of_a_repair: entered(ports.loans.notify_the_members_of_a_repair),
      continue_the_repair_notice_round: entered(ports.loans.continue_the_repair_notice_round),
      begin_a_weekly_summary: entered(ports.loans.begin_a_weekly_summary),
      sum_up_the_week_for_the_member: entered(ports.loans.sum_up_the_week_for_the_member),
      ...reads.loans,
    },
    alone: {
      notify_a_member_of_the_repair: entered(alone.notify_a_member_of_the_repair),
    },
    at,
    /** The context of a read sent at an instant: its `now`, told in the shed's zone, and the zone (DOM-18); no operation. */
    when: (instant: string): wlib.RootContext => ({
      now: wlib.in_zone(zone)(wlib.date_time.parse(instant)),
      time_zone: zone,
    }),
    /**
     * The entries queued for an effect, in order, as its executor will
     * read them (part 7.1): at the current shape, by the store's versions
     * (DOM-22), so that a wait queued at 1.x gives its return the input of
     * 2.0.0.
     */
    queued: (effect: string): readonly wlib.EntryFields[] =>
      cell
        .entries()
        .filter((entry) => entry.effect === effect)
        .map((entry) => versions[wlib.$Versions].entry(entry)),
    versions,
  }
}

/** The first event of a port's stream: a command's outcome, the first event and a terminal one (DOM-2). */
export const first = async <event>(events: AsyncIterable<event>): Promise<event> => {
  for await (const event of events) return event
  throw new Error('the port gave no event')
}

/** Every event of a port's stream, until it ends: a read that does not stream, an input not in its schema. */
export const all = async <event>(events: AsyncIterable<event>): Promise<readonly event[]> => {
  const every: event[] = []
  for await (const event of events) every.push(event)
  return every
}
