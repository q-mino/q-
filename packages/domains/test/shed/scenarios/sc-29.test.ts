import { describe, expect, test } from 'vitest'
import * as zz from '../../../src/library/index.ts'
import { accounts, all, first, oracle, type Who } from './oracle.ts'
import { persona } from '../persona/_node.ts'
import { registry as persona_registry } from '../persona/_registry.ts'
import { registry as member_registry } from '../persona/member/_registry.ts'
import { majors as member_majors } from '../persona/member/_majors.ts'
import { borrow_a_tool } from '../persona/member/_usecase.ts'

// SC-29, the gate (part 6.4; PER-17, A, 17 Nov 2026): `version_not_supported`
// is a base event of every leaf, at the entry of the tree, before any node,
// so that no lookup runs. The window is the tree's majors, its folders: it
// stops a major the tree has not and the current major at a higher minor,
// the patch not counted, and tells the version the tree speaks and its
// oldest major. A request it stops records no fact, and goes to the trace.

const marta: Who = { identified_by: 'account', id: 'A-MARTA' }
const gianni: Who = { identified_by: 'account', id: 'A-GIANNI' }
const paolo: Who = { identified_by: 'account', id: 'A-PAOLO' }
const luca: Who = { identified_by: 'account', id: 'A-LUCA' }

const the_shed = async () => {
  const shed = await oracle({
    accounts: accounts({
      hats: {
        'A-MARTA': ['member'],
        'A-GIANNI': ['member'],
        'A-PAOLO': ['member'],
        'A-LUCA': ['keeper'],
      },
      member_cards: {
        'A-MARTA': { id: 'M-12', valid_until: '2027-03-31' },
        'A-GIANNI': { id: 'M-7', valid_until: '2027-03-31' },
        'A-PAOLO': { id: 'M-3', valid_until: '2027-03-31' },
      },
    }),
  })
  await first(
    shed.tools.add_a_tool(shed.at('2026-11-05T08:00:00-05:00'), {
      id: 'drill',
      name: 'Cordless drill',
      category: 'power',
    }),
  )
  return shed
}

const stopped = { event: 'version_not_supported', current: '2.0.0', oldest: 1 }

describe('SC-29: the gate', () => {
  test('Gianni’s app at 2.1.0 meets a shed still at 2.0.0: stopped before any node, not `invalid_request`', async () => {
    const shed = await the_shed()
    expect(
      await all(
        shed.member.borrow_a_tool(shed.as(gianni, '2.1.0').at('2026-11-05T10:00:00-05:00'), {
          loan_id: 'L5',
          tool_id: 'drill',
        }),
      ),
    ).toEqual([stopped])
    // Luca, with no member card, is stopped by the gate too: no lookup ran.
    expect(
      await all(shed.member.my_loans(shed.as(luca, '2.1.0').when('2026-11-05T10:01:00-05:00'), {})),
    ).toEqual([stopped])
    expect(
      shed.traced().map(({ path, version, answered, why }) => ({ path, version, answered, why })),
    ).toEqual([
      {
        path: 'persona/member/usecase/borrow_a_tool',
        version: '2.1.0',
        answered: stopped,
        why: { closed_by: 'the_gate', current: '2.0.0', oldest: 1 },
      },
      {
        path: 'persona/member/usecase/my_loans',
        version: '2.1.0',
        answered: stopped,
        why: { closed_by: 'the_gate', current: '2.0.0', oldest: 1 },
      },
    ])
    expect(
      await first(
        shed.loans.the_ongoing_loans_of_a_member(shed.when('2026-11-05T10:02:00-05:00'), {
          member_id: 'M-7',
        }),
      ),
    ).toMatchObject({ entries: [] })
  })

  test('the patch does not count: 2.0.7 is served as 2.0.0', async () => {
    const shed = await the_shed()
    expect(
      await all(
        shed.member.borrow_a_tool(shed.as(gianni, '2.0.7').at('2026-11-05T10:00:00-05:00'), {
          loan_id: 'L5',
          tool_id: 'drill',
        }),
      ),
    ).toEqual([
      {
        event: 'you_have_the_tool',
        payload: { loan_id: 'L5', tool_id: 'drill', due_day: '2026-11-19' },
      },
    ])
  })

  test('a client at 3.0.0 meets an instance still at 2.0.0 during a release: stopped', async () => {
    const shed = await the_shed()
    // A major the tree has not: the type gives its leaf no input, so the
    // client is one whose version the type does not know.
    const newer = zz.semver.parse('3.0.0')
    expect(
      await all(
        shed.member.borrow_a_tool(shed.as(marta, newer).at('2026-11-05T10:00:00-05:00'), {
          loan_id: 'L7',
          tool_id: 'drill',
        }),
      ),
    ).toEqual([stopped])
  })

  test('on 1 March `1/` is deleted: Paolo’s phone at 1.2.0, served the day before, is stopped', async () => {
    const shed = await the_shed()
    const older = zz.semver.parse('1.2.0')
    const sent = { loan_id: 'L9', tool_id: 'drill' }
    // Before: the leaf of 1.x answers in its words.
    expect(
      await all(
        shed.member.borrow_a_tool(shed.as(paolo, older).at('2026-11-05T10:00:00-05:00'), sent),
      ),
    ).toMatchObject([
      { event: 'you_have_the_tool', payload: { due_date: '2026-11-19T23:59:59.999-05:00' } },
    ])
    // After: a release whose `_majors.ts` lists 2.0.0 alone.
    const released = zz.tree_ports({
      registry: { ...persona_registry, ...member_registry },
      versions: shed.versions,
      majors: { 2: member_majors[2] },
      top: persona,
      use_cases: { borrow_a_tool },
    })({ invoked: shed.invoked, log: shed.log, trace: shed.trace })
    expect(
      await all(
        released.borrow_a_tool(shed.as(paolo, older).at('2027-03-01T10:00:00-05:00'), sent),
      ),
    ).toEqual([{ event: 'version_not_supported', current: '2.0.0', oldest: 2 }])
  })
})
