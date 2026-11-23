import { describe, expect, test } from 'vitest'
import { first, oracle } from './oracle.ts'

// SC-35: the due-date reminder (DOM-13..15, D68.3; Shed's step 7). On
// Monday 2 November Marta borrows the drill (L7), due on the 16th; the loan
// queues, with its fact, a wait until the eve, the start of the 15th in the
// shed's zone. The executor waits for it by its clock, and on the 15th the
// library gives the payload back to its return (`returns_the_payload`),
// invoked as "system · executor of the effect": Marta still has the drill,
// so she is reminded, and the reminder goes to her phone. Had she brought it
// back on the 13th, the return records that the loan came back first, and
// no reminder goes (D95): no entry is ever cancelled.

const the_eve = 'business/loans/effect/wait_until_the_eve_of_the_due_date'
const the_reminder = 'business/loans/effect/send_the_due_date_reminder'

/** The drill in the shed, lent to Marta on 2 November at 10:00 (L7, due on the 16th). */
const marta_borrows_the_drill = async () => {
  const shed = await oracle()
  await first(
    shed.tools.add_a_tool(shed.at('2026-11-02T13:00:00.000Z'), {
      id: 'drill',
      name: 'Cordless drill',
      category: 'power',
    }),
  )
  await first(
    shed.loans.borrow_a_tool(
      shed.at('2026-11-02T15:00:00.000Z', { scope: 'member/M-12', operation: 'B1' }),
      { loan_id: 'L7', tool_id: 'drill', member_id: 'M-12' },
    ),
  )
  return shed
}

describe('SC-35: the due-date reminder, a wait and a guarded return', () => {
  test('on the eve Marta still has the drill: reminded, the reminder on her phone', async () => {
    const shed = await marta_borrows_the_drill()
    shed.executor({ at: '2026-11-02T15:00:00.000Z', phones: { 'M-12': '+1 416 555 0112' } })
    await shed.pass('2026-11-15T04:59:59.000Z')
    expect(await shed.recorded()).toHaveLength(2)
    expect(shed.received()).toEqual([])
    await shed.pass('2026-11-15T05:00:00.000Z')
    const facts = await shed.recorded()
    expect(facts).toHaveLength(3)
    expect(facts[2]).toMatchObject({
      parts: [
        {
          path: 'business/loans/fact/the_member_has_been_reminded_of_the_due_date',
          payload: { loan_id: 'L7' },
        },
      ],
      operation: { scope: the_eve, id: 'L7' },
      correlation: 'correlation-B1',
    })
    expect(shed.received()).toEqual([
      {
        message: 'due_date_reminder',
        key: `${the_reminder}/L7`,
        phone: '+1 416 555 0112',
        tool_name: 'Cordless drill',
        due_day: '2026-11-16',
      },
    ])
    expect(shed.held(the_eve)).toEqual([])
    expect(shed.held(the_reminder)).toEqual([])
  })

  test('the drill back on the 13th: on the eve the loan came back first, and no reminder goes', async () => {
    const shed = await marta_borrows_the_drill()
    await first(
      shed.loans.return_a_tool(shed.at('2026-11-13T22:00:00.000Z'), {
        loan_id: 'L7',
        tool_id: 'drill',
        condition: 'good',
      }),
    )
    shed.executor({ at: '2026-11-13T22:00:00.000Z', phones: { 'M-12': '+1 416 555 0112' } })
    await shed.pass('2026-11-15T05:00:00.000Z')
    const facts = await shed.recorded()
    expect(facts.at(-1)).toMatchObject({
      parts: [{ path: 'business/loans/fact/the_loan_was_returned_before_the_reminder' }],
      operation: { scope: the_eve, id: 'L7' },
    })
    expect(shed.received()).toEqual([])
  })

  test('the network down: the reminder is transient, tried again after a pause, then delivered', async () => {
    const shed = await marta_borrows_the_drill()
    shed.network('is_down', 'is_down')
    shed.executor({ at: '2026-11-02T15:00:00.000Z', phones: { 'M-12': '+1 416 555 0112' } })
    await shed.pass('2026-11-15T05:00:00.000Z')
    expect(shed.received()).toEqual([])
    await shed.pass('2026-11-15T05:01:00.000Z')
    expect(shed.received()).toEqual([])
    await shed.pass('2026-11-15T05:02:00.000Z')
    expect(shed.received()).toMatchObject([{ key: `${the_reminder}/L7` }])
    expect(shed.held(the_reminder)).toEqual([])
  })

  test('the network falls: the executor stops where it was, and started again it sends the reminder', async () => {
    const shed = await marta_borrows_the_drill()
    shed.network('falls')
    const fallen = shed.executor({
      at: '2026-11-02T15:00:00.000Z',
      phones: { 'M-12': '+1 416 555 0112' },
    })
    await shed.pass('2026-11-15T05:00:00.000Z')
    expect(shed.received()).toEqual([])
    await expect(fallen.stop()).rejects.toThrow(`the delivery of ${the_reminder} fell`)
    shed.executor({ at: '2026-11-15T13:00:00.000Z', phones: { 'M-12': '+1 416 555 0112' } })
    await shed.pass('2026-11-15T13:00:00.000Z')
    expect(shed.received()).toMatchObject([{ key: `${the_reminder}/L7` }])
    expect(await shed.recorded()).toHaveLength(3)
  })

  test('Marta has no phone: the reminder is exhausted, a dead letter shown, never a business fact', async () => {
    const shed = await marta_borrows_the_drill()
    shed.executor({ at: '2026-11-02T15:00:00.000Z' })
    await shed.pass('2026-11-15T05:00:00.000Z')
    expect(shed.held(the_reminder)).toMatchObject([
      {
        held: 'dead_letter',
        cause: { cause: 'exhausted', reason: 'the member has no phone' },
        entry: { effect: the_reminder, id: 'L7', correlation: 'correlation-B1' },
      },
    ])
    expect(await shed.recorded()).toHaveLength(3)
  })
})
