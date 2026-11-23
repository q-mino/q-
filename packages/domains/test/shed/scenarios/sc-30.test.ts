import { describe, expect, expectTypeOf, test } from 'vitest'
import type * as zz from '../../../src/library/index.ts'
import { accounts, first, followed, oracle, type Who } from './oracle.ts'
import type { majors as member_majors } from '../persona/member/_majors.ts'
import type { loan_id } from '../business/loans/_id.ts'

// SC-30, the identity of a past read leaf (part 6.4; PER-17, PER-18, A, 17
// Nov 2026): a read leaf of a past major whose next streams declares the
// field of its own entry that names a row (`stream: { identity: 'loan_id' }`
// in `persona/member/1/`), checked by type to hold the identity the next
// leaf's stream gives. The port streams for every major, by the current
// leaf: each entry comes back in the major's words (`from_next`), each event
// of the stream's own too, by the identity the current leaf's stream gives.

const marta: Who = { identified_by: 'account', id: 'A-MARTA' }

/** Marta borrows the drill (L1) on 2 November from her old phone, due on the 16th. */
const the_shed = async () => {
  const shed = await oracle({
    accounts: accounts({
      hats: { 'A-MARTA': ['member'] },
      member_cards: { 'A-MARTA': { id: 'M-12', valid_until: '2027-03-31' } },
    }),
  })
  await first(
    shed.tools.add_a_tool(shed.at('2026-11-02T13:00:00.000Z'), {
      id: 'drill',
      name: 'Cordless drill',
      category: 'power',
    }),
  )
  await first(
    shed.member.borrow_a_tool(shed.as(marta, '1.4.0').at('2026-11-02T15:12:00.000Z'), {
      loan_id: 'L1',
      tool_id: 'drill',
    }),
  )
  return shed
}

/** The events of "my loans" at a version, as the port types them. */
type MyLoansAt<version extends zz.Semver> = zz.ReadLeafEvent<
  zz.LeafAt<typeof member_majors, 'my_loans', version>
>

describe('SC-30: a past read leaf names its rows by the field it declares', () => {
  test('Marta’s old phone keeps "my loans" open: on 17 November `your_loan_is_overdue` reaches the row of L1, in 1.x’s words', async () => {
    const shed = await the_shed()
    const { snapshot, events } = await followed(
      () =>
        shed.member
          .my_loans(shed.as(marta, '1.4.0').when('2026-11-16T14:00:00.000Z'), {})
          [Symbol.asyncIterator](),
      async () => {
        await first(
          shed.loans.declare_the_loan_overdue(shed.at('2026-11-17T05:00:00.000Z'), {
            loan_id: 'L1',
          }),
        )
        await first(
          shed.member.return_a_tool(shed.as(marta, '1.4.0').at('2026-11-18T15:00:00.000Z'), {
            loan_id: 'L1',
            tool_id: 'drill',
            condition: 'good',
          }),
        )
      },
    )
    const due_date = '2026-11-17T04:59:59.999Z'
    expect(snapshot).toMatchObject([
      {
        event: 'snapshot',
        entries: [{ loan_id: 'L1', tool_id: 'drill', due_date, term: 'running' }],
      },
    ])
    expect(events).toMatchObject([
      {
        event: 'your_loan_is_overdue',
        identity: 'L1',
        entry: { loan_id: 'L1', due_date, term: 'overdue' },
        payload: {},
      },
      { event: 'left', identity: 'L1' },
      { event: 'caught_up' },
    ])
    expect(events[0]).not.toHaveProperty('entry.due_day')
  })

  test('the identity of each event is the field 1.x declares: a loan’s id, by type', () => {
    type Left = Extract<MyLoansAt<'1.4.0'>, { readonly event: 'left' }>
    expectTypeOf<Left['identity']>().toEqualTypeOf<loan_id>()
    type Overdue = Extract<MyLoansAt<'1.4.0'>, { readonly event: 'your_loan_is_overdue' }>
    expectTypeOf<Overdue['entry']>().toHaveProperty('due_date')
    expectTypeOf<Overdue['entry']>().not.toHaveProperty('due_day')
  })
})
