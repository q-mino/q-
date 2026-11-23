import { describe, expect, test } from 'vitest'
import { oracle } from './oracle.ts'
import { kept_before_2_0_0 } from './kept.ts'

// SC-38: Marta's waits queued at 1.x (DOM-22; Shed's step 10). On 2 November
// at 10:12 she borrowed the drill at `loans` 1.4.0, due on the 16th at
// 10:12, and the loan queued its two waits at that shape; on the 4th
// `loans` 2.0.0 makes a loan due on a day. The executor reads each entry at
// the current shape before the delivery (the effects in flight, A, 17 Nov
// 2026): the eve, queued for 10:12 of the 15th with `due_date`, reaches its
// return with `due_day`, and Marta is reminded of the 16th; a translation
// touches the payload alone, never when the entry goes, so the overdue
// wait comes at 10:12 of her due day itself, and its return, reading the
// day, puts it off to the start of the day after, under a key of its own:
// her drill becomes overdue on the 17th at 00:00, as any loan of 2.0.0.

const the_eve = 'business/loans/effect/wait_until_the_eve_of_the_due_date'
const the_due_date = 'business/loans/effect/wait_until_the_due_date'

describe("SC-38: Marta's waits queued at 1.x, delivered at 2.0.0", () => {
  test('the eve with the new shape; the overdue wait put off to the end of her due day', async () => {
    const shed = await oracle({ kept: kept_before_2_0_0 })
    shed.executor({ at: '2026-11-05T14:00:00.000Z', phones: { 'M-12': '+1 416 555 0112' } })
    await shed.pass('2026-11-15T15:12:00.000Z')
    expect((await shed.recorded()).at(-1)).toMatchObject({
      parts: [{ path: 'business/loans/fact/the_member_has_been_reminded_of_the_due_date' }],
      operation: { scope: the_eve, id: 'L1' },
      correlation: 'correlation-L1',
    })
    expect(shed.received()).toMatchObject([{ message: 'due_date_reminder', due_day: '2026-11-16' }])
    await shed.pass('2026-11-16T15:12:00.000Z')
    expect((await shed.recorded()).at(-1)).toMatchObject({
      parts: [{ path: 'business/loans/fact/the_overdue_check_has_been_put_off' }],
      operation: { scope: the_due_date, id: 'L1' },
    })
    const put_off = shed.queued(the_due_date).at(-1)
    expect(put_off).toMatchObject({ not_before: '2026-11-17T05:00:00.000Z' })
    expect(put_off?.id).not.toBe('L1')
    await shed.pass('2026-11-17T05:00:00.000Z')
    expect((await shed.recorded()).at(-1)).toMatchObject({
      parts: [
        {
          path: 'business/loans/fact/a_loan_has_become_overdue',
          payload: { overdue_loan: { id: 'L1' } },
        },
      ],
      operation: { scope: the_due_date, id: put_off?.id },
    })
  })
})
