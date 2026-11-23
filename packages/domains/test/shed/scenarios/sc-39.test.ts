import { Buffer } from 'node:buffer'
import { describe, expect, test } from 'vitest'
import { first, oracle, quiet, type Start } from './oracle.ts'
import { ladder } from './shed.ts'

// SC-39: the desk's work sheet of a retired tool's reservations, a process
// with a cursor (DOM-20, D97, D112, D111; Shed's step 8, parts 2-4). The
// ladder holds Marta's R3 on Saturday and Gianni's R5 on Sunday; on
// Thursday Luca retires it (F1). `reaction/retirement/` opens the sheet in
// `loans`, with no cursor (F2); the desk's reaction to the opening takes the
// first step, R3, the closest day: [the cancellation has advanced, its
// cursor at R3; R3 cancelled] (F3); the reaction to the step's part takes
// the next, R5 (F4); after R5 the step closes the sheet (F5), and no one
// reacts to the closing. The cursor is the library's, written in the step's
// part, the order key of the reservation handled (day, then id, D109). A
// redelivery is the duplicate branch: F3 delivered again under its operation
// gives F4 as recorded, and R5 is cancelled once (TST-4).

const thursday = '2026-11-19T15:00:00.000Z'

/** The paths of each fact's parts, in the order of the log. */
const paths = (facts: readonly { readonly parts: readonly { readonly path: string }[] }[]) =>
  facts.map((fact) => fact.parts.map((part) => part.path.split('/').at(-1)))

/** The order key a cursor encodes, as the library writes it (DOM-20, LIB-10). */
const key_of = (cursor: unknown): unknown =>
  typeof cursor === 'string'
    ? JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    : cursor

/** The ladder in the shed; on Monday Marta (M-12) books it for Saturday (R3), Gianni (M-7) for Sunday (R5). */
const the_shed = async (start: Start = {}) => {
  const shed = await oracle(start)
  await first(shed.tools.add_a_tool(shed.at('2026-11-16T13:00:00.000Z'), ladder))
  for (const [reservation_id, member_id, day] of [
    ['R5', 'M-7', '2026-11-22'],
    ['R3', 'M-12', '2026-11-21'],
  ] as const) {
    await first(
      shed.loans.reserve_a_tool(shed.at('2026-11-16T14:00:00.000Z'), {
        reservation_id,
        tool_id: 'ladder',
        member_id,
        day,
      }),
    )
  }
  const luca_retires_the_ladder = () =>
    first(
      shed.tools.retire_a_tool(shed.at(thursday, { operation: 'RET-1' }), {
        id: 'ladder',
        reason: 'broken',
      }),
    )
  /** The facts after the shed was set up: the retirement and what came of it. */
  const after_the_retirement = async () => (await shed.recorded()).slice(3)
  /** The reservations of a member still booked, as the business reads them. */
  const booked = async (member_id: string) => {
    const snapshot = await first(
      shed.loans.the_reservations_of_a_member(shed.when(thursday), { member_id }),
    )
    return snapshot.event === 'snapshot' ? snapshot.entries.map((entry) => entry.id) : snapshot
  }
  return { shed, luca_retires_the_ladder, after_the_retirement, booked }
}

describe('SC-39, the work sheet of a retired tool', () => {
  test('the sheet cancels R3, then R5, by a cursor, then closes; the cursor at the reservation handled', async () => {
    const { shed, luca_retires_the_ladder, after_the_retirement, booked } = await the_shed()
    const consumers = shed.processes({ at: thursday })
    await luca_retires_the_ladder()
    await quiet()
    await consumers.stop()
    const facts = await after_the_retirement()
    expect(paths(facts)).toEqual([
      ['a_tool_has_been_retired'],
      ['the_cancellation_of_the_reservations_of_a_tool_has_begun'],
      ['the_cancellation_has_advanced', 'a_reservation_has_been_cancelled'],
      ['the_cancellation_has_advanced', 'a_reservation_has_been_cancelled'],
      ['the_cancellation_of_the_reservations_of_a_tool_has_ended'],
    ])
    const [, opened, first_step, second_step] = facts
    expect(opened?.parts[0]?.payload).toEqual({
      new_cancellation: {
        tool_id: 'ladder',
        start_date: '2026-11-19T15:00:00.000Z',
        progress: { stage: 'cancelling' },
      },
    })
    // The step's part keeps the cursor, the order key of the reservation
    // handled: its day, then its id (D109); the transition's part, the
    // reservation cancelled.
    expect(first_step?.parts.map((part) => part.payload)).toMatchObject([
      { tool_id: 'ladder' },
      {
        cancelled_reservation: {
          id: 'R3',
          progress: { stage: 'cancelled', cancellation_date: '2026-11-19T15:00:00.000Z' },
        },
      },
    ])
    const cursor_of_step = (step: typeof first_step) => {
      const payload = step?.parts[0]?.payload
      return typeof payload === 'object' && payload !== null && 'cursor' in payload
        ? key_of(payload.cursor)
        : undefined
    }
    expect(cursor_of_step(first_step)).toEqual([
      ['day', '2026-11-21'],
      ['id', 'R3'],
    ])
    expect(cursor_of_step(second_step)).toEqual([
      ['day', '2026-11-22'],
      ['id', 'R5'],
    ])
    expect(second_step?.parts[1]?.payload).toMatchObject({ cancelled_reservation: { id: 'R5' } })
    // Each step is of the chain the retirement began (DOM-10).
    expect(new Set(facts.map((fact) => fact.correlation))).toEqual(new Set([facts[0]?.correlation]))
    expect(await booked('M-12')).toEqual([])
    expect(await booked('M-7')).toEqual([])
  })

  test('a step on a sheet closed, or on none, is rejected, naming the read (DOM-20)', async () => {
    const { shed, luca_retires_the_ladder } = await the_shed()
    const consumers = shed.processes({ at: thursday })
    await luca_retires_the_ladder()
    await quiet()
    await consumers.stop()
    const rejected = {
      outcome: 'rejected',
      failures: [{ read: 'business/loans/value/cancellation_under_way' }],
    }
    expect(
      await first(
        shed.loans.continue_the_cancellation_of_reservations(shed.at(thursday), {
          tool_id: 'ladder',
        }),
      ),
    ).toEqual(rejected)
    expect(
      await first(
        shed.loans.continue_the_cancellation_of_reservations(shed.at(thursday), {
          tool_id: 'drill',
        }),
      ),
    ).toEqual(rejected)
  })

  test('the steps by hand: each advances by one, the retry of a step is its fact, another step under its operation `identity_already_used`', async () => {
    const { shed } = await the_shed()
    await first(
      shed.loans.cancel_the_reservations_of_a_tool(shed.at(thursday), { tool_id: 'ladder' }),
    )
    const step = (operation: string, tool_id = 'ladder') =>
      first(
        shed.loans.continue_the_cancellation_of_reservations(shed.at(thursday, { operation }), {
          tool_id,
        }),
      )
    const one = await step('S-1')
    expect(one).toMatchObject({
      outcome: 'applied',
      branch: 'advances',
      fact: { parts: [{ path: 'business/loans/fact/the_cancellation_has_advanced' }, {}] },
    })
    expect(one.outcome === 'applied' ? one.fact.parts[1]?.payload : undefined).toMatchObject({
      cancelled_reservation: { id: 'R3' },
    })
    // The retry of the first step reads its fact, at its position: never
    // the second reservation (DOM-11).
    expect(await step('S-1')).toEqual(one)
    expect(await step('S-1', 'drill')).toEqual({ outcome: 'identity_already_used' })
    expect(await step('S-2')).toMatchObject({
      branch: 'advances',
      fact: { parts: [{}, { payload: { cancelled_reservation: { id: 'R5' } } }] },
    })
    expect(await step('S-3')).toMatchObject({
      outcome: 'applied',
      branch: 'completes',
      fact: {
        parts: [
          {
            path: 'business/loans/fact/the_cancellation_of_the_reservations_of_a_tool_has_ended',
            payload: {
              completed_cancellation: {
                tool_id: 'ladder',
                progress: { stage: 'complete', end_date: '2026-11-19T15:00:00.000Z' },
              },
            },
          },
        ],
      },
    })
    expect(await step('S-3')).toMatchObject({ outcome: 'applied', branch: 'completes' })
    expect(await step('S-4')).toMatchObject({ outcome: 'rejected' })
    expect(
      await first(
        shed.loans.continue_the_cancellation_of_reservations(shed.at(thursday), { tool_id: '' }),
      ),
    ).toEqual({ outcome: 'invalid_request' })
  })

  test('the consumers fall before saving their positions, and started again: the duplicate branch, R5 cancelled once (TST-4)', async () => {
    const { shed, luca_retires_the_ladder, after_the_retirement } = await the_shed()
    const falling = shed.processes({ at: thursday, saves_its_position: false })
    await luca_retires_the_ladder()
    await quiet()
    await falling.stop()
    const before = await after_the_retirement()
    const again = shed.processes({ at: thursday })
    await quiet()
    await again.stop()
    expect(await after_the_retirement()).toEqual(before)
    expect(before).toHaveLength(5)
  })

  test('every fact delivered twice: one sheet, each reservation cancelled once (TST-4)', async () => {
    const { shed, luca_retires_the_ladder, after_the_retirement } = await the_shed({
      redelivered: true,
    })
    const consumers = shed.processes({ at: thursday })
    await luca_retires_the_ladder()
    await quiet()
    await consumers.stop()
    expect(paths(await after_the_retirement())).toEqual([
      ['a_tool_has_been_retired'],
      ['the_cancellation_of_the_reservations_of_a_tool_has_begun'],
      ['the_cancellation_has_advanced', 'a_reservation_has_been_cancelled'],
      ['the_cancellation_has_advanced', 'a_reservation_has_been_cancelled'],
      ['the_cancellation_of_the_reservations_of_a_tool_has_ended'],
    ])
  })

  test('an instance on which no branch of the transition holds is passed over, never a rejection (D112.2)', async () => {
    // A release of the adapter of `loans` reads Marta's R3 as not booked when
    // a command asks, while the sheet's selection keeps it: the first step
    // passes over R3 and cancels R5, its cursor at R5; the second closes.
    const { shed, luca_retires_the_ladder, after_the_retirement, booked } = await the_shed({
      not_booked_for_its_commands: ['R3'],
    })
    const consumers = shed.processes({ at: thursday })
    await luca_retires_the_ladder()
    await quiet()
    await consumers.stop()
    const facts = await after_the_retirement()
    const steps = facts.filter((fact) => fact.parts.length === 2)
    expect(steps.map((fact) => fact.parts[1]?.payload)).toMatchObject([
      { cancelled_reservation: { id: 'R5' } },
    ])
    expect(
      steps.map((fact) => {
        const payload = fact.parts[0]?.payload
        return typeof payload === 'object' && payload !== null && 'cursor' in payload
          ? key_of(payload.cursor)
          : undefined
      }),
    ).toEqual([
      [
        ['day', '2026-11-22'],
        ['id', 'R5'],
      ],
    ])
    expect(await booked('M-12')).toEqual(['R3'])
    expect(facts.at(-1)?.parts[0]?.path).toBe(
      'business/loans/fact/the_cancellation_of_the_reservations_of_a_tool_has_ended',
    )
  })

  test('a tool with no reservation ahead: the first step closes the sheet', async () => {
    const shed = await oracle()
    await first(shed.tools.add_a_tool(shed.at('2026-11-16T13:00:00.000Z'), ladder))
    const consumers = shed.processes({ at: thursday })
    await first(shed.tools.retire_a_tool(shed.at(thursday), { id: 'ladder', reason: 'broken' }))
    await quiet()
    await consumers.stop()
    expect(paths((await shed.recorded()).slice(1))).toEqual([
      ['a_tool_has_been_retired'],
      ['the_cancellation_of_the_reservations_of_a_tool_has_begun'],
      ['the_cancellation_of_the_reservations_of_a_tool_has_ended'],
    ])
  })
})
