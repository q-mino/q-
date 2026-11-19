import { describe, expect, test } from 'vitest'
import { accounts, all, first, oracle, type Who } from './oracle.ts'

// SC-24, the borrowing half (part 6.1; reading her loans, a leaf that
// streams, with part 6.3): Marta's node (PER-6, PER-7, PER-9, PER-14) looks
// up her hats and her member card in auth, finds her as a member only if
// she wears the hat (a perimeter: `not_found`, no reason), and gives the
// card down whole; the leaf gives its number to `loans` as the member
// (D33, PER-8). An expired card blocks borrowing: a limit of the leaf, its
// name the reason (`refused`, PER-14, D80), after the nodes and before the
// creator (PER-5.5), so that nothing is recorded.

const marta: Who = { identified_by: 'account', id: 'A-MARTA' }
const luca: Who = { identified_by: 'account', id: 'A-LUCA' }
const gianni: Who = { identified_by: 'account', id: 'A-GIANNI' }

const the_shed = async () => {
  const shed = await oracle({
    accounts: accounts({
      hats: { 'A-MARTA': ['member'], 'A-LUCA': ['keeper'], 'A-GIANNI': ['member'] },
      member_cards: { 'A-MARTA': { id: 'M-12', valid_until: '2027-03-31' } },
    }),
  })
  await first(
    shed.tools.add_a_tool(shed.at('2026-11-16T09:00:00-05:00'), {
      id: 'drill',
      name: 'Cordless drill',
      category: 'power',
    }),
  )
  return shed
}

describe("SC-24, Marta's node", () => {
  test('her card from auth, given down: she has the drill, lent to M-12', async () => {
    const shed = await the_shed()
    expect(
      await all(
        shed.member.borrow_a_tool(shed.as(marta, '2.0.0').at('2026-11-19T10:00:00-05:00'), {
          loan_id: 'L7',
          tool_id: 'drill',
        }),
      ),
    ).toMatchObject([{ event: 'you_have_the_tool', payload: { loan_id: 'L7', tool_id: 'drill' } }])
    const loans = await first(
      shed.loans.the_ongoing_loans_of_a_member(shed.when('2026-11-19T10:01:00-05:00'), {
        member_id: 'M-12',
      }),
    )
    expect(loans).toMatchObject({ entries: [{ id: 'L7', tool_id: 'drill' }] })
  })

  test('her card expired on 31 March: refused, its reason named, nothing recorded', async () => {
    const shed = await the_shed()
    expect(
      await all(
        shed.member.borrow_a_tool(shed.as(marta, '2.0.0').at('2027-04-01T10:00:00-04:00'), {
          loan_id: 'L7',
          tool_id: 'drill',
        }),
      ),
    ).toEqual([{ event: 'refused', reasons: ['the_member_card_is_valid_today'] }])
    expect(
      await first(shed.tools.the_catalogue(shed.when('2027-04-01T10:01:00-04:00'), {})),
    ).toMatchObject({ position: '1' })
  })

  test("the member's hat, or a card, missing: not found, no reason", async () => {
    const shed = await the_shed()
    const borrow = (who: Who) =>
      all(
        shed.member.borrow_a_tool(shed.as(who, '2.0.0').at('2026-11-19T10:00:00-05:00'), {
          loan_id: 'L7',
          tool_id: 'drill',
        }),
      )
    // Luca keeps the shed and is no member; Gianni is a member with no card.
    expect(await borrow(luca)).toEqual([{ event: 'not_found' }])
    expect(await borrow(gianni)).toEqual([{ event: 'not_found' }])
    // The trace keeps what the caller is not told (F6, PER-14, part 6.2).
    expect(shed.traced().map((each) => each.why)).toEqual([
      {
        closed_by: 'a_lookup',
        node: 'persona/member/node/member',
        lookups: [{ lookup: 'the_member_card_of_the_caller', not_known: 'value' }],
      },
      {
        closed_by: 'a_lookup',
        node: 'persona/member/node/member',
        lookups: [{ lookup: 'the_member_card_of_the_caller', not_known: 'value' }],
      },
    ])
  })

  test('a perimeter hides from the caller, the trace keeps it: a card without the hat', async () => {
    const shed = await oracle({
      accounts: accounts({
        hats: { 'A-GIORGIO': ['keeper'] },
        member_cards: { 'A-GIORGIO': { id: 'M-3', valid_until: '2027-03-31' } },
      }),
    })
    const giorgio: Who = { identified_by: 'account', id: 'A-GIORGIO' }
    const at = shed
      .as(giorgio, '2.0.0')
      .at('2026-11-19T10:00:00-05:00', { scope: 'member/A-GIORGIO' })
    expect(await all(shed.member.borrow_a_tool(at, { loan_id: 'L7', tool_id: 'drill' }))).toEqual([
      { event: 'not_found' },
    ])
    expect(shed.traced()).toEqual([
      {
        path: 'persona/member/usecase/borrow_a_tool',
        given: { caller: giorgio, now: at.now, time_zone: at.time_zone },
        version: '2.0.0',
        operation: at.operation,
        correlation: at.correlation,
        sent: { loan_id: 'L7', tool_id: 'drill' },
        answered: { event: 'not_found' },
        why: {
          closed_by: 'a_perimeter',
          node: 'persona/member/node/member',
          perimeter: 'the_caller_wears_the_hat_of_member',
        },
      },
    ])
  })
})
