import { describe, expect, test } from 'vitest'
import * as wlib from '../wlib.ts'
import { accounts, all, first, followed, oracle, pull, type Who } from './oracle.ts'

// SC-32 (the refusal with part 6.2; the shelf live and a resume refused with
// part 6.3): a read leaf holds limits of its own, as a
// command leaf (PER-5.5, D80): pure, over the context of its point and the
// input, after the nodes of its path and before the read, so that the
// failed ones close the request with `refused`, their names the reasons,
// before any snapshot. Marta follows the shelf (`member`'s `the_shelf`)
// while her card is valid; on 1 April she is refused and told why. A limit
// never filters a row: the catalogue stays the visitor's to read once. With
// her card valid the shelf is live (`stream: { identity: 'tool_id' }`); the
// limit runs at every request, so a stream opened on 31 March stays open past
// midnight, and its resume on 1 April is refused.

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

  test('her card valid: past the limit, the shelf live; a tool added comes in, one sent to the workshop leaves', async () => {
    const shed = await the_shed()
    const { snapshot, events } = await followed(
      () =>
        shed.member
          .the_shelf(shed.as(marta, '2.0.0').when('2026-11-19T10:00:00-05:00'), {})
          [Symbol.asyncIterator](),
      async () => {
        await first(
          shed.tools.add_a_tool(shed.at('2026-11-19T11:00:00-05:00'), {
            id: 'saw',
            name: 'Hand saw',
            category: 'hand',
          }),
        )
        await first(
          shed.tools.send_a_tool_to_repair(shed.at('2026-11-19T12:00:00-05:00'), {
            tool_id: 'drill',
          }),
        )
      },
    )
    expect(snapshot).toEqual([
      {
        event: 'snapshot',
        entries: [{ tool_id: 'drill', name: 'Cordless drill' }],
        position: '1',
        total: 1,
      },
    ])
    expect(events).toEqual([
      {
        event: 'fact',
        position: '2',
        identity: 'saw',
        entry: { tool_id: 'saw', name: 'Hand saw' },
      },
      { event: 'left', position: '3', identity: 'drill' },
      { event: 'caught_up', position: '3' },
    ])
    expect(shed.traced()).toEqual([])
  })

  test('a stream opened on 31 March stays open past midnight; its resume on 1 April is refused before any read', async () => {
    const shed = await the_shed()
    const live = shed.member
      .the_shelf(shed.as(marta, '2.0.0').when('2027-03-31T23:00:00-04:00'), {})
      [Symbol.asyncIterator]()
    const [opened] = await pull(live, 1)
    expect(opened).toMatchObject({ event: 'snapshot', position: '1' })
    await first(
      shed.tools.add_a_tool(shed.at('2027-04-01T00:10:00-04:00'), {
        id: 'saw',
        name: 'Hand saw',
        category: 'hand',
      }),
    )
    expect(await pull(live, 1)).toMatchObject([{ event: 'fact', position: '2', identity: 'saw' }])
    expect(
      await all(
        shed.member.the_shelf(
          shed.as(marta, '2.0.0').when('2027-04-01T00:30:00-04:00'),
          {},
          wlib.position.parse('2'),
        ),
      ),
    ).toEqual([{ event: 'refused', reasons: ['the_member_card_is_valid_today'] }])
    expect(shed.traced().map((each) => each.why)).toEqual([
      {
        closed_by: 'limits',
        at: 'persona/member/usecase/the_shelf',
        reasons: ['the_member_card_is_valid_today'],
      },
    ])
  })
})
