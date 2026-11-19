import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import * as wlib from '../wlib.ts'
import { first, oracle, quiet, type Start } from './oracle.ts'
import { drill, ladder } from './shed.ts'

// SC-40: the reaction of a damaged return (DOM-16, D88.2, D89; Shed's step
// 9, part 1). `reaction/damage/` reads `loans`' facts and sends a tool
// returned damaged to the workshop of `tools`, through its use case; a
// whole return it translates to `nothing`. Its operation is derived from
// the fact's operation, its own path and the part (`reaction_operation`,
// LIB-10), so that a fact delivered again is the duplicate branch: one stay
// in repair, which `tools` names from that operation (SC-7). On Monday Paolo
// returns the ladder whole, and nothing happens; on Tuesday Marta returns
// the drill damaged (F1), and the consumer sends it to the workshop, the
// fact of Marta's chain (DOM-10); on Thursday Gianni cannot borrow it; on
// Friday Luca puts it back in service.

const damage = 'reaction/damage/reaction/the_damaged_tool_goes_to_repair'
const monday = '2026-11-16T09:00:00-05:00'
const tuesday = '2026-11-17T09:00:00-05:00'

/** The stay an operation opens, as `tools` names it (SC-7). */
const the_stay_of = (operation: wlib.Operation): string => wlib.identity_of(z.string())(operation)

/**
 * The drill and the ladder in the shed; on Monday 9 November Paolo (M-9)
 * borrows the ladder (L3), Marta (M-12) the drill (L7).
 */
const the_shed = async (start: Start = {}) => {
  const shed = await oracle(start)
  for (const tool of [drill, ladder]) {
    await first(shed.tools.add_a_tool(shed.at('2026-11-02T08:00:00-05:00'), tool))
  }
  for (const [loan_id, tool_id, member_id] of [
    ['L3', 'ladder', 'M-9'],
    ['L7', 'drill', 'M-12'],
  ] as const) {
    await first(
      shed.loans.borrow_a_tool(
        shed.at('2026-11-09T10:00:00-05:00', { scope: `member/${member_id}` }),
        { loan_id, tool_id, member_id },
      ),
    )
  }
  /** Marta's return of the drill on Tuesday, damaged, under her operation R-1, of her chain C-MARTA. */
  const her_return = shed.at(tuesday, {
    operation: 'R-1',
    scope: 'member/M-12',
    correlation: 'C-MARTA',
  })
  const marta_returns_the_drill_damaged = () =>
    first(
      shed.loans.return_a_tool(her_return, {
        loan_id: 'L7',
        tool_id: 'drill',
        condition: 'damaged',
      }),
    )
  /** The facts that sent a tool to the workshop, as the log keeps them. */
  const repairs = async () =>
    (await shed.recorded()).filter((fact) =>
      fact.parts.some((part) => part.path === 'business/tools/fact/a_tool_has_been_sent_to_repair'),
    )
  /** The operation of the reaction to Marta's return, derived from it (LIB-10). */
  const the_reactions_operation = wlib.reaction_operation(damage)({
    operation: her_return.operation,
    part: 0,
  })
  return { shed, marta_returns_the_drill_damaged, repairs, the_reactions_operation }
}

describe('SC-40, the reaction of a damaged return', () => {
  test('a whole return does nothing; a damaged one sends the drill to the workshop, under the reaction’s operation, of Marta’s chain', async () => {
    const { shed, marta_returns_the_drill_damaged, repairs, the_reactions_operation } =
      await the_shed()
    const consumers = shed.reactions({ at: monday })
    await first(
      shed.loans.return_a_tool(shed.at(monday, { scope: 'member/M-9' }), {
        loan_id: 'L3',
        tool_id: 'ladder',
        condition: 'good',
      }),
    )
    await quiet()
    expect(await shed.recorded()).toHaveLength(5)
    await shed.pass('2026-11-17T09:01:00-05:00')
    await marta_returns_the_drill_damaged()
    await quiet()
    expect(await repairs()).toEqual([
      expect.objectContaining({
        parts: [
          {
            path: 'business/tools/fact/a_tool_has_been_sent_to_repair',
            version: '1.0.0',
            payload: {
              tool_under_repair: {
                id: 'drill',
                status: 'underRepair',
                repair: {
                  id: the_stay_of(the_reactions_operation),
                  since: '2026-11-17T09:01:00-05:00',
                },
              },
            },
            resources: [
              { path: 'business/tools/id/tool_id', value: 'drill' },
              { path: 'business/tools/id/repair_id', value: the_stay_of(the_reactions_operation) },
            ],
          },
        ],
        operation: the_reactions_operation,
        correlation: 'C-MARTA',
        branch: 'the_tool_is_in_service_so_it_goes_to_repair',
      }),
    ])
    expect(the_reactions_operation.scope).toBe(damage)
    // On Thursday Gianni cannot borrow the drill, in the workshop.
    expect(
      await first(
        shed.loans.borrow_a_tool(shed.at('2026-11-19T10:00:00-05:00', { scope: 'member/M-7' }), {
          loan_id: 'L9',
          tool_id: 'drill',
          member_id: 'M-7',
        }),
      ),
    ).toMatchObject({ outcome: 'rejected' })
    // On Friday Luca puts it back in service.
    expect(
      await first(
        shed.tools.put_a_repaired_tool_back_in_service(shed.at('2026-11-20T09:00:00-05:00'), {
          tool_id: 'drill',
        }),
      ),
    ).toMatchObject({ outcome: 'applied' })
    await quiet()
    expect(shed.held_parts(damage)).toEqual([])
    await consumers.stop()
  })

  test('the consumer falls before saving its position: Marta’s return delivered again gives the command again, the duplicate branch, one stay (TST-4)', async () => {
    const { shed, marta_returns_the_drill_damaged, repairs } = await the_shed()
    const falling = shed.reactions({ at: tuesday, saves_its_position: false })
    await marta_returns_the_drill_damaged()
    await quiet()
    await falling.stop()
    const sent = await repairs()
    expect(sent).toHaveLength(1)
    const again = shed.reactions({ at: '2026-11-17T09:30:00-05:00' })
    await quiet()
    expect(await repairs()).toEqual(sent)
    expect(shed.held_parts(damage)).toEqual([])
    await again.stop()
  })

  test('every fact the log gives twice: one stay (TST-4)', async () => {
    const { shed, marta_returns_the_drill_damaged, repairs, the_reactions_operation } =
      await the_shed({ redelivered: true })
    const consumers = shed.reactions({ at: tuesday })
    await marta_returns_the_drill_damaged()
    await quiet()
    expect(await repairs()).toEqual([
      expect.objectContaining({ operation: the_reactions_operation }),
    ])
    expect(shed.held_parts(damage)).toEqual([])
    await consumers.stop()
  })

  test('the adapter of `tools` falls: the consumer stops where it is, unadvanced, and started again sends the drill (TST-4)', async () => {
    const { shed, marta_returns_the_drill_damaged, repairs, the_reactions_operation } =
      await the_shed()
    const consumers = shed.reactions({ at: tuesday })
    shed.the_adapter_of_tools_falls()
    await marta_returns_the_drill_damaged()
    await quiet()
    await expect(consumers.stop()).rejects.toThrow(`the delivery of ${damage} fell`)
    expect(await repairs()).toEqual([])
    expect(shed.held_parts(damage)).toEqual([])
    const again = shed.reactions({ at: '2026-11-17T10:00:00-05:00' })
    await quiet()
    expect(await repairs()).toEqual([
      expect.objectContaining({ operation: the_reactions_operation, correlation: 'C-MARTA' }),
    ])
    await again.stop()
  })
})
