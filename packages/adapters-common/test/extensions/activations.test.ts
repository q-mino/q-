import * as boundary from '@q-mino/boundary'
import { what_it_asks_more } from '@q-mino/domains/extensions/activations/_dsl.ts'
import { ask_for_the_extensions_in_common } from '@q-mino/domains/extensions/activations/_effect.ts'
import * as zz from '@q-mino/domains/library'
import { known } from '@q-mino/domains/persona/known/_version.ts'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import {
  the_delivery_of_the_extensions_in_common,
  the_manifest_to_accept,
  type AKernelsRequest,
  type AnAnswerToTheKernelsRequest,
} from '../../src/index.ts'
import { a_leaf, the_manifest_of_waves, wave_input, waved } from './fixtures.ts'

// The manifest the composition read, in the words of the kernel's office of
// the extensions (EXT-7, EXT-10, GR-10; part 12.4): `domains` never imports
// `boundary`, so the kernel's adapter translates; and what an update asks
// more, the office's comparison over two translated manifests. The
// delivery of the office's question about the extensions in common over
// the kernel's own port of requests (EXT-8, F7; part 13.3), the port
// played: each answer it can give, mapped.

/** `waves` at its next version, with a second major on `known`, whose leaves the test gives. */
const at_two_majors = (leaves_at_2: Readonly<Record<string, ReturnType<typeof a_leaf>>>) =>
  boundary.below_the_kernels_node('known')({
    version: '2.0.0',
    majors: {
      1: { 'usecase/wave': a_leaf(wave_input, { waved }) },
      2: leaves_at_2,
    },
  })

describe('the manifest to accept (EXT-7, EXT-10)', () => {
  test('a composed manifest in the office’s words: what it sees and touches, its extension points, its leaves on known, its majors', () => {
    expect(the_manifest_to_accept(the_manifest_of_waves())).toEqual({
      name: 'waves',
      version: '1.0.0',
      sees: { known: [] },
      touches: ['the_port_of_requests', 'its_storage'],
      extension_points: [{ point: 'action', name: 'wave', place: 'a_bond' }],
      leaves_on_known: ['usecase/wave'],
      majors: { self: [1], known: [1] },
    })
  })

  test('slots and pages are extension points too; the leaves on known of every major, once; no surface, no major', () => {
    const manifest: boundary.the_manifest = {
      ...the_manifest_of_waves({
        sees: ['the_peer_key'],
        known: at_two_majors({
          'usecase/wave': a_leaf(wave_input, { waved }),
          'usecase/wave_twice': a_leaf(wave_input, { waved }),
        }),
      }),
      slots: { the_waves_of_a_bond: { on: 'a_bond', shows: 'frame/the_waves_of_a_bond.html' } },
      pages: { all_the_waves: { on: 'the_extension', shows: 'frame/all_the_waves.html' } },
    }
    expect(the_manifest_to_accept(manifest)).toMatchObject({
      sees: { known: ['the_peer_key'] },
      extension_points: [
        { point: 'action', name: 'wave', place: 'a_bond' },
        { point: 'slot', name: 'the_waves_of_a_bond', place: 'a_bond' },
        { point: 'page', name: 'all_the_waves', place: 'the_extension' },
      ],
      leaves_on_known: ['usecase/wave', 'usecase/wave_twice'],
      majors: { self: [1], known: [1, 2] },
    })
    const only_self = { ...the_manifest_of_waves(), surfaces: { self: manifest.surfaces.self } }
    expect(the_manifest_to_accept(only_self)).toMatchObject({
      leaves_on_known: [],
      majors: { self: [1], known: [] },
    })
  })
})

describe('what an update asks more (EXT-10)', () => {
  const accepted = the_manifest_to_accept(the_manifest_of_waves())

  test('a name added to what it sees or touches, an extension point added, a leaf added on known', () => {
    const update = the_manifest_to_accept({
      ...the_manifest_of_waves({
        sees: ['the_name_of_the_bond'],
        known: at_two_majors({
          'usecase/wave': a_leaf(wave_input, { waved }),
          'usecase/wave_twice': a_leaf(wave_input, { waved }),
        }),
        actions: {
          wave: { on: 'a_bond', invokes: 'usecase/wave_to_a_bond' },
          wave_from_its_page: { on: 'the_extension', invokes: 'usecase/wave_to_a_bond' },
        },
      }),
    })
    expect(what_it_asks_more(accepted, update)).toEqual([
      { asks: 'to_see_on_known', name: 'the_name_of_the_bond' },
      {
        asks: 'an_extension_point',
        extension_point: { point: 'action', name: 'wave_from_its_page', place: 'the_extension' },
      },
      { asks: 'a_leaf_on_known', leaf: 'usecase/wave_twice' },
    ])
    const touches_more = the_manifest_to_accept(
      the_manifest_of_waves({ touches: ['the_port_of_requests'] }),
    )
    expect(what_it_asks_more(touches_more, accepted)).toEqual([
      { asks: 'to_touch', name: 'its_storage' },
    ])
  })

  test('a new major with the same leaves, a leaf on self, a new version ask no more', () => {
    const update = the_manifest_to_accept(
      the_manifest_of_waves({
        known: at_two_majors({ 'usecase/wave': a_leaf(wave_input, { waved }) }),
        self: boundary.below_the_kernels_node('self')({
          version: '1.0.0',
          majors: {
            1: {
              'usecase/wave_to_a_bond': a_leaf(z.strictObject({ bond: z.string().min(1) }), {}),
              'usecase/wave_to_everyone': a_leaf(z.strictObject({}), {}),
            },
          },
        }),
      }),
    )
    expect(what_it_asks_more(accepted, update)).toEqual([])
  })
})

describe('the delivery of the extensions in common (EXT-8, F7)', () => {
  /** Anna's question Q1 on her bond L_b with Bruno: greetings at major 1 and waves at 1 and 2, offered; 60 seconds. */
  const q1 = {
    id: zz.entry_id.parse('Q1'),
    payload: ask_for_the_extensions_in_common.parse({
      question_id: 'Q1',
      bond: 'L_b',
      offered: [
        { name: 'greetings', majors: [1] },
        { name: 'waves', majors: [1, 2] },
      ],
      waits: 60,
    }),
  }

  /** The kernel's port played: it answers so, and keeps the requests it was called with. */
  const a_port = (answer: AnAnswerToTheKernelsRequest) => {
    const called: AKernelsRequest[] = []
    const port = (request: AKernelsRequest): Promise<AnAnswerToTheKernelsRequest> => {
      called.push(request)
      return Promise.resolve(answer)
    }
    return { port, called }
  }

  /** The leaf's snapshot as Bruno's node gives it (PER-18): one page, every entry. */
  const a_snapshot = (entries: readonly boundary.Json[]) => ({
    event: 'snapshot',
    entries: [...entries],
    position: '7',
    total: entries.length,
  })

  test('the request: the kernel’s read leaf on known at the version of known, what the node offers in the persona’s words, the effect and the entry’s id, the bond, the time', async () => {
    const { port, called } = a_port({ answer: 'no_response' })
    await the_delivery_of_the_extensions_in_common(port)(q1)
    expect(called).toEqual([
      {
        effect: 'extensions/activations/effect/ask_for_the_extensions_in_common',
        id: 'Q1',
        bond: 'L_b',
        invokes: {
          persona: 'known',
          use_case: 'usecase/the_extensions_in_common',
          version: known[zz.$Version],
        },
        input: {
          offered: [
            { extension: 'greetings', majors: [1] },
            { extension: 'waves', majors: [1, 2] },
          ],
        },
        waits: 60,
      },
    ])
  })

  test('the leaf’s snapshot: the extensions in common came back, each extension the office’s name, nothing the peer claims filtered', async () => {
    const { port } = a_port({
      answer: 'responded',
      event: a_snapshot([
        { extension: 'greetings', majors: [1] },
        { extension: 'ping_pong', majors: [3] },
      ]),
    })
    expect(await the_delivery_of_the_extensions_in_common(port)(q1)).toEqual({
      outcome: 'delivered',
      returns: {
        question_id: 'Q1',
        what_came_back: {
          outcome: 'the_extensions_in_common_came_back',
          in_common: [
            { name: 'greetings', majors: [1] },
            { name: 'ping_pong', majors: [3] },
          ],
        },
      },
    })
  })

  test('an empty snapshot: none in common came back', async () => {
    const { port } = a_port({ answer: 'responded', event: a_snapshot([]) })
    expect(await the_delivery_of_the_extensions_in_common(port)(q1)).toEqual({
      outcome: 'delivered',
      returns: {
        question_id: 'Q1',
        what_came_back: { outcome: 'the_extensions_in_common_came_back', in_common: [] },
      },
    })
  })

  test('a closing of the peer’s node or a base event: the peer cannot answer', async () => {
    const closings: readonly boundary.Json[] = [
      { event: 'not_found' },
      { event: 'invalid_request', reason: 'input_not_in_schema' },
      { event: 'version_not_supported', current: '2.0.0', oldest: 2 },
    ]
    for (const event of closings) {
      const { port } = a_port({ answer: 'responded', event })
      expect(await the_delivery_of_the_extensions_in_common(port)(q1)).toEqual({
        outcome: 'delivered',
        returns: {
          question_id: 'Q1',
          what_came_back: { outcome: 'no_answer_came_back', why: 'the_peer_cannot_answer' },
        },
      })
    }
  })

  test('a snapshot that does not parse, by the leaf’s entry or by the office’s set: the peer cannot answer', async () => {
    const not_parsed: readonly boundary.Json[] = [
      a_snapshot([{ name: 'greetings', majors: [1] }]),
      a_snapshot([{ extension: 'greetings', majors: [1], more: true }]),
      a_snapshot([
        { extension: 'greetings', majors: [1] },
        { extension: 'greetings', majors: [2] },
      ]),
      { event: 'snapshot' },
      'snapshot',
    ]
    for (const event of not_parsed) {
      const { port } = a_port({ answer: 'responded', event })
      expect(await the_delivery_of_the_extensions_in_common(port)(q1)).toEqual({
        outcome: 'delivered',
        returns: {
          question_id: 'Q1',
          what_came_back: { outcome: 'no_answer_came_back', why: 'the_peer_cannot_answer' },
        },
      })
    }
  })

  test('no response in its time: no answer came back, no_response', async () => {
    const { port } = a_port({ answer: 'no_response' })
    expect(await the_delivery_of_the_extensions_in_common(port)(q1)).toEqual({
      outcome: 'delivered',
      returns: {
        question_id: 'Q1',
        what_came_back: { outcome: 'no_answer_came_back', why: 'no_response' },
      },
    })
  })

  test('the bond gone: the delivery exhausted, a dead letter (DOM-15)', async () => {
    const { port } = a_port({ answer: 'the_bond_is_gone' })
    expect(await the_delivery_of_the_extensions_in_common(port)(q1)).toEqual({
      outcome: 'exhausted',
      reason: 'the bond is gone',
    })
  })
})
