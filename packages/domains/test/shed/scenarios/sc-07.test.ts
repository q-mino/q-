import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import * as zz from '../../../src/library/index.ts'
import { first, quiet } from './oracle.ts'
import { a_shed_with, drill } from './shed.ts'

// SC-7: the drill goes to the workshop, its stay named by `tools` from the
// operation, since nobody outside can name it (DOM-12, DOM-23, D75.8): the
// library's stable function `identity_of` (LIB-10). One operation records one
// fact, so it opens one stay, and a retry or a redelivery is the duplicate
// branch, the same stay. Luca finds the drill broken on the shelf; or the
// reaction of a damaged return sends it the same way, its operation derived
// from the fact (`reaction_operation`, since part 7.3), so that the stay is
// named by Marta's return.

/** The stay an operation opens, as `tools` names it. */
const the_stay_of = (operation: zz.Operation): string => zz.identity_of(z.string())(operation)

describe('SC-7, the drill goes to the workshop', () => {
  test('its stay is named from the operation that sends it', async () => {
    const shed = await a_shed_with(drill)
    const tuesday = shed.at('2026-11-17T14:00:00.000Z', { operation: 'W1' })
    const sent = await first(shed.tools.send_a_tool_to_repair(tuesday, { tool_id: 'drill' }))
    expect(sent).toEqual({
      outcome: 'applied',
      branch: 'the_tool_is_in_service_so_it_goes_to_repair',
      position: '2',
      fact: {
        parts: [
          {
            path: 'business/tools/fact/a_tool_has_been_sent_to_repair',
            payload: {
              tool_under_repair: {
                id: 'drill',
                status: 'underRepair',
                repair: { id: the_stay_of(tuesday.operation), since: '2026-11-17T14:00:00.000Z' },
              },
            },
            resources: [
              { path: 'business/tools/id/tool_id', value: 'drill' },
              { path: 'business/tools/id/repair_id', value: the_stay_of(tuesday.operation) },
            ],
          },
        ],
        operation: tuesday.operation,
        correlation: tuesday.correlation,
      },
    })
  })

  test('sent again under its operation, the same stay: the duplicate branch', async () => {
    const shed = await a_shed_with(drill)
    const sent = await first(
      shed.tools.send_a_tool_to_repair(shed.at('2026-11-17T14:00:00.000Z', { operation: 'W1' }), {
        tool_id: 'drill',
      }),
    )
    expect(
      await first(
        shed.tools.send_a_tool_to_repair(shed.at('2026-11-17T14:10:00.000Z', { operation: 'W1' }), {
          tool_id: 'drill',
        }),
      ),
    ).toEqual(sent)
  })

  test('sent by another operation while in the workshop: nothing changes, the stay stands', async () => {
    const shed = await a_shed_with(drill)
    await first(
      shed.tools.send_a_tool_to_repair(shed.at('2026-11-17T14:00:00.000Z', { operation: 'W1' }), {
        tool_id: 'drill',
      }),
    )
    expect(
      await first(
        shed.tools.send_a_tool_to_repair(shed.at('2026-11-17T15:00:00.000Z', { operation: 'W2' }), {
          tool_id: 'drill',
        }),
      ),
    ).toMatchObject({
      outcome: 'applied',
      branch: 'the_tool_is_already_in_the_workshop_so_nothing_changes',
      fact: {
        parts: [
          {
            path: 'business/tools/fact/a_tool_has_been_sent_to_repair_again',
            payload: { tool_id: 'drill' },
          },
        ],
      },
    })
  })

  test('back in service and in the workshop again: another operation, another stay', async () => {
    const shed = await a_shed_with(drill)
    const tuesday = shed.at('2026-11-17T14:00:00.000Z', { operation: 'W1' })
    await first(shed.tools.send_a_tool_to_repair(tuesday, { tool_id: 'drill' }))
    await first(
      shed.tools.put_a_repaired_tool_back_in_service(shed.at('2026-11-20T14:00:00.000Z'), {
        tool_id: 'drill',
      }),
    )
    const saturday = shed.at('2026-11-21T14:00:00.000Z', { operation: 'W3' })
    expect(
      await first(shed.tools.send_a_tool_to_repair(saturday, { tool_id: 'drill' })),
    ).toMatchObject({
      outcome: 'applied',
      branch: 'the_tool_is_in_service_so_it_goes_to_repair',
      fact: {
        parts: [
          {
            payload: { tool_under_repair: { repair: { id: the_stay_of(saturday.operation) } } },
          },
        ],
      },
    })
    expect(the_stay_of(saturday.operation)).not.toBe(the_stay_of(tuesday.operation))
  })

  test('sent by the reaction of a damaged return: the stay named by the reaction’s operation, derived from Marta’s return', async () => {
    const shed = await a_shed_with(drill)
    await first(
      shed.loans.borrow_a_tool(shed.at('2026-11-16T15:00:00.000Z', { scope: 'member/M-12' }), {
        loan_id: 'L7',
        tool_id: 'drill',
        member_id: 'M-12',
      }),
    )
    const consumers = shed.reactions({ at: '2026-11-17T14:00:00.000Z' })
    const her_return = shed.at('2026-11-17T14:00:00.000Z', {
      operation: 'R-1',
      scope: 'member/M-12',
    })
    await first(
      shed.loans.return_a_tool(her_return, {
        loan_id: 'L7',
        tool_id: 'drill',
        condition: 'damaged',
      }),
    )
    await quiet()
    const reacting = zz.reaction_operation(
      'reaction/damage/reaction/the_damaged_tool_goes_to_repair',
    )({ operation: her_return.operation, part: 0 })
    expect((await shed.recorded()).at(-1)).toMatchObject({
      operation: reacting,
      parts: [
        {
          path: 'business/tools/fact/a_tool_has_been_sent_to_repair',
          payload: { tool_under_repair: { repair: { id: the_stay_of(reacting) } } },
        },
      ],
    })
    await consumers.stop()
  })
})
