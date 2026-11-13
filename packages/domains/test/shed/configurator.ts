// A sketch of the configurator of the shed (§ 7 of architecture.md): it wires
// the trees of the personas over the ports of the in-memory oracle. The tree
// of a persona enters from the node of the persona base, which takes the
// `Caller` (PER-4, PER-6); its leaves invoke the use cases of `tools` and
// `loans`, its nodes the lookups of `accounts`, found by path (`Invoked`).
// Nothing runs: the library is wished.

import * as wlib from './wlib.ts'
import { memory_adapter, type Cell } from './adapter/memory/index.ts'
import { persona } from './@persona/_node.ts'
import { registry as persona_registry } from './@persona/_registry.ts'
import { registry as member_registry } from './@persona/@member/_registry.ts'
import { borrow_a_tool } from './@persona/@member/_usecase.ts'
import { registry as keeper_registry } from './@persona/@keeper/_registry.ts'
import { retire_a_tool } from './@persona/@keeper/_usecase.ts'

export const shed = (cell: Cell) => {
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
      use_cases: { borrow_a_tool },
    })(invoked),
    keeper: wlib.tree_ports({
      registry: { ...persona_registry, ...keeper_registry },
      top: persona,
      use_cases: { retire_a_tool },
    })(invoked),
  }
}
