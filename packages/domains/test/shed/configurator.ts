// A sketch of the configurator of the shed (§ 7 of architecture.md): it wires
// the trees of the personas over the ports of the in-memory oracle. The tree
// of a persona enters from the node of the persona base, which takes the
// `Caller` (PER-4, PER-6); its leaves, command and read, invoke the use cases
// of `tools` and `loans`, its nodes the lookups of `accounts`, found by path
// (`Invoked`). The effect executor of `loans` (DOM-14) delivers its effects
// to the world the oracle fakes, and brings the eve of a due date back to
// its return. Nothing runs: the library is wished.

import * as wlib from './wlib.ts'
import { memory_adapter, type Cell } from './adapter/memory/index.ts'
import { send_the_due_date_reminder, type Phones } from './adapter/memory/reminders.ts'
import { registry as loans_registry } from './@business/@loans/_registry.ts'
import { remind_the_member_of_the_due_date } from './@business/@loans/_usecase.ts'
import { persona } from './@persona/_node.ts'
import { registry as persona_registry } from './@persona/_registry.ts'
import { registry as member_registry } from './@persona/@member/_registry.ts'
import { borrow_a_tool, my_loans } from './@persona/@member/_usecase.ts'
import { registry as keeper_registry } from './@persona/@keeper/_registry.ts'
import { retire_a_tool } from './@persona/@keeper/_usecase.ts'
import { registry as visitor_registry } from './@persona/@visitor/_registry.ts'
import { the_catalogue } from './@persona/@visitor/_usecase.ts'

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
      use_cases: { borrow_a_tool, my_loans },
    })(invoked),
    keeper: wlib.tree_ports({
      registry: { ...persona_registry, ...keeper_registry },
      top: persona,
      use_cases: { retire_a_tool },
    })(invoked),
    visitor: wlib.tree_ports({
      registry: { ...persona_registry, ...visitor_registry },
      top: persona,
      use_cases: { the_catalogue },
    })(invoked),
    loans_effects: wlib.effect_executor({
      registry: loans_registry,
      returns: { remind_the_member_of_the_due_date },
    })({
      'business/loans/effect/wait_until_the_eve_of_the_due_date': wlib.returns_the_payload,
      'business/loans/effect/send_the_due_date_reminder': send_the_due_date_reminder(cell.get)(
        world.phones,
      ),
    })({
      outbox: cell.outbox,
      returns: adapter.loans,
      state: cell.executor,
      clock: world.clock,
    }),
  }
}
