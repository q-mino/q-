import * as boundary from '@q-mino/boundary'
import { what_it_asks_more } from '@q-mino/domains/extensions/activations/_dsl.ts'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import { the_manifest_to_accept } from '../../src/index.ts'
import { a_leaf, the_manifest_of_waves, wave_input, waved } from './fixtures.ts'

// The manifest the composition read, in the words of the kernel's office of
// the extensions (EXT-7, EXT-10, GR-10; part 12.4): `domains` never imports
// `boundary`, so the kernel's adapter translates; and what an update asks
// more, the office's comparison over two translated manifests.

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
