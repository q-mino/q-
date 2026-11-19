import { describe, expect, test } from 'vitest'
import { first, followed, oracle, told, view, type Start } from './oracle.ts'

// SC-16, the business's side (part 5.2): "your loan is overdue". The read use
// case names the fact that goes with its register (`facts`: the overdue, A,
// 14 Nov 2026); its stream carries it as any fact of its domain that touches
// an entry, `fact` with the envelope and the entry after it (DOM-17): the
// event does not change, and a use case over it finds the part by name
// among those that touch the entry. Every other fact goes the same way, the
// row. Marta's leaf names it `your_loan_is_overdue` with part 6.3.

const strategies = ['native', 'composed'] as const

/**
 * Marta borrows the drill on 2 November (L7, due on the 16th); her "my
 * loans" is open on the 16th; at the start of the 17th the desk declares it
 * overdue (3); on the 18th she brings it back (4).
 */
const the_shed = async (start: Start) => {
  const shed = await oracle(start)
  await first(
    shed.tools.add_a_tool(shed.at('2026-11-02T08:00:00-05:00'), {
      id: 'drill',
      name: 'Cordless drill',
      category: 'power',
    }),
  )
  await first(
    shed.loans.borrow_a_tool(shed.at('2026-11-02T10:00:00-05:00'), {
      loan_id: 'L7',
      tool_id: 'drill',
      member_id: 'M-12',
    }),
  )
  const story = async () => {
    expect(
      await first(
        shed.loans.declare_the_loan_overdue(shed.at('2026-11-17T00:00:00-05:00'), {
          loan_id: 'L7',
        }),
      ),
    ).toMatchObject({
      outcome: 'applied',
      branch: 'the_member_still_has_the_tool_after_the_due_day_so_the_loan_is_overdue',
    })
    await first(
      shed.loans.return_a_tool(shed.at('2026-11-18T10:00:00-05:00'), {
        loan_id: 'L7',
        tool_id: 'drill',
        condition: 'good',
      }),
    )
  }
  const my_loans = () =>
    shed.loans
      .the_ongoing_loans_of_a_member(shed.when('2026-11-16T09:00:00-05:00'), {
        member_id: 'M-12',
      })
      [Symbol.asyncIterator]()
  return { story, my_loans }
}

describe('SC-16: the overdue reaches Marta’s loans as a fact the read use case names', () => {
  test('native: the overdue, `fact` on L7 with its part and the row overdue; the return, `left`', async () => {
    const { story, my_loans } = await the_shed({})
    const { snapshot, events } = await followed(my_loans, story)
    expect(snapshot).toMatchObject([
      { event: 'snapshot', position: '2', entries: [{ id: 'L7', term: 'running' }] },
    ])
    expect(told(events)).toEqual([
      ['fact', '3'],
      ['left', '4'],
      ['caught_up', '4'],
    ])
    expect(events[0]).toMatchObject({
      identity: 'L7',
      entry: { id: 'L7', term: 'overdue' },
      fact: {
        parts: [
          {
            path: 'business/loans/fact/a_loan_has_become_overdue',
            resources: [{ path: 'business/loans/id/loan_id', value: 'L7' }],
          },
        ],
      },
    })
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
