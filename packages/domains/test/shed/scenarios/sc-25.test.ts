import { describe, expect, test } from 'vitest'
import { accounts, all, first, oracle, type Who } from './oracle.ts'

// SC-25 (part 6.1): the visitor, worn by anyone, signed in or not (PER-7,
// V13): `visitor` has no node of its own, so whoever the persona base takes
// reads the catalogue, the same; the keeper's node verifies its hat as a
// perimeter, so whoever has an account without it, or none, is not found
// (`not_found`, no reason, D87.5).

const paolo: Who = { identified_by: 'session', id: 'S-PAOLO' }
const marta: Who = { identified_by: 'account', id: 'A-MARTA' }
const rossi: Who = { identified_by: 'key', id: 'K-ROSSI' }
const luca: Who = { identified_by: 'account', id: 'A-LUCA' }

const the_shed = async () => {
  const shed = await oracle({
    accounts: accounts({
      hats: { 'A-MARTA': ['member'], 'A-LUCA': ['keeper'] },
      key_hats: { 'K-ROSSI': ['workshop'] },
    }),
  })
  await first(
    shed.tools.add_a_tool(shed.at('2026-11-16T09:00:00-05:00'), {
      id: 'ladder',
      name: 'Ladder',
      category: 'ladder',
    }),
  )
  return shed
}

describe('SC-25, the visitor, worn by anyone', () => {
  test('a session, an account, a key: the same catalogue', async () => {
    const shed = await the_shed()
    const read = (who: Who) =>
      all(shed.visitor.the_catalogue(shed.as(who, '1.0.0').when('2026-11-19T10:00:00-05:00'), {}))
    const expected = [
      {
        event: 'snapshot',
        entries: [{ tool_id: 'ladder', name: 'Ladder', category: 'ladder' }],
        position: '1',
        total: 1,
      },
    ]
    expect(await read(paolo)).toEqual(expected)
    expect(await read(marta)).toEqual(expected)
    expect(await read(rossi)).toEqual(expected)
  })

  test("the keeper's hat, a perimeter: no account, or an account without it, is not found", async () => {
    const shed = await the_shed()
    const retire = (who: Who) =>
      all(
        shed.keeper.retire_a_tool(shed.as(who, '1.0.0').at('2026-11-19T10:00:00-05:00'), {
          tool_id: 'ladder',
          reason: 'broken',
        }),
      )
    expect(await retire(paolo)).toEqual([{ event: 'not_found' }])
    expect(await retire(marta)).toEqual([{ event: 'not_found' }])
    expect(await retire(rossi)).toEqual([{ event: 'not_found' }])
    // Nothing was recorded: the ladder is still in the catalogue.
    expect(
      await first(shed.tools.the_catalogue(shed.when('2026-11-19T10:01:00-05:00'), {})),
    ).toMatchObject({ entries: [{ id: 'ladder' }], position: '1' })
    expect(await retire(luca)).toMatchObject([{ event: 'the_tool_is_retired' }])
  })
})
