import { describe, expect, test } from 'vitest'
import { first, followed, oracle, told, view, type Start } from './oracle.ts'

// SC-21, the business's side (part 5.1): Luca asks how many loans each tool
// had this month, a read that counts: a calculation beside the fields
// (DOM-18, D50.7). The query binds its parameters by part, the month of the
// read's `now` in the shed's zone; the adapter gives its fragment, one more
// field of the planned query, so the read and its order (the most lent
// first, then by name, closed by the tool's id, LIB-9) meet fields alone.
// The entry's identity is `tools`' (`tool_id`), whose path `tools`' registry
// gives (`identities`, GR-3). Luca's leaf, the snapshot alone, is part 6.1.
// Since part 5.2 its stream (DOM-17): a loan, a fact of `loans` that holds
// the tool's id, touches the tool's entry by that path (`fact`, the count
// after it); a tool added comes in at zero (`entered`), a rename is
// `changed`, a retirement `left`, facts of `tools`.

/** A tool as Luca adds it. */
interface Added {
  readonly id: string
  readonly name: string
  readonly category: 'garden' | 'power' | 'hand' | 'ladder'
}

const drill: Added = { id: 'drill', name: 'Cordless drill', category: 'power' }
const sander: Added = { id: 'sander', name: 'Orbital sander', category: 'power' }
const ladder: Added = { id: 'ladder', name: 'Ladder', category: 'ladder' }
const saw: Added = { id: 'saw', name: 'Hand saw', category: 'hand' }
const rake: Added = { id: 'rake', name: 'Rake', category: 'garden' }

/**
 * The shed's autumn: five tools added on 30 October. At 23:30 on 31
 * October Gianni borrows the drill (L1), back the next morning; on 2
 * November Marta's loan (L7) is written for the drill, though Luca hands
 * her the sander, and on the 4th he corrects it (SC-13); on the 5th she
 * borrows the rake (L10), back the next day; on the 10th Gianni borrows
 * the drill (L8); on the 12th Paolo the saw (L9), back damaged on the 13th,
 * in the workshop from the 14th; on the 20th the rake is retired.
 */
const the_shed = async (start: Start = {}) => {
  const shed = await oracle(start)
  for (const tool of [drill, sander, ladder, saw, rake]) {
    await first(shed.tools.add_a_tool(shed.at('2026-10-30T09:00:00-04:00'), tool))
  }
  const lent = async (instant: string, loan_id: string, tool_id: string, member_id: string) => {
    expect(
      await first(shed.loans.borrow_a_tool(shed.at(instant), { loan_id, tool_id, member_id })),
    ).toMatchObject({ outcome: 'applied', branch: 'the_tool_is_available_so_it_is_lent' })
  }
  const back = async (
    instant: string,
    loan_id: string,
    tool_id: string,
    condition: 'good' | 'damaged',
  ) => {
    expect(
      await first(shed.loans.return_a_tool(shed.at(instant), { loan_id, tool_id, condition })),
    ).toMatchObject({ outcome: 'applied', branch: 'the_loan_is_ongoing_so_it_is_closed' })
  }
  await lent('2026-10-31T23:30:00-04:00', 'L1', 'drill', 'M-7')
  await back('2026-11-01T10:00:00-05:00', 'L1', 'drill', 'good')
  await lent('2026-11-02T10:00:00-05:00', 'L7', 'drill', 'M-12')
  expect(
    await first(
      shed.loans.correct_the_tool_of_a_loan(shed.at('2026-11-04T10:00:00-05:00'), {
        loan_id: 'L7',
        tool_written: 'drill',
        tool_handed: 'sander',
        member_id: 'M-12',
        due_day: '2026-11-16',
      }),
    ),
  ).toMatchObject({ outcome: 'applied', branch: 'the_card_named_another_tool_so_it_is_corrected' })
  await lent('2026-11-05T10:00:00-05:00', 'L10', 'rake', 'M-12')
  await back('2026-11-06T10:00:00-05:00', 'L10', 'rake', 'good')
  await lent('2026-11-10T10:00:00-05:00', 'L8', 'drill', 'M-7')
  await lent('2026-11-12T10:00:00-05:00', 'L9', 'saw', 'M-3')
  await back('2026-11-13T10:00:00-05:00', 'L9', 'saw', 'damaged')
  expect(
    await first(
      shed.tools.send_a_tool_to_repair(shed.at('2026-11-14T09:00:00-05:00'), { tool_id: 'saw' }),
    ),
  ).toMatchObject({ outcome: 'applied' })
  expect(
    await first(
      shed.tools.retire_a_tool(shed.at('2026-11-20T09:00:00-05:00'), {
        id: 'rake',
        reason: 'broken',
      }),
    ),
  ).toMatchObject({ outcome: 'applied' })
  return shed
}

describe('SC-21, the loans of each tool this month', () => {
  test('on 30 November: every tool still in the shed, its loans of November, the most lent first, the ladder at zero', async () => {
    const shed = await the_shed()
    expect(
      await first(
        shed.loans.the_loans_of_each_tool_this_month(shed.when('2026-11-30T18:00:00-05:00'), {}),
      ),
    ).toEqual({
      event: 'snapshot',
      // L1 was lent on 31 October in the shed's zone: October's. L7 counts
      // for the sander, as corrected. The saw, in the workshop, is still in
      // the shed; the rake, retired, is not, its loan with it. One loan
      // each, then by name: `C`, `H`, `O`.
      entries: [
        { tool_id: 'drill', tool_name: 'Cordless drill', loans: 1 },
        { tool_id: 'saw', tool_name: 'Hand saw', loans: 1 },
        { tool_id: 'sander', tool_name: 'Orbital sander', loans: 1 },
        { tool_id: 'ladder', tool_name: 'Ladder', loans: 0 },
      ],
      position: '16',
      total: 4,
    })
  })

  test('on 1 December at 00:30 in the shed, already its December: no loan yet', async () => {
    const shed = await the_shed()
    expect(
      await first(
        shed.loans.the_loans_of_each_tool_this_month(shed.when('2026-12-01T00:30:00-05:00'), {}),
      ),
    ).toMatchObject({
      entries: [
        { tool_id: 'drill', loans: 0 },
        { tool_id: 'saw', loans: 0 },
        { tool_id: 'ladder', loans: 0 },
        { tool_id: 'sander', loans: 0 },
      ],
    })
  })

  test("a shed whose calendar is UTC writes Gianni's loan of 23:30 on 31 October as 1 November's: the drill counts two", async () => {
    const shed = await the_shed({ time_zone: 'UTC' })
    expect(
      await first(
        shed.loans.the_loans_of_each_tool_this_month(shed.when('2026-11-30T18:00:00-05:00'), {}),
      ),
    ).toMatchObject({
      entries: [
        { tool_id: 'drill', loans: 2 },
        { tool_id: 'saw', loans: 1 },
        { tool_id: 'sander', loans: 1 },
        { tool_id: 'ladder', loans: 0 },
      ],
    })
  })

  /**
   * On 10 November, the drill and the ladder in the shed since 30 October
   * (1, 2); Marta borrows the drill (L7, 3); Luca adds the sander (4),
   * renames the drill (5), retires the ladder (6).
   */
  const the_month_followed = async (streams: 'native' | 'composed') => {
    const shed = await oracle({ streams })
    for (const [id, name, category] of [
      ['drill', 'Cordless drill', 'power'],
      ['ladder', 'Ladder', 'ladder'],
    ] as const) {
      await first(
        shed.tools.add_a_tool(shed.at('2026-10-30T09:00:00-04:00'), { id, name, category }),
      )
    }
    return followed(
      () =>
        shed.loans
          .the_loans_of_each_tool_this_month(shed.when('2026-11-10T09:00:00-05:00'), {})
          [Symbol.asyncIterator](),
      async () => {
        await first(
          shed.loans.borrow_a_tool(shed.at('2026-11-10T10:00:00-05:00'), {
            loan_id: 'L7',
            tool_id: 'drill',
            member_id: 'M-12',
          }),
        )
        await first(
          shed.tools.add_a_tool(shed.at('2026-11-10T11:00:00-05:00'), {
            id: 'sander',
            name: 'Orbital sander',
            category: 'power',
          }),
        )
        await first(
          shed.tools.rename_a_tool(shed.at('2026-11-10T12:00:00-05:00'), {
            tool_id: 'drill',
            name: 'Drill, cordless',
          }),
        )
        await first(
          shed.tools.retire_a_tool(shed.at('2026-11-10T13:00:00-05:00'), {
            id: 'ladder',
            reason: 'broken',
          }),
        )
      },
    )
  }

  test('its stream: a loan touches its tool by the id of `tools`; a tool added, renamed, retired', async () => {
    const { events } = await the_month_followed('native')
    expect(told(events)).toEqual([
      ['fact', '3'],
      ['entered', '4'],
      ['changed', '5'],
      ['left', '6'],
      ['caught_up', '6'],
    ])
    expect(events[0]).toMatchObject({
      identity: 'drill',
      entry: { tool_id: 'drill', loans: 1 },
      fact: { parts: [{ path: 'business/loans/fact/a_tool_has_been_lent' }] },
    })
    expect(events[1]).toMatchObject({ identity: 'sander', entry: { loans: 0 } })
    expect(events[2]).toMatchObject({ identity: 'drill', entry: { tool_name: 'Drill, cordless' } })
  })

  test.each(['native', 'composed'] as const)(
    '%s: the snapshot at P with the events from P is the snapshot at the end (D69.3)',
    async (streams) => {
      const { snapshot, events, at_the_end } = await the_month_followed(streams)
      expect(view('tool_id')([...snapshot, ...events])).toEqual(view('tool_id')(at_the_end))
    },
  )
})
