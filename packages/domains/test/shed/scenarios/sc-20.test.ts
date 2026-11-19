import { describe, expect, test } from 'vitest'
import { first, followed, oracle, told, view, type Start } from './oracle.ts'

// SC-20, the business's side (part 5.2): a selection over another domain's
// state (DOM-18, GR-3). Gianni's reservations whose tool is in the workshop
// (`the_reservations_of_a_member_in_the_workshop`): on Tuesday the drill goes
// to the workshop, a fact of `tools` that touches no reservation, and R8
// enters; on Wednesday it is back in service, and R8 leaves. The stream asks
// nothing more than SC-19's rule. Gianni's leaf is part 6.3.

const strategies = ['native', 'composed'] as const

/** Gianni books the drill for Thursday (R8, 2); Tuesday it goes to the workshop (3); Wednesday it is back (4). */
const the_shed = async (start: Start) => {
  const shed = await oracle(start)
  await first(
    shed.tools.add_a_tool(shed.at('2026-11-16T08:00:00-05:00'), {
      id: 'drill',
      name: 'Cordless drill',
      category: 'power',
    }),
  )
  await first(
    shed.loans.reserve_a_tool(shed.at('2026-11-16T09:00:00-05:00'), {
      reservation_id: 'R8',
      tool_id: 'drill',
      member_id: 'M-7',
      day: '2026-11-19',
    }),
  )
  const story = async () => {
    await first(
      shed.tools.send_a_tool_to_repair(shed.at('2026-11-17T09:00:00-05:00'), { tool_id: 'drill' }),
    )
    await first(
      shed.tools.put_a_repaired_tool_back_in_service(shed.at('2026-11-18T16:00:00-05:00'), {
        tool_id: 'drill',
      }),
    )
  }
  const in_the_workshop = () =>
    shed.loans
      .the_reservations_of_a_member_in_the_workshop(shed.when('2026-11-17T08:00:00-05:00'), {
        member_id: 'M-7',
      })
      [Symbol.asyncIterator]()
  return { shed, story, in_the_workshop }
}

describe('SC-20: Gianni’s reservations in the workshop follow the state of `tools`', () => {
  test('native: the drill to the workshop, R8 entered; back in service, R8 left', async () => {
    const { story, in_the_workshop } = await the_shed({})
    const { snapshot, events } = await followed(in_the_workshop, story)
    expect(snapshot).toEqual([{ event: 'snapshot', entries: [], position: '2', total: 0 }])
    expect(told(events)).toEqual([
      ['entered', '3'],
      ['left', '4'],
      ['caught_up', '4'],
    ])
    expect(events[0]).toEqual({
      event: 'entered',
      position: '3',
      identity: 'R8',
      entry: { id: 'R8', tool_id: 'drill', day: '2026-11-19', tool_name: 'Cordless drill' },
    })
  })

  test.each(strategies)(
    '%s: the snapshot at P with the events from P is the snapshot at the end (D69.3)',
    async (streams) => {
      const { story, in_the_workshop } = await the_shed({ streams })
      const { snapshot, events, at_the_end } = await followed(in_the_workshop, story)
      expect(view('id')([...snapshot, ...events])).toEqual(view('id')(at_the_end))
    },
  )

  test('composed, live: each fact read again as it is recorded, the events the oracle’s', async () => {
    const { shed, in_the_workshop } = await the_shed({ streams: 'composed' })
    const live = in_the_workshop()
    await live.next()
    await live.next()
    const entered = live.next()
    await first(
      shed.tools.send_a_tool_to_repair(shed.at('2026-11-17T09:00:00-05:00'), { tool_id: 'drill' }),
    )
    expect((await entered).value).toMatchObject({ event: 'entered', position: '3', identity: 'R8' })
    const left = live.next()
    await first(
      shed.tools.put_a_repaired_tool_back_in_service(shed.at('2026-11-18T16:00:00-05:00'), {
        tool_id: 'drill',
      }),
    )
    expect((await left).value).toEqual({ event: 'left', position: '4', identity: 'R8' })
  })
})
