import { describe, expect, test } from 'vitest'
import { accounts, first, followed, oracle, told, view, type Start, type Who } from './oracle.ts'

// SC-17, the business's side (part 5.2): Gianni's R8 reads that the tool he
// booked is in repair, from the part of a fact that touches it (DOM-17,
// D111). `the_reservations_of_a_member` names the notice; the stream carries
// the fact whose part touches R8 by its resources (the notice declares its
// reservation alone, SC-55), `fact` with the envelope, unchanged: a use case
// over it finds the part named among those that touch the entry. The drill
// sent to the workshop, a fact of `tools`, changes nothing the entry reads.
// The round's step records the notice beside its own part, which touches no
// reservation, since part 7.4 (`by_the_round`); the tests before it enter
// the notice alone (`alone`, SC-55), its envelope one part. Gianni's leaf reads it since part 6.3: his own
// event, from the part that touches his row, with the row and no envelope.

const gianni: Who = { identified_by: 'account', id: 'A-GIANNI' }

const strategies = ['native', 'composed'] as const

/**
 * Gianni books the drill for Thursday 19 November (R8, position 2); his "my
 * reservations" is open on Tuesday; the drill goes to the workshop (RP1, 3)
 * and the desk notifies him (4).
 */
const the_shed = async (start: Start) => {
  const shed = await oracle(start)
  await first(
    shed.tools.add_a_tool(shed.at('2026-11-16T13:00:00.000Z'), {
      id: 'drill',
      name: 'Cordless drill',
      category: 'power',
    }),
  )
  await first(
    shed.loans.reserve_a_tool(shed.at('2026-11-16T14:00:00.000Z'), {
      reservation_id: 'R8',
      tool_id: 'drill',
      member_id: 'M-7',
      day: '2026-11-19',
    }),
  )
  const tuesday = '2026-11-17T14:00:00.000Z'
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
      .the_reservations_of_a_member(shed.when('2026-11-17T13:00:00.000Z'), { member_id: 'M-7' })
      [Symbol.asyncIterator]()
  const his_leaf = () =>
    shed.member
      .my_reservations(shed.as(gianni, '2.0.0').when('2026-11-17T13:00:00.000Z'), {})
      [Symbol.asyncIterator]()
  /**
   * The same story by the desk's round (part 7.4): the drill to the
   * workshop (3), the round begun (4), its first step, one fact,
   * [the round advanced (RP), Gianni notified (R8)] (5).
   */
  const by_the_round = async () => {
    const sent = await first(
      shed.tools.send_a_tool_to_repair(shed.at(tuesday), { tool_id: 'drill' }),
    )
    const payload = sent.outcome === 'applied' ? sent.fact.parts[0].payload : undefined
    const repair_id =
      payload !== undefined && 'tool_under_repair' in payload
        ? payload.tool_under_repair.repair.id
        : undefined
    if (repair_id === undefined) throw new Error('the drill did not go to the workshop')
    await first(
      shed.loans.notify_the_members_of_a_repair(shed.at(tuesday), { repair_id, tool_id: 'drill' }),
    )
    await first(shed.loans.continue_the_repair_notice_round(shed.at(tuesday), { repair_id }))
  }
  return { story, by_the_round, my_reservations, his_leaf }
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

  test.each(strategies)(
    "%s: Gianni's leaf reads `the_tool_you_booked_is_in_repair` on R8's row, from the part that touches it",
    async (streams) => {
      const { story, his_leaf } = await the_shed({
        streams,
        accounts: accounts({
          hats: { 'A-GIANNI': ['member'] },
          member_cards: { 'A-GIANNI': { id: 'M-7', valid_until: '2027-03-31' } },
        }),
      })
      const { snapshot, events } = await followed(his_leaf, story)
      const row = {
        reservation_id: 'R8',
        tool_id: 'drill',
        tool_name: 'Cordless drill',
        day: '2026-11-19',
      }
      expect(snapshot).toEqual([{ event: 'snapshot', entries: [row], position: '2', total: 1 }])
      expect(events).toEqual([
        {
          event: 'the_tool_you_booked_is_in_repair',
          position: '4',
          identity: 'R8',
          entry: row,
          payload: {},
        },
        { event: 'caught_up', position: '4' },
      ])
    },
  )

  test.each(strategies)(
    "%s: by the round's step, the composite fact touches R8 by its second part; Gianni's leaf reads it on R8's row",
    async (streams) => {
      const { by_the_round, my_reservations } = await the_shed({
        streams,
        accounts: accounts({
          hats: { 'A-GIANNI': ['member'] },
          member_cards: { 'A-GIANNI': { id: 'M-7', valid_until: '2027-03-31' } },
        }),
      })
      const business = await followed(my_reservations, by_the_round)
      expect(told(business.events)).toEqual([
        ['fact', '5'],
        ['caught_up', '5'],
      ])
      expect(business.events[0]).toMatchObject({
        identity: 'R8',
        fact: {
          parts: [
            { path: 'business/loans/fact/the_repair_notice_round_has_advanced' },
            {
              path: 'business/loans/fact/a_member_has_been_notified_of_the_repair',
              resources: [{ path: 'business/loans/id/reservation_id', value: 'R8' }],
            },
          ],
        },
      })
    },
  )

  test("by the round's step, Gianni's leaf reads `the_tool_you_booked_is_in_repair` from the part that touches R8", async () => {
    const { by_the_round, his_leaf } = await the_shed({
      accounts: accounts({
        hats: { 'A-GIANNI': ['member'] },
        member_cards: { 'A-GIANNI': { id: 'M-7', valid_until: '2027-03-31' } },
      }),
    })
    const { events } = await followed(his_leaf, by_the_round)
    expect(events).toMatchObject([
      { event: 'the_tool_you_booked_is_in_repair', position: '5', identity: 'R8', payload: {} },
      { event: 'caught_up', position: '5' },
    ])
  })
})
