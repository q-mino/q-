import { describe, expect, test } from 'vitest'
import { first, quiet } from './oracle.ts'
import { a_shed_with, drill } from './shed.ts'

// SC-55: a fact declares resources narrower than every identity of its
// payload, the instances it changes and its target (D94.6): the notice of
// a repair holds its reservation alone, not the stay in repair, which is
// the round's (DOM-10). Its envelope, and since part 7.2 the hold it gives
// a dead letter of the executor: Gianni's dead notice holds R8 alone, and
// Paolo's notice of the same stay goes (SC-53). In Shed only the step of
// the round of the notices records it: the harness enters the notice alone
// (`alone`) until the steps have a body (part 7.4).

/** The shed with the drill, which Gianni (M-7) booked on Monday for Thursday (R8). */
const the_drill_booked_for_thursday = async () => {
  const shed = await a_shed_with(drill)
  await first(
    shed.loans.reserve_a_tool(shed.at('2026-11-16T17:00:00.000Z', { scope: 'member/M-7' }), {
      reservation_id: 'R8',
      tool_id: 'drill',
      member_id: 'M-7',
      day: '2026-11-19',
    }),
  )
  return shed
}

describe("SC-55, a fact's narrower resources", () => {
  test('Gianni notified of the repair: the part holds his reservation alone, not the stay', async () => {
    const shed = await the_drill_booked_for_thursday()
    const tuesday = shed.at('2026-11-17T14:00:00.000Z', { scope: 'reaction/repair' })
    expect(
      await first(
        shed.alone.notify_a_member_of_the_repair(tuesday, {
          reservation_id: 'R8',
          repair_id: 'RP1',
          member_id: 'M-7',
          tool_id: 'drill',
          day: '2026-11-19',
        }),
      ),
    ).toEqual({
      outcome: 'applied',
      branch: 'the_reservation_is_booked_so_its_member_is_notified',
      position: '3',
      fact: {
        parts: [
          {
            path: 'business/loans/fact/a_member_has_been_notified_of_the_repair',
            payload: { reservation_id: 'R8', repair_id: 'RP1' },
            resources: [{ path: 'business/loans/id/reservation_id', value: 'R8' }],
          },
        ],
        operation: tuesday.operation,
        correlation: tuesday.correlation,
      },
    })
  })

  test("a fact that declares none holds every identity of its payload, another domain's too", async () => {
    const shed = await the_drill_booked_for_thursday()
    expect(
      await first(
        shed.tools.send_a_tool_to_repair(shed.at('2026-11-17T13:00:00.000Z'), {
          tool_id: 'drill',
        }),
      ),
    ).toMatchObject({
      outcome: 'applied',
      fact: {
        parts: [
          {
            resources: [
              { path: 'business/tools/id/tool_id', value: 'drill' },
              { path: 'business/tools/id/repair_id' },
            ],
          },
        ],
      },
    })
  })
  test("Gianni's notice exhausted holds R8 alone: Paolo's notice of the same stay goes", async () => {
    const shed = await the_drill_booked_for_thursday()
    await first(
      shed.loans.reserve_a_tool(shed.at('2026-11-16T17:30:00.000Z', { scope: 'member/M-9' }), {
        reservation_id: 'R9',
        tool_id: 'drill',
        member_id: 'M-9',
        day: '2026-12-10',
      }),
    )
    // Gianni has no phone the executor knows: his notice is exhausted.
    shed.executor({ at: '2026-11-17T14:00:00.000Z', phones: { 'M-9': '+1 416 555 0109' } })
    for (const [reservation_id, member_id, day] of [
      ['R8', 'M-7', '2026-11-19'],
      ['R9', 'M-9', '2026-12-10'],
    ] as const) {
      await first(
        shed.alone.notify_a_member_of_the_repair(
          shed.at('2026-11-17T14:00:00.000Z', { scope: 'reaction/repair' }),
          { reservation_id, repair_id: 'RP1', member_id, tool_id: 'drill', day },
        ),
      )
    }
    await quiet()
    expect(shed.held('business/loans/effect/send_the_repair_notice')).toMatchObject([
      {
        held: 'dead_letter',
        cause: { cause: 'exhausted', reason: 'the member has no phone' },
        entry: { resources: [{ path: 'business/loans/id/reservation_id', value: 'R8' }] },
      },
    ])
    expect(shed.received()).toMatchObject([{ message: 'repair_notice', day: '2026-12-10' }])
  })
})
