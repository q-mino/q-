import { describe, expect, test } from 'vitest'
import { accounts, all, first, oracle, type Who } from './oracle.ts'

// SC-32, the refusal (part 6.2; following the shelf live, its stream and a
// resume refused, with part 6.3): a read leaf holds limits of its own, as a
// command leaf (PER-5.5, D80): pure, over the context of its point and the
// input, after the nodes of its path and before the read, so that the
// failed ones close the request with `refused`, their names the reasons,
// before any snapshot. Marta follows the shelf (`member`'s `the_shelf`)
// while her card is valid; on 1 April she is refused and told why. A limit
// never filters a row: the catalogue stays the visitor's to read once.

const marta: Who = { identified_by: 'account', id: 'A-MARTA' }
const luca: Who = { identified_by: 'account', id: 'A-LUCA' }

const the_shed = async () => {
  const shed = await oracle({
    accounts: accounts({
      hats: { 'A-MARTA': ['member'], 'A-LUCA': ['keeper'] },
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

describe('SC-32, a limit on a read', () => {
  test('her card expired on 31 March: refused, its reason named, no snapshot; the trace keeps where', async () => {
    const shed = await the_shed()
    expect(
      await all(
        shed.member.the_shelf(shed.as(marta, '2.0.0').when('2027-04-01T10:00:00-04:00'), {}),
      ),
    ).toEqual([{ event: 'refused', reasons: ['the_member_card_is_valid_today'] }])
    expect(shed.traced()).toMatchObject([
      {
        path: 'persona/member/usecase/the_shelf',
        given: { caller: marta },
        answered: { event: 'refused' },
        why: {
          closed_by: 'limits',
          at: 'persona/member/usecase/the_shelf',
          reasons: ['the_member_card_is_valid_today'],
        },
      },
    ])
    expect(shed.traced()[0]).not.toHaveProperty('operation')
  })

  test("the member's node first: Luca, no member, is not found before any limit", async () => {
    const shed = await the_shed()
    expect(
      await all(
        shed.member.the_shelf(shed.as(luca, '2.0.0').when('2027-04-01T10:00:00-04:00'), {}),
      ),
    ).toEqual([{ event: 'not_found' }])
    expect(shed.traced().map((each) => each.why.closed_by)).toEqual(['a_lookup'])
  })

  test('her card valid: past the limit, the shelf streams, with part 6.3', async () => {
    const shed = await the_shed()
    await expect(
      all(shed.member.the_shelf(shed.as(marta, '2.0.0').when('2026-11-19T10:00:00-05:00'), {})),
    ).rejects.toThrow('persona/member/usecase/the_shelf declares stream (part 6.3)')
  })
})
