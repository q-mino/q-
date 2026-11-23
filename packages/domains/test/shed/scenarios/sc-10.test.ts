import { describe, expect, test } from 'vitest'
import { first } from './oracle.ts'
import { a_shed_with, drill } from './shed.ts'

// SC-10: Gianni takes the drill on the day he booked it: the loan takes up
// the reservation, one fact in two parts, a transition composed outside a
// step (DOM-19, D111). The branch applies when its condition and a branch
// of the transition hold; a rejection names the failed predicates of both,
// the transition's under its name (DOM-6).

/** The shed with the drill, which Gianni (M-7) booked on Monday for Thursday 19 November (R8). */
const the_drill_booked_for_thursday = async () => {
  const shed = await a_shed_with(drill)
  await first(
    shed.loans.reserve_a_tool(shed.at('2026-11-16T17:00:00.000Z', { scope: 'member/M-7' }), {
      reservation_id: 'R8',
      tool_id: 'drill',
      member_id: 'M-7',
      day: '2026-11-19',
    }),
  )
  return shed
}

/** Gianni's request on Thursday, from R8's row: take the tool he booked, under L5. */
const gianni_takes_it = { loan_id: 'L5', reservation_id: 'R8', tool_id: 'drill', member_id: 'M-7' }

/** The reservation taken up by the loan, the part the transition records. */
const taken_up = {
  branch: 'the_reservation_holds_the_tool_for_the_member_today_so_it_is_taken_up',
  fact: { taken_up_reservation: { id: 'R8', progress: { stage: 'taken_up', loan_id: 'L5' } } },
}

describe('SC-10, Gianni takes the drill he booked', () => {
  test('one fact in two parts: the loan, then the reservation taken up, each with its resources', async () => {
    const shed = await the_drill_booked_for_thursday()
    const thursday = shed.at('2026-11-19T15:00:00.000Z', { scope: 'member/M-7' })
    expect(await first(shed.loans.lend_a_booked_tool(thursday, gianni_takes_it))).toEqual({
      outcome: 'applied',
      branch: 'the_member_booked_the_tool_for_today_so_it_is_lent',
      position: '3',
      fact: {
        parts: [
          {
            path: 'business/loans/fact/a_tool_has_been_lent',
            payload: {
              new_loan: {
                id: 'L5',
                tool_id: 'drill',
                member_id: 'M-7',
                start_date: '2026-11-19T15:00:00.000Z',
                start_day: '2026-11-19',
                due_day: '2026-12-03',
                progress: { stage: 'ongoing', term: 'running' },
              },
            },
            resources: [
              { path: 'business/loans/id/loan_id', value: 'L5' },
              { path: 'business/tools/id/tool_id', value: 'drill' },
              { path: 'business/loans/id/member_id', value: 'M-7' },
            ],
          },
          {
            path: 'business/loans/fact/a_reservation_has_been_taken_up',
            payload: taken_up.fact,
            resources: [
              { path: 'business/loans/id/reservation_id', value: 'R8' },
              { path: 'business/loans/id/loan_id', value: 'L5' },
            ],
          },
        ],
        operation: thursday.operation,
        correlation: thursday.correlation,
      },
      composed: { the_reservation_is_taken_up: taken_up },
    })
  })

  test('a retry reads the composed parts as the first request did', async () => {
    const shed = await the_drill_booked_for_thursday()
    const sent = { operation: 'gianni-L5', scope: 'member/M-7' }
    const applied = await first(
      shed.loans.lend_a_booked_tool(shed.at('2026-11-19T15:00:00.000Z', sent), gianni_takes_it),
    )
    expect(
      await first(
        shed.loans.lend_a_booked_tool(shed.at('2026-11-19T15:00:05.000Z', sent), gianni_takes_it),
      ),
    ).toEqual(applied)
  })

  test('a second tap records the reservation already taken up, a branch that composes nothing', async () => {
    const shed = await the_drill_booked_for_thursday()
    await first(
      shed.loans.lend_a_booked_tool(
        shed.at('2026-11-19T15:00:00.000Z', { scope: 'member/M-7' }),
        gianni_takes_it,
      ),
    )
    const again = shed.at('2026-11-19T15:01:00.000Z', { scope: 'member/M-7' })
    expect(await first(shed.loans.lend_a_booked_tool(again, gianni_takes_it))).toEqual({
      outcome: 'applied',
      branch: 'the_member_already_took_the_tool_so_nothing_changes',
      position: '4',
      fact: {
        parts: [
          {
            path: 'business/loans/fact/a_reservation_has_been_taken_up_again',
            payload: { reservation_id: 'R8', member_id: 'M-7' },
            resources: [
              { path: 'business/loans/id/reservation_id', value: 'R8' },
              { path: 'business/loans/id/member_id', value: 'M-7' },
            ],
          },
        ],
        operation: again.operation,
        correlation: again.correlation,
      },
    })
  })

  test("Marta, that Thursday, is lent no tool booked for today: the drill is Gianni's", async () => {
    const shed = await the_drill_booked_for_thursday()
    expect(
      await first(
        shed.loans.borrow_a_tool(shed.at('2026-11-19T14:00:00.000Z', { scope: 'member/M-12' }), {
          loan_id: 'L7',
          tool_id: 'drill',
          member_id: 'M-12',
        }),
      ),
    ).toEqual({
      outcome: 'rejected',
      failures: [
        {
          branch: 'the_tool_is_available_so_it_is_lent',
          components: ['no_one_booked_the_tool_for_today'],
          predicate: 'business/loans/predicate/the_tool_is_booked_for_the_day',
        },
        {
          branch: 'the_member_already_has_the_tool_so_nothing_changes',
          components: [],
          predicate: 'business/loans/predicate/the_tool_is_on_loan_to_this_member',
        },
      ],
    })
  })

  test("Marta names Gianni's reservation: the transition fails, under its name, and nothing is recorded", async () => {
    const shed = await the_drill_booked_for_thursday()
    expect(
      await first(
        shed.loans.lend_a_booked_tool(
          shed.at('2026-11-19T14:00:00.000Z', { scope: 'member/M-12' }),
          { loan_id: 'L7', reservation_id: 'R8', tool_id: 'drill', member_id: 'M-12' },
        ),
      ),
    ).toEqual({
      outcome: 'rejected',
      failures: [
        {
          branch: 'the_member_booked_the_tool_for_today_so_it_is_lent',
          components: [
            'the_reservation_is_taken_up',
            'the_reservation_holds_the_tool_for_the_member_today_so_it_is_taken_up',
          ],
          predicate:
            'business/loans/predicate/the_reservation_holds_the_tool_for_the_member_on_the_day',
        },
        {
          branch: 'the_member_already_took_the_tool_so_nothing_changes',
          components: [],
          predicate: 'business/loans/predicate/the_reservation_of_the_member_has_been_taken_up',
        },
      ],
    })
    const gianni = await first(
      shed.loans.lend_a_booked_tool(
        shed.at('2026-11-19T15:00:00.000Z', { scope: 'member/M-7' }),
        gianni_takes_it,
      ),
    )
    expect(gianni).toMatchObject({
      outcome: 'applied',
      branch: 'the_member_booked_the_tool_for_today_so_it_is_lent',
      position: '3',
    })
  })

  test('the drill already on loan: both the branch and the transition fail, each where it stands', async () => {
    const shed = await the_drill_booked_for_thursday()
    await first(
      shed.loans.lend_a_booked_tool(
        shed.at('2026-11-19T15:00:00.000Z', { scope: 'member/M-7' }),
        gianni_takes_it,
      ),
    )
    expect(
      await first(
        shed.loans.lend_a_booked_tool(
          shed.at('2026-11-19T16:00:00.000Z', { scope: 'member/M-12' }),
          { loan_id: 'L7', reservation_id: 'R8', tool_id: 'drill', member_id: 'M-12' },
        ),
      ),
    ).toEqual({
      outcome: 'rejected',
      failures: [
        {
          branch: 'the_member_booked_the_tool_for_today_so_it_is_lent',
          components: ['the_requested_tool_is_not_on_loan'],
          predicate: 'business/loans/predicate/the_tool_is_on_loan',
        },
        {
          branch: 'the_member_booked_the_tool_for_today_so_it_is_lent',
          components: [
            'the_reservation_is_taken_up',
            'the_reservation_holds_the_tool_for_the_member_today_so_it_is_taken_up',
          ],
          predicate:
            'business/loans/predicate/the_reservation_holds_the_tool_for_the_member_on_the_day',
        },
        {
          branch: 'the_member_already_took_the_tool_so_nothing_changes',
          components: [],
          predicate: 'business/loans/predicate/the_reservation_of_the_member_has_been_taken_up',
        },
      ],
    })
  })
})
