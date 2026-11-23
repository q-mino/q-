import { describe, expect, test } from 'vitest'
import { first, oracle } from './oracle.ts'
import { a_shed_with, drill } from './shed.ts'
import { marta_s_loan_at_1, marta_s_waits_at_1, the_drill_added } from './kept.ts'

// SC-12: the day of an instant (LIB-2, DOM-22, PER-17). A node reads its days
// in one zone, its calendar, declared by its configuration (Toronto for the
// shed), never by a domain. At 23:30 on Monday 2 November in Toronto,
// already the 3rd in UTC, Marta borrows the drill: it is due on the 16th,
// its eve's wait goes at the start of the 15th there, its overdue wait at
// the start of the 17th. An instant is in UTC and tells no zone (A, 23 Nov
// 2026): the command decides a day with the context's zone and the fact
// carries it (`start_day`, `due_day`), so a translation, which has no zone,
// takes the day written: her loan of 1.x, due at 23:30 on the 16th, is due
// on the 16th at 2.0.0, though its instant is the 17th in UTC. In a shed
// whose calendar is UTC it would be due on the 17th. The formats themselves
// are the library's, tested on these days and instants since part 3.2
// (`test/library/format.test.ts`).

/** Marta's request at 23:30 on 2 November in Toronto, already the 3rd in UTC. */
const marta_borrows = { loan_id: 'L1', tool_id: 'drill', member_id: 'M-12' }

describe('SC-12, the day of an instant', () => {
  test("Marta borrows at 23:30 on 2 November in Toronto: due on the shed's 16th", async () => {
    const shed = await a_shed_with(drill)
    const late = shed.at('2026-11-03T04:30:00.000Z', { scope: 'member/M-12' })
    expect(await first(shed.loans.borrow_a_tool(late, marta_borrows))).toMatchObject({
      outcome: 'applied',
      fact: {
        parts: [
          {
            payload: {
              new_loan: {
                start_date: '2026-11-03T04:30:00.000Z',
                start_day: '2026-11-02',
                due_day: '2026-11-16',
              },
            },
          },
        ],
      },
    })
  })

  test("her waits at the start of the shed's 15th and 17th, in Toronto", async () => {
    const shed = await a_shed_with(drill)
    await first(
      shed.loans.borrow_a_tool(
        shed.at('2026-11-03T04:30:00.000Z', { scope: 'member/M-12' }),
        marta_borrows,
      ),
    )
    expect(shed.queued('business/loans/effect/wait_until_the_eve_of_the_due_date')).toMatchObject([
      { payload: { due_day: '2026-11-16' }, not_before: '2026-11-15T05:00:00.000Z' },
    ])
    expect(shed.queued('business/loans/effect/wait_until_the_due_date')).toMatchObject([
      { payload: { loan_id: 'L1' }, not_before: '2026-11-17T05:00:00.000Z' },
    ])
  })

  test('a shed whose calendar is UTC: the same instant is the 3rd, and the loan due on the 17th', async () => {
    const shed = await oracle({ time_zone: 'UTC', kept: { facts: [the_drill_added] } })
    expect(
      await first(
        shed.loans.borrow_a_tool(
          shed.at('2026-11-03T04:30:00.000Z', { scope: 'member/M-12' }),
          marta_borrows,
        ),
      ),
    ).toMatchObject({
      outcome: 'applied',
      fact: {
        parts: [
          {
            payload: {
              new_loan: {
                start_date: '2026-11-03T04:30:00.000Z',
                start_day: '2026-11-03',
                due_day: '2026-11-17',
              },
            },
          },
        ],
      },
    })
    expect(shed.queued('business/loans/effect/wait_until_the_due_date')).toMatchObject([
      { not_before: '2026-11-18T00:00:00.000Z' },
    ])
  })

  test('her loan of 1.x, due at 23:30 on the 16th in Toronto, the 17th in UTC, is due on the 16th at 2.0.0: the day the desk wrote', async () => {
    const shed = await oracle({
      kept: {
        facts: [
          the_drill_added,
          marta_s_loan_at_1({
            lent: '2026-11-03T04:30:00.000Z',
            start_day: '2026-11-02',
            due: '2026-11-17T04:30:00.000Z',
            due_day: '2026-11-16',
          }),
        ],
        entries: marta_s_waits_at_1({
          eve: '2026-11-16T04:30:00.000Z',
          due: '2026-11-17T04:30:00.000Z',
          due_day: '2026-11-16',
        }),
      },
    })
    const tuesday = shed.at('2026-11-10T23:00:00.000Z', { scope: 'member/M-12' })
    const extend = (due_day: string) =>
      first(
        shed.loans.extend_the_loan(tuesday, {
          loan_id: 'L1',
          tool_id: 'drill',
          member_id: 'M-12',
          due_day,
        }),
      )
    expect(await extend('2026-11-17')).toMatchObject({
      outcome: 'rejected',
      failures: [
        {
          branch: 'the_loan_can_be_extended_so_its_due_day_moves_on',
          components: ['it_is_due_on_the_day_they_read'],
        },
      ],
    })
    expect(await extend('2026-11-16')).toMatchObject({
      outcome: 'applied',
      fact: { parts: [{ payload: { extended_loan: { id: 'L1', due_day: '2026-11-30' } } }] },
    })
    expect(shed.queued('business/loans/effect/wait_until_the_eve_of_the_due_date')).toMatchObject([
      { payload: { due_day: '2026-11-16' }, not_before: '2026-11-16T04:30:00.000Z' },
      { payload: { due_day: '2026-11-30' }, not_before: '2026-11-29T05:00:00.000Z' },
    ])
  })
})
