import { describe, expect, test } from 'vitest'
import { first } from './oracle.ts'
import { a_shed_with, drill } from './shed.ts'

// SC-4: Marta borrows the drill: `loans` keeps its own view of the tools,
// keyed by the identity of `tools`, and the adapter links them (GR-3, V11,
// DOM-24).

describe('SC-4, Marta borrows the drill', () => {
  test("the loan names the drill by the identity of tools, among the fact's resources", async () => {
    const shed = await a_shed_with(drill)
    const thursday = shed.at('2026-11-19T10:00:00-05:00', { scope: 'member/M-12' })
    expect(
      await first(
        shed.loans.borrow_a_tool(thursday, { loan_id: 'L7', tool_id: 'drill', member_id: 'M-12' }),
      ),
    ).toEqual({
      outcome: 'applied',
      branch: 'the_tool_is_available_so_it_is_lent',
      position: '2',
      fact: {
        parts: [
          {
            path: 'business/loans/fact/a_tool_has_been_lent',
            payload: {
              new_loan: {
                id: 'L7',
                tool_id: 'drill',
                member_id: 'M-12',
                start_date: '2026-11-19T10:00:00-05:00',
                due_day: '2026-12-03',
                progress: { stage: 'ongoing', term: 'running' },
              },
            },
            resources: [
              { path: 'business/loans/id/loan_id', value: 'L7' },
              { path: 'business/tools/id/tool_id', value: 'drill' },
              { path: 'business/loans/id/member_id', value: 'M-12' },
            ],
          },
        ],
        operation: thursday.operation,
        correlation: thursday.correlation,
      },
    })
  })

  test('a tool tools does not have: the view of loans, read over the state of tools, fails', async () => {
    const shed = await a_shed_with(drill)
    expect(
      await first(
        shed.loans.borrow_a_tool(shed.at('2026-11-19T10:00:00-05:00'), {
          loan_id: 'L7',
          tool_id: 'sander',
          member_id: 'M-12',
        }),
      ),
    ).toEqual({
      outcome: 'rejected',
      failures: [
        {
          branch: 'the_tool_is_available_so_it_is_lent',
          components: ['the_tool_can_be_lent', 'a_tool_has_the_requested_id'],
          predicate: 'business/loans/predicate/a_tool_has_this_id',
        },
        {
          branch: 'the_tool_is_available_so_it_is_lent',
          components: ['the_tool_can_be_lent', 'the_requested_tool_is_in_service'],
          predicate: 'business/loans/predicate/the_tool_is_in_service',
        },
        {
          branch: 'the_member_already_has_the_tool_so_nothing_changes',
          components: [],
          predicate: 'business/loans/predicate/the_tool_is_on_loan_to_this_member',
        },
      ],
    })
  })

  test('the drill on loan to Marta: Gianni is refused by a predicate under NOT', async () => {
    const shed = await a_shed_with(drill)
    await first(
      shed.loans.borrow_a_tool(shed.at('2026-11-19T10:00:00-05:00'), {
        loan_id: 'L7',
        tool_id: 'drill',
        member_id: 'M-12',
      }),
    )
    expect(
      await first(
        shed.loans.borrow_a_tool(shed.at('2026-11-19T11:00:00-05:00'), {
          loan_id: 'L9',
          tool_id: 'drill',
          member_id: 'M-7',
        }),
      ),
    ).toEqual({
      outcome: 'rejected',
      failures: [
        {
          branch: 'the_tool_is_available_so_it_is_lent',
          components: ['the_tool_can_be_lent', 'the_requested_tool_is_not_on_loan'],
          predicate: 'business/loans/predicate/the_tool_is_on_loan',
        },
        {
          branch: 'the_member_already_has_the_tool_so_nothing_changes',
          components: [],
          predicate: 'business/loans/predicate/the_tool_is_on_loan_to_this_member',
        },
      ],
    })
  })
})
