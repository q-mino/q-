import { describe, expect, test } from 'vitest'
import { tree_ports, tree_ports_by_path } from '../../src/library/index.ts'
import { persona } from '../shed/persona/_node.ts'
import { registry as persona_registry } from '../shed/persona/_registry.ts'
import { registry as member_registry } from '../shed/persona/member/_registry.ts'
import { majors as member_majors } from '../shed/persona/member/_majors.ts'
import { borrow_a_tool, my_loans } from '../shed/persona/member/_usecase.ts'
import { visitor } from '../shed/persona/visitor/_version.ts'
import { accounts, all, first, oracle, type Who } from '../shed/scenarios/oracle.ts'

// The ports of a tree by path (EXT-5, PER-6; part 13.2), on the library's
// test domains: one port for a tree's leaves, each named by its path in the
// surface, as a request that came by a letter names it; a path no leaf has,
// `not_a_leaf` after the gate, traced; a tree with no leaf, served so.

const marta: Who = { identified_by: 'account', id: 'A-MARTA' }
const paolo: Who = { identified_by: 'session', id: 'S-PAOLO' }
const at = '2026-11-19T15:00:00.000Z'

const the_shed = async () => {
  const shed = await oracle({
    accounts: accounts({
      hats: { 'A-MARTA': ['member'] },
      member_cards: { 'A-MARTA': { id: 'M-12', valid_until: '2027-03-31' } },
    }),
  })
  await first(
    shed.tools.add_a_tool(shed.at('2026-11-16T14:00:00.000Z'), {
      id: 'drill',
      name: 'Cordless drill',
      category: 'power',
    }),
  )
  return shed
}

/** Marta's tree, by name and by path, over one shed. */
const the_member_s = async () => {
  const shed = await the_shed()
  const declaration = {
    registry: { ...persona_registry, ...member_registry },
    versions: shed.versions,
    majors: member_majors,
    top: persona,
    use_cases: { borrow_a_tool, my_loans },
  }
  const wired = { invoked: shed.invoked, log: shed.log, trace: shed.trace }
  return {
    shed,
    by_name: tree_ports(declaration)(wired),
    by_path: tree_ports_by_path(declaration)(wired),
  }
}

describe('the ports of a tree by path (EXT-5, PER-6)', () => {
  test('a leaf by its path answers as by its name: a command takes the operation, a read none', async () => {
    const { shed, by_name, by_path } = await the_member_s()
    expect(
      await all(
        by_path(shed.as(marta, '2.0.0').at(at, { operation: 'B1' }), {
          leaf: 'usecase/borrow_a_tool',
          input: { loan_id: 'L7', tool_id: 'drill' },
        }),
      ),
    ).toMatchObject([{ event: 'you_have_the_tool', payload: { loan_id: 'L7', tool_id: 'drill' } }])
    // Her loans stream: their first event, the snapshot, by path and by name.
    const later = shed.as(marta, '2.0.0').when('2026-11-19T16:00:00.000Z')
    const read = await first(by_path(later, { leaf: 'usecase/my_loans', input: {} }))
    expect(read).toEqual(await first(by_name.my_loans(later, {})))
    expect(read).toMatchObject({ event: 'snapshot', entries: [{ loan_id: 'L7' }] })
  })

  test('a path no leaf has: the gate first, then not_a_leaf, each traced at that path', async () => {
    const { shed, by_path } = await the_member_s()
    expect(
      await all(by_path(shed.as(marta, '9.0.0').when(at), { leaf: 'usecase/dance', input: {} })),
    ).toEqual([{ event: 'version_not_supported', current: '2.0.0', oldest: 1 }])
    expect(
      await all(by_path(shed.as(marta, '2.0.0').when(at), { leaf: 'usecase/dance', input: {} })),
    ).toEqual([{ event: 'invalid_request', reason: 'not_a_leaf' }])
    expect(shed.traced()).toMatchObject([
      { path: 'persona/member/usecase/dance', why: { closed_by: 'the_gate' } },
      { path: 'persona/member/usecase/dance', why: { closed_by: 'not_a_leaf', major: 2 } },
    ])
  })

  test('a tree with no leaf, only its version: the gate, then not_a_leaf', async () => {
    const shed = await the_shed()
    const version_only = { 'persona/visitor/version/visitor': visitor }
    const nobody_s = tree_ports_by_path({
      registry: { ...persona_registry, ...version_only },
      versions: shed.versions,
      majors: { 1: version_only },
      top: persona,
      use_cases: {},
    })({ invoked: shed.invoked, log: shed.log, trace: shed.trace })
    expect(
      await all(nobody_s(shed.as(paolo, '2.0.0').when(at), { leaf: 'usecase/x', input: {} })),
    ).toEqual([{ event: 'version_not_supported', current: '1.0.0', oldest: 1 }])
    expect(
      await all(
        nobody_s(shed.as(paolo, '1.0.0').when(at), { leaf: 'usecase/the_catalogue', input: {} }),
      ),
    ).toEqual([{ event: 'invalid_request', reason: 'not_a_leaf' }])
    expect(shed.traced().at(-1)).toMatchObject({
      path: 'persona/visitor/usecase/the_catalogue',
      given: { caller: paolo },
      why: { closed_by: 'not_a_leaf', major: 1 },
    })
  })
})
