// The configurator of the shed (§ 7 of architecture.md, CFG-1): it wires the
// trees of the personas over the ports of the in-memory oracle, those of the
// people of the shed and that of Rossi's workshop, a system outside it
// (SC-34). The tree of a persona enters from the node of the persona base,
// which takes the `Caller` (PER-4, PER-6); its leaves, command and read,
// invoke the use cases of `tools` and `loans`, its nodes the lookups of
// `accounts`, found by path (`Invoked`). The effect executor of `loans`
// (DOM-14) delivers its effects to the world the oracle fakes, and brings
// the eve of a due date, and the due date, back to their returns. The
// consumers of the reactions (DOM-16) read the fact log of the cell and
// invoke the use cases of the offices they move: those of a procedure
// between offices (`retirement`, `damage`, `repair`), and those of an
// office's own processes (`loans`, its work sheet and its rounds of notices;
// `tools`, a sheet of tools loaded line by line). Everything that reads what
// the cell stored takes its versions, so that a fact or an effect of `loans`
// 1.x reaches every reader at 2.0.0 (DOM-22).
//
// It runs on the oracle since part 7.5, and the scenarios run through it
// (`scenarios/oracle.ts`): everything is wired, and checked (CFG-2), when the
// shed starts; the durable consumers run where the node runs them, in the
// writer only (DOM-9), so they are given wired, each to start.

import * as wlib from '../../src/library/index.ts'
import { memory_adapter, type Cell, type MemoryRelease } from './adapter/memory/index.ts'
import {
  send_the_due_date_reminder,
  send_the_repair_notice,
  send_the_weeks_summary,
  type Phones,
} from './adapter/memory/reminders.ts'
import { registry as loans_registry } from './business/loans/_registry.ts'
import { registry as tools_registry } from './business/tools/_registry.ts'
import { majors as loans_majors } from './business/loans/_majors.ts'
import { majors as tools_majors } from './business/tools/_majors.ts'
import {
  declare_the_loan_overdue,
  remind_the_member_of_the_due_date,
  sum_up_the_week_for_the_member,
} from './business/loans/_usecase.ts'
import { persona } from './persona/_node.ts'
import { registry as persona_registry } from './persona/_registry.ts'
import { registry as member_registry } from './persona/member/_registry.ts'
import { majors as member_majors } from './persona/member/_majors.ts'
import {
  borrow_a_tool,
  extend_your_loan,
  my_loans,
  my_reservations,
  my_reservations_in_the_workshop,
  return_a_tool,
  send_me_my_week_on_mondays,
  take_the_tool_you_booked,
  the_shelf,
} from './persona/member/_usecase.ts'
import { registry as keeper_registry } from './persona/keeper/_registry.ts'
import { majors as keeper_majors } from './persona/keeper/_majors.ts'
import {
  put_a_repaired_tool_back_in_service,
  retire_a_tool,
  send_a_tool_to_repair,
  the_loans_of_the_month,
  load_tools_from_a_sheet,
  load_tools_from_a_short_sheet,
} from './persona/keeper/_usecase.ts'
import { registry as workshop_registry } from './persona/workshop/_registry.ts'
import { majors as workshop_majors } from './persona/workshop/_majors.ts'
import { close_a_job } from './persona/workshop/_usecase.ts'
import { registry as visitor_registry } from './persona/visitor/_registry.ts'
import { majors as visitor_majors } from './persona/visitor/_majors.ts'
import { the_catalogue } from './persona/visitor/_usecase.ts'
import { registry as retirement_registry } from './reaction/retirement/_registry.ts'
import { registry as damage_registry } from './reaction/damage/_registry.ts'
import { registry as repair_registry } from './reaction/repair/_registry.ts'

/**
 * The world outside the shed, as the oracle fakes it: the members' phones,
 * and the clock of the executors and the consumers. The clock tells the zone
 * of the shed's calendar, which the shed's configuration declares (Toronto,
 * `America/Toronto`), not a domain: `loans` lends in any town (SC-12). The
 * time that passes, which measures how long a leaf that follows waits at
 * most (DOM-3) and wakes the executor when an entry comes due (DOM-14): a
 * timeout of the runtime that runs the shed.
 */
export interface World {
  readonly phones: Phones
  readonly clock: wlib.Clock
  readonly elapsed: wlib.Elapsed
}

/**
 * The release the shed runs: the majors of the domains whose data its store
 * keeps, as its code holds them (`_majors.ts`), and its adapter, the
 * oracle's as it is. A scenario gives another (TST-4): a release that
 * deleted a past major too early (SC-9), the oracle's adapter released with
 * a defect or streaming by composition (`MemoryRelease`).
 */
export interface Release {
  readonly majors?: readonly wlib.Majors[]
  readonly adapter?: MemoryRelease
}

export const shed =
  (cell: Cell, release: Release = {}) =>
  async (world: World) => {
    // The versions of the cell, composed once from the majors of every
    // domain whose facts and effects it keeps, checked against what it keeps
    // (a past major deleted too early stops the start), and given to
    // everything that reads them: the library alone takes what was stored to
    // the current shapes (DOM-22, A, 17 Nov 2026).
    const versions = await wlib.versions(release.majors ?? [loans_majors, tools_majors])({
      stored: cell.stored_versions,
    })
    const adapter = memory_adapter(cell, release.adapter)(versions)
    // The ports the trees invoke, by the folder of what they serve (PER-6):
    // where a leaf or a node finds the use case or the lookup it names.
    const invoked = {
      'business/tools': adapter.tools,
      'business/loans': adapter.loans,
      'auth/accounts': adapter.accounts,
    }
    // What every tree is wired to: the ports it invokes, the fact log a leaf
    // that follows reads (DOM-3), the trace of its rejections (F6, PER-14),
    // the time that passes.
    const wired = { invoked, log: adapter.log, trace: adapter.trace, elapsed: world.elapsed }
    const member = wlib.tree_ports({
      registry: { ...persona_registry, ...member_registry },
      versions,
      majors: member_majors,
      top: persona,
      use_cases: {
        borrow_a_tool,
        take_the_tool_you_booked,
        return_a_tool,
        extend_your_loan,
        my_loans,
        my_reservations,
        my_reservations_in_the_workshop,
        the_shelf,
        send_me_my_week_on_mondays,
      },
    })(wired)
    const keeper = wlib.tree_ports({
      registry: { ...persona_registry, ...keeper_registry },
      versions,
      majors: keeper_majors,
      top: persona,
      use_cases: {
        retire_a_tool,
        send_a_tool_to_repair,
        put_a_repaired_tool_back_in_service,
        the_loans_of_the_month,
        load_tools_from_a_sheet,
        load_tools_from_a_short_sheet,
      },
    })(wired)
    // Rossi's workshop, an actor from outside (D88.1, D91.1): its interface
    // verifies the signature of its system's key and gives the `Caller`
    // (PER-4), and the scope of its operations, whose ids its notifications
    // carry (SC-34).
    const workshop = wlib.tree_ports({
      registry: { ...persona_registry, ...workshop_registry },
      versions,
      majors: workshop_majors,
      top: persona,
      use_cases: { close_a_job },
    })(wired)
    const visitor = wlib.tree_ports({
      registry: { ...persona_registry, ...visitor_registry },
      versions,
      majors: visitor_majors,
      top: persona,
      use_cases: { the_catalogue },
    })(wired)
    const loans_effects = wlib.effect_executor({
      registry: loans_registry,
      versions,
      returns: {
        remind_the_member_of_the_due_date,
        declare_the_loan_overdue,
        sum_up_the_week_for_the_member,
      },
    })({
      'business/loans/effect/wait_until_the_eve_of_the_due_date': wlib.returns_the_payload,
      'business/loans/effect/wait_until_the_due_date': wlib.returns_the_payload,
      'business/loans/effect/send_the_due_date_reminder': send_the_due_date_reminder(cell.get)(
        world.phones,
      ),
      'business/loans/effect/send_the_repair_notice': send_the_repair_notice(cell.get)(
        world.phones,
      ),
      'business/loans/effect/wait_until_monday': wlib.returns_the_payload,
      'business/loans/effect/send_the_weeks_summary': send_the_weeks_summary(world.phones),
    })
    // The desk's work sheet and its rounds of notices move themselves on: a
    // reaction between two steps of one domain's process lives in that
    // domain (DOM-16).
    const loans_reactions = wlib.reaction_consumers({ registry: loans_registry, versions })({
      'business/loans/reaction/the_first_reservation_on_the_sheet_is_taken_up': {
        log: adapter.log,
        invokes: adapter.loans.continue_the_cancellation_of_reservations,
      },
      'business/loans/reaction/the_next_reservation_on_the_sheet_is_taken_up': {
        log: adapter.log,
        invokes: adapter.loans.continue_the_cancellation_of_reservations,
      },
      'business/loans/reaction/the_first_member_on_the_round_is_notified': {
        log: adapter.log,
        invokes: adapter.loans.continue_the_repair_notice_round,
      },
      'business/loans/reaction/the_next_member_on_the_round_is_notified': {
        log: adapter.log,
        invokes: adapter.loans.continue_the_repair_notice_round,
      },
    })
    // The desk's loading of a sheet of tools moves itself on (SC-44).
    const tools_reactions = wlib.reaction_consumers({ registry: tools_registry, versions })({
      'business/tools/reaction/the_first_line_of_the_sheet_is_taken_up': {
        log: adapter.log,
        invokes: adapter.tools.continue_the_loading_of_a_sheet,
      },
      'business/tools/reaction/the_next_line_of_the_sheet_is_taken_up': {
        log: adapter.log,
        invokes: adapter.tools.continue_the_loading_of_a_sheet,
      },
    })
    // The procedures, above the domains (GR-9).
    const damage = wlib.reaction_consumers({ registry: damage_registry, versions })({
      'reaction/damage/reaction/the_damaged_tool_goes_to_repair': {
        log: adapter.log,
        invokes: adapter.tools.send_a_tool_to_repair,
      },
    })
    const repair = wlib.reaction_consumers({ registry: repair_registry, versions })({
      'reaction/repair/reaction/the_members_who_booked_the_tool_are_notified': {
        log: adapter.log,
        invokes: adapter.loans.notify_the_members_of_a_repair,
      },
    })
    const retirement = wlib.reaction_consumers({ registry: retirement_registry, versions })({
      'reaction/retirement/reaction/the_reservations_of_the_tool_are_cancelled': {
        log: adapter.log,
        invokes: adapter.loans.cancel_the_reservations_of_a_tool,
      },
    })
    const consumers = { state: cell.reactions, clock: world.clock }
    return {
      /** The versions of the store, as its readers meet its data (DOM-22). */
      versions,
      /** The ports the trees invoke, by folder: the business's use cases, where no tree is above them. */
      invoked,
      /** The fact log of the cell (DOM-17). */
      log: adapter.log,
      member,
      keeper,
      workshop,
      visitor,
      /** The effect executor of `loans`, started (DOM-14). */
      loans_effects: () =>
        loans_effects({
          outbox: cell.outbox,
          returns: adapter.loans,
          state: cell.executor,
          clock: world.clock,
          elapsed: world.elapsed,
        }),
      /** The consumers of the reactions, by the folder that holds them, each set started (DOM-16). */
      reactions: {
        'business/loans': () => loans_reactions(consumers),
        'business/tools': () => tools_reactions(consumers),
        'reaction/damage': () => damage(consumers),
        'reaction/repair': () => repair(consumers),
        'reaction/retirement': () => retirement(consumers),
      },
    }
  }
