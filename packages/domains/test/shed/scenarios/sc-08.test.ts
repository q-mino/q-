import { describe, expect, test } from 'vitest'
import * as zz from '../../../src/library/index.ts'
import type * as loans_fact from '../business/loans/_fact.ts'
import type * as tools_fact from '../business/tools/_fact.ts'
import { first, one_at_a_time, oracle } from './oracle.ts'
import {
  kept_before_2_0_0,
  marta_borrows_the_drill,
  marta_s_loan_at_1,
  marta_s_operation,
  the_drill_added,
} from './kept.ts'

// SC-8: Marta's loan of `loans` 1.x read after 2.0.0, by every reader at the
// current shape; the state rebuilt from the log (DOM-22, V14). On 2 November
// at 10:12 Marta borrows the drill at 1.x, due on the 16th at 10:12; on the
// 4th `loans` 2.0.0 makes a loan due on a day. The store keeps her fact as
// it was written, and the release rebuilds its state from the log through
// the library (`replay`), which gives each part at the current shape: her
// loan is due on the 16th, to its end. Every reader meets 2.0.0 alone: the
// duplicate branch, the rebuild, the executor's waits (part 7.1 reads them
// so), the reads and the consumers with their parts.

describe('SC-8, a loan of loans 1.x read after 2.0.0', () => {
  test('the state rebuilt from the log: Marta extends her loan of 1.x as due on the 16th', async () => {
    const shed = await oracle({ kept: kept_before_2_0_0 })
    const tuesday = shed.at('2026-11-10T23:00:00.000Z', { scope: 'member/M-12' })
    const extended = await first(
      shed.loans.extend_the_loan(tuesday, {
        loan_id: 'L1',
        tool_id: 'drill',
        member_id: 'M-12',
        due_day: '2026-11-16',
      }),
    )
    expect(extended).toMatchObject({
      outcome: 'applied',
      branch: 'the_loan_can_be_extended_so_its_due_day_moves_on',
      position: '3',
      fact: {
        parts: [
          {
            path: 'business/loans/fact/a_loan_has_been_extended',
            payload: { extended_loan: { id: 'L1', due_day: '2026-11-30' } },
          },
        ],
      },
    })
  })

  test("Marta's retry of her request of 1.x: the duplicate branch gives back its fact at 2.0.0", async () => {
    const shed = await oracle({ kept: kept_before_2_0_0 })
    const retried = await first(
      shed.loans.borrow_a_tool(
        shed.at('2026-11-05T13:00:00.000Z', marta_s_operation),
        marta_borrows_the_drill,
      ),
    )
    expect(retried).toEqual({
      outcome: 'applied',
      branch: 'the_tool_is_available_so_it_is_lent',
      position: '2',
      fact: {
        parts: [
          {
            path: 'business/loans/fact/a_tool_has_been_lent',
            payload: {
              new_loan: {
                id: 'L1',
                tool_id: 'drill',
                member_id: 'M-12',
                start_date: '2026-11-02T15:12:00.000Z',
                start_day: '2026-11-02',
                due_day: '2026-11-16',
                progress: { stage: 'ongoing', term: 'running' },
              },
            },
            resources: [
              { path: 'business/loans/id/loan_id', value: 'L1' },
              { path: 'business/tools/id/tool_id', value: 'drill' },
              { path: 'business/loans/id/member_id', value: 'M-12' },
            ],
          },
        ],
        operation: { id: 'L1', scope: 'member/M-12' },
        correlation: 'correlation-L1',
      },
    })
  })

  test("the waits queued at 1.x reach the executor at 2.0.0's shape, when queued", async () => {
    const shed = await oracle({ kept: kept_before_2_0_0 })
    expect(shed.queued('business/loans/effect/wait_until_the_eve_of_the_due_date')).toEqual([
      {
        effect: 'business/loans/effect/wait_until_the_eve_of_the_due_date',
        id: 'L1',
        payload: { loan_id: 'L1', tool_id: 'drill', member_id: 'M-12', due_day: '2026-11-16' },
        not_before: '2026-11-15T15:12:00.000Z',
        resources: [
          { path: 'business/loans/id/loan_id', value: 'L1' },
          { path: 'business/tools/id/tool_id', value: 'drill' },
          { path: 'business/loans/id/member_id', value: 'M-12' },
        ],
        correlation: 'correlation-L1',
      },
    ])
    expect(shed.queued('business/loans/effect/wait_until_the_due_date')).toMatchObject([
      { id: 'L1', payload: { loan_id: 'L1' }, not_before: '2026-11-16T15:12:00.000Z' },
    ])
  })

  test('the rebuild replays the facts the log had recorded when it began, each at the current shape', async () => {
    const shed = await oracle()
    const lent = marta_s_loan_at_1({
      lent: '2026-11-02T15:12:00.000Z',
      start_day: '2026-11-02',
      due: '2026-11-16T15:12:00.000Z',
      due_day: '2026-11-16',
    })
    const after: zz.StoredEnvelope = {
      ...the_drill_added,
      operation: { id: zz.operation_id.parse('T2'), scope: 'keeper/luca' },
    }
    const log: zz.FactLog = () =>
      one_at_a_time<zz.LogEvent>([
        { event: 'fact', position: zz.position.parse('1'), fact: the_drill_added },
        { event: 'fact', position: zz.position.parse('2'), fact: lent },
        { event: 'caught_up', position: zz.position.parse('2') },
        { event: 'fact', position: zz.position.parse('3'), fact: after },
      ])
    const replayed: unknown[] = []
    for await (const fact of zz.replay<
      typeof loans_fact.a_tool_has_been_lent | typeof tools_fact.a_tool_has_been_added,
      unknown
    >({
      versions: shed.versions,
      writes: {
        'business/loans/fact/a_tool_has_been_lent': (payload) => payload.new_loan.due_day,
        'business/tools/fact/a_tool_has_been_added': (payload) => payload.added_tool.id,
      },
    })(log)) {
      replayed.push(fact)
    }
    expect(replayed).toEqual([
      { position: '1', writes: ['drill'] },
      { position: '2', writes: ['2026-11-16'] },
    ])
  })
})
