import { describe, expect, test } from 'vitest'
import * as zz from '../../../src/library/index.ts'
import {
  accounts,
  first,
  followed,
  oracle,
  pull,
  told,
  until_caught_up,
  view,
  type Start,
  type Who,
} from './oracle.ts'

// SC-15, the business's side (part 5.2): Marta's live "my loans", the read
// use case as a stream (DOM-2, DOM-17): the snapshot at P, then the events
// from P, no gap and no double; a resume from a position, inclusive; a
// position the store keeps no longer, `position_unavailable`, terminal; a
// fact delivered twice (TST-4). On the oracle's native stream, the
// reference, and on the stream the library composes over its log (D69.3):
// the snapshot at P with the events from P rebuilds the snapshot at the end.
// `entered` comes in SC-20, `changed` in SC-19. Marta's leaf, `my_loans`,
// is part 6.3.

const strategies = ['native', 'composed'] as const

const p = (at: number) => zz.position.parse(String(at))

/**
 * The shed on 2 November: the drill, the ladder and the sander added
 * (positions 1 to 3); then, while Marta's "my loans" is open, she borrows
 * the drill (L7, 4), Gianni the sander (L9, 5), she the ladder (L8, 6),
 * and brings the ladder back (7).
 */
const the_shed = async (start: Start) => {
  const shed = await oracle(start)
  for (const [id, name, category] of [
    ['drill', 'Cordless drill', 'power'],
    ['ladder', 'Ladder', 'ladder'],
    ['sander', 'Orbital sander', 'power'],
  ] as const) {
    await first(shed.tools.add_a_tool(shed.at('2026-11-02T13:00:00.000Z'), { id, name, category }))
  }
  const lent = (instant: string, loan_id: string, tool_id: string, member_id: string) =>
    first(shed.loans.borrow_a_tool(shed.at(instant), { loan_id, tool_id, member_id }))
  const morning = async () => {
    await lent('2026-11-02T15:00:00.000Z', 'L7', 'drill', 'M-12')
    await lent('2026-11-02T15:05:00.000Z', 'L9', 'sander', 'M-7')
    await lent('2026-11-02T15:10:00.000Z', 'L8', 'ladder', 'M-12')
    await first(
      shed.loans.return_a_tool(shed.at('2026-11-02T23:00:00.000Z'), {
        loan_id: 'L8',
        tool_id: 'ladder',
        condition: 'good',
      }),
    )
  }
  const my_loans = (from?: zz.position) =>
    shed.loans
      .the_ongoing_loans_of_a_member(
        shed.when('2026-11-02T14:00:00.000Z'),
        { member_id: 'M-12' },
        from,
      )
      [Symbol.asyncIterator]()
  return { shed, lent, morning, my_loans }
}

describe('SC-15: Marta follows her loans live', () => {
  test('native: the snapshot at P, then each fact from P, Gianni’s loan none of hers; caught up; then live', async () => {
    const { lent, morning, my_loans } = await the_shed({})
    const live = my_loans()
    expect(await pull(live, 1)).toEqual([
      { event: 'snapshot', entries: [], position: '3', total: 0 },
    ])
    await morning()
    const events = await until_caught_up(live)
    expect(
      events.map((event) => [event.event, 'position' in event ? event.position : undefined]),
    ).toEqual([
      ['fact', '4'],
      ['fact', '6'],
      ['left', '7'],
      ['caught_up', '7'],
    ])
    expect(events[0]).toMatchObject({
      identity: 'L7',
      entry: { id: 'L7', tool_id: 'drill', tool_name: 'Cordless drill', term: 'running' },
      fact: {
        parts: [{ path: 'business/loans/fact/a_tool_has_been_lent' }],
        operation: { id: 'op-4' },
      },
    })
    expect(events[2]).toEqual({ event: 'left', position: '7', identity: 'L8' })
    // Live: the next fact as it is recorded.
    const next = live.next()
    await lent('2026-11-03T00:00:00.000Z', 'L10', 'ladder', 'M-12')
    expect((await next).value).toMatchObject({ event: 'fact', position: '8', identity: 'L10' })
  })

  describe.each(strategies)('%s', (streams) => {
    test('the snapshot at P with the events from P is the snapshot at the end (D69.3)', async () => {
      const { morning, my_loans } = await the_shed({ streams })
      const live = my_loans()
      const snapshot = await pull(live, 1)
      await morning()
      const events = await until_caught_up(live)
      expect(events.at(-1)).toEqual({ event: 'caught_up', position: '7' })
      const at_the_end = await pull(my_loans(), 1)
      expect(view('id')([...snapshot, ...events])).toEqual(view('id')(at_the_end))
      expect([...view('id')(at_the_end).keys()]).toEqual(['L7'])
    })

    test('a fact delivered twice changes nothing the consumer holds (TST-4)', async () => {
      const { morning, my_loans } = await the_shed({ streams, redelivered: true })
      const live = my_loans()
      const snapshot = await pull(live, 1)
      await morning()
      const events = await until_caught_up(live)
      expect(view('id')([...snapshot, ...events])).toEqual(view('id')(await pull(my_loans(), 1)))
    })

    test('live: the fact recorded while the consumer waits', async () => {
      const { lent, my_loans } = await the_shed({ streams })
      const live = my_loans()
      expect(await pull(live, 2)).toEqual([
        { event: 'snapshot', entries: [], position: '3', total: 0 },
        { event: 'caught_up', position: '3' },
      ])
      const next = live.next()
      await lent('2026-11-02T15:00:00.000Z', 'L7', 'drill', 'M-12')
      expect((await next).value).toMatchObject({ event: 'fact', position: '4', identity: 'L7' })
    })
  })

  test('native: a resume from a position is the stream alone, from it, inclusive', async () => {
    const { morning, my_loans } = await the_shed({})
    await morning()
    const resumed = await until_caught_up(my_loans(p(6)))
    expect(resumed.map((event) => event.event)).toEqual(['fact', 'left', 'caught_up'])
    expect(resumed[0]).toMatchObject({ position: '6', identity: 'L8' })
  })

  test('native: a position the store keeps no longer is position_unavailable, terminal; read again, then stream (TST-4)', async () => {
    const { shed, morning, my_loans } = await the_shed({})
    await morning()
    shed.forget(p(5))
    const gone = my_loans(p(4))
    expect(await pull(gone, 1)).toEqual([{ event: 'position_unavailable' }])
    expect((await gone.next()).done).toBe(true)
    // From a position still kept, the stream goes on.
    expect(await until_caught_up(my_loans(p(5)))).toMatchObject([
      { event: 'fact', position: '6' },
      { event: 'left', position: '7' },
      { event: 'caught_up', position: '7' },
    ])
    // Read again: the snapshot, then the stream from its position.
    expect(await pull(my_loans(), 2)).toMatchObject([
      { event: 'snapshot', position: '7', total: 1 },
      { event: 'caught_up', position: '7' },
    ])
  })

  test('composed: a resume is position_unavailable, terminal: the state before a position is gone; read again', async () => {
    const { morning, my_loans } = await the_shed({ streams: 'composed' })
    await morning()
    const resumed = my_loans(p(6))
    expect(await pull(resumed, 1)).toEqual([{ event: 'position_unavailable' }])
    expect((await resumed.next()).done).toBe(true)
    expect(await pull(my_loans(), 2)).toMatchObject([
      { event: 'snapshot', position: '7', total: 1 },
      { event: 'caught_up', position: '7' },
    ])
  })

  test('an input not in its schema reads nothing, from a position too', async () => {
    const { shed } = await the_shed({})
    const not_a_member = { member_id: '' }
    for (const from of [undefined, p(1)]) {
      const events = shed.loans.the_ongoing_loans_of_a_member(
        shed.when('2026-11-02T14:00:00.000Z'),
        not_a_member,
        from,
      )
      expect(await pull(events[Symbol.asyncIterator](), 1)).toEqual([
        { event: 'invalid_request', reason: 'input_not_in_schema' },
      ])
    }
  })
})

/** Marta (M-12) and Gianni (M-7), members; the drill and the ladder in the shed; Marta borrows the drill on 2 November (L7, due the 16th). */
const the_members_shed = async (valid_until = '2027-03-31') => {
  const shed = await oracle({
    accounts: accounts({
      hats: { 'A-MARTA': ['member'], 'A-GIANNI': ['member'] },
      member_cards: {
        'A-MARTA': { id: 'M-12', valid_until },
        'A-GIANNI': { id: 'M-7', valid_until: '2027-03-31' },
      },
    }),
  })
  for (const [id, name, category] of [
    ['drill', 'Cordless drill', 'power'],
    ['ladder', 'Ladder', 'ladder'],
  ] as const) {
    await first(shed.tools.add_a_tool(shed.at('2026-11-01T14:00:00.000Z'), { id, name, category }))
  }
  await first(
    shed.loans.borrow_a_tool(shed.at('2026-11-02T15:00:00.000Z'), {
      loan_id: 'L7',
      tool_id: 'drill',
      member_id: 'M-12',
    }),
  )
  return shed
}

const marta_s: Who = { identified_by: 'account', id: 'A-MARTA' }

describe("SC-15, the persona's side (part 6.3)", () => {
  test('Marta\'s "my loans" live: a loan appears as `fact`, a return takes one away as `left`; a resume is the stream alone, inclusive', async () => {
    const shed = await the_members_shed()
    const her = shed.as(marta_s, '2.0.0').when('2026-11-03T14:00:00.000Z')
    const { snapshot, events } = await followed(
      () => shed.member.my_loans(her, {})[Symbol.asyncIterator](),
      async () => {
        await first(
          shed.loans.borrow_a_tool(shed.at('2026-11-03T15:00:00.000Z'), {
            loan_id: 'L8',
            tool_id: 'ladder',
            member_id: 'M-12',
          }),
        )
        await first(
          shed.loans.return_a_tool(shed.at('2026-11-03T16:00:00.000Z'), {
            loan_id: 'L7',
            tool_id: 'drill',
            condition: 'good',
          }),
        )
      },
    )
    expect(snapshot).toMatchObject([
      { event: 'snapshot', position: '3', entries: [{ loan_id: 'L7' }] },
    ])
    expect(told(events)).toEqual([
      ['fact', '4'],
      ['left', '5'],
      ['caught_up', '5'],
    ])
    expect(events[0]).toMatchObject({
      identity: 'L8',
      entry: { loan_id: 'L8', tool_name: 'Ladder' },
    })
    expect(events[1]).toEqual({ event: 'left', position: '5', identity: 'L7' })
    const resumed = await until_caught_up(
      shed.member.my_loans(her, {}, zz.position.parse('4'))[Symbol.asyncIterator](),
    )
    expect(told(resumed)).toEqual([
      ['fact', '4'],
      ['left', '5'],
      ['caught_up', '5'],
    ])
    expect(view('loan_id')([...snapshot, ...events])).toEqual(
      view('loan_id')(await pull(shed.member.my_loans(her, {})[Symbol.asyncIterator](), 1)),
    )
  })
})
