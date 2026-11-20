import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import { mounted_leaf_ports, tree_ports } from '../../src/library/index.ts'
import type { MountedInvocation, Mounted, OutsideTheSurface } from '../../src/library/index.ts'
import { persona } from '../shed/persona/_node.ts'
import { registry as persona_registry } from '../shed/persona/_registry.ts'
import { caller } from '../shed/persona/_value.ts'
import { registry as member_registry } from '../shed/persona/member/_registry.ts'
import { majors as member_majors } from '../shed/persona/member/_majors.ts'
import { borrow_a_tool } from '../shed/persona/member/_usecase.ts'
import { accounts, all, first, oracle, type Who } from '../shed/scenarios/oracle.ts'

// A mounted folder (PER-6, "A mounted folder"; EXT-6, EXT-11; part 12.3),
// on the library's test domains. From the side of the tree mounted: a tree
// whose top point is given its context from outside, with no node to take
// it. From the side of the tree it hangs in: leaves of another unit, in no
// registry, given at wiring as data with the port that invokes them, below
// a node, their leaf and input checked before it.

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

/** `persona/member` as if mounted below a node of another tree, which gives it the `Caller`. */
const member_mounted = {
  mounted: 'persona/member',
  context: z.strictObject({ caller }),
} satisfies Mounted

describe('a tree whose top point is given its context from outside (EXT-11)', () => {
  test('Marta’s tree mounted: the context given, the node below still looks up her card', async () => {
    const shed = await the_shed()
    const mounted = tree_ports({
      registry: member_registry,
      versions: shed.versions,
      majors: member_majors,
      top: member_mounted,
      use_cases: { borrow_a_tool },
    })({ invoked: shed.invoked, log: shed.log, trace: shed.trace })
    const at = '2026-11-19T10:00:00-05:00'
    expect(
      await all(
        mounted.borrow_a_tool(shed.as(marta, '2.0.0').at(at), { loan_id: 'L7', tool_id: 'drill' }),
      ),
    ).toMatchObject([{ event: 'you_have_the_tool', payload: { loan_id: 'L7', tool_id: 'drill' } }])
    expect(
      await all(
        mounted.borrow_a_tool(shed.as(luca, '2.0.0').at(at), { loan_id: 'L8', tool_id: 'drill' }),
      ),
    ).toEqual([{ event: 'not_found' }])
  })

  test('at wiring: a node that takes below the mounted folder, a leaf not below it', async () => {
    const shed = await the_shed()
    expect(() =>
      tree_ports({
        registry: { ...persona_registry, ...member_registry },
        versions: shed.versions,
        majors: member_majors,
        top: { ...member_mounted, mounted: 'persona' } satisfies Mounted,
        use_cases: { borrow_a_tool },
      }),
    ).toThrow(
      'persona/node/persona takes from the entry, below the mounted folder persona, whose context is given from outside (EXT-11, PER-6)',
    )
    expect(() =>
      tree_ports({
        registry: member_registry,
        versions: shed.versions,
        majors: member_majors,
        top: { ...member_mounted, mounted: 'persona/keeper' } satisfies Mounted,
        use_cases: { borrow_a_tool },
      }),
    ).toThrow('persona/member/usecase/borrow_a_tool is not below the top, persona/keeper (PER-6)')
  })
})

/** Waving to the shed, a leaf of another unit's surface, mounted below Marta's node. */
const waved = z.strictObject({
  event: z.literal('waved'),
  payload: z.strictObject({ to: z.string() }),
})
const surface = {
  version: '1.2.0',
  majors: {
    1: {
      'usecase/wave': {
        kind: 'command' as const,
        input: z.strictObject({ to: z.string().min(1) }),
        events: { waved },
      },
      'usecase/the_waves': {
        kind: 'read' as const,
        input: z.strictObject({}),
        events: {
          snapshot: z.strictObject({ event: z.literal('snapshot'), entries: z.array(z.string()) }),
        },
      },
    },
  },
}

/** Events as the other unit gives them, one at a time. */
const streamed = async function* (events: readonly unknown[]): AsyncIterable<unknown> {
  for (const event of events) yield await Promise.resolve(event)
}

/** The leaves mounted below `persona/member`, wired: what each invocation was given, and the events outside the surface. */
const waving = async () => {
  const shed = await the_shed()
  const invocations: MountedInvocation[] = []
  const outside: OutsideTheSurface[] = []
  const port = mounted_leaf_ports({
    registry: { ...persona_registry, ...member_registry },
    top: persona,
    at: 'persona/member',
    name: 'waves',
  })({
    invoked: shed.invoked,
    trace: shed.trace,
    surface,
    invokes: (invocation) => {
      invocations.push(invocation)
      return streamed(
        invocation.leaf === 'usecase/the_waves'
          ? [{ event: 'snapshot', entries: ['Marta'] }]
          : [
              { event: 'waved', payload: { to: 'the shed' } },
              { event: 'waved', payload: { to: 42 } },
            ],
      )
    },
    outside_the_surface: (event) => {
      outside.push(event)
    },
  })
  return { shed, port, invocations, outside }
}

describe('leaves mounted from outside, below a node (PER-6, EXT-6)', () => {
  const at = '2026-11-19T10:00:00-05:00'

  test('Marta waves: the invocation has the context the nodes give, her card; an event the surface does not type goes aside', async () => {
    const { shed, port, invocations, outside } = await waving()
    expect(
      await all(
        port(shed.as(marta, '1.0.0').at(at, { operation: 'W1' }), {
          leaf: 'usecase/wave',
          input: { to: 'the shed' },
        }),
      ),
    ).toEqual([{ event: 'waved', payload: { to: 'the shed' } }])
    expect(invocations).toMatchObject([
      {
        leaf: 'usecase/wave',
        version: '1.0.0',
        context: { caller: marta, card: { id: 'M-12' } },
        operation: { id: 'W1', scope: 'keeper/luca' },
        input: { to: 'the shed' },
      },
    ])
    expect(outside).toEqual([
      { leaf: 'usecase/wave', version: '1.0.0', event: { event: 'waved', payload: { to: 42 } } },
    ])
  })

  test('a read takes no operation', async () => {
    const { shed, port, invocations } = await waving()
    expect(
      await all(
        port({ ...shed.as(marta, '1.1.0').when(at) }, { leaf: 'usecase/the_waves', input: {} }),
      ),
    ).toEqual([{ event: 'snapshot', entries: ['Marta'] }])
    expect(invocations[0]).not.toHaveProperty('operation')
  })

  test('Luca, no member: not found, traced, nothing invoked; malformed, invalid before the node', async () => {
    const { shed, port, invocations } = await waving()
    expect(
      await all(
        port(shed.as(luca, '1.0.0').at(at), { leaf: 'usecase/wave', input: { to: 'the shed' } }),
      ),
    ).toEqual([{ event: 'not_found' }])
    expect(
      await all(port(shed.as(luca, '1.0.0').at(at), { leaf: 'usecase/wave', input: { to: '' } })),
    ).toEqual([{ event: 'invalid_request', reason: 'input_not_in_schema' }])
    expect(invocations).toEqual([])
    expect(shed.traced().slice(-2)).toMatchObject([
      { path: 'persona/member/waves/usecase/wave', why: { closed_by: 'a_lookup' } },
      { path: 'persona/member/waves/usecase/wave', why: { closed_by: 'the_input' } },
    ])
  })

  test('the surface’s own gate, before any node; a path it has not', async () => {
    const { shed, port } = await waving()
    expect(
      await all(port(shed.as(luca, '2.0.0').at(at), { leaf: 'usecase/wave', input: { to: 'x' } })),
    ).toEqual([{ event: 'version_not_supported', current: '1.2.0', oldest: 1 }])
    expect(
      await all(port(shed.as(marta, '1.3.0').at(at), { leaf: 'usecase/wave', input: { to: 'x' } })),
    ).toEqual([{ event: 'version_not_supported', current: '1.2.0', oldest: 1 }])
    expect(
      await all(port(shed.as(marta, '1.0.0').at(at), { leaf: 'usecase/dance', input: {} })),
    ).toEqual([{ event: 'invalid_request', reason: 'not_a_leaf' }])
  })

  test('at wiring: a folder not below the top, a surface whose version has no leaves', async () => {
    const shed = await the_shed()
    expect(() =>
      mounted_leaf_ports({
        registry: { ...persona_registry, ...member_registry },
        top: persona,
        at: 'business/loans',
        name: 'waves',
      }),
    ).toThrow('business/loans is not below the top, persona/node/persona (PER-6)')
    expect(() =>
      mounted_leaf_ports({
        registry: { ...persona_registry, ...member_registry },
        top: persona,
        at: 'persona/member',
        name: 'waves',
      })({
        invoked: shed.invoked,
        trace: shed.trace,
        surface: { ...surface, version: '2.0.0' },
        invokes: () => streamed([]),
        outside_the_surface: () => undefined,
      }),
    ).toThrow(
      'persona/member/waves: the surface speaks 2.0.0, a major its leaves are not given at (PER-17, CFG-2)',
    )
  })
})
