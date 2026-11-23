import { describe, expect, test } from 'vitest'
import { accounts, all, first, oracle, type Who } from './oracle.ts'

// SC-31, the persona's side (part 6.2; the business's node at the command
// port since part 4.1, D105): Marta keeps a tool longer through her leaf
// (`member`'s `extend_your_loan`), which invokes `loans`' `extend_the_loan`
// below the node "an ongoing loan" (`business/loans/an_ongoing_loan/`), the
// loan its target, given beside the rest of the input, flat. A rejection
// names the path's failed predicates once, with no branch (D105.4), and the
// branch's; the leaf tells a booking by someone else apart, any other
// failure in one word, and the trace keeps which (F6, PER-14).

const marta: Who = { identified_by: 'account', id: 'A-MARTA' }
const gianni: Who = { identified_by: 'account', id: 'A-GIANNI' }

/**
 * On Monday 2 November Marta borrows the drill (L7) and the ladder (L8),
 * both due on Monday 16; Gianni books the ladder for Thursday 19.
 */
const the_shed = async () => {
  const shed = await oracle({
    accounts: accounts({
      hats: { 'A-MARTA': ['member'], 'A-GIANNI': ['member'] },
      member_cards: {
        'A-MARTA': { id: 'M-12', valid_until: '2027-03-31' },
        'A-GIANNI': { id: 'M-7', valid_until: '2027-03-31' },
      },
    }),
  })
  for (const [id, name, category] of [
    ['drill', 'Cordless drill', 'power'],
    ['ladder', 'Ladder', 'ladder'],
  ] as const) {
    await first(shed.tools.add_a_tool(shed.at('2026-11-01T14:00:00.000Z'), { id, name, category }))
  }
  for (const [loan_id, tool_id] of [
    ['L7', 'drill'],
    ['L8', 'ladder'],
  ] as const) {
    await all(
      shed.member.borrow_a_tool(
        shed.as(marta, '2.0.0').at('2026-11-02T15:00:00.000Z', { scope: 'member/A-MARTA' }),
        { loan_id, tool_id },
      ),
    )
  }
  await first(
    shed.loans.reserve_a_tool(shed.at('2026-11-10T17:00:00.000Z', { scope: 'member/A-GIANNI' }), {
      reservation_id: 'R8',
      tool_id: 'ladder',
      member_id: 'M-7',
      day: '2026-11-19',
    }),
  )
  return shed
}

/** A request to keep a loan longer, from the row of "my loans", by who asks, on Friday 13 November. */
const extend = (
  shed: Awaited<ReturnType<typeof the_shed>>,
  who: Who,
  row: { readonly loan_id: string; readonly tool_id: string; readonly due_day: string },
) =>
  all(
    shed.member.extend_your_loan(
      shed.as(who, '2.0.0').at('2026-11-13T23:00:00.000Z', { scope: `member/${who.id}` }),
      row,
    ),
  )

describe('SC-31, Marta keeps a tool longer under "an ongoing loan"', () => {
  test('the drill: due on the 30th, as her loans read it', async () => {
    const shed = await the_shed()
    expect(
      await extend(shed, marta, { loan_id: 'L7', tool_id: 'drill', due_day: '2026-11-16' }),
    ).toEqual([
      { event: 'your_loan_is_extended', payload: { loan_id: 'L7', due_day: '2026-11-30' } },
    ])
    expect(
      await first(
        shed.loans.the_ongoing_loans_of_a_member(shed.when('2026-11-13T23:01:00.000Z'), {
          member_id: 'M-12',
        }),
      ),
    ).toMatchObject({
      entries: [
        { id: 'L8', due_day: '2026-11-16' },
        { id: 'L7', due_day: '2026-11-30' },
      ],
    })
    expect(shed.traced()).toEqual([])
  })

  test('the ladder, booked by Gianni for Thursday: told apart, the failure in the trace', async () => {
    const shed = await the_shed()
    expect(
      await extend(shed, marta, { loan_id: 'L8', tool_id: 'ladder', due_day: '2026-11-16' }),
    ).toEqual([{ event: 'someone_booked_the_tool', payload: {} }])
    expect(shed.traced()).toMatchObject([
      {
        path: 'persona/member/usecase/extend_your_loan',
        answered: { event: 'someone_booked_the_tool' },
        why: {
          closed_by: 'the_business',
          outcome: {
            outcome: 'rejected',
            failures: [
              {
                branch: 'the_loan_can_be_extended_so_its_due_day_moves_on',
                components: ['no_one_booked_the_tool_up_to_the_new_due_day'],
                predicate: 'business/loans/predicate/the_tool_is_booked_on_a_day_up_to',
              },
            ],
          },
        },
      },
    ])
  })

  test("Marta's drill back in the shed: the path's predicate fails, named once with no branch", async () => {
    const shed = await the_shed()
    // Whole, her return ends at once (SC-27).
    expect(
      await all(
        shed.member.return_a_tool(shed.as(marta, '2.0.0').at('2026-11-12T23:00:00.000Z'), {
          loan_id: 'L7',
          tool_id: 'drill',
          condition: 'good',
        }),
      ),
    ).toEqual([{ event: 'you_returned_the_tool', payload: { tool_id: 'drill' } }])
    expect(
      await extend(shed, marta, { loan_id: 'L7', tool_id: 'drill', due_day: '2026-11-16' }),
    ).toEqual([{ event: 'the_loan_cannot_be_extended', payload: {} }])
    const [traced] = shed.traced()
    expect(traced?.why).toMatchObject({
      closed_by: 'the_business',
      outcome: {
        outcome: 'rejected',
        failures: [{ predicate: 'business/loans/predicate/the_loan_is_ongoing' }],
      },
    })
    const failures =
      traced?.why.closed_by === 'the_business' && traced.why.outcome.outcome === 'rejected'
        ? traced.why.outcome.failures
        : []
    expect(failures[0]).not.toHaveProperty('branch')
  })

  test("Gianni asks for Marta's drill: the loan cannot be extended, whose it is the trace's alone", async () => {
    const shed = await the_shed()
    expect(
      await extend(shed, gianni, { loan_id: 'L7', tool_id: 'drill', due_day: '2026-11-16' }),
    ).toEqual([{ event: 'the_loan_cannot_be_extended', payload: {} }])
    expect(shed.traced()).toMatchObject([
      {
        given: { caller: gianni },
        sent: { loan_id: 'L7', tool_id: 'drill', due_day: '2026-11-16' },
        why: {
          closed_by: 'the_business',
          outcome: {
            outcome: 'rejected',
            failures: [
              {
                branch: 'the_loan_can_be_extended_so_its_due_day_moves_on',
                components: ['it_is_a_loan_of_the_member'],
                predicate: 'business/loans/predicate/the_loan_is_of_this_member',
              },
            ],
          },
        },
      },
    ])
  })
})
