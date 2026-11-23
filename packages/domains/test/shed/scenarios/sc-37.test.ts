import { describe, expect, test } from 'vitest'
import { first, oracle } from './oracle.ts'

// SC-37: the executor down past the due date (D108, D95; Shed's step 7). No
// order holds between two effects: the eve's wait and the due date's are
// two delivery units, and the executor, down from the 14th to the 18th,
// finds both due when it starts again. Whichever comes first, "bring it
// back tomorrow" would reach Marta two days late: the eve's return reads
// the due date at the executor's `now`, past, and records that the due date
// came first, so no reminder goes; the due date's stamps the loan overdue.
// An entry goes late, never skipped.

describe('SC-37: the executor down past the due date', () => {
  test('started again on the 18th: the reminder comes late and records that the due date came first', async () => {
    const shed = await oracle()
    await first(
      shed.tools.add_a_tool(shed.at('2026-11-02T13:00:00.000Z'), {
        id: 'drill',
        name: 'Cordless drill',
        category: 'power',
      }),
    )
    await first(
      shed.loans.borrow_a_tool(shed.at('2026-11-02T15:00:00.000Z', { scope: 'member/M-12' }), {
        loan_id: 'L7',
        tool_id: 'drill',
        member_id: 'M-12',
      }),
    )
    const before = shed.executor({
      at: '2026-11-02T15:00:00.000Z',
      phones: { 'M-12': '+1 416 555 0112' },
    })
    await shed.pass('2026-11-14T14:00:00.000Z')
    await before.stop()
    shed.executor({ at: '2026-11-18T14:00:00.000Z', phones: { 'M-12': '+1 416 555 0112' } })
    await shed.pass('2026-11-18T14:00:00.000Z')
    const facts = (await shed.recorded()).slice(2)
    expect(facts.map((fact) => [fact.operation.scope, fact.parts[0]?.path]).toSorted()).toEqual([
      [
        'business/loans/effect/wait_until_the_due_date',
        'business/loans/fact/a_loan_has_become_overdue',
      ],
      [
        'business/loans/effect/wait_until_the_eve_of_the_due_date',
        'business/loans/fact/the_due_date_came_before_the_reminder',
      ],
    ])
    expect(shed.received()).toEqual([])
  })
})
