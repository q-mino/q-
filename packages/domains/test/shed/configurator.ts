// A sketch of the configurator of the shed (§ 7 of architecture.md): it wires
// the trees of the personas over the ports of the in-memory oracle. The tree
// of a persona enters from the node of the persona base, which takes the
// `Caller` (PER-4, PER-6); its leaves, command and read, invoke the use cases
// of `tools` and `loans`, its nodes the lookups of `accounts`, found by path
// (`Invoked`). The effect executor of `loans` (DOM-14) delivers its effects
// to the world the oracle fakes, and brings the eve of a due date, and the
// due date, back to their returns. The consumers of the reactions (DOM-16)
// read the fact log of the cell and invoke the use cases of the offices they
// move: those of a procedure between offices (`retirement`, `damage`,
// `repair`), and those of an office's own processes (`loans`, its work sheet
// and its rounds of notices). Nothing runs: the library is wished.

import * as wlib from './wlib.ts'
import { memory_adapter, type Cell } from './adapter/memory/index.ts'
import {
  send_the_due_date_reminder,
  send_the_repair_notice,
  type Phones,
} from './adapter/memory/reminders.ts'
import { registry as loans_registry } from './business/loans/_registry.ts'
import {
  declare_the_loan_overdue,
  remind_the_member_of_the_due_date,
} from './business/loans/_usecase.ts'
import { persona } from './persona/_node.ts'
import { registry as persona_registry } from './persona/_registry.ts'
import { registry as member_registry } from './persona/member/_registry.ts'
import { borrow_a_tool, my_loans, return_a_tool } from './persona/member/_usecase.ts'
import { registry as keeper_registry } from './persona/keeper/_registry.ts'
import {
  put_a_repaired_tool_back_in_service,
  retire_a_tool,
  send_a_tool_to_repair,
} from './persona/keeper/_usecase.ts'
import { registry as visitor_registry } from './persona/visitor/_registry.ts'
import { the_catalogue } from './persona/visitor/_usecase.ts'
import { registry as retirement_registry } from './reaction/retirement/_registry.ts'
import { registry as damage_registry } from './reaction/damage/_registry.ts'
import { registry as repair_registry } from './reaction/repair/_registry.ts'

/** The world outside the shed, as the oracle fakes it: the members' phones, and the clock of the executors. */
export interface World {
  readonly phones: Phones
  readonly clock: () => wlib.date_time_string
}

export const shed = (cell: Cell) => (world: World) => {
  const adapter = memory_adapter(cell)
  const invoked = {
    'business/tools': adapter.tools,
    'business/loans': adapter.loans,
    'auth/accounts': adapter.accounts,
  }
  return {
    member: wlib.tree_ports({
      registry: { ...persona_registry, ...member_registry },
      top: persona,
      use_cases: { borrow_a_tool, return_a_tool, my_loans },
    })({ invoked, log: adapter.log }),
    keeper: wlib.tree_ports({
      registry: { ...persona_registry, ...keeper_registry },
      top: persona,
      use_cases: { retire_a_tool, send_a_tool_to_repair, put_a_repaired_tool_back_in_service },
    })({ invoked, log: adapter.log }),
    visitor: wlib.tree_ports({
      registry: { ...persona_registry, ...visitor_registry },
      top: persona,
      use_cases: { the_catalogue },
    })({ invoked, log: adapter.log }),
    loans_effects: wlib.effect_executor({
      registry: loans_registry,
      returns: { remind_the_member_of_the_due_date, declare_the_loan_overdue },
    })({
      'business/loans/effect/wait_until_the_eve_of_the_due_date': wlib.returns_the_payload,
      'business/loans/effect/wait_until_the_due_date': wlib.returns_the_payload,
      'business/loans/effect/send_the_due_date_reminder': send_the_due_date_reminder(cell.get)(
        world.phones,
      ),
      'business/loans/effect/send_the_repair_notice': send_the_repair_notice(cell.get)(
        world.phones,
      ),
    })({
      outbox: cell.outbox,
      returns: adapter.loans,
      state: cell.executor,
      clock: world.clock,
    }),
    loans_reactions: wlib.reaction_consumers({ registry: loans_registry })({
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
    })({
      state: cell.reactions,
      clock: world.clock,
    }),
    damage: wlib.reaction_consumers({ registry: damage_registry })({
      'reaction/damage/reaction/the_damaged_tool_goes_to_repair': {
        log: adapter.log,
        invokes: adapter.tools.send_a_tool_to_repair,
      },
    })({
      state: cell.reactions,
      clock: world.clock,
    }),
    repair: wlib.reaction_consumers({ registry: repair_registry })({
      'reaction/repair/reaction/the_members_who_booked_the_tool_are_notified': {
        log: adapter.log,
        invokes: adapter.loans.notify_the_members_of_a_repair,
      },
    })({
      state: cell.reactions,
      clock: world.clock,
    }),
    retirement: wlib.reaction_consumers({ registry: retirement_registry })({
      'reaction/retirement/reaction/the_reservations_of_the_tool_are_cancelled': {
        log: adapter.log,
        invokes: adapter.loans.cancel_the_reservations_of_a_tool,
      },
    })({
      state: cell.reactions,
      clock: world.clock,
    }),
  }
}
