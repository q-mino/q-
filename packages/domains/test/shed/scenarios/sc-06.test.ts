import { describe, expect, test } from 'vitest'
import { first } from './oracle.ts'
import { a_shed_with, ladder } from './shed.ts'

// SC-6: Gianni books the ladder for a day outside the window: an invalid
// request, a static rule over the input and `now`, in the schema the library
// builds over the context before parsing (DOM-21).

const thursday = '2026-11-19T15:00:00.000Z'

describe('SC-6, Gianni books the ladder for a day outside the window', () => {
  test.each([
    ['today', '2026-11-19'],
    ['more than 30 days ahead', '2026-12-20'],
  ])('a day %s is an invalid request: nothing is planned', async (_, day) => {
    const shed = await a_shed_with(ladder)
    expect(
      await first(
        shed.loans.reserve_a_tool(shed.at(thursday), {
          reservation_id: 'R8',
          tool_id: 'ladder',
          member_id: 'M-7',
          day,
        }),
      ),
    ).toEqual({ outcome: 'invalid_request' })
  })

  test('a day inside the window is booked; the window moves with now', async () => {
    const shed = await a_shed_with(ladder)
    const booking = { reservation_id: 'R8', tool_id: 'ladder', member_id: 'M-7', day: '2026-12-19' }
    expect(await first(shed.loans.reserve_a_tool(shed.at(thursday), booking))).toMatchObject({
      outcome: 'applied',
      branch: 'the_tool_is_free_that_day_so_it_is_booked',
    })
    expect(
      await first(
        shed.loans.reserve_a_tool(shed.at('2026-12-19T13:00:00.000Z'), {
          ...booking,
          reservation_id: 'R9',
        }),
      ),
    ).toEqual({ outcome: 'invalid_request' })
  })

  test('an undeclared field never passes (DOM-21)', async () => {
    const shed = await a_shed_with(ladder)
    const with_a_priority = {
      reservation_id: 'R8',
      tool_id: 'ladder',
      member_id: 'M-7',
      day: '2026-11-26',
      priority: 'high',
    }
    expect(await first(shed.loans.reserve_a_tool(shed.at(thursday), with_a_priority))).toEqual({
      outcome: 'invalid_request',
    })
  })
})
