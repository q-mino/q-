import { describe, expect, test } from 'vitest'
import type * as zz from '../../../src/library/index.ts'
import { first, oracle, quiet, type Message, type Start } from './oracle.ts'

// SC-56: an effect that tolerates reordering (DOM-14, D67.3; Shed's step
// 11). An effect declares its order: `per_resource` the default, `any` an
// effect whose entries may reach the world in any order, whose dead letters
// hold nothing. The week's summary declares it: each summary names its
// Monday, and the phone reads the loans and the reservations live. Marta's
// carrier refuses her messages for a week: her summary of Monday 16
// November is exhausted, a dead letter, shown for the operator; on Monday
// 23 her next summary, which touches her too, goes. With the order per
// resource it would wait behind the letter until an operator acts.

const the_summary = 'business/loans/effect/send_the_weeks_summary'
const phones = { 'M-12': '+1 416 555 0112' }

/** On Thursday 12 November Marta asks for her week; the executor runs from then, and her carrier gives up on the 16th's summary. */
const marta_s_weeks = async (start: Start = {}) => {
  const shed = await oracle(start)
  await first(
    shed.loans.begin_a_weekly_summary(
      shed.at('2026-11-12T12:00:00-05:00', { scope: 'member/M-12', operation: 'W1' }),
      { member_id: 'M-12' },
    ),
  )
  const executor = shed.executor({ at: '2026-11-12T12:00:00-05:00', phones })
  shed.network('gives_up')
  await shed.pass('2026-11-16T00:00:00-05:00')
  return { shed, executor }
}

/** The Monday of each summary a phone received, in order. */
const mondays = (received: readonly Message[]): readonly string[] =>
  received.flatMap((message) => (message.message === 'weeks_summary' ? [message.monday] : []))

/** The letter shown for an effect. */
const the_letter = (held: readonly zz.HeldEntry[]): zz.EffectDeadLetter => {
  const letter = held.find((each) => each.held === 'dead_letter')
  if (letter?.held !== 'dead_letter') throw new Error('no dead letter is held')
  return letter
}

describe('SC-56: an effect that tolerates reordering', () => {
  test('the summary of the 16th in a dead letter, Marta’s too: the 23rd’s goes past it', async () => {
    const { shed } = await marta_s_weeks()
    expect(shed.held(the_summary)).toMatchObject([
      {
        held: 'dead_letter',
        cause: { cause: 'exhausted', reason: 'the network gave up' },
        entry: {
          payload: { member_id: 'M-12', monday: '2026-11-16' },
          resources: [{ path: 'business/loans/id/member_id', value: 'M-12' }],
        },
      },
    ])
    expect(shed.received()).toEqual([])
    await shed.pass('2026-11-23T00:00:00-05:00')
    expect(shed.held(the_summary)).toMatchObject([
      { held: 'dead_letter', entry: { payload: { monday: '2026-11-16' } } },
    ])
    expect(shed.received()).toMatchObject([{ message: 'weeks_summary', monday: '2026-11-23' }])
  })

  test('the letter stays for the operator: redelivered, the 16th’s summary arrives after the 23rd’s', async () => {
    const { shed, executor } = await marta_s_weeks()
    await shed.pass('2026-11-23T00:00:00-05:00')
    expect(await executor.redeliver(the_letter(shed.held(the_summary)))).toEqual({
      outcome: 'delivered',
    })
    await quiet()
    expect(shed.held(the_summary)).toEqual([])
    expect(mondays(shed.received())).toEqual(['2026-11-23', '2026-11-16'])
  })

  test('every entry given twice, and a fall: the letter is held once, nothing waits behind it', async () => {
    const { shed, executor } = await marta_s_weeks({ redelivered: true })
    await executor.stop()
    shed.executor({ at: '2026-11-23T00:00:00-05:00', phones, saves_its_position: false })
    await shed.pass('2026-11-23T00:00:00-05:00')
    expect(shed.held(the_summary).map((each) => [each.held, each.entry.payload])).toEqual([
      ['dead_letter', { member_id: 'M-12', monday: '2026-11-16' }],
    ])
    expect(new Set(mondays(shed.received()))).toEqual(new Set(['2026-11-23']))
  })

  // The deliveries of an effect `any` are in flight together (F7, DOM-14;
  // A, 20 Nov 2026): one that waits for its world never holds the others.
  // The position stays behind the oldest in flight (C, 20 Nov 2026): after a
  // fall every entry handled above it is delivered again, at least once.
  // The library's test of the rule ping pong's requests meet (DOM-14, "The
  // position behind a delivery in flight"), on the summary, Shed's effect
  // `any`.

  /** On Thursday 12 November Marta and Gianni each ask for their week; on Monday 16 Marta's phone hangs, Gianni's receives. */
  const two_weeks_with_one_hanging = async () => {
    const shed = await oracle()
    for (const [member_id, operation] of [
      ['M-12', 'W1'],
      ['M-7', 'W2'],
    ] as const) {
      await first(
        shed.loans.begin_a_weekly_summary(
          shed.at('2026-11-12T12:00:00-05:00', { scope: `member/${member_id}`, operation }),
          { member_id },
        ),
      )
    }
    const both = { 'M-12': '+1 416 555 0112', 'M-7': '+1 416 555 0107' }
    const executor = shed.executor({ at: '2026-11-12T12:00:00-05:00', phones: both })
    shed.network('hangs')
    await shed.pass('2026-11-16T00:00:00-05:00')
    return { shed, executor, both }
  }

  const of_whom = (received: readonly Message[]): readonly string[] =>
    received.flatMap((message) =>
      message.message === 'weeks_summary' ? [`${message.phone} ${message.monday}`] : [],
    )

  test('in flight together: Marta’s summary hangs, Gianni’s goes past it and arrives', async () => {
    const { shed } = await two_weeks_with_one_hanging()
    expect(shed.hanging()).toBe(1)
    expect(of_whom(shed.received())).toEqual(['+1 416 555 0107 2026-11-16'])
    await shed.answer_the_hanging()
    expect(of_whom(shed.received())).toEqual([
      '+1 416 555 0107 2026-11-16',
      '+1 416 555 0112 2026-11-16',
    ])
    expect(shed.held(the_summary)).toEqual([])
  })

  test('a stop abandons the delivery in flight: the position behind it, both delivered again when started again, the late answer unread', async () => {
    const { shed, executor, both } = await two_weeks_with_one_hanging()
    await executor.stop()
    shed.executor({ at: '2026-11-16T00:05:00-05:00', phones: both })
    await shed.pass('2026-11-16T00:05:00-05:00')
    // At least once: Gianni's again, handled above the position; Marta's,
    // met again, now delivered.
    expect(of_whom(shed.received())).toEqual([
      '+1 416 555 0107 2026-11-16',
      '+1 416 555 0112 2026-11-16',
      '+1 416 555 0107 2026-11-16',
    ])
    // The abandoned delivery answers late: her phone receives once more (the
    // key lets the network drop it), and the executor reads nothing of it.
    await shed.answer_the_hanging()
    expect(of_whom(shed.received()).at(-1)).toBe('+1 416 555 0112 2026-11-16')
    expect(shed.held(the_summary)).toEqual([])
    await shed.pass('2026-11-23T00:00:00-05:00')
    expect(of_whom(shed.received()).slice(-2).toSorted()).toEqual([
      '+1 416 555 0107 2026-11-23',
      '+1 416 555 0112 2026-11-23',
    ])
  })
})
