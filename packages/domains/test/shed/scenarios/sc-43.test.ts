import { describe, expect, test } from 'vitest'
import { first, oracle } from './oracle.ts'

// SC-43: every Monday the desk sends the week's summary (DOM-13, D48, D68.3;
// Shed's step 11). A recurrence is a wait whose return queues the next,
// with the constructs there are: no timer, no schedule of the library. On
// Thursday 19 November Marta asks for her week; the wait until Monday the
// 23rd, at the start of the shed's day, keyed by her and the Monday, comes
// back and the summary goes, with the wait for the 30th. The executor is
// down from the 28th to Wednesday 9 December: the wait of the 30th comes on
// the 9th, its week over, and sends nothing of a past week; it awaits the
// 7th, already past, which goes at once. After the downtime Marta reads one
// summary, of the week she is in, and the next wait is the 14th's.

const the_summary = 'business/loans/effect/send_the_weeks_summary'
const monday = 'business/loans/effect/wait_until_monday'

describe("SC-43: every Monday the week's summary, a wait whose return queues the next", () => {
  test('the 23rd, then the executor down from the 28th: on the 9th one summary, of the 7th', async () => {
    const shed = await oracle()
    const asked = await first(
      shed.loans.begin_a_weekly_summary(
        shed.at('2026-11-19T12:00:00-05:00', { scope: 'member/M-12', operation: 'W1' }),
        { member_id: 'M-12' },
      ),
    )
    expect(asked).toMatchObject({ outcome: 'applied', position: '1' })
    const before = shed.executor({
      at: '2026-11-19T12:00:00-05:00',
      phones: { 'M-12': '+1 416 555 0112' },
    })
    await shed.pass('2026-11-23T00:00:00-05:00')
    expect((await shed.recorded()).at(-1)).toMatchObject({
      parts: [
        {
          path: 'business/loans/fact/the_weeks_summary_has_been_sent',
          payload: { monday: '2026-11-23', next_monday: '2026-11-30' },
        },
      ],
      operation: { scope: monday },
      correlation: 'correlation-W1',
    })
    expect(shed.received()).toMatchObject([{ message: 'weeks_summary', monday: '2026-11-23' }])
    await shed.pass('2026-11-28T09:00:00-05:00')
    await before.stop()
    shed.executor({ at: '2026-12-09T09:00:00-05:00', phones: { 'M-12': '+1 416 555 0112' } })
    await shed.pass('2026-12-09T09:00:00-05:00')
    const after = (await shed.recorded()).slice(2)
    expect(after.map((fact) => fact.parts.map((part) => [part.path, part.payload]))).toEqual([
      [
        [
          'business/loans/fact/a_past_weeks_summary_has_been_skipped',
          expect.objectContaining({ monday: '2026-11-30', next_monday: '2026-12-07' }),
        ],
      ],
      [
        [
          'business/loans/fact/the_weeks_summary_has_been_sent',
          expect.objectContaining({ monday: '2026-12-07', next_monday: '2026-12-14' }),
        ],
      ],
    ])
    expect(shed.received().map((message) => message.key)).toEqual([
      expect.stringContaining(the_summary),
      expect.stringContaining(the_summary),
    ])
    expect(shed.received()).toMatchObject([{ monday: '2026-11-23' }, { monday: '2026-12-07' }])
    expect(shed.queued(monday).at(-1)).toMatchObject({
      payload: { monday: '2026-12-14' },
      not_before: '2026-12-14T00:00:00-05:00',
    })
  })
})
