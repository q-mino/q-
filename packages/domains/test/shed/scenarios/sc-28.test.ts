import { describe, expect, test } from 'vitest'
import * as zz from '../../../src/library/index.ts'
import { accounts, all, first, oracle, type Who } from './oracle.ts'

// SC-28, two versions of a leaf (part 6.4; PER-17, D72.7, D75.6): the
// client writes its persona's version whole into every message, and its
// major picks the leaf; a leaf of a past major (`persona/member/1/`) is over
// the next major's, its input forward (`to_next`), what the next leaf gives
// back in its words (`from_next`), each over the context of the leaf's point
// first (SC-12); the current leaf's limits, creator and projection answer,
// and the business, which has one version, records one fact. A delegated
// leaf is the next major's; a path its major has not is `not_a_leaf`.

const marta: Who = { identified_by: 'account', id: 'A-MARTA' }
const gianni: Who = { identified_by: 'account', id: 'A-GIANNI' }
const luca: Who = { identified_by: 'account', id: 'A-LUCA' }

/** The shed on 5 November, after `member` 2.0.0: the drill and the ladder on the shelf, Marta and Gianni with their cards. */
const the_shed = async () => {
  const shed = await oracle({
    accounts: accounts({
      hats: { 'A-MARTA': ['member'], 'A-GIANNI': ['member'], 'A-LUCA': ['keeper'] },
      member_cards: {
        'A-MARTA': { id: 'M-12', valid_until: '2027-03-31' },
        'A-GIANNI': { id: 'M-7', valid_until: '2027-03-31' },
      },
    }),
  })
  for (const [id, name] of [
    ['drill', 'Cordless drill'],
    ['ladder', 'Ladder'],
  ] as const) {
    await first(
      shed.tools.add_a_tool(shed.at('2026-11-05T13:00:00.000Z'), {
        id,
        name,
        category: 'power',
      }),
    )
  }
  return shed
}

describe('SC-28: an old phone and a new one borrow by the same path', () => {
  test('Gianni at 2.0.0 reads the due day; Marta at 1.4.0 the last instant of that day in the shed’s zone', async () => {
    const shed = await the_shed()
    expect(
      await all(
        shed.member.borrow_a_tool(shed.as(gianni, '2.0.0').at('2026-11-05T15:00:00.000Z'), {
          loan_id: 'L5',
          tool_id: 'ladder',
        }),
      ),
    ).toEqual([
      {
        event: 'you_have_the_tool',
        payload: { loan_id: 'L5', tool_id: 'ladder', due_day: '2026-11-19' },
      },
    ])
    expect(
      await all(
        shed.member.borrow_a_tool(shed.as(marta, '1.4.0').at('2026-11-05T15:05:00.000Z'), {
          loan_id: 'L7',
          tool_id: 'drill',
        }),
      ),
    ).toEqual([
      {
        event: 'you_have_the_tool',
        payload: { loan_id: 'L7', tool_id: 'drill', due_date: '2026-11-20T04:59:59.999Z' },
      },
    ])
    // One business, one version: Marta's loan is due on a day, as Gianni's.
    expect(
      await first(
        shed.loans.the_ongoing_loans_of_a_member(shed.when('2026-11-05T15:10:00.000Z'), {
          member_id: 'M-12',
        }),
      ),
    ).toMatchObject({ entries: [{ id: 'L7', tool_id: 'drill', due_day: '2026-11-19' }] })
  })

  test('"my loans" each in its own words; the return, delegated, as 2.0.0 tells it', async () => {
    const shed = await the_shed()
    await all(
      shed.member.borrow_a_tool(shed.as(marta, '1.4.0').at('2026-11-05T15:05:00.000Z'), {
        loan_id: 'L7',
        tool_id: 'drill',
      }),
    )
    expect(
      await first(
        shed.member.my_loans(shed.as(marta, '1.4.0').when('2026-11-06T14:00:00.000Z'), {}),
      ),
    ).toMatchObject({
      event: 'snapshot',
      entries: [{ loan_id: 'L7', tool_id: 'drill', due_date: '2026-11-20T04:59:59.999Z' }],
    })
    const at_2 = await first(
      shed.member.my_loans(shed.as(marta, '2.0.0').when('2026-11-06T14:00:00.000Z'), {}),
    )
    expect(at_2).toMatchObject({ entries: [{ loan_id: 'L7', due_day: '2026-11-19' }] })
    expect(
      await all(
        shed.member.return_a_tool(shed.as(marta, '1.4.0').at('2026-11-06T15:00:00.000Z'), {
          loan_id: 'L7',
          tool_id: 'drill',
          condition: 'good',
        }),
      ),
    ).toEqual([{ event: 'you_returned_the_tool', payload: { tool_id: 'drill' } }])
    expect(
      await all(
        shed.member.return_a_tool(shed.as(marta, '2.0.0').at('2026-11-06T15:01:00.000Z'), {
          loan_id: 'L7',
          tool_id: 'drill',
          condition: 'good',
        }),
      ),
    ).toEqual([{ event: 'you_had_already_returned_it', payload: { loan_id: 'L7' } }])
  })

  test('her retry under the same operation from her updated phone: the same fact, told at 2.0.0', async () => {
    const shed = await the_shed()
    const sent = { operation: 'L7-borrow' }
    await all(
      shed.member.borrow_a_tool(shed.as(marta, '1.4.0').at('2026-11-05T15:05:00.000Z', sent), {
        loan_id: 'L7',
        tool_id: 'drill',
      }),
    )
    // The fingerprint is over the path and the input as sent, the version
    // apart (LIB-11): the duplicate branch, in the words of the version.
    expect(
      await all(
        shed.member.borrow_a_tool(shed.as(marta, '2.0.0').at('2026-11-05T15:06:00.000Z', sent), {
          loan_id: 'L7',
          tool_id: 'drill',
        }),
      ),
    ).toEqual([
      {
        event: 'you_have_the_tool',
        payload: { loan_id: 'L7', tool_id: 'drill', due_day: '2026-11-19' },
      },
    ])
  })

  test('a rejection told in 1.x, a closing as it is, a leaf 1.x has not: `not_a_leaf`, each in the trace', async () => {
    const shed = await the_shed()
    await all(
      shed.member.borrow_a_tool(shed.as(gianni, '2.0.0').at('2026-11-05T15:00:00.000Z'), {
        loan_id: 'L5',
        tool_id: 'ladder',
      }),
    )
    expect(
      await all(
        shed.member.borrow_a_tool(shed.as(marta, '1.4.0').at('2026-11-05T15:05:00.000Z'), {
          loan_id: 'L7',
          tool_id: 'ladder',
        }),
      ),
    ).toEqual([{ event: 'the_tool_is_not_available', payload: {} }])
    // Luca keeps the shed and has no member card: the node closes as at 2.0.0.
    expect(
      await all(
        shed.member.borrow_a_tool(shed.as(luca, '1.4.0').at('2026-11-05T15:06:00.000Z'), {
          loan_id: 'L8',
          tool_id: 'drill',
        }),
      ),
    ).toEqual([{ event: 'not_found' }])
    // A client whose version the type does not know reaches every major's
    // leaf: `extend_your_loan` is the current major's alone (SC-31), not in 1/.
    const any_version = zz.semver.parse('1.4.0')
    expect(
      await all(
        shed.member.extend_your_loan(shed.as(marta, any_version).at('2026-11-05T15:07:00.000Z'), {
          loan_id: 'L7',
          tool_id: 'drill',
          due_day: '2026-11-19',
        }),
      ),
    ).toEqual([{ event: 'invalid_request', reason: 'not_a_leaf' }])
    expect(shed.traced().map(({ version, answered, why }) => ({ version, answered, why }))).toEqual(
      [
        {
          version: '1.4.0',
          answered: { event: 'the_tool_is_not_available', payload: {} },
          why: {
            closed_by: 'the_business',
            outcome: {
              outcome: 'rejected',
              failures: expect.arrayContaining([
                expect.objectContaining({
                  predicate: 'business/loans/predicate/the_tool_is_on_loan',
                }),
              ]) as unknown,
            },
          },
        },
        {
          version: '1.4.0',
          answered: { event: 'not_found' },
          why: {
            closed_by: 'a_lookup',
            node: 'persona/member/node/member',
            lookups: [{ lookup: 'the_member_card_of_the_caller', not_known: 'value' }],
          },
        },
        {
          version: '1.4.0',
          answered: { event: 'invalid_request', reason: 'not_a_leaf' },
          why: { closed_by: 'not_a_leaf', major: 1 },
        },
      ],
    )
  })
})
