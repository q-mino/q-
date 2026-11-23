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
      shed.at('2026-11-12T17:00:00.000Z', { scope: 'member/M-12', operation: 'W1' }),
      { member_id: 'M-12' },
    ),
  )
  const executor = shed.executor({ at: '2026-11-12T17:00:00.000Z', phones })
  shed.network('gives_up')
  await shed.pass('2026-11-16T05:00:00.000Z')
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
    await shed.pass('2026-11-23T05:00:00.000Z')
    expect(shed.held(the_summary)).toMatchObject([
      { held: 'dead_letter', entry: { payload: { monday: '2026-11-16' } } },
    ])
    expect(shed.received()).toMatchObject([{ message: 'weeks_summary', monday: '2026-11-23' }])
  })

  test('the letter stays for the operator: redelivered, the 16th’s summary arrives after the 23rd’s', async () => {
    const { shed, executor } = await marta_s_weeks()
    await shed.pass('2026-11-23T05:00:00.000Z')
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
    shed.executor({ at: '2026-11-23T05:00:00.000Z', phones, saves_its_position: false })
    await shed.pass('2026-11-23T05:00:00.000Z')
    expect(shed.held(the_summary).map((each) => [each.held, each.entry.payload])).toEqual([
      ['dead_letter', { member_id: 'M-12', monday: '2026-11-16' }],
    ])
    expect(new Set(mondays(shed.received()))).toEqual(new Set(['2026-11-23']))
  })
})
