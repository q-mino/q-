// The harness of the scenarios (TST-2, TST-3): one cell of the oracle, the
// in-memory state adapter of the shed, and the ports the library builds over
// it; the clock and the ids injected, so that a scenario says when each
// request is sent and under which operation. A scenario observes only what
// the ports give (TST-3), never the cell's state.
//
// Part 4.1 gives the command ports of `tools` and `loans`; the reads, the
// trees, the executors and the consumers join it with their parts, until the
// configurator runs whole (7.5).

import * as wlib from '../wlib.ts'
import {
  memory_commands,
  type CommandCell,
  type Recorded,
  type State,
} from '../adapter/memory/index.ts'
import { majors as loans_majors } from '../business/loans/_majors.ts'
import { majors as tools_majors } from '../business/tools/_majors.ts'

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

/**
 * A cell for the commands: its state, the facts it recorded in order, each
 * at its position, the first at 1; the fact an operation recorded, kept
 * for every operation (DOM-11).
 */
const command_cell = (): CommandCell => {
  let state = nothing
  const recorded: Recorded[] = []
  const position_at = (count: number): wlib.position => wlib.position.parse(String(count))
  return {
    get: () => state,
    record: (step) => {
      recorded.push({
        position: position_at(recorded.length + 1),
        fact: step.fact,
        before: state,
        after: step.state,
      })
      state = step.state
    },
    position: () => position_at(recorded.length),
    recorded_by: (operation) =>
      recorded.find(
        (each) =>
          each.fact.operation.id === operation.id && each.fact.operation.scope === operation.scope,
      ),
  }
}

/** A request's operation: its id, and the scope the entry composes (hat and `Caller`'s id, DOM-11). */
export interface Sent {
  readonly operation?: string
  readonly scope?: string
}

/**
 * The oracle of the scenarios: the command ports of `tools` and `loans`, and
 * the context of a request sent at an instant. Each request is a new
 * operation unless the scenario names one; its correlation is its own (the
 * origin, DOM-10). The fingerprint is the harness's, one per operation,
 * until the library computes it where the request enters (part 4.2, LIB-11).
 */
export const oracle = async () => {
  const cell = command_cell()
  const versions = await wlib.versions([loans_majors, tools_majors])({
    stored: () => Promise.resolve([]),
  })
  const ports = memory_commands(cell)(versions)
  let operations = 0
  const at = (instant: string, sent: Sent = {}): wlib.CommandRootContext => {
    operations += 1
    const id = sent.operation ?? `op-${String(operations)}`
    return {
      now: wlib.in_zone(time_zone)(wlib.date_time.parse(instant)),
      time_zone,
      operation: { id: wlib.operation_id.parse(id), scope: sent.scope ?? 'keeper/luca' },
      correlation: wlib.correlation.parse(`correlation-${id}`),
      fingerprint: wlib.fingerprint.parse(`fingerprint-${id}`),
    }
  }
  return { tools: ports.tools, loans: ports.loans, at }
}

/** The first event of a port's stream: a command's outcome, the first event and a terminal one (DOM-2). */
export const first = async <event>(events: AsyncIterable<event>): Promise<event> => {
  for await (const event of events) return event
  throw new Error('the port gave no event')
}
