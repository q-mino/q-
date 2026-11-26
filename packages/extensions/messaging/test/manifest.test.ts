import * as boundary from '@q-mino/boundary'
import { describe, expect, expectTypeOf, test } from 'vitest'
import committed from '../manifest.json' with { type: 'json' }
import package_json from '../package.json' with { type: 'json' }
import { manifest } from '../manifest.ts'
import type { registry } from '../persona/self/_registry.ts'
import { the_manifest_of_messaging } from '../the_manifest.ts'

// Messaging's manifest (MSG-10, EXT-10; part M2): its declaration, typed by
// its tree's registry, and its data form, derived by its build and committed
// (`manifest.json`), which must not differ from what the build derives now,
// as `generate:check` keeps the generated files.

describe('the manifest of messaging (EXT-10, MSG-10)', () => {
  test('the committed manifest.json is what the build derives: run `pnpm --filter @q-mino/messaging manifest`', () => {
    expect(boundary.the_manifest.parse(committed)).toEqual(the_manifest_of_messaging)
  })

  test('its versions are its package’s and the boundary’s; it sees the declared time; its slot on a bond; no action, no page', () => {
    expect(the_manifest_of_messaging).toMatchObject({
      name: 'messaging',
      version: package_json.version,
      boundary_version: boundary.version,
      sees: { known: ['the_declared_time'] },
      touches: ['the_port_of_requests', 'its_storage'],
      actions: {},
      slots: { the_chat: { on: 'a_bond', shows: 'parts/the_chat.js' } },
      pages: {},
    })
  })

  test('on self: two commands in one event, two reads that stream', () => {
    const majors = the_manifest_of_messaging.surfaces.self?.majors['1']
    expect(Object.keys(majors ?? {}).toSorted()).toEqual([
      'usecase/a_chat',
      'usecase/a_chat_at_a_glance',
      'usecase/read_a_chat',
      'usecase/write_a_message',
    ])
    expect(majors?.['usecase/write_a_message']).toMatchObject({
      kind: 'command',
      answers_in_one_event: true,
    })
    expect(majors?.['usecase/read_a_chat']).toMatchObject({
      kind: 'command',
      answers_in_one_event: true,
    })
    for (const read of ['usecase/a_chat', 'usecase/a_chat_at_a_glance']) {
      expect(majors?.[read]).toMatchObject({ kind: 'read', answers_in_one_event: false })
      expect(Object.keys(majors?.[read]?.events ?? {})).toEqual([
        'snapshot',
        'fact',
        'entered',
        'left',
        'caught_up',
        'position_unavailable',
        'invalid_request',
        'version_not_supported',
      ])
    }
  })

  test('message on known: a command that answers in one event, its own events and the kernel’s, whole; its input with no refinement', () => {
    const message = the_manifest_of_messaging.surfaces.known?.majors['1']?.['usecase/message']
    expect(message).toMatchObject({ kind: 'command', answers_in_one_event: true })
    expect(Object.keys(message?.events ?? {})).toEqual([
      'received',
      'not_received',
      'not_found',
      'invalid_request',
      'version_not_supported',
      'identity_already_used',
    ])
    expect(JSON.stringify(message?.input)).not.toMatch(/x-refined|x-unrepresentable|x-lossy/)
    expect(message?.input).toMatchObject({
      properties: { text: { type: 'string', minLength: 1, maxLength: 4_000 } },
    })
  })

  test('its declaration is typed by the registry of self', () => {
    expectTypeOf<boundary.LeavesOnSelf<typeof registry>>().toEqualTypeOf<
      | 'usecase/write_a_message'
      | 'usecase/read_a_chat'
      | 'usecase/a_chat'
      | 'usecase/a_chat_at_a_glance'
    >()
    expectTypeOf(manifest).toExtend<boundary.Manifest<typeof registry>>()
  })
})
