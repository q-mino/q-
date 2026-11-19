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
// operation. Since part 5.2 their streams too, native (the oracle's own, the
// reference) or composed by the library over the cell's log (`streams`),
// with the deviations a stream must bear injected (TST-4): a position the
// cell keeps no longer (`forget`), every fact delivered twice
// (`redelivered`). Since part 6.1 the trees of the personas (`keeper`,
// `member`, `visitor`) over the same ports and the lookups of `accounts`,
// entered as an interface would, for who asks (`as`), the accounts the shed
// is given at its start (`accounts`); and the fact log, a port of the
// adapter (`log`). Since part 6.2 the tree of Rossi's workshop, an actor
// from outside whose requests name their operation, entered with its scope
// alone (`as(…).named`, SC-34), and the trace of the trees, every request
// answered with no fact, with why (`traced`, F6, PER-14).

import type * as z from 'zod'
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
  type Strategy,
  log,
} from '../adapter/memory/index.ts'
import { accounts_lookups, type AccountsState } from '../adapter/memory/accounts.ts'
import { account_id, key_id } from '../auth/accounts/_id.ts'
import { hats, member_card } from '../auth/accounts/_value.ts'
import { registry as accounts_registry } from '../auth/accounts/_registry.ts'
import {
  the_hats_of_a_key,
  the_hats_of_an_account,
  the_member_card_of_an_account,
} from '../auth/accounts/_lookup.ts'
import { persona } from '../persona/_node.ts'
import { caller } from '../persona/_value.ts'
import { registry as persona_registry } from '../persona/_registry.ts'
import { registry as keeper_registry } from '../persona/keeper/_registry.ts'
import { majors as keeper_majors } from '../persona/keeper/_majors.ts'
import * as keeper from '../persona/keeper/_usecase.ts'
import { registry as member_registry } from '../persona/member/_registry.ts'
import { majors as member_majors } from '../persona/member/_majors.ts'
import * as member from '../persona/member/_usecase.ts'
import { registry as visitor_registry } from '../persona/visitor/_registry.ts'
import { majors as visitor_majors } from '../persona/visitor/_majors.ts'
import * as visitor from '../persona/visitor/_usecase.ts'
import { registry as workshop_registry } from '../persona/workshop/_registry.ts'
import { majors as workshop_majors } from '../persona/workshop/_majors.ts'
import * as workshop from '../persona/workshop/_usecase.ts'
import { majors as loans_majors } from '../business/loans/_majors.ts'
import { majors as tools_majors } from '../business/tools/_majors.ts'
import { registry as loans_registry } from '../business/loans/_registry.ts'
import { registry as tools_registry } from '../business/tools/_registry.ts'
import { notify_a_member_of_the_repair } from '../business/loans/_command.ts'

/** The zone of the shed's calendar, as its configuration declares it (`configurator.ts`, SC-12). */
export const time_zone = wlib.time_zone.parse('America/Toronto')

/** The state of a shed that has nothing yet, but the accounts it is given (`Start.accounts`). */
const nothing = (accounts: Partial<AccountsState> = {}): State => ({
  tools: new Map(),
  sheets: new Map(),
  sheet_lines: new Map(),
  loans: new Map(),
  reservations: new Map(),
  cancellations: new Map(),
  notice_rounds: new Map(),
  weekly_summaries: new Map(),
  hats: accounts.hats ?? new Map(),
  member_cards: accounts.member_cards ?? new Map(),
  key_hats: accounts.key_hats ?? new Map(),
})

/** The position of the fact recorded after so many, the first at 1. */
const position_at = (count: number): wlib.position => wlib.position.parse(String(count))

/**
 * A cell for the commands and the reads: its state, the facts it recorded in
 * order, each at its position, the first at 1, with the state before and
 * after it; the facts from a position on, inclusive, and those after it as
 * soon as there is one (DOM-17); the fact an operation recorded, kept for
 * every operation (DOM-11); the entries queued with the facts, in order,
 * after those it kept. Injected (TST-4): the positions before one it keeps
 * no longer, once forgotten (`forget`); every fact it gives a stream or a
 * log twice, if it redelivers (at least once, DOM-17).
 */
const command_cell = (
  kept: readonly wlib.StoredEntry[],
  redelivered: boolean,
  initial: State,
): CommandCell &
  ReadCell & {
    readonly entries: () => readonly wlib.StoredEntry[]
    readonly forget: (before: wlib.position) => void
  } => {
  let state = initial
  const recorded: Recorded[] = []
  const entries: wlib.StoredEntry[] = [...kept]
  const waiting: (() => void)[] = []
  let kept_from = 0
  const delivered = (facts: readonly Recorded[]): readonly Recorded[] =>
    redelivered ? facts.flatMap((each) => [each, each]) : facts
  const after = (position: wlib.position): readonly Recorded[] =>
    delivered(recorded.filter((each) => Number(each.position) > Number(position)))
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
    entries: () => entries,
    forget: (before) => {
      kept_from = Number(before)
    },
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

/**
 * How a shed starts: what its store kept, the majors its configurator gives,
 * the zone of its calendar; how its read ports stream, natively (the
 * oracle's, the default) or composed by the library over the cell's log
 * (DOM-2, D69.3); whether its cell delivers every fact twice to the streams
 * and the log (TST-4).
 */
export interface Start {
  readonly kept?: Kept
  readonly majors?: readonly wlib.Majors[]
  readonly time_zone?: string
  readonly streams?: Strategy
  readonly redelivered?: boolean
  readonly accounts?: Partial<AccountsState>
}

/** Who asks, as the interface verified it (PER-4): an account, a session, a key. */
export type Who = z.input<typeof caller>

/**
 * The accounts a shed starts with (`Start.accounts`), as a test writes
 * them: the hats and the member cards of each account, the hats of each key,
 * parsed by the values of `accounts`.
 */
export const accounts = (written: {
  readonly hats?: Readonly<Record<string, readonly string[]>>
  readonly member_cards?: Readonly<
    Record<string, { readonly id: string; readonly valid_until: string }>
  >
  readonly key_hats?: Readonly<Record<string, readonly string[]>>
}): Partial<AccountsState> => ({
  hats: new Map(
    Object.entries(written.hats ?? {}).map(([id, each]) => [
      account_id.parse(id),
      hats.parse(each),
    ]),
  ),
  member_cards: new Map(
    Object.entries(written.member_cards ?? {}).map(([id, card]) => [
      account_id.parse(id),
      member_card.parse(card),
    ]),
  ),
  key_hats: new Map(
    Object.entries(written.key_hats ?? {}).map(([id, each]) => [
      key_id.parse(id),
      hats.parse(each),
    ]),
  ),
})

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
  readonly correlation?: string
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
  const initial = nothing(start.accounts)
  const cell = command_cell(kept.entries ?? [], start.redelivered ?? false, initial)
  // The versions of the store, checked against what it kept (SC-9); its
  // state rebuilt from its log, each fact kept as it was stored (SC-8): a
  // store that kept no fact has nothing to rebuild.
  const versions = await wlib.versions(start.majors ?? [loans_majors, tools_majors])({
    stored: () => Promise.resolve(stored_versions(kept)),
  })
  const facts = kept.facts ?? []
  const rebuilding =
    facts.length === 0 ? one_at_a_time([]) : rebuilt(versions)(initial)(log_of(facts))
  for await (const each of rebuilding) {
    const fact = facts[Number(each.position) - 1]
    if (fact === undefined) throw new Error('a rebuild gave a position the log did not keep')
    cell.record({ fact, entries: [], state: each.state })
  }
  const ports = memory_commands(cell)(versions)
  const reads = memory_reads(cell, start.streams)(versions)
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
      correlation: wlib.correlation.parse(sent.correlation ?? `correlation-${id}`),
    }
  }
  // The trees of the personas (part 6.1), as the configurator wires them:
  // over the ports the library built, by the folder of what they serve, and
  // the lookups of `accounts` over the accounts the shed is given.
  const invoked = {
    'business/tools': { ...ports.tools, ...reads.tools },
    'business/loans': { ...ports.loans, ...reads.loans },
    'auth/accounts': wlib.lookup_ports({
      registry: accounts_registry,
      lookups: { the_hats_of_an_account, the_hats_of_a_key, the_member_card_of_an_account },
    })(accounts_lookups(cell.get)),
  }
  // The trace of the trees (F6, PER-14), as the cell keeps it: every entry,
  // in the order the library hands it.
  const trace: wlib.Traced<unknown>[] = []
  const wired = {
    invoked,
    log: log(cell),
    trace: (traced: wlib.Traced<unknown>) => {
      trace.push(traced)
    },
  }
  const trees = {
    keeper: wlib.tree_ports({
      registry: { ...persona_registry, ...keeper_registry },
      versions,
      majors: keeper_majors,
      top: persona,
      use_cases: {
        retire_a_tool: keeper.retire_a_tool,
        send_a_tool_to_repair: keeper.send_a_tool_to_repair,
        put_a_repaired_tool_back_in_service: keeper.put_a_repaired_tool_back_in_service,
        the_loans_of_the_month: keeper.the_loans_of_the_month,
      },
    })(wired),
    member: wlib.tree_ports({
      registry: { ...persona_registry, ...member_registry },
      versions,
      majors: member_majors,
      top: persona,
      use_cases: {
        borrow_a_tool: member.borrow_a_tool,
        return_a_tool: member.return_a_tool,
        extend_your_loan: member.extend_your_loan,
        the_shelf: member.the_shelf,
      },
    })(wired),
    visitor: wlib.tree_ports({
      registry: { ...persona_registry, ...visitor_registry },
      versions,
      majors: visitor_majors,
      top: persona,
      use_cases: { the_catalogue: visitor.the_catalogue },
    })(wired),
    workshop: wlib.tree_ports({
      registry: { ...persona_registry, ...workshop_registry },
      versions,
      majors: workshop_majors,
      top: persona,
      use_cases: { close_a_job: workshop.close_a_job },
    })(wired),
  }
  /**
   * What the entry gives a tree for who asks (PER-4, PER-6): the `Caller`
   * as the interface verified it, the version the client was built at
   * (D72.7); for a command at an instant the context of `at`, with its
   * operation and correlation, for a read the context of `when`; for a
   * command whose input names its operation (SC-34), its scope alone
   * (`named`), the correlation the entry's own.
   */
  const as = <const version extends wlib.Semver>(who: Who, version: version) => ({
    at: (instant: string, sent: Sent = {}) => ({
      caller: caller.parse(who),
      version,
      ...at(instant, sent),
    }),
    when: (instant: string) => ({
      caller: caller.parse(who),
      version,
      now: wlib.in_zone(zone)(wlib.date_time.parse(instant)),
      time_zone: zone,
    }),
    named: (instant: string, sent: Omit<Sent, 'operation'> = {}) => {
      const { operation, ...entered } = at(instant, sent)
      return {
        caller: caller.parse(who),
        version,
        ...entered,
        operation: { scope: operation.scope },
      }
    },
  })
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
    ...trees,
    at,
    as,
    /** The fact log of the cell, a port of the adapter (DOM-17): what a fact carries, its correlation (DOM-10). */
    log: wired.log,
    /** The trace of the trees, a port of the adapter (F6): where a test wires a tree of its own. */
    trace: wired.trace,
    /** What the trees' trace holds, in the order handed (F6, PER-14): a request answered with no fact, with why. */
    traced: (): readonly wlib.Traced<unknown>[] => [...trace],
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
    /** The positions before this one, which the cell keeps no longer (TST-4): a stream from one of them is `position_unavailable`. */
    forget: cell.forget,
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

/** The next events of a stream that stays open, so many, as the consumer pulls them. */
export const pull = async <event>(
  stream: AsyncIterator<event>,
  count: number,
): Promise<readonly event[]> => {
  const pulled: event[] = []
  while (pulled.length < count) {
    const next = await stream.next()
    if (next.done === true) throw new Error('the stream ended')
    pulled.push(next.value)
  }
  return pulled
}

/** The events of a stream that stays open, up to `caught_up` or a terminal event, included. */
export const until_caught_up = async <event extends { readonly event: string }>(
  stream: AsyncIterator<event>,
): Promise<readonly event[]> => {
  const pulled: event[] = []
  for (;;) {
    const next = await stream.next()
    if (next.done === true) return pulled
    pulled.push(next.value)
    if (next.value.event === 'caught_up' || next.value.event === 'position_unavailable')
      return pulled
  }
}

/** An event of a read, as a consumer of a live view reads it. */
export interface Seen {
  readonly event: string
  readonly position?: wlib.position
  readonly identity?: unknown
  readonly entry?: unknown
  readonly entries?: readonly unknown[]
}

/**
 * What a consumer of a live view holds after a read's events (DOM-17): the
 * snapshot's entries by identity, then each event applied, an entry set by
 * `fact`, `entered` or `changed`, removed by `left`; an event already met,
 * by position and identity, left out, so that a resume, inclusive, and a
 * fact delivered twice change nothing (D72). The state the snapshot at P
 * and the events from P rebuild, compared with the snapshot at the end
 * (D69.3).
 */
export const view =
  (identity: string) =>
  (events: readonly Seen[]): ReadonlyMap<unknown, unknown> => {
    const held = new Map<unknown, unknown>()
    const met = new Set<string>()
    for (const event of events) {
      if (event.event === 'snapshot') {
        held.clear()
        for (const entry of event.entries ?? []) {
          if (typeof entry === 'object' && entry !== null && identity in entry)
            held.set(Reflect.get(entry, identity), entry)
        }
        continue
      }
      if (event.position === undefined || !('identity' in event)) continue
      const key = `${event.position} ${JSON.stringify(event.identity)}`
      if (met.has(key)) continue
      met.add(key)
      if (event.event === 'left') held.delete(event.identity)
      else held.set(event.identity, event.entry)
    }
    return held
  }

/**
 * A read followed from its snapshot while a story runs, up to `caught_up`,
 * and read again at the end: what the test of D69.3 compares, the snapshot
 * at P with the events from P against the snapshot at the end. An event of
 * the fact at P, which the snapshot holds, is a double (D72): it throws.
 */
export const followed = async <event extends Seen>(
  open: () => AsyncIterator<event>,
  story: () => Promise<void>,
): Promise<{
  readonly snapshot: readonly event[]
  readonly events: readonly event[]
  readonly at_the_end: readonly event[]
}> => {
  const live = open()
  const snapshot = await pull(live, 1)
  await story()
  const events = await until_caught_up(live)
  // No double (D72): the fact at the snapshot's position is in the snapshot.
  const at = snapshot[0]?.position
  if (events.some((event) => event.event !== 'caught_up' && event.position === at)) {
    throw new Error(`a stream gave again the fact at its snapshot's position, ${String(at)}`)
  }
  return { snapshot, events, at_the_end: await pull(open(), 1) }
}

/** The events of a stream as their kind and position, the shape a scenario reads first. */
export const told = (events: readonly Seen[]): readonly (readonly [string, unknown])[] =>
  events.map((event) => [event.event, event.position])
