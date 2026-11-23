import { describe, expect, test } from 'vitest'
import * as zz from '../../../src/library/index.ts'
import { accounts, all, first, oracle, type Who } from './oracle.ts'

// SC-26 (part 6.1): the base events, which no leaf declares (PER-5, D106):
// `invalid_request` with its formal reason, at the entry of the tree,
// before any node, so that a caller learns nothing the public contract
// does not tell (PER-7); and `identity_already_used`, from the duplicate
// branch of the command port, which crosses the leaf unprojected (DOM-11,
// D79.4), while a retry of the same request is its first outcome, projected
// again. The fingerprint is the library's, at the leaf, over its path and
// the input as sent (D100, LIB-11).

const luca: Who = { identified_by: 'account', id: 'A-LUCA' }
const marta: Who = { identified_by: 'account', id: 'A-MARTA' }
const paolo: Who = { identified_by: 'session', id: 'S-PAOLO' }

const the_shed = async () => {
  const shed = await oracle({
    accounts: accounts({ hats: { 'A-LUCA': ['keeper'], 'A-MARTA': ['member'] } }),
  })
  for (const tool of [
    { id: 'ladder', name: 'Ladder', category: 'ladder' as const },
    { id: 'drill', name: 'Cordless drill', category: 'power' as const },
  ]) {
    await first(shed.tools.add_a_tool(shed.at('2026-11-16T14:00:00.000Z'), tool))
  }
  return shed
}

describe('SC-26, the base events', () => {
  test('an input not in its schema: invalid_request, and nothing recorded', async () => {
    const shed = await the_shed()
    const at = shed.as(luca, '1.0.0').at('2026-11-19T15:00:00.000Z')
    // A field the leaf does not declare, as a client may send it.
    const sent = { tool_id: 'ladder', reason: 'broken' as const, by: 'Luca' }
    expect(await all(shed.keeper.retire_a_tool(at, sent))).toEqual([
      { event: 'invalid_request', reason: 'input_not_in_schema' },
    ])
    // Notes longer than the keeper's form takes (500).
    const long = { tool_id: 'ladder', reason: 'broken' as const, notes: 'x'.repeat(501) }
    expect(await all(shed.keeper.retire_a_tool(at, long))).toEqual([
      { event: 'invalid_request', reason: 'input_not_in_schema' },
    ])
    expect(
      await first(shed.tools.the_catalogue(shed.when('2026-11-19T15:01:00.000Z'), {})),
    ).toMatchObject({ position: '2', total: 2 })
    // The caller reads a formal reason; the trace keeps which field and which rule (D106.3, part 6.2).
    expect(shed.traced()).toMatchObject([
      {
        path: 'persona/keeper/usecase/retire_a_tool',
        operation: { scope: 'keeper/luca' },
        sent,
        answered: { event: 'invalid_request', reason: 'input_not_in_schema' },
        why: {
          closed_by: 'the_input',
          issues: [{ field: [], rule: 'unrecognized_keys' }],
        },
      },
      {
        sent: long,
        why: { closed_by: 'the_input', issues: [{ field: ['notes'], rule: 'too_big' }] },
      },
    ])
    // The field the leaf does not declare, named by the rule's message.
    const [first_rejected] = shed.traced()
    expect(
      first_rejected?.why.closed_by === 'the_input' ? first_rejected.why.issues[0]?.message : '',
    ).toContain('"by"')
  })

  test("before the nodes: Marta, without the keeper's hat, reads invalid_request, not not_found", async () => {
    const shed = await the_shed()
    expect(
      await all(
        shed.keeper.retire_a_tool(shed.as(marta, '1.0.0').at('2026-11-19T15:00:00.000Z'), {
          tool_id: 'ladder',
          reason: 'broken',
          notes: 'x'.repeat(501),
        }),
      ),
    ).toEqual([{ event: 'invalid_request', reason: 'input_not_in_schema' }])
  })

  test('a read: a page too long, or a cursor not of its order (the base64url of "not a cursor"), is invalid_request', async () => {
    const shed = await the_shed()
    const when = shed.as(paolo, '1.0.0').when('2026-11-19T15:00:00.000Z')
    expect(await all(shed.visitor.the_catalogue(when, { page_size: 101 }))).toEqual([
      { event: 'invalid_request', reason: 'input_not_in_schema' },
    ])
    expect(
      await all(shed.visitor.the_catalogue(when, {}, zz.cursor.parse('bm90IGEgY3Vyc29y'))),
    ).toEqual([{ event: 'invalid_request', reason: 'cursor_not_in_schema' }])
  })

  test('identity_already_used crosses the leaf unprojected; a retry is the first outcome again', async () => {
    const shed = await the_shed()
    const luca_at = shed.as(luca, '1.0.0')
    const first_try = await all(
      shed.keeper.retire_a_tool(luca_at.at('2026-11-19T15:00:00.000Z', { operation: 'R-1' }), {
        tool_id: 'ladder',
        reason: 'broken',
      }),
    )
    expect(first_try).toEqual([
      {
        event: 'the_tool_is_retired',
        payload: { tool_id: 'ladder', date: '2026-11-19T15:00:00.000Z' },
      },
    ])
    // His screen got no answer: the retry, its fields in another order, an hour on.
    expect(
      await all(
        shed.keeper.retire_a_tool(luca_at.at('2026-11-19T16:00:00.000Z', { operation: 'R-1' }), {
          reason: 'broken',
          tool_id: 'ladder',
        }),
      ),
    ).toEqual(first_try)
    // The same operation, another request.
    expect(
      await all(
        shed.keeper.retire_a_tool(luca_at.at('2026-11-19T16:00:00.000Z', { operation: 'R-1' }), {
          tool_id: 'drill',
          reason: 'broken',
        }),
      ),
    ).toEqual([{ event: 'identity_already_used' }])
  })
})
