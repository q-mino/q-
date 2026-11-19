import { describe, expect, test } from 'vitest'
import { accounts, all, first, oracle, type Who } from './oracle.ts'

// SC-23 (part 6.1): Luca retires a tool as keeper, through the leaf of his
// tree (PER-6, DOM-2, D45): the request enters at the node of the persona
// base, which takes his `Caller`; the keeper's node looks up his hats and
// finds him (PER-7); the leaf's own input, in the keeper's words, its
// creator gives `tools` its input, and the outcome comes back projected
// into the leaf's own events, one per branch and one for the rejection,
// the first event and the last (D72.3). The keeper's notes never leave in
// an event he does not declare (PER-18).

/** Luca, signed in, who keeps the shed. */
const luca: Who = { identified_by: 'account', id: 'A-LUCA' }

/** The shed on Monday 16 November: the ladder and the drill on the shelf, Luca with the hat of keeper. */
const the_shed = async () => {
  const shed = await oracle({ accounts: accounts({ hats: { 'A-LUCA': ['keeper'] } }) })
  for (const tool of [
    { id: 'ladder', name: 'Ladder', category: 'ladder' as const },
    { id: 'drill', name: 'Cordless drill', category: 'power' as const },
  ]) {
    await first(shed.tools.add_a_tool(shed.at('2026-11-16T09:00:00-05:00'), tool))
  }
  return shed
}

describe('SC-23, Luca retires a tool as keeper', () => {
  test('in service: the tool is retired, in his words, with the day of the retirement', async () => {
    const shed = await the_shed()
    const events = await all(
      shed.keeper.retire_a_tool(shed.as(luca, '1.0.0').at('2026-11-19T10:00:00-05:00'), {
        tool_id: 'ladder',
        reason: 'broken',
        notes: 'a rung is cracked',
      }),
    )
    expect(events).toEqual([
      {
        event: 'the_tool_is_retired',
        payload: { tool_id: 'ladder', date: '2026-11-19T10:00:00-05:00' },
      },
    ])
  })

  test('already retired: another branch, another event of his', async () => {
    const shed = await the_shed()
    const luca_at = shed.as(luca, '1.0.0')
    await all(
      shed.keeper.retire_a_tool(luca_at.at('2026-11-19T10:00:00-05:00'), {
        tool_id: 'ladder',
        reason: 'broken',
      }),
    )
    expect(
      await all(
        shed.keeper.retire_a_tool(luca_at.at('2026-11-19T11:00:00-05:00'), {
          tool_id: 'ladder',
          reason: 'broken',
        }),
      ),
    ).toEqual([{ event: 'the_tool_was_already_retired', payload: { tool_id: 'ladder' } }])
  })

  test('in the workshop, beyond repair: retired by the other branch, the same event', async () => {
    const shed = await the_shed()
    const luca_at = shed.as(luca, '1.0.0')
    expect(
      await all(
        shed.keeper.send_a_tool_to_repair(luca_at.at('2026-11-19T09:00:00-05:00'), {
          tool_id: 'drill',
        }),
      ),
    ).toEqual([
      {
        event: 'the_tool_is_in_the_workshop',
        payload: { tool_id: 'drill', since: '2026-11-19T09:00:00-05:00' },
      },
    ])
    expect(
      await all(
        shed.keeper.retire_a_tool(luca_at.at('2026-11-19T10:00:00-05:00'), {
          tool_id: 'drill',
          reason: 'broken',
        }),
      ),
    ).toEqual([
      {
        event: 'the_tool_is_retired',
        payload: { tool_id: 'drill', date: '2026-11-19T10:00:00-05:00' },
      },
    ])
  })

  test('no such tool: the rejection, projected, with nothing he did not ask', async () => {
    const shed = await the_shed()
    expect(
      await all(
        shed.keeper.retire_a_tool(shed.as(luca, '1.0.0').at('2026-11-19T10:00:00-05:00'), {
          tool_id: 'sander',
          reason: 'broken',
        }),
      ),
    ).toEqual([{ event: 'there_is_no_such_tool', payload: {} }])
  })

  test('the correlation from the origin reaches the fact (DOM-10)', async () => {
    const shed = await the_shed()
    await all(
      shed.keeper.retire_a_tool(
        shed.as(luca, '1.0.0').at('2026-11-19T10:00:00-05:00', { correlation: 'C-LUCA-1' }),
        { tool_id: 'ladder', reason: 'broken' },
      ),
    )
    const log = shed.log(undefined)[Symbol.asyncIterator]()
    const recorded: unknown[] = []
    for (;;) {
      const next = await log.next()
      if (next.done === true || next.value.event !== 'fact') break
      recorded.push(next.value.fact)
    }
    expect(recorded.at(-1)).toMatchObject({
      correlation: 'C-LUCA-1',
      operation: { scope: 'keeper/luca' },
      parts: [{ path: 'business/tools/fact/a_tool_has_been_retired' }],
    })
  })
})
