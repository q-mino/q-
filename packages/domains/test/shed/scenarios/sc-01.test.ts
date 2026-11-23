import { describe, expect, test } from 'vitest'
import { first, oracle } from './oracle.ts'

// SC-1: Luca adds the drill to the catalogue: a command, its branch, its fact
// in its envelope (DOM-1, DOM-5, DOM-10).

describe('SC-1, Luca adds the drill to the catalogue', () => {
  test('the branch applied records its fact, in its envelope, with its resources', async () => {
    const shed = await oracle()
    const thursday = shed.at('2026-11-19T15:00:00.000Z')
    expect(
      await first(
        shed.tools.add_a_tool(thursday, { id: 'drill', name: 'Cordless drill', category: 'power' }),
      ),
    ).toEqual({
      outcome: 'applied',
      branch: 'the_tool_is_new_so_it_is_added',
      position: '1',
      fact: {
        parts: [
          {
            path: 'business/tools/fact/a_tool_has_been_added',
            payload: {
              added_tool: {
                id: 'drill',
                name: 'Cordless drill',
                category: 'power',
                status: 'inService',
                addDate: '2026-11-19T15:00:00.000Z',
              },
            },
            resources: [{ path: 'business/tools/id/tool_id', value: 'drill' }],
          },
        ],
        operation: thursday.operation,
        correlation: thursday.correlation,
      },
    })
  })

  test('the same tool again is rejected, naming the predicate that failed under NOT', async () => {
    const shed = await oracle()
    await first(
      shed.tools.add_a_tool(shed.at('2026-11-19T15:00:00.000Z'), {
        id: 'drill',
        name: 'Cordless drill',
        category: 'power',
      }),
    )
    expect(
      await first(
        shed.tools.add_a_tool(shed.at('2026-11-19T15:05:00.000Z'), {
          id: 'drill',
          name: 'Drill',
          category: 'power',
        }),
      ),
    ).toEqual({
      outcome: 'rejected',
      failures: [
        {
          branch: 'the_tool_is_new_so_it_is_added',
          components: [],
          predicate: 'business/tools/predicate/a_tool_has_this_id',
        },
      ],
    })
  })

  test('a name the schema refuses is an invalid request, not a rejection (DOM-21)', async () => {
    const shed = await oracle()
    expect(
      await first(
        shed.tools.add_a_tool(shed.at('2026-11-19T15:00:00.000Z'), {
          id: 'drill',
          name: '',
          category: 'power',
        }),
      ),
    ).toEqual({ outcome: 'invalid_request' })
  })
})
