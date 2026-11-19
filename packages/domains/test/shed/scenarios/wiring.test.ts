import { describe, expect, test } from 'vitest'
import * as wlib from '../wlib.ts'
import { oracle } from './oracle.ts'
import { persona } from '../persona/_node.ts'
import { registry as persona_registry } from '../persona/_registry.ts'
import { registry as keeper_registry } from '../persona/keeper/_registry.ts'
import { majors as keeper_majors } from '../persona/keeper/_majors.ts'
import { retire_a_tool, send_a_tool_to_repair } from '../persona/keeper/_usecase.ts'
import { the_catalogue } from '../persona/visitor/_usecase.ts'
import { registry as member_registry } from '../persona/member/_registry.ts'
import { majors as member_majors } from '../persona/member/_majors.ts'
import { borrow_a_tool, return_a_tool } from '../persona/member/_usecase.ts'
import { registry as member_1_registry } from '../persona/member/1/_registry.ts'
import { my_loans as my_loans_of_1 } from '../persona/member/1/_usecase.ts'

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

  test('a leaf that follows, with no port to measure its wait: stopped at wiring (part 6.3)', async () => {
    const shed = await oracle()
    const tree = wlib.tree_ports({
      registry: { ...persona_registry, ...member_registry },
      versions: shed.versions,
      majors: member_majors,
      top: persona,
      use_cases: { return_a_tool },
    })
    expect(() =>
      tree({
        invoked: {
          'business/loans': { return_a_tool: shed.loans.return_a_tool },
        },
        log: shed.log,
        trace: shed.trace,
      }),
    ).toThrow(
      'persona/member/usecase/return_a_tool follows, and no port given measures how long it waits (elapsed, CFG-2)',
    )
  })

  test('a leaf of a past major given as the current one, which the types let through: stopped (part 6.4)', async () => {
    const shed = await oracle()
    // Leaves are structural: `my_loans` of `1/` has the port's type. A
    // registry that holds `1/` finds it at the current path; only the
    // current major's registry, by object identity, tells.
    expect(() =>
      wlib.tree_ports({
        registry: { ...persona_registry, ...member_registry, ...member_1_registry },
        versions: shed.versions,
        majors: member_majors,
        top: persona,
        use_cases: { my_loans: my_loans_of_1 },
      }),
    ).toThrow(
      "persona/member/usecase/my_loans is given as a leaf that is not the current major's at its path (PER-17, CFG-2)",
    )
  })

  test('majors that declare no version, a past major that leads elsewhere: stopped (part 6.4)', async () => {
    const shed = await oracle()
    expect(() =>
      wlib.tree_ports({
        registry: { ...persona_registry, ...member_registry },
        versions: shed.versions,
        majors: { 1: member_majors[1] },
        top: persona,
        use_cases: { borrow_a_tool },
      }),
    ).toThrow(
      "the majors given declare 0 versions: a tree's majors hold one current registry, whose version.ts declares its version (PER-17, CFG-2)",
    )
    expect(() =>
      wlib.tree_ports({
        registry: { ...persona_registry, ...member_registry },
        versions: shed.versions,
        majors: {
          2: member_majors[2],
          1: {
            ...member_majors[1],
            'persona/member/usecase/borrow_a_tool':
              member_majors[1]['persona/member/usecase/my_loans'],
          },
        },
        top: persona,
        use_cases: { borrow_a_tool },
      }),
    ).toThrow(
      'persona/member/usecase/borrow_a_tool of major 1 does not lead to the current leaf given (PER-17, CFG-2)',
    )
  })
})
