import { describe, expect, test } from 'vitest'
import { first, followed, oracle, told, view, type Start } from './oracle.ts'

// SC-17, the business's side (part 5.2): Gianni's R8 reads that the tool he
// booked is in repair, from the part of a fact that touches it (DOM-17,
// D111). `the_reservations_of_a_member` names the notice; the stream carries
// the fact whose part touches R8 by its resources (the notice declares its
// reservation alone, SC-55), `fact` with the envelope, unchanged: a use case
// over it finds the part named among those that touch the entry. The drill
// sent to the workshop, a fact of `tools`, changes nothing the entry reads.
// The round's step records the notice beside its own part, which touches no
// reservation, with part 7.4; until then the harness enters the notice
// alone (`alone`, SC-55). Gianni's leaf reads it with part 6.3.

const strategies = ['native', 'composed'] as const

/**
 * Gianni books the drill for Thursday 19 November (R8, position 2); his "my
 * reservations" is open on Tuesday; the drill goes to the workshop (RP1, 3)
 * and the desk notifies him (4).
 */
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
  const tuesday = '2026-11-17T09:00:00-05:00'
  const story = async () => {
    await first(shed.tools.send_a_tool_to_repair(shed.at(tuesday), { tool_id: 'drill' }))
    await first(
      shed.alone.notify_a_member_of_the_repair(shed.at(tuesday), {
        reservation_id: 'R8',
        repair_id: 'RP1',
        member_id: 'M-7',
        tool_id: 'drill',
        day: '2026-11-19',
      }),
    )
  }
  const my_reservations = () =>
    shed.loans
      .the_reservations_of_a_member(shed.when('2026-11-17T08:00:00-05:00'), { member_id: 'M-7' })
      [Symbol.asyncIterator]()
  return { story, my_reservations }
}

describe('SC-17: the notice of the repair reaches Gianni’s R8', () => {
  test('native: the workshop changes nothing R8 reads; the notice touches R8, `fact` with its part', async () => {
    const { story, my_reservations } = await the_shed({})
    const { snapshot, events } = await followed(my_reservations, story)
    expect(snapshot).toMatchObject([{ event: 'snapshot', position: '2', entries: [{ id: 'R8' }] }])
    expect(told(events)).toEqual([
      ['fact', '4'],
      ['caught_up', '4'],
    ])
    expect(events[0]).toMatchObject({
      identity: 'R8',
      entry: { id: 'R8', tool_id: 'drill', day: '2026-11-19' },
      fact: {
        parts: [
          {
            path: 'business/loans/fact/a_member_has_been_notified_of_the_repair',
            resources: [{ path: 'business/loans/id/reservation_id', value: 'R8' }],
          },
        ],
      },
    })
  })

  test.each(strategies)(
    '%s: the snapshot at P with the events from P is the snapshot at the end (D69.3)',
    async (streams) => {
      const { story, my_reservations } = await the_shed({ streams })
      const { snapshot, events, at_the_end } = await followed(my_reservations, story)
      expect(view('id')([...snapshot, ...events])).toEqual(view('id')(at_the_end))
    },
  )
})
