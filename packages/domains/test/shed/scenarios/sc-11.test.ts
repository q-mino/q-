import { describe, expect, test } from 'vitest'
import { first } from './oracle.ts'
import { at_once, serially, type Request } from './serial.ts'
import { a_shed_with, drill, sander } from './shed.ts'

// SC-11: Marta and Gianni ask for the last drill at the same instant: one
// loan, the other `the_tool_is_not_available`; concurrency equals some
// serial order; a retry in flight reads the first's fact (DOM-9, DOM-11,
// ADP-8). The command runs in one consistent step of the adapter, the
// duplicate branch inside it: the oracle is a serial writer, nothing awaits
// inside an execution (an interpreter rule).

type Shed = Awaited<ReturnType<typeof a_shed_with>>

const a_shed_with_the_drill = () => a_shed_with(drill)

/** A member asks for the drill on Thursday at 10:00, under the operation named as the loan. */
const asks_for_the_drill = (loan_id: string, member_id: string) => (shed: Shed) =>
  first(
    shed.loans.borrow_a_tool(
      shed.at('2026-11-19T15:00:00.000Z', {
        operation: loan_id,
        scope: `member/${member_id}`,
      }),
      { loan_id, tool_id: 'drill', member_id },
    ),
  )

const marta = asks_for_the_drill('L11', 'M-12')
const gianni = asks_for_the_drill('L12', 'M-7')

/** What the one who does not get the drill reads: the predicates of `borrow_a_tool` that failed. */
const not_available = {
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
}

describe('SC-11, Marta and Gianni ask for the last drill at the same instant', () => {
  test('the outcomes of one of the two serial orders: one has it, the other reads it is not available', async () => {
    const requests: readonly Request<Shed, unknown>[] = [marta, gianni]
    const serial = await serially(a_shed_with_the_drill, requests)
    const together = await at_once(a_shed_with_the_drill, requests)
    expect(serial).toContainEqual(together)
    expect(together).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          outcome: 'applied',
          branch: 'the_tool_is_available_so_it_is_lent',
          position: '2',
        }),
        not_available,
      ]),
    )
  })

  test('one fact in the log: the next is the third', async () => {
    const shed = await a_shed_with_the_drill()
    await Promise.all([marta(shed), gianni(shed)])
    expect(
      await first(shed.tools.add_a_tool(shed.at('2026-11-19T15:05:00.000Z'), sander)),
    ).toMatchObject({ outcome: 'applied', position: '3' })
  })

  test("Marta's phone sends L11 again while the first is in flight: the first's fact, at its position", async () => {
    const requests: readonly Request<Shed, unknown>[] = [marta, marta, gianni]
    const serial = await serially(a_shed_with_the_drill, requests)
    const together = await at_once(a_shed_with_the_drill, requests)
    expect(serial).toContainEqual(together)
    const [first_try, retry] = together
    expect(retry).toEqual(first_try)
    // In no order is the retry a second fact for one operation
    // (`a_tool_has_been_lent_again`): the duplicate branch is in the step.
    for (const outcomes of serial) {
      expect(outcomes[1]).toEqual(outcomes[0])
      expect(outcomes).not.toContainEqual(
        expect.objectContaining({
          branch: 'the_member_already_has_the_tool_so_nothing_changes',
        }),
      )
    }
  })
})
