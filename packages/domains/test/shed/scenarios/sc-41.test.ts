import { describe, expect, test } from 'vitest'
import { first, oracle, quiet, type Start } from './oracle.ts'
import { drill } from './shed.ts'

// SC-41: the desk's round of the notices of a repair, a process with a
// cursor (DOM-20, DOM-13, D97, D112; Shed's step 9, part 2). On Tuesday the
// drill goes to the workshop (RP1); `reaction/repair/` begins the round in
// `loans`, keyed by the stay; the desk's reactions take its steps: Gianni,
// booked for Thursday (R8), then Paolo, booked three weeks on (R9), each
// step one fact [the round advanced, its cursor at the reservation; the
// member notified], the notice queued with it, keyed by the stay and the
// reservation; then the round closes. The reservations stay. The drill back
// on Friday and in the workshop again the next Tuesday (RP2): a second
// round, and Paolo, still booked, a second notice, of another key; Gianni's
// Thursday has passed. Had Luca found the drill beyond repair after the first
// step and retired it, the cancellation's sheet cancels R9, which leaves the
// round's selection: Paolo gets no repair notice.

const tuesday = '2026-11-17T09:00:00-05:00'
const notice = 'business/loans/effect/send_the_repair_notice'

/** The last segment of the paths of each fact's parts, in the order of the log. */
const paths = (facts: readonly { readonly parts: readonly { readonly path: string }[] }[]) =>
  facts.map((fact) => fact.parts.map((part) => part.path.split('/').at(-1)))

/** The reservation a notice is for, by its payload. */
const reservation_of = (payload: unknown): unknown =>
  typeof payload === 'object' && payload !== null && 'reservation_id' in payload
    ? payload.reservation_id
    : undefined

/** The stay in repair a fact of `tools` opened, by its payload. */
const stay_of = (payload: unknown): string => {
  if (typeof payload !== 'object' || payload === null || !('tool_under_repair' in payload)) {
    throw new Error('no stay in repair')
  }
  const tool: unknown = payload.tool_under_repair
  const repair: unknown =
    typeof tool === 'object' && tool !== null && 'repair' in tool ? tool.repair : undefined
  const id: unknown =
    typeof repair === 'object' && repair !== null && 'id' in repair ? repair.id : undefined
  if (typeof id !== 'string') throw new Error('no stay in repair')
  return id
}

/** The drill in the shed; on Monday Gianni (M-7) books it for Thursday (R8), Paolo (M-9) for 10 December (R9). */
const the_shed = async (start: Start = {}) => {
  const shed = await oracle(start)
  await first(shed.tools.add_a_tool(shed.at('2026-11-16T08:00:00-05:00'), drill))
  for (const [reservation_id, member_id, day] of [
    ['R8', 'M-7', '2026-11-19'],
    ['R9', 'M-9', '2026-12-10'],
  ] as const) {
    await first(
      shed.loans.reserve_a_tool(shed.at('2026-11-16T09:00:00-05:00'), {
        reservation_id,
        tool_id: 'drill',
        member_id,
        day,
      }),
    )
  }
  /** Luca sends the drill to the workshop: the stay it opens. */
  const to_the_workshop = async (at: string) => {
    const sent = await first(shed.tools.send_a_tool_to_repair(shed.at(at), { tool_id: 'drill' }))
    if (sent.outcome !== 'applied') throw new Error('the drill did not go to the workshop')
    return stay_of(sent.fact.parts[0].payload)
  }
  /** The facts after the shed was set up. */
  const since_the_repair = async () => (await shed.recorded()).slice(3)
  return { shed, to_the_workshop, since_the_repair }
}

describe('SC-41, the round of the notices of a repair', () => {
  test('one notice per member who booked, one step each, then the round closes; the reservations stay', async () => {
    const { shed, to_the_workshop, since_the_repair } = await the_shed()
    const consumers = shed.processes({ at: tuesday })
    const rp1 = await to_the_workshop(tuesday)
    await quiet()
    await consumers.stop()
    const facts = await since_the_repair()
    expect(paths(facts)).toEqual([
      ['a_tool_has_been_sent_to_repair'],
      ['a_repair_notice_round_has_begun'],
      ['the_repair_notice_round_has_advanced', 'a_member_has_been_notified_of_the_repair'],
      ['the_repair_notice_round_has_advanced', 'a_member_has_been_notified_of_the_repair'],
      ['the_repair_notice_round_has_ended'],
    ])
    // The step's part names the round, and touches no reservation; the
    // notice touches its reservation alone (SC-55).
    expect(facts[2]?.parts).toMatchObject([
      {
        payload: { repair_id: rp1 },
        resources: [{ path: 'business/tools/id/repair_id', value: rp1 }],
      },
      {
        payload: { reservation_id: 'R8', repair_id: rp1 },
        resources: [{ path: 'business/loans/id/reservation_id', value: 'R8' }],
      },
    ])
    expect(facts[3]?.parts[1]?.payload).toEqual({ reservation_id: 'R9', repair_id: rp1 })
    // The notices queued with the steps, keyed by the stay and the
    // reservation, each of the repair's chain.
    const queued = shed.queued(notice)
    expect(queued.map((entry) => entry.payload)).toEqual([
      { reservation_id: 'R8', member_id: 'M-7', tool_id: 'drill', day: '2026-11-19' },
      { reservation_id: 'R9', member_id: 'M-9', tool_id: 'drill', day: '2026-12-10' },
    ])
    expect(new Set(queued.map((entry) => entry.id)).size).toBe(2)
    expect(new Set(queued.map((entry) => entry.correlation))).toEqual(
      new Set([facts[0]?.correlation]),
    )
    // The executor delivers them: Gianni and Paolo read that the drill is in
    // repair.
    const executor = shed.executor({
      at: tuesday,
      phones: { 'M-7': '+1-555-0107', 'M-9': '+1-555-0109' },
    })
    await shed.pass(tuesday)
    await executor.stop()
    expect(shed.received()).toMatchObject([
      { message: 'repair_notice', phone: '+1-555-0107', day: '2026-11-19' },
      { message: 'repair_notice', phone: '+1-555-0109', day: '2026-12-10' },
    ])
    // The reservations stay.
    const gianni = await first(
      shed.loans.the_reservations_of_a_member(shed.when(tuesday), { member_id: 'M-7' }),
    )
    expect(gianni).toMatchObject({ event: 'snapshot', entries: [{ id: 'R8' }] })
  })

  test('the drill in the workshop again the next Tuesday (RP2): a second round, Paolo notified again under another key', async () => {
    const { shed, to_the_workshop, since_the_repair } = await the_shed()
    const consumers = shed.processes({ at: tuesday })
    const rp1 = await to_the_workshop(tuesday)
    await quiet()
    await first(
      shed.tools.put_a_repaired_tool_back_in_service(shed.at('2026-11-20T09:00:00-05:00'), {
        tool_id: 'drill',
      }),
    )
    await shed.pass('2026-11-24T09:00:00-05:00')
    const rp2 = await to_the_workshop('2026-11-24T09:00:00-05:00')
    await quiet()
    await consumers.stop()
    expect(rp2).not.toBe(rp1)
    expect(paths((await since_the_repair()).slice(5))).toEqual([
      ['a_tool_has_been_repaired'],
      ['a_tool_has_been_sent_to_repair'],
      ['a_repair_notice_round_has_begun'],
      ['the_repair_notice_round_has_advanced', 'a_member_has_been_notified_of_the_repair'],
      ['the_repair_notice_round_has_ended'],
    ])
    const queued = shed.queued(notice)
    expect(queued.map((entry) => reservation_of(entry.payload))).toEqual(['R8', 'R9', 'R9'])
    expect(new Set(queued.map((entry) => entry.id)).size).toBe(3)
  })

  test('the drill retired beyond repair after the first step: the sheet cancels R9, and Paolo gets no notice', async () => {
    const { shed, to_the_workshop, since_the_repair } = await the_shed()
    const rp1 = await to_the_workshop(tuesday)
    await first(
      shed.loans.notify_the_members_of_a_repair(shed.at(tuesday), {
        repair_id: rp1,
        tool_id: 'drill',
      }),
    )
    const round = () =>
      first(shed.loans.continue_the_repair_notice_round(shed.at(tuesday), { repair_id: rp1 }))
    expect(await round()).toMatchObject({ outcome: 'applied', branch: 'advances' })
    const wednesday = '2026-11-18T09:00:00-05:00'
    await first(shed.tools.retire_a_tool(shed.at(wednesday), { id: 'drill', reason: 'broken' }))
    await first(
      shed.loans.cancel_the_reservations_of_a_tool(shed.at(wednesday), { tool_id: 'drill' }),
    )
    const cancellation = () =>
      first(
        shed.loans.continue_the_cancellation_of_reservations(shed.at(wednesday), {
          tool_id: 'drill',
        }),
      )
    expect(await cancellation()).toMatchObject({ branch: 'advances' })
    expect(await cancellation()).toMatchObject({ branch: 'advances' })
    expect(await cancellation()).toMatchObject({ branch: 'completes' })
    expect(await round()).toMatchObject({ outcome: 'applied', branch: 'completes' })
    expect(shed.queued(notice).map((entry) => reservation_of(entry.payload))).toEqual(['R8'])
    expect(paths((await since_the_repair()).slice(-2))).toEqual([
      ['the_cancellation_of_the_reservations_of_a_tool_has_ended'],
      ['the_repair_notice_round_has_ended'],
    ])
  })

  test('every fact delivered twice, and the consumers fallen and started again: one notice per member (TST-4)', async () => {
    const { shed, to_the_workshop, since_the_repair } = await the_shed({ redelivered: true })
    const falling = shed.processes({ at: tuesday, saves_its_position: false })
    await to_the_workshop(tuesday)
    await quiet()
    await falling.stop()
    const again = shed.processes({ at: tuesday })
    await quiet()
    await again.stop()
    expect(paths(await since_the_repair())).toHaveLength(5)
    expect(shed.queued(notice).map((entry) => reservation_of(entry.payload))).toEqual(['R8', 'R9'])
  })
})
