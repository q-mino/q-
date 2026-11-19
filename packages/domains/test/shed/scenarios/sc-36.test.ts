import { describe, expect, test } from 'vitest'
import { first, oracle, type Start } from './oracle.ts'

// SC-36: the deadline as a fact (D68.3, D92.4; Shed's step 7). Time is not
// a fact: Marta's loan becomes overdue only by a command, so that the
// change can enter a stream. Her loan queues, with its fact, a wait until
// the due date, the start of the day after her due day; its return,
// `declare_the_loan_overdue`, stamps the loan if she still has the drill,
// and records that it came back first if not. The executor delivers at
// least once (DOM-14): a wait delivered twice, or again after the executor
// fell before saving its position, is the duplicate branch of its return,
// keyed by the effect and the entry (DOM-11): one stamp (TST-4).

const the_due_date = 'business/loans/effect/wait_until_the_due_date'
const overdue = 'business/loans/fact/a_loan_has_become_overdue'

/** The drill lent to Marta on 2 November (L7, due on the 16th), on a shed that starts so. */
const marta_borrows_the_drill = async (start: Start = {}) => {
  const shed = await oracle(start)
  await first(
    shed.tools.add_a_tool(shed.at('2026-11-02T08:00:00-05:00'), {
      id: 'drill',
      name: 'Cordless drill',
      category: 'power',
    }),
  )
  await first(
    shed.loans.borrow_a_tool(
      shed.at('2026-11-02T10:00:00-05:00', { scope: 'member/M-12', operation: 'B1' }),
      { loan_id: 'L7', tool_id: 'drill', member_id: 'M-12' },
    ),
  )
  return shed
}

/** The paths of the facts recorded, in order, each by its parts. */
const paths = (facts: readonly { readonly parts: readonly { readonly path: string }[] }[]) =>
  facts.map((fact) => fact.parts.map((part) => part.path))

describe('SC-36: the deadline as a fact, the overdue wait stamps the loan', () => {
  test('at the start of the 17th Marta still has the drill: the loan becomes overdue', async () => {
    const shed = await marta_borrows_the_drill()
    shed.executor({ at: '2026-11-02T10:00:00-05:00', phones: { 'M-12': '+1 416 555 0112' } })
    await shed.pass('2026-11-16T23:59:59-05:00')
    expect(paths(await shed.recorded())).not.toContainEqual([overdue])
    await shed.pass('2026-11-17T00:00:00-05:00')
    const facts = await shed.recorded()
    expect(facts.at(-1)).toMatchObject({
      parts: [
        {
          path: overdue,
          payload: { overdue_loan: { id: 'L7', progress: { stage: 'ongoing', term: 'overdue' } } },
        },
      ],
      operation: { scope: the_due_date, id: 'L7' },
      correlation: 'correlation-B1',
    })
  })

  test('the drill back on the 16th: on the 17th the loan came back first, and nothing is stamped', async () => {
    const shed = await marta_borrows_the_drill()
    shed.executor({ at: '2026-11-02T10:00:00-05:00', phones: { 'M-12': '+1 416 555 0112' } })
    await first(
      shed.loans.return_a_tool(shed.at('2026-11-16T18:00:00-05:00'), {
        loan_id: 'L7',
        tool_id: 'drill',
        condition: 'good',
      }),
    )
    await shed.pass('2026-11-17T00:00:00-05:00')
    expect(paths(await shed.recorded()).at(-1)).toEqual([
      'business/loans/fact/the_loan_was_returned_before_it_became_overdue',
    ])
  })

  test('every entry the outbox gives twice: the wait comes again, the duplicate branch, one stamp', async () => {
    const shed = await marta_borrows_the_drill({ redelivered: true })
    shed.executor({ at: '2026-11-02T10:00:00-05:00', phones: { 'M-12': '+1 416 555 0112' } })
    await shed.pass('2026-11-17T00:00:00-05:00')
    const facts = paths(await shed.recorded())
    expect(facts.filter((fact) => fact[0] === overdue)).toHaveLength(1)
    expect(shed.held(the_due_date)).toEqual([])
  })

  test('the executor falls before saving its position: started again, the wait comes again, one stamp', async () => {
    const shed = await marta_borrows_the_drill()
    const falling = shed.executor({
      at: '2026-11-02T10:00:00-05:00',
      phones: { 'M-12': '+1 416 555 0112' },
      saves_its_position: false,
    })
    await shed.pass('2026-11-17T00:00:00-05:00')
    await falling.stop()
    const before = await shed.recorded()
    shed.executor({ at: '2026-11-17T00:05:00-05:00', phones: { 'M-12': '+1 416 555 0112' } })
    await shed.pass('2026-11-17T00:05:00-05:00')
    const after = await shed.recorded()
    expect(after).toEqual(before)
    expect(paths(after).filter((fact) => fact[0] === overdue)).toHaveLength(1)
  })
})
