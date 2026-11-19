import { describe, expect, test } from 'vitest'
import * as wlib from '../wlib.ts'
import { oracle } from './oracle.ts'
import { persona } from '../persona/_node.ts'
import { registry as persona_registry } from '../persona/_registry.ts'
import { registry as keeper_registry } from '../persona/keeper/_registry.ts'
import { majors as keeper_majors } from '../persona/keeper/_majors.ts'
import { retire_a_tool, send_a_tool_to_repair } from '../persona/keeper/_usecase.ts'
import { the_catalogue } from '../persona/visitor/_usecase.ts'

// The wiring of a tree's ports (part 6.1, CFG-2): the configurator's faults
// stop the node before the first request, every one named in one message.

describe("the wiring of a tree's ports", () => {
  test('a leaf given under another name, a leaf of another tree: stopped at once', async () => {
    const shed = await oracle()
    expect(() =>
      wlib.tree_ports({
        registry: { ...persona_registry, ...keeper_registry },
        versions: shed.versions,
        majors: keeper_majors,
        top: persona,
        use_cases: { retire_the_tool: retire_a_tool, the_catalogue },
      }),
    ).toThrow(
      [
        'persona/keeper/usecase/retire_a_tool is given as retire_the_tool (DOM-24)',
        'the leaf the_catalogue is not in the registry given (DOM-24)',
      ].join('\n'),
    )
  })

  test('a port the library did not build, a use case and a lookup no port serves', async () => {
    const shed = await oracle()
    const tree = wlib.tree_ports({
      registry: { ...persona_registry, ...keeper_registry },
      versions: shed.versions,
      majors: keeper_majors,
      top: persona,
      use_cases: { retire_a_tool, send_a_tool_to_repair },
    })
    expect(() =>
      tree({
        invoked: {
          'business/tools': {
            retire_a_tool: shed.tools.retire_a_tool,
            send_a_tool_to_repair: shed.tools.send_a_tool_to_repair,
          },
        },
        log: shed.log,
        trace: shed.trace,
      }),
    ).toThrow(
      [
        'business/tools: retire_a_tool is a port the library did not build (CFG-2)',
        'business/tools: send_a_tool_to_repair is a port the library did not build (CFG-2)',
        'persona/keeper/node/keeper looks up the_hats_of_the_caller, which no port given serves (CFG-2)',
        'persona/keeper/usecase/retire_a_tool invokes a use case no port given serves (CFG-2)',
        'persona/keeper/usecase/send_a_tool_to_repair invokes a use case no port given serves (CFG-2)',
      ].join('\n'),
    )
  })
})
