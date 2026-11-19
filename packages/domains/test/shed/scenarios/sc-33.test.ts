import { describe, expect, test } from 'vitest'
import * as wlib from '../wlib.ts'
import { accounts, first, followed, oracle, pull, type Who } from './oracle.ts'
import { extend_the_loan } from '../business/loans/an_ongoing_loan/_usecase.ts'
import { return_a_tool } from '../business/loans/_usecase.ts'
import { member_id } from '../business/loans/_id.ts'

// SC-33 (part 6.3, PER-15, D47, D51): which buttons are active on each row
// of Marta's "my loans". The read leaf lists two command leaves of its
// folder as actions (`bring_it_back`, `keep_it_longer`); per entry the
// library runs the same pass as the write (the nodes of the business's
// path, the command's creator), leaves the leaves the caller gives later
// not known (`given_by_the_caller`: the tool she scans at the desk), the
// adapter evaluates the rest in the snapshot of the read, and the library
// composes the three values in strong Kleene logic; the leaf's own limits
// (her card) go in AND outside. The projection writes the row's buttons.

const marta: Who = { identified_by: 'account', id: 'A-MARTA' }

/**
 * Marta borrows the sander on 26 October (L6, due 9 November), the drill
 * (L7) and the ladder (L8) on 2 November, due on the 16th; Gianni books the
 * ladder for Thursday 19 (R8).
 */
const the_shed = async (valid_until = '2027-03-31') => {
  const shed = await oracle({
    accounts: accounts({
      hats: { 'A-MARTA': ['member'] },
      member_cards: { 'A-MARTA': { id: 'M-12', valid_until } },
    }),
  })
  for (const [id, name, category] of [
    ['drill', 'Cordless drill', 'power'],
    ['ladder', 'Ladder', 'ladder'],
    ['sander', 'Belt sander', 'power'],
  ] as const) {
    await first(shed.tools.add_a_tool(shed.at('2026-10-20T09:00:00-04:00'), { id, name, category }))
  }
  for (const [loan_id, tool_id, at] of [
    ['L6', 'sander', '2026-10-26T10:00:00-04:00'],
    ['L7', 'drill', '2026-11-02T10:00:00-05:00'],
    ['L8', 'ladder', '2026-11-02T10:00:00-05:00'],
  ] as const) {
    await first(shed.loans.borrow_a_tool(shed.at(at), { loan_id, tool_id, member_id: 'M-12' }))
  }
  await first(
    shed.loans.reserve_a_tool(shed.at('2026-11-10T12:00:00-05:00'), {
      reservation_id: 'R8',
      tool_id: 'ladder',
      member_id: 'M-7',
      day: '2026-11-19',
    }),
  )
  const friday = shed.as(marta, '2.0.0').when('2026-11-13T18:00:00-05:00')
  return { shed, friday }
}

/** The buttons of each row, by loan. */
const buttons = (entries: readonly unknown[] | undefined): Readonly<Record<string, unknown>> =>
  Object.fromEntries(
    (entries ?? []).flatMap((entry): readonly (readonly [string, unknown])[] =>
      typeof entry === 'object' && entry !== null && 'loan_id' in entry
        ? [
            [
              String(entry.loan_id),
              [Reflect.get(entry, 'bring_it_back'), Reflect.get(entry, 'keep_it_longer')],
            ],
          ]
        : [],
    ),
  )

describe('SC-33, the buttons on the rows of "my loans"', () => {
  test('on Friday 13 November: bring each back, scanning the tool; keep the drill longer, not the ladder (booked) nor the sander (past due)', async () => {
    const { shed, friday } = await the_shed()
    const [snapshot] = await pull(shed.member.my_loans(friday, {})[Symbol.asyncIterator](), 1)
    expect(snapshot?.event).toBe('snapshot')
    expect(buttons(snapshot?.event === 'snapshot' ? snapshot.entries : [])).toEqual({
      L6: ['scan_the_tool_you_bring', 'not_this_loan'],
      L7: ['scan_the_tool_you_bring', 'you_may'],
      L8: ['scan_the_tool_you_bring', 'someone_booked_the_tool'],
    })
  })

  test('her card expired: no row may be kept longer, for her card, whatever the loan; she may still bring each back', async () => {
    const { shed, friday } = await the_shed('2026-11-12')
    const [snapshot] = await pull(shed.member.my_loans(friday, {})[Symbol.asyncIterator](), 1)
    expect(buttons(snapshot?.event === 'snapshot' ? snapshot.entries : [])).toEqual({
      L6: ['scan_the_tool_you_bring', 'your_card_is_not_valid'],
      L7: ['scan_the_tool_you_bring', 'your_card_is_not_valid'],
      L8: ['scan_the_tool_you_bring', 'your_card_is_not_valid'],
    })
  })

  test("the business's read with actions: the return not known until the tool is scanned; the extension of the ladder false, the booking named", async () => {
    const { shed } = await the_shed()
    const read = shed.loans.the_ongoing_loans_of_a_member.with_actions({
      bring_it_back: {
        use_case: return_a_tool,
        input: () => (loan) => ({
          loan_id: loan.id,
          tool_id: wlib.given_by_the_caller,
          condition: wlib.given_by_the_caller,
        }),
      },
      keep_it_longer: {
        use_case: extend_the_loan,
        input: () => (loan) => ({
          loan_id: loan.id,
          tool_id: loan.tool_id,
          due_day: loan.due_day,
          member_id: member_id.parse('M-12'),
        }),
      },
    })
    const [snapshot] = await pull(
      read(shed.when('2026-11-13T18:00:00-05:00'), { member_id: 'M-12' })[Symbol.asyncIterator](),
      1,
    )
    const entries = snapshot?.event === 'snapshot' ? snapshot.entries : []
    const drill = entries.find((entry) => entry.id === 'L7')
    expect(drill?.bring_it_back).toMatchObject({ value: 'not_known', limits: {} })
    expect(drill?.bring_it_back.branch).toBeUndefined()
    expect(drill?.bring_it_back.leaves).toContainEqual(
      expect.objectContaining({
        predicate: 'business/loans/predicate/the_loan_is_of_this_tool',
        holds: 'not_known',
      }),
    )
    expect(drill?.keep_it_longer).toMatchObject({
      value: true,
      branch: 'the_loan_can_be_extended_so_its_due_day_moves_on',
    })
    const ladder = entries.find((entry) => entry.id === 'L8')
    expect(ladder?.keep_it_longer.value).toBe(false)
    expect(
      ladder?.keep_it_longer.leaves
        .filter((leaf) => leaf.holds === false)
        .map((leaf) => leaf.predicate),
    ).toEqual(['business/loans/predicate/the_tool_is_booked_on_a_day_up_to'])
  })

  test('Gianni books the drill while she reads: its row changes, keep it longer no more', async () => {
    const { shed, friday } = await the_shed()
    const { events } = await followed(
      () => shed.member.my_loans(friday, {})[Symbol.asyncIterator](),
      async () => {
        await first(
          shed.loans.reserve_a_tool(shed.at('2026-11-13T18:05:00-05:00'), {
            reservation_id: 'R9',
            tool_id: 'drill',
            member_id: 'M-7',
            day: '2026-11-20',
          }),
        )
      },
    )
    expect(events).toMatchObject([
      {
        event: 'fact',
        identity: 'L7',
        entry: {
          loan_id: 'L7',
          bring_it_back: 'scan_the_tool_you_bring',
          keep_it_longer: 'someone_booked_the_tool',
        },
      },
      { event: 'caught_up' },
    ])
  })
})
