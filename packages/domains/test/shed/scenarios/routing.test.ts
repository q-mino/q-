import { describe, expect, test } from 'vitest'
import * as fc from 'fast-check'
import * as wlib from '../wlib.ts'
import { first, oracle } from './oracle.ts'
import { at_once, serially } from './serial.ts'

// The routing of commands as properties (TST-9, TST-5; LIB-1: the duplicate
// branch, the conditions, the fact with its envelope), over `tools`' life
// cycle on the oracle, with arbitraries written by hand: what the library
// guarantees whatever the business decides (TST-8). One operation records
// one fact; a retry of it is that fact, another request under it
// `identity_already_used`; a rejection records nothing and names every
// branch; positions are never given twice; requests at the same time give
// the outcomes of one of their serial orders.

type Shed = Awaited<ReturnType<typeof oracle>>

/** The branches of each command, in their order: what a rejection names (none held). */
const branches = {
  add_a_tool: ['the_tool_is_new_so_it_is_added'],
  retire_a_tool: [
    'the_tool_is_in_service_so_it_is_retired',
    'the_tool_is_beyond_repair_so_it_is_retired',
    'the_tool_is_already_retired_so_nothing_changes',
  ],
  send_a_tool_to_repair: [
    'the_tool_is_in_service_so_it_goes_to_repair',
    'the_tool_is_already_in_the_workshop_so_nothing_changes',
    'the_tool_is_retired_so_nothing_changes',
  ],
  put_a_repaired_tool_back_in_service: ['the_tool_is_in_the_workshop_so_it_is_back_in_service'],
} as const

type Use = keyof typeof branches

/** A request of Luca's or Anna's, as a scenario writes it: what, on which tool, under which operation. */
interface Sent {
  readonly use: Use
  readonly tool: 'drill' | 'sander'
  /** A variant of the input under the same use: another name, another reason. */
  readonly variant: 0 | 1
  readonly operation: 'O1' | 'O2' | 'O3' | 'O4'
  readonly scope: 'keeper/luca' | 'keeper/anna'
}

const a_request: fc.Arbitrary<Sent> = fc.record({
  use: fc.constantFrom<Use>(
    'add_a_tool',
    'retire_a_tool',
    'send_a_tool_to_repair',
    'put_a_repaired_tool_back_in_service',
  ),
  tool: fc.constantFrom('drill', 'sander'),
  variant: fc.constantFrom(0, 1),
  operation: fc.constantFrom('O1', 'O2', 'O3', 'O4'),
  scope: fc.constantFrom('keeper/luca', 'keeper/anna'),
})

/** The input of a request, as sent. */
const input_of = (sent: Sent): unknown => {
  switch (sent.use) {
    case 'add_a_tool':
      return a_tool(sent)
    case 'retire_a_tool':
      return a_retirement(sent)
    case 'send_a_tool_to_repair':
    case 'put_a_repaired_tool_back_in_service':
      return { tool_id: sent.tool }
  }
}

/** The tool Luca adds, under one of two names. */
const a_tool = (sent: Sent) =>
  ({
    id: sent.tool,
    name: sent.variant === 0 ? `The ${sent.tool}` : `A ${sent.tool}`,
    category: 'power',
  }) as const

/** The tool Luca retires, for one of two reasons. */
const a_retirement = (sent: Sent) =>
  ({ id: sent.tool, reason: sent.variant === 0 ? 'broken' : 'lost' }) as const

/** A request sent to its port on Thursday, its outcome as the port gives it. */
const send =
  (sent: Sent) =>
  (shed: Shed): Promise<unknown> => {
    const context = shed.at('2026-11-19T10:00:00-05:00', {
      operation: sent.operation,
      scope: sent.scope,
    })
    switch (sent.use) {
      case 'add_a_tool':
        return first(shed.tools.add_a_tool(context, a_tool(sent)))
      case 'retire_a_tool':
        return first(shed.tools.retire_a_tool(context, a_retirement(sent)))
      case 'send_a_tool_to_repair':
        return first(shed.tools.send_a_tool_to_repair(context, { tool_id: sent.tool }))
      case 'put_a_repaired_tool_back_in_service':
        return first(
          shed.tools.put_a_repaired_tool_back_in_service(context, { tool_id: sent.tool }),
        )
    }
  }

/** The parts of an outcome a property reads. */
const read = (outcome: unknown) => {
  const fields: Readonly<Record<string, unknown>> =
    typeof outcome === 'object' && outcome !== null ? { ...outcome } : {}
  const failures = Array.isArray(fields['failures']) ? fields['failures'] : []
  return {
    outcome: fields['outcome'],
    position: fields['position'],
    branches_named: new Set(
      failures.flatMap((failure: unknown) =>
        typeof failure === 'object' && failure !== null && 'branch' in failure
          ? [failure.branch]
          : [],
      ),
    ),
  }
}

describe('the routing of commands, as properties (TST-9)', () => {
  test('one operation, one fact; a retry is that fact; another request under it, identity already used', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(a_request, { minLength: 1, maxLength: 12 }), async (requests) => {
        const shed = await oracle()
        const recorded = new Map<string, { readonly request: string; readonly outcome: unknown }>()
        let facts = 0
        for (const sent of requests) {
          const outcome = await send(sent)(shed)
          const key = `${sent.scope} ${sent.operation}`
          const request = wlib.canonical_json([sent.use, input_of(sent)])
          const first_time = recorded.get(key)
          const got = read(outcome)
          if (first_time !== undefined) {
            expect(outcome).toEqual(
              first_time.request === request
                ? first_time.outcome
                : { outcome: 'identity_already_used' },
            )
          } else if (got.outcome === 'applied') {
            facts += 1
            expect(got.position).toBe(String(facts))
            expect(outcome).toMatchObject({
              fact: { operation: { id: sent.operation, scope: sent.scope } },
            })
            recorded.set(key, { request, outcome })
          } else {
            expect(got.outcome).toBe('rejected')
            expect(got.branches_named).toEqual(new Set(branches[sent.use]))
          }
        }
      }),
      { numRuns: 150 },
    )
  })

  test('requests at the same time give the outcomes of one of their serial orders (TST-5)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(a_request, { minLength: 2, maxLength: 4 }), async (requests) => {
        // A shed with the drill, so that the requests meet a tool in its life.
        const fresh = async () => {
          const shed = await oracle()
          await first(
            shed.tools.add_a_tool(shed.at('2026-11-16T09:00:00-05:00', { operation: 'O0' }), {
              id: 'drill',
              name: 'The drill',
              category: 'power',
            }),
          )
          return shed
        }
        const sent = requests.map(send)
        expect(await serially(fresh, sent)).toContainEqual(await at_once(fresh, sent))
      }),
      { numRuns: 60 },
    )
  })
})
