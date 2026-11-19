import { describe, expect, test } from 'vitest'
import * as wlib from '../wlib.ts'
import { repair_id } from '../business/tools/_id.ts'
import { first } from './oracle.ts'
import { a_shed_with, drill } from './shed.ts'

// SC-5: a value with states. A loan by stages (nesting: its progress, ongoing
// then returned, keeps the loan's fields); a tool under repair (subtraction:
// each status writes what it has, the stay in repair named by `tools` from
// the operation). The states are observed as the ports show them (TST-3):
// the facts, and what the next commands find (DOM-19, Shed § Experiments).

describe('SC-5, a value with states', () => {
  test('a loan by stages: lent, returned, then the return again changes nothing', async () => {
    const shed = await a_shed_with(drill)
    await first(
      shed.loans.borrow_a_tool(shed.at('2026-11-19T10:00:00-05:00'), {
        loan_id: 'L7',
        tool_id: 'drill',
        member_id: 'M-12',
      }),
    )
    const returned = await first(
      shed.loans.return_a_tool(shed.at('2026-11-24T18:00:00-05:00'), {
        loan_id: 'L7',
        tool_id: 'drill',
        condition: 'good',
      }),
    )
    expect(returned).toMatchObject({
      outcome: 'applied',
      branch: 'the_loan_is_ongoing_so_it_is_closed',
      fact: { parts: [{ path: 'business/loans/fact/a_tool_has_been_returned' }] },
    })
    expect(
      await first(
        shed.loans.return_a_tool(shed.at('2026-11-24T18:05:00-05:00'), {
          loan_id: 'L7',
          tool_id: 'drill',
          condition: 'good',
        }),
      ),
    ).toMatchObject({
      outcome: 'applied',
      branch: 'the_loan_was_already_returned_so_nothing_changes',
      fact: { parts: [{ path: 'business/loans/fact/a_tool_has_been_returned_again' }] },
    })
    expect(
      await first(
        shed.loans.borrow_a_tool(shed.at('2026-11-25T09:00:00-05:00'), {
          loan_id: 'L9',
          tool_id: 'drill',
          member_id: 'M-7',
        }),
      ),
    ).toMatchObject({ outcome: 'applied', branch: 'the_tool_is_available_so_it_is_lent' })
  })

  test('a tool under repair: its stay named from the operation, lent to no one until back in service', async () => {
    const shed = await a_shed_with(drill)
    const tuesday = shed.at('2026-11-24T08:00:00-05:00', { scope: 'keeper/luca' })
    const sent = await first(shed.tools.send_a_tool_to_repair(tuesday, { tool_id: 'drill' }))
    const stay = wlib.identity_of(repair_id)(tuesday.operation)
    expect(sent).toMatchObject({
      outcome: 'applied',
      branch: 'the_tool_is_in_service_so_it_goes_to_repair',
      fact: {
        parts: [
          {
            path: 'business/tools/fact/a_tool_has_been_sent_to_repair',
            payload: {
              tool_under_repair: {
                id: 'drill',
                status: 'underRepair',
                repair: { id: stay, since: '2026-11-24T08:00:00-05:00' },
              },
            },
            resources: [
              { path: 'business/tools/id/tool_id', value: 'drill' },
              { path: 'business/tools/id/repair_id', value: stay },
            ],
          },
        ],
      },
    })
    expect(
      await first(
        shed.loans.borrow_a_tool(shed.at('2026-11-24T10:00:00-05:00'), {
          loan_id: 'L9',
          tool_id: 'drill',
          member_id: 'M-7',
        }),
      ),
    ).toMatchObject({
      outcome: 'rejected',
      failures: [
        {
          components: ['the_tool_can_be_lent', 'the_requested_tool_is_in_service'],
          predicate: 'business/loans/predicate/the_tool_is_in_service',
        },
        { predicate: 'business/loans/predicate/the_tool_is_on_loan_to_this_member' },
      ],
    })
    expect(
      await first(
        shed.tools.put_a_repaired_tool_back_in_service(shed.at('2026-11-27T16:00:00-05:00'), {
          tool_id: 'drill',
        }),
      ),
    ).toMatchObject({
      outcome: 'applied',
      branch: 'the_tool_is_in_the_workshop_so_it_is_back_in_service',
    })
    expect(
      await first(
        shed.loans.borrow_a_tool(shed.at('2026-11-28T10:00:00-05:00'), {
          loan_id: 'L9',
          tool_id: 'drill',
          member_id: 'M-7',
        }),
      ),
    ).toMatchObject({ outcome: 'applied', branch: 'the_tool_is_available_so_it_is_lent' })
  })
})
