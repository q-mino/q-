import {
  what_happened_in_a_tree,
  what_happened_in_the_kernel,
  type TheKernelsTraced,
} from '@q-mino/adapters-common'
import * as zz from '@q-mino/domains/library'
import { how_a_closing_ends } from '@q-mino/domains/user/activities/_dsl.ts'
import { what_an_extension_asks } from '@q-mino/domains/user/_dsl.ts'
import { a_manifest } from '@q-mino/domains/user/_value.ts'
import { describe, expect, test } from 'vitest'
import { on_a_cell, the_manifest_shown } from './harness.ts'
import { stories_of_user } from './stories.ts'

// The stories of `user` (packages/domains/src/user/README.md; USR-1..USR-8,
// part 15.2): those over a node on q-'s oracle (`stories.ts`), each phone
// on a cell of its own (TST-2); stories 15 and 16, and the kernel's trace
// told in her words, on the dsl and the adapter's mapping alone, which no
// storage changes.

stories_of_user('on q-’s oracle (part 15.2)', on_a_cell)

describe('user, on the dsl alone (part 15.2)', () => {
  test('what an extension asks, in the order the notice tells it', () => {
    expect(what_an_extension_asks(the_manifest_shown())).toEqual([
      { asks: 'to_send_requests_on_your_bonds' },
      { asks: 'a_storage_of_its_own' },
      { asks: 'to_answer_your_bonds', leaves: ['usecase/ping'] },
      { asks: 'a_place_on_your_screens', point: 'action', name: 'ping', place: 'a_bond' },
      { asks: 'all_that_cumino_reaches' },
    ])
    const with_a_slot = a_manifest.parse({
      ...the_manifest_shown(),
      sees: { known: ['the_name_of_the_bond'] },
      extension_points: [{ point: 'slot', name: 'the_pings', place: 'a_bond' }],
    })
    const asks = what_an_extension_asks(with_a_slot)
    expect(asks[0]).toEqual({ asks: 'to_see_the_name_of_the_bond' })
    expect(asks.at(-1)).toEqual({ asks: 'its_parts_act_with_no_tap' })
  })

  test('how a closing ends: the wait over, the base events and the node’s closings', () => {
    expect(how_a_closing_ends({ event: 'the_wait_is_over', payload: {} })).toEqual({
      ended: 'no_longer_followed',
    })
    for (const event of [
      'invalid_request',
      'version_not_supported',
      'identity_already_used',
      'not_found',
      'refused',
    ]) {
      const said = { event, payload: {} }
      expect(how_a_closing_ends(said)).toEqual({ ended: 'the_app_cannot_do_it', said })
    }
    expect(how_a_closing_ends({ event: 'pong', payload: {} })).toBeUndefined()
  })

  test('each reason of the kernel’s trace is told in her words', () => {
    const now = '2026-11-20T10:00:00.000Z'
    const request = {
      invokes: {
        of: 'an_extension',
        extension: 'ping_pong',
        persona: 'known',
        use_case: 'usecase/ping',
        version: '1.0.0',
      },
      letter: 'P1',
      caller: { is: 'a_face', key: 'K_b' },
      now,
      version: '1.0.0',
    } as const
    const response = { letter: 'R1', answers: 'P1', caller: request.caller, now }
    const extension = 'ping_pong'
    const cases: readonly (readonly [TheKernelsTraced, unknown])[] = [
      [
        { why: 'the_extension_is_not_installed', request },
        { happened: 'a_request_met_silence', extension, because: 'the_extension_is_not_installed' },
      ],
      [
        { why: 'the_extension_is_not_active', request },
        { happened: 'a_request_met_silence', extension, because: 'the_extension_is_not_active' },
      ],
      [
        { why: 'the_extension_is_not_offered_to_the_bond', request },
        {
          happened: 'a_request_met_silence',
          extension,
          because: 'the_extension_is_not_offered_to_the_bond',
        },
      ],
      [
        { why: 'an_envelope_not_opened', came_to: 'D', now, opened: { outcome: 'not_opened' } },
        { happened: 'a_letter_could_not_be_opened' },
      ],
      [
        { why: 'a_response_not_awaited', response, answered: {} },
        { happened: 'a_response_came_unasked' },
      ],
      [
        { why: 'not_a_leaf_of_the_extension', request },
        { happened: 'a_letter_was_refused', leaf: 'usecase/ping' },
      ],
      [
        // The relay out of reach is thrown, handed again at the next pass, never traced (MSG-14).
        { why: 'a_response_not_deposited', response, answered: { outcome: 'not_sealed' } },
        { happened: 'a_response_could_not_be_sent' },
      ],
      [
        {
          why: 'a_request_not_sent',
          request: {
            effect: 'extensions/activations/effect/ask_for_the_extensions_in_common',
            id: 'Q1',
            invokes: {
              of: 'the_kernel',
              persona: 'known',
              use_case: 'usecase/the_extensions_in_common',
              version: '1.0.0',
            },
          },
          now,
          because: 'too_large_for_a_letter',
        },
        { happened: 'a_request_could_not_be_sent' },
      ],
      [
        {
          why: 'a_call_not_declared',
          extension,
          now,
          call: { port: 'its_storage', request: {} },
        },
        { happened: 'an_extension_did_what_it_does_not_declare', extension },
      ],
      [
        {
          why: 'an_event_not_in_the_surface',
          extension,
          now,
          persona: 'self',
          leaf: 'usecase/send_a_ping',
          version: '1.0.0',
          event: {},
          the_event_is: 'not_typed',
        },
        { happened: 'an_extension_did_what_it_does_not_declare', extension },
      ],
      [
        {
          why: 'a_part_fenced',
          extension,
          now,
          fence: 'the_part_is_not_shown',
          message: {},
        },
        { happened: 'an_extension_did_what_it_does_not_declare', extension },
      ],
      [
        {
          why: 'a_message_not_in_the_boundary',
          extension,
          now,
          message: {},
          the_message: 'does_not_parse',
        },
        { happened: 'an_extension_did_what_it_does_not_declare', extension },
      ],
      [
        { why: 'the_extension_has_fallen', extension, now, fall: 'the_first', because: 'full' },
        { happened: 'an_extension_fell', extension, fall: 'the_first' },
      ],
      [
        {
          why: 'a_call_not_answered',
          extension,
          now,
          call: { port: 'its_storage', request: {} },
        },
        { happened: 'a_request_was_not_answered', extension },
      ],
      [
        { why: 'a_request_not_answered', request, because: 'it fell' },
        { happened: 'a_request_was_not_answered', extension },
      ],
    ]
    for (const [traced, told] of cases) expect(what_happened_in_the_kernel(traced)).toEqual(told)
    // A tree's trace (PER-14): a letter refused, its leaf; one of `self`'s, her own request, told by her activity's end.
    const a_tree_s = {
      path: 'persona/known/usecase/the_extensions_in_common',
      given: {},
      version: zz.semver.parse('1.0.0'),
      sent: {},
      answered: { event: 'invalid_request' },
      why: { closed_by: 'not_a_leaf', major: 1 },
    } as const
    expect(what_happened_in_a_tree(a_tree_s)).toEqual({
      happened: 'a_letter_was_refused',
      leaf: 'persona/known/usecase/the_extensions_in_common',
    })
    expect(
      what_happened_in_a_tree({ ...a_tree_s, path: 'persona/self/usecase/rename_a_bond' }),
    ).toBeUndefined()
  })
})
