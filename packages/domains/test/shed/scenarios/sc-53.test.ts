import { describe, expect, test } from 'vitest'
import type * as zz from '../../../src/library/index.ts'
import { first, oracle, quiet, type Start } from './oracle.ts'
import { drill, ladder } from './shed.ts'

// SC-53: the executor's hold (DOM-14, D108, D67.3; Shed's step 11). The
// executor keeps the order per resource within each effect: a dead letter
// holds its entry's resources for its effect, those of the part that queued
// it (since SC-55 the notice's reservation alone), and a later entry of the
// effect that touches one of them waits behind it, holding its own in turn;
// another effect is never held. On Tuesday the drill goes to the workshop
// (RP1), and the desk's round notifies Gianni (R8, booked for Thursday the
// 26th) and Paolo (R9, booked three weeks on). Gianni's carrier refuses his
// notice: tried again, then exhausted, a dead letter holding R8; Paolo's
// goes. On Saturday the drill goes again (RP2): Gianni's notice of RP2
// waits behind his of RP1, Paolo's goes, and Gianni's reminder of the
// ladder, another effect, goes. On Monday the operator redelivers Gianni's
// letter: he reads the notice of RP1, then that of RP2, never the second
// stay before the first. In Shed only the step of the round records the
// notice (part 7.4): the harness enters it alone (`alone`, SC-55).

const the_notice = 'business/loans/effect/send_the_repair_notice'
const the_eve = 'business/loans/effect/wait_until_the_eve_of_the_due_date'
const phones = { 'M-7': '+1 416 555 0107', 'M-9': '+1 416 555 0109', 'M-12': '+1 416 555 0112' }

/** A booking of the drill, as the round's notice names it. */
interface Booking {
  readonly reservation_id: string
  readonly member_id: string
  readonly day: string
}

const gianni: Booking = { reservation_id: 'R8', member_id: 'M-7', day: '2026-11-26' }
const paolo: Booking = { reservation_id: 'R9', member_id: 'M-9', day: '2026-12-10' }

/** The key of a notice, the stay in repair and the reservation (`dsl`), as the network sees it. */
const key_of = (repair_id: string, booking: Booking): string =>
  `${the_notice}/${JSON.stringify([repair_id, booking.reservation_id])}`

/**
 * The drill and the ladder in the shed on 2 November; Gianni borrows the
 * ladder on Sunday 8 November (L5, due on the 22nd: its eve, the 21st); on
 * Monday 16 he books the drill for Thursday the 26th (R8), Paolo for
 * 10 December (R9).
 */
const the_shed = async (start: Start = {}) => {
  const shed = await oracle(start)
  for (const tool of [drill, ladder]) {
    await first(shed.tools.add_a_tool(shed.at('2026-11-02T13:00:00.000Z'), tool))
  }
  await first(
    shed.loans.borrow_a_tool(shed.at('2026-11-08T15:00:00.000Z', { scope: 'member/M-7' }), {
      loan_id: 'L5',
      tool_id: 'ladder',
      member_id: 'M-7',
    }),
  )
  for (const booking of [gianni, paolo]) {
    await first(
      shed.loans.reserve_a_tool(
        shed.at('2026-11-16T17:00:00.000Z', { scope: `member/${booking.member_id}` }),
        { ...booking, tool_id: 'drill' },
      ),
    )
  }
  /** The round notifies a member of a stay in repair, at an instant (the step's composed transition, entered alone). */
  const notify = async (instant: string, repair_id: string, booking: Booking) =>
    first(
      shed.alone.notify_a_member_of_the_repair(shed.at(instant, { scope: 'reaction/repair' }), {
        ...booking,
        repair_id,
        tool_id: 'drill',
      }),
    )
  return { shed, notify }
}

/** The letter an effect holds first, as an operator picks it from the dead letters shown. */
const the_letter = (held: readonly zz.HeldEntry[]): zz.EffectDeadLetter => {
  const letter = held.find((each) => each.held === 'dead_letter')
  if (letter?.held !== 'dead_letter') throw new Error('no dead letter is held')
  return letter
}

/**
 * Up to Saturday 21 November: on Tuesday Gianni's notice of RP1 is tried,
 * the network down, then again a minute on, and given up; Paolo's goes. On
 * Saturday the ladder's eve, then the notices of RP2.
 */
const up_to_saturday = async (start: Start = {}) => {
  const { shed, notify } = await the_shed(start)
  const executor = shed.executor({ at: '2026-11-17T13:00:00.000Z', phones })
  shed.network('is_down', 'gives_up')
  await notify('2026-11-17T14:00:00.000Z', 'RP1', gianni)
  await notify('2026-11-17T14:00:00.000Z', 'RP1', paolo)
  await quiet()
  await shed.pass('2026-11-17T14:01:00.000Z')
  await shed.pass('2026-11-21T05:00:00.000Z')
  await notify('2026-11-21T15:00:00.000Z', 'RP2', gianni)
  await notify('2026-11-21T15:00:00.000Z', 'RP2', paolo)
  await shed.pass('2026-11-21T15:00:00.000Z')
  return { shed, executor, notify }
}

describe("SC-53: the executor's hold, an entry's resources", () => {
  test('Gianni’s dead notice holds R8 alone: Paolo’s go, his reminder of the ladder goes, his second waits', async () => {
    const { shed } = await up_to_saturday()
    expect(shed.held(the_notice)).toMatchObject([
      {
        held: 'dead_letter',
        cause: { cause: 'exhausted', reason: 'the network gave up' },
        entry: {
          effect: the_notice,
          id: JSON.stringify(['RP1', 'R8']),
          resources: [{ path: 'business/loans/id/reservation_id', value: 'R8' }],
        },
      },
      {
        held: 'waiting',
        entry: {
          id: JSON.stringify(['RP2', 'R8']),
          resources: [{ path: 'business/loans/id/reservation_id', value: 'R8' }],
        },
      },
    ])
    expect(shed.received().map((message) => message.key)).toEqual([
      key_of('RP1', paolo),
      'business/loans/effect/send_the_due_date_reminder/L5',
      key_of('RP2', paolo),
    ])
  })

  test('on Monday the operator redelivers Gianni’s letter: RP1, then RP2, in the order of the outbox', async () => {
    const { shed, executor } = await up_to_saturday()
    await shed.pass('2026-11-23T14:00:00.000Z')
    const letter = the_letter(shed.held(the_notice))
    expect(await executor.redeliver(letter)).toEqual({ outcome: 'delivered' })
    await quiet()
    expect(shed.held(the_notice)).toEqual([])
    expect(shed.received().map((message) => message.key)).toEqual([
      key_of('RP1', paolo),
      'business/loans/effect/send_the_due_date_reminder/L5',
      key_of('RP2', paolo),
      key_of('RP1', gianni),
      key_of('RP2', gianni),
    ])
    // A letter no longer held: redelivered before.
    expect(await executor.redeliver(letter)).toEqual({ outcome: 'not_held' })
  })

  test('had the operator discarded the letter, the stay over, his notice of RP2 goes on as after a delivery', async () => {
    const { shed, executor } = await up_to_saturday()
    await shed.pass('2026-11-23T14:00:00.000Z')
    const letter = the_letter(shed.held(the_notice))
    await executor.discard(letter)({ by: 'keeper/luca', reason: 'the first stay is over' })
    await quiet()
    expect(shed.held(the_notice)).toEqual([])
    expect(shed.discarded()).toMatchObject([
      {
        letter: { entry: { id: JSON.stringify(['RP1', 'R8']) } },
        by: 'keeper/luca',
        reason: 'the first stay is over',
        at: '2026-11-23T14:00:00.000Z',
      },
    ])
    expect(
      shed
        .received()
        .map((message) => message.key)
        .slice(3),
    ).toEqual([key_of('RP2', gianni)])
    expect(await executor.redeliver(letter)).toEqual({ outcome: 'not_held' })
  })

  test('redelivered and refused again, the letter holds still, with what was said this time', async () => {
    const { shed, executor } = await up_to_saturday()
    shed.network('gives_up')
    const again = await executor.redeliver(the_letter(shed.held(the_notice)))
    expect(again).toMatchObject({
      outcome: 'dead_letter',
      letter: { held: 'dead_letter', cause: { cause: 'exhausted', reason: 'the network gave up' } },
    })
    await quiet()
    expect(shed.held(the_notice).map((each) => each.held)).toEqual(['dead_letter', 'waiting'])
    expect(shed.received()).toHaveLength(3)
  })

  test('the executor falls and is started again: what it holds is held once, and the letter redelivered there', async () => {
    const { shed, executor } = await up_to_saturday()
    await executor.stop()
    const again = shed.executor({
      at: '2026-11-23T14:00:00.000Z',
      phones,
      saves_its_position: false,
    })
    await shed.pass('2026-11-23T14:00:00.000Z')
    expect(shed.held(the_notice).map((each) => each.held)).toEqual(['dead_letter', 'waiting'])
    expect(
      shed.received().filter((message) => message.key.startsWith(`${the_notice}/["RP1","R8"]`)),
    ).toEqual([])
    expect(await again.redeliver(the_letter(shed.held(the_notice)))).toEqual({
      outcome: 'delivered',
    })
    await quiet()
    expect(
      shed
        .received()
        .map((message) => message.key)
        .slice(-2),
    ).toEqual([key_of('RP1', gianni), key_of('RP2', gianni)])
  })

  test('the executor falls once the letter is redelivered, before the entry behind it: started again, it goes', async () => {
    const { shed, executor } = await up_to_saturday()
    shed.network('delivers', 'falls')
    expect(await executor.redeliver(the_letter(shed.held(the_notice)))).toEqual({
      outcome: 'delivered',
    })
    await quiet()
    await expect(executor.stop()).rejects.toThrow(`the delivery of ${the_notice} fell`)
    expect(shed.held(the_notice)).toMatchObject([
      { held: 'waiting', entry: { id: JSON.stringify(['RP2', 'R8']) } },
    ])
    shed.executor({ at: '2026-11-23T15:00:00.000Z', phones })
    await shed.pass('2026-11-23T15:00:00.000Z')
    expect(shed.held(the_notice)).toEqual([])
    expect(
      shed
        .received()
        .map((message) => message.key)
        .slice(-2),
    ).toEqual([key_of('RP1', gianni), key_of('RP2', gianni)])
  })

  test('every entry given twice: each held once, and the notices delivered at least once', async () => {
    const { shed } = await up_to_saturday({ redelivered: true })
    expect(shed.held(the_notice).map((each) => [each.held, each.entry.id])).toEqual([
      ['dead_letter', JSON.stringify(['RP1', 'R8'])],
      ['waiting', JSON.stringify(['RP2', 'R8'])],
    ])
    expect(shed.received().filter((message) => message.key === key_of('RP1', gianni))).toEqual([])
  })

  test('a stopped executor serves no operator', async () => {
    const { shed, executor } = await up_to_saturday()
    await executor.stop()
    await expect(executor.redeliver(the_letter(shed.held(the_notice)))).rejects.toThrow(
      'the effect executor is stopped',
    )
  })
})

describe('SC-53: a wait is never exhausted, but its return may refuse it, held the same way', () => {
  /**
   * Marta borrows the drill on 2 November (L7, due on the 16th) and the
   * ladder on the 3rd (L8, due on the 17th); before the eve, a reminder of
   * L7 is recorded under the eve's operation with another due day, so that
   * the eve's return meets it: `identity_already_used`, the first outcome
   * stands (D108.4).
   */
  const marta_s_eves = async () => {
    const shed = await oracle()
    for (const tool of [drill, ladder]) {
      await first(shed.tools.add_a_tool(shed.at('2026-11-02T13:00:00.000Z'), tool))
    }
    await first(
      shed.loans.borrow_a_tool(
        shed.at('2026-11-02T15:00:00.000Z', { scope: 'member/M-12', operation: 'B1' }),
        { loan_id: 'L7', tool_id: 'drill', member_id: 'M-12' },
      ),
    )
    await first(
      shed.loans.borrow_a_tool(
        shed.at('2026-11-03T15:00:00.000Z', { scope: 'member/M-12', operation: 'B2' }),
        { loan_id: 'L8', tool_id: 'ladder', member_id: 'M-12' },
      ),
    )
    expect(
      await first(
        shed.loans.remind_the_member_of_the_due_date(
          shed.at('2026-11-10T14:00:00.000Z', { scope: the_eve, operation: 'L7' }),
          { loan_id: 'L7', tool_id: 'drill', member_id: 'M-12', due_day: '2026-11-17' },
        ),
      ),
    ).toMatchObject({ outcome: 'applied' })
    return shed
  }

  test('the eve of L7 refused, a dead letter holding the part’s resources: the eve of L8, Marta’s too, waits', async () => {
    const shed = await marta_s_eves()
    const executor = shed.executor({ at: '2026-11-10T14:00:00.000Z', phones })
    await shed.pass('2026-11-16T05:00:00.000Z')
    expect(shed.held(the_eve)).toMatchObject([
      {
        held: 'dead_letter',
        cause: {
          cause: 'identity_already_used',
          returns: { loan_id: 'L7', due_day: '2026-11-16' },
        },
        entry: {
          id: 'L7',
          resources: [
            { path: 'business/loans/id/loan_id', value: 'L7' },
            { path: 'business/tools/id/tool_id', value: 'drill' },
            { path: 'business/loans/id/member_id', value: 'M-12' },
          ],
        },
      },
      { held: 'waiting', entry: { id: 'L8' } },
    ])
    // Redelivered, the return runs again with what was said, never the effect: the first outcome stands.
    expect(await executor.redeliver(the_letter(shed.held(the_eve)))).toMatchObject({
      outcome: 'dead_letter',
      letter: { cause: { cause: 'identity_already_used' } },
    })
    await executor.discard(the_letter(shed.held(the_eve)))({
      by: 'keeper/luca',
      reason: 'reminded already',
    })
    await quiet()
    expect(shed.held(the_eve)).toEqual([])
    expect(shed.received()).toMatchObject([
      { message: 'due_date_reminder', key: 'business/loans/effect/send_the_due_date_reminder/L8' },
    ])
  })
})
