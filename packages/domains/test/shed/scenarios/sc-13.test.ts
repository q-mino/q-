import { describe, expect, test } from 'vitest'
import { first } from './oracle.ts'
import { a_shed_with, drill, sander } from './shed.ts'

// SC-13: Luca lent the wrong tool: a compensating command with its fact,
// never a fact removed (DOM-22, D101). Since SC-31 the correction is below
// the node `an_ongoing_loan` of `loans` (D105): the loan is the node's target,
// given beside the command's input, flat; the node requires that it exists
// and is ongoing, before every branch; a rejection names the path's failed
// predicates once, with no branch (D105.4).

const lent = { loan_id: 'L7', tool_id: 'drill', member_id: 'M-12' }
const correction = {
  loan_id: 'L7',
  tool_written: 'drill',
  tool_handed: 'sander',
  member_id: 'M-12',
  due_day: '2026-12-03',
}

describe('SC-13, Luca lent the wrong tool', () => {
  test('the correction records its fact; the loan keeps its id; a second one changes nothing', async () => {
    const shed = await a_shed_with(drill, sander)
    await first(shed.loans.borrow_a_tool(shed.at('2026-11-19T15:00:00.000Z'), lent))
    expect(
      await first(
        shed.loans.correct_the_tool_of_a_loan(shed.at('2026-11-19T15:10:00.000Z'), correction),
      ),
    ).toMatchObject({
      outcome: 'applied',
      branch: 'the_card_named_another_tool_so_it_is_corrected',
      fact: {
        parts: [
          {
            path: 'business/loans/fact/the_tool_of_a_loan_has_been_corrected',
            payload: {
              corrected_loan: { id: 'L7', tool_id: 'sander' },
              tool_named_before: 'drill',
            },
          },
        ],
      },
    })
    expect(
      await first(
        shed.loans.correct_the_tool_of_a_loan(shed.at('2026-11-19T15:20:00.000Z'), correction),
      ),
    ).toMatchObject({
      outcome: 'applied',
      branch: 'the_card_already_names_the_tool_handed_so_nothing_changes',
      fact: {
        parts: [{ path: 'business/loans/fact/the_tool_of_a_loan_has_been_corrected_again' }],
      },
    })
    expect(
      await first(
        shed.loans.borrow_a_tool(shed.at('2026-11-19T16:00:00.000Z'), {
          loan_id: 'L9',
          tool_id: 'drill',
          member_id: 'M-7',
        }),
      ),
    ).toMatchObject({ outcome: 'applied', branch: 'the_tool_is_available_so_it_is_lent' })
  })

  test("once the loan is back, the node's requirement fails, named once with no branch", async () => {
    const shed = await a_shed_with(drill, sander)
    await first(shed.loans.borrow_a_tool(shed.at('2026-11-19T15:00:00.000Z'), lent))
    await first(
      shed.loans.correct_the_tool_of_a_loan(shed.at('2026-11-19T15:10:00.000Z'), correction),
    )
    await first(
      shed.loans.return_a_tool(shed.at('2026-11-24T23:00:00.000Z'), {
        loan_id: 'L7',
        tool_id: 'sander',
        condition: 'good',
      }),
    )
    expect(
      await first(
        shed.loans.correct_the_tool_of_a_loan(shed.at('2026-11-25T14:00:00.000Z'), correction),
      ),
    ).toEqual({
      outcome: 'rejected',
      failures: [
        {
          components: ['the_requested_loan_is_ongoing'],
          predicate: 'business/loans/predicate/the_loan_is_ongoing',
        },
        {
          branch: 'the_card_named_another_tool_so_it_is_corrected',
          components: ['its_card_names_the_tool_written'],
          predicate: 'business/loans/predicate/the_loan_is_of_this_tool',
        },
      ],
    })
  })

  test('a target its schema refuses is an invalid request', async () => {
    const shed = await a_shed_with(drill, sander)
    expect(
      await first(
        shed.loans.correct_the_tool_of_a_loan(shed.at('2026-11-19T15:10:00.000Z'), {
          ...correction,
          loan_id: '',
        }),
      ),
    ).toEqual({ outcome: 'invalid_request' })
  })
})
