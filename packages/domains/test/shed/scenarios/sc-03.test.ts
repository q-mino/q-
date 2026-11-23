import { describe, expect, test } from 'vitest'
import { first, oracle } from './oracle.ts'
import { a_shed_with, drill, sander } from './shed.ts'

// SC-3: the same command sent twice: the duplicate branch gives the fact
// recorded; the same operation with another input is `identity_already_used`
// (DOM-11, D100, D106). The duplicate branch runs first, in the adapter's
// step (DOM-9); the library compares the fingerprint it computes where the
// request enters, over the path and the input as sent (LIB-11).

describe('SC-3, the same command sent twice', () => {
  test("Luca's answer is lost and his phone sends the drill again: the fact recorded, at its position", async () => {
    const shed = await oracle()
    const monday = shed.at('2026-11-16T14:00:00.000Z', { operation: 'A1' })
    const added = await first(shed.tools.add_a_tool(monday, drill))
    expect(added).toMatchObject({
      outcome: 'applied',
      branch: 'the_tool_is_new_so_it_is_added',
      position: '1',
    })
    const again = shed.at('2026-11-16T14:01:00.000Z', { operation: 'A1' })
    expect(await first(shed.tools.add_a_tool(again, drill))).toEqual(added)
    // One fact: the next one is the second.
    expect(
      await first(shed.tools.add_a_tool(shed.at('2026-11-16T14:02:00.000Z'), sander)),
    ).toMatchObject({ outcome: 'applied', position: '2' })
  })

  test('the fields in another order are the same request (D100: equal as structures)', async () => {
    const shed = await oracle()
    const added = await first(
      shed.tools.add_a_tool(shed.at('2026-11-16T14:00:00.000Z', { operation: 'A1' }), drill),
    )
    expect(
      await first(
        shed.tools.add_a_tool(shed.at('2026-11-16T14:01:00.000Z', { operation: 'A1' }), {
          category: 'power',
          name: 'Cordless drill',
          id: 'drill',
        }),
      ),
    ).toEqual(added)
  })

  test('two branches record one fact: the duplicate names the branch applied, as stored', async () => {
    const shed = await a_shed_with(drill)
    await first(shed.tools.send_a_tool_to_repair(shed.at('2026-11-17T14:00:00.000Z'), drill_id))
    const retire = { id: 'drill', reason: 'broken' } as const
    const retired = await first(
      shed.tools.retire_a_tool(shed.at('2026-11-18T14:00:00.000Z', { operation: 'R1' }), retire),
    )
    expect(retired).toMatchObject({
      outcome: 'applied',
      branch: 'the_tool_is_beyond_repair_so_it_is_retired',
      fact: { parts: [{ path: 'business/tools/fact/a_tool_has_been_retired' }] },
    })
    expect(
      await first(
        shed.tools.retire_a_tool(shed.at('2026-11-18T14:05:00.000Z', { operation: 'R1' }), retire),
      ),
    ).toEqual(retired)
  })

  test('Marta returns the drill, and her phone sends her loan again: the loan recorded, not a new one', async () => {
    const shed = await a_shed_with(drill)
    const borrow = { loan_id: 'L11', tool_id: 'drill', member_id: 'M-12' }
    const marta = { operation: 'L11', scope: 'member/M-12' }
    const lent = await first(
      shed.loans.borrow_a_tool(shed.at('2026-11-19T15:00:00.000Z', marta), borrow),
    )
    expect(lent).toMatchObject({
      outcome: 'applied',
      branch: 'the_tool_is_available_so_it_is_lent',
      position: '2',
    })
    await first(
      shed.loans.return_a_tool(shed.at('2026-11-19T23:00:00.000Z', { scope: 'member/M-12' }), {
        loan_id: 'L11',
        tool_id: 'drill',
        condition: 'good',
      }),
    )
    // Without the duplicate branch the drill, back on the shelf, would be
    // lent again: a loan she did not ask for.
    expect(
      await first(shed.loans.borrow_a_tool(shed.at('2026-11-19T23:01:00.000Z', marta), borrow)),
    ).toEqual(lent)
    expect(
      await first(shed.tools.add_a_tool(shed.at('2026-11-19T23:02:00.000Z'), sander)),
    ).toMatchObject({ outcome: 'applied', position: '4' })
  })

  test('the same operation with another input: identity already used, and nothing recorded', async () => {
    const shed = await oracle()
    await first(
      shed.tools.add_a_tool(shed.at('2026-11-16T14:00:00.000Z', { operation: 'A1' }), drill),
    )
    expect(
      await first(
        shed.tools.add_a_tool(shed.at('2026-11-16T14:01:00.000Z', { operation: 'A1' }), sander),
      ),
    ).toEqual({ outcome: 'identity_already_used' })
    expect(
      await first(shed.tools.add_a_tool(shed.at('2026-11-16T14:02:00.000Z'), sander)),
    ).toMatchObject({ outcome: 'applied', branch: 'the_tool_is_new_so_it_is_added', position: '2' })
  })

  test('the same operation for another use case: identity already used (the path is in the fingerprint)', async () => {
    const shed = await a_shed_with(drill)
    await first(
      shed.tools.send_a_tool_to_repair(
        shed.at('2026-11-17T14:00:00.000Z', { operation: 'X1' }),
        drill_id,
      ),
    )
    expect(
      await first(
        shed.tools.put_a_repaired_tool_back_in_service(
          shed.at('2026-11-17T14:05:00.000Z', { operation: 'X1' }),
          drill_id,
        ),
      ),
    ).toEqual({ outcome: 'identity_already_used' })
  })

  test('one id in two scopes is two operations (DOM-11: the scope is Caller and hat)', async () => {
    const shed = await a_shed_with(drill, sander)
    const marta = await first(
      shed.loans.borrow_a_tool(
        shed.at('2026-11-19T15:00:00.000Z', { operation: 'O-1', scope: 'member/M-12' }),
        { loan_id: 'L11', tool_id: 'drill', member_id: 'M-12' },
      ),
    )
    const gianni = await first(
      shed.loans.borrow_a_tool(
        shed.at('2026-11-19T15:00:00.000Z', { operation: 'O-1', scope: 'member/M-7' }),
        { loan_id: 'L12', tool_id: 'sander', member_id: 'M-7' },
      ),
    )
    expect([marta, gianni]).toMatchObject([
      { outcome: 'applied', position: '3' },
      { outcome: 'applied', position: '4' },
    ])
  })

  test('a rejection records nothing: its retry is tried again, on the state it meets', async () => {
    const shed = await a_shed_with(drill)
    await first(
      shed.loans.borrow_a_tool(shed.at('2026-11-19T15:00:00.000Z', { scope: 'member/M-12' }), {
        loan_id: 'L11',
        tool_id: 'drill',
        member_id: 'M-12',
      }),
    )
    const gianni = { operation: 'L12', scope: 'member/M-7' }
    const borrow = { loan_id: 'L12', tool_id: 'drill', member_id: 'M-7' }
    expect(
      await first(shed.loans.borrow_a_tool(shed.at('2026-11-19T16:00:00.000Z', gianni), borrow)),
    ).toMatchObject({ outcome: 'rejected' })
    await first(
      shed.loans.return_a_tool(shed.at('2026-11-19T17:00:00.000Z', { scope: 'member/M-12' }), {
        loan_id: 'L11',
        tool_id: 'drill',
        condition: 'good',
      }),
    )
    expect(
      await first(shed.loans.borrow_a_tool(shed.at('2026-11-19T17:05:00.000Z', gianni), borrow)),
    ).toMatchObject({
      outcome: 'applied',
      branch: 'the_tool_is_available_so_it_is_lent',
      position: '4',
    })
  })
})

const drill_id = { tool_id: 'drill' } as const
