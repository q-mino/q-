import { describe, expect, test } from 'vitest'
import { first, oracle } from './oracle.ts'

// SC-2: Luca retires the drill, already retired: the branch "nothing to do"
// records a fact, never a silent no-op; a rejection names every failed
// predicate (DOM-5, DOM-6, D95).

const the_drill: { readonly id: string; readonly name: string; readonly category: 'power' } = {
  id: 'drill',
  name: 'Cordless drill',
  category: 'power',
}

describe('SC-2, Luca retires the drill, already retired', () => {
  test('nothing to do is a branch, and records its fact', async () => {
    const shed = await oracle()
    await first(shed.tools.add_a_tool(shed.at('2026-11-19T14:00:00.000Z'), the_drill))
    const retired = await first(
      shed.tools.retire_a_tool(shed.at('2026-11-19T15:00:00.000Z'), {
        id: 'drill',
        reason: 'worn_out',
      }),
    )
    expect(retired).toMatchObject({
      outcome: 'applied',
      branch: 'the_tool_is_in_service_so_it_is_retired',
      position: '2',
      fact: { parts: [{ path: 'business/tools/fact/a_tool_has_been_retired' }] },
    })
    expect(
      await first(
        shed.tools.retire_a_tool(shed.at('2026-11-19T15:05:00.000Z'), {
          id: 'drill',
          reason: 'worn_out',
        }),
      ),
    ).toMatchObject({
      outcome: 'applied',
      branch: 'the_tool_is_already_retired_so_nothing_changes',
      position: '3',
      fact: {
        parts: [
          {
            path: 'business/tools/fact/a_tool_has_been_retired_again',
            payload: { tool_id: 'drill' },
            resources: [{ path: 'business/tools/id/tool_id', value: 'drill' }],
          },
        ],
      },
    })
  })

  test('a tool not in the catalogue: every failed predicate of every branch, by its components', async () => {
    const shed = await oracle()
    expect(
      await first(
        shed.tools.retire_a_tool(shed.at('2026-11-19T15:00:00.000Z'), {
          id: 'ladder',
          reason: 'lost',
        }),
      ),
    ).toEqual({
      outcome: 'rejected',
      failures: [
        [
          'the_tool_is_in_service_so_it_is_retired',
          'the_requested_tool_is_in_service',
          'the_tool_is_in_service',
        ],
        [
          'the_tool_is_beyond_repair_so_it_is_retired',
          'the_requested_tool_is_under_repair',
          'the_tool_is_under_repair',
        ],
        [
          'the_tool_is_already_retired_so_nothing_changes',
          'the_requested_tool_is_retired',
          'the_tool_is_retired',
        ],
      ].flatMap(([branch, component, predicate]) => [
        {
          branch,
          components: ['a_tool_has_the_requested_id'],
          predicate: 'business/tools/predicate/a_tool_has_this_id',
        },
        {
          branch,
          components: [component],
          predicate: `business/tools/predicate/${String(predicate)}`,
        },
      ]),
    })
  })
})
