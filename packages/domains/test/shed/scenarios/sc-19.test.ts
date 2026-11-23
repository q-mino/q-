import { describe, expect, test } from 'vitest'
import { first, followed, oracle, told, view, type Start } from './oracle.ts'

// SC-19, the business's side (part 5.2): an entry that reads another domain
// (DOM-17, GR-3, V11). Marta has the drill (L7) with "my loans" open; Luca
// renames it, a fact of `tools` that touches no loan: her row of L7 reads
// the new name, `changed` in `loans`' stream, the entry compared by value.
// Gianni books the drill for Thursday: his reservation holds the drill's
// id, which the entry of L7 holds too, and touches nothing of hers, a fact
// touching an entry by the query's identity alone. Marta's leaf projects
// `changed` as the row, with part 6.3.

const strategies = ['native', 'composed'] as const

/** The drill (1), lent to Marta (L7, 2); Luca renames it (3); Gianni books it for Thursday (4). */
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
    shed.loans.borrow_a_tool(shed.at('2026-11-16T15:00:00.000Z'), {
      loan_id: 'L7',
      tool_id: 'drill',
      member_id: 'M-12',
    }),
  )
  const story = async () => {
    await first(
      shed.tools.rename_a_tool(shed.at('2026-11-17T14:00:00.000Z'), {
        tool_id: 'drill',
        name: 'Drill, cordless',
      }),
    )
    await first(
      shed.loans.reserve_a_tool(shed.at('2026-11-17T15:00:00.000Z'), {
        reservation_id: 'R8',
        tool_id: 'drill',
        member_id: 'M-7',
        day: '2026-12-03',
      }),
    )
  }
  const my_loans = () =>
    shed.loans
      .the_ongoing_loans_of_a_member(shed.when('2026-11-17T13:00:00.000Z'), {
        member_id: 'M-12',
      })
      [Symbol.asyncIterator]()
  return { story, my_loans }
}

describe('SC-19: Luca renames the drill, and Marta’s row of L7 reads the new name', () => {
  test('native: the rename, `changed` on L7 with the entry read again; Gianni’s booking, nothing', async () => {
    const { story, my_loans } = await the_shed({})
    const { events } = await followed(my_loans, story)
    expect(told(events)).toEqual([
      ['changed', '3'],
      ['caught_up', '4'],
    ])
    expect(events[0]).toMatchObject({
      event: 'changed',
      position: '3',
      identity: 'L7',
      entry: { id: 'L7', tool_name: 'Drill, cordless' },
    })
    expect(events[0]).not.toHaveProperty('fact')
  })

  test.each(strategies)(
    '%s: the snapshot at P with the events from P is the snapshot at the end (D69.3)',
    async (streams) => {
      const { story, my_loans } = await the_shed({ streams })
      const { snapshot, events, at_the_end } = await followed(my_loans, story)
      expect(view('id')([...snapshot, ...events])).toEqual(view('id')(at_the_end))
    },
  )
})
