import * as boundary from '@q-mino/boundary'
import { describe, expect, expectTypeOf, test } from 'vitest'
import committed from '../manifest.json' with { type: 'json' }
import package_json from '../package.json' with { type: 'json' }
import { manifest } from '../manifest.ts'
import type { registry } from '../persona/self/_registry.ts'
import { the_manifest_of_ping_pong } from '../the_manifest.ts'

// Ping pong's manifest (PNG-5, EXT-10; part 14.1): its declaration, typed
// by its tree's registry, and its data form, derived by its build and
// committed (`manifest.json`), which must not differ from what the build
// derives now, as `generate:check` keeps the generated files.

describe('the manifest of ping pong (EXT-10)', () => {
  test('the committed manifest.json is what the build derives: run `pnpm --filter @q-mino/ping_pong manifest`', () => {
    expect(boundary.the_manifest.parse(committed)).toEqual(the_manifest_of_ping_pong)
  })

  test('its versions are its package’s and the boundary’s; it sees the bond alone; its action invokes its leaf on self', () => {
    expect(the_manifest_of_ping_pong).toMatchObject({
      name: 'ping_pong',
      version: package_json.version,
      boundary_version: boundary.version,
      sees: { known: [] },
      touches: ['the_port_of_requests', 'its_storage'],
      actions: { ping: { on: 'a_bond', invokes: 'usecase/send_a_ping' } },
      slots: {},
      pages: {},
    })
  })

  test('send_a_ping on self follows its ping: not one event, its wait over among its events', () => {
    const send_a_ping =
      the_manifest_of_ping_pong.surfaces.self?.majors['1']?.['usecase/send_a_ping']
    expect(send_a_ping).toMatchObject({ kind: 'command', answers_in_one_event: false })
    expect(Object.keys(send_a_ping?.events ?? {})).toEqual(
      expect.arrayContaining([
        'the_ping_is_sent',
        'pong',
        'no_response',
        'the_peer_cannot_answer',
        'the_wait_is_over',
      ]),
    )
  })

  test('ping on known: a command that answers in one event, its own events and the kernel’s, whole', () => {
    const ping = the_manifest_of_ping_pong.surfaces.known?.majors['1']?.['usecase/ping']
    expect(ping).toMatchObject({ kind: 'command', answers_in_one_event: true })
    expect(Object.keys(ping?.events ?? {})).toEqual([
      'pong',
      'no_pong',
      'not_found',
      'invalid_request',
      'version_not_supported',
      'identity_already_used',
    ])
    expect(JSON.stringify(ping?.input)).not.toMatch(/x-refined|x-unrepresentable/)
  })

  test('an action whose leaf is no leaf of self does not compile against its registry', () => {
    expectTypeOf<boundary.LeavesOnSelf<typeof registry>>().toEqualTypeOf<'usecase/send_a_ping'>()
    expectTypeOf(manifest).toExtend<boundary.Manifest<typeof registry>>()
    expectTypeOf<{
      name: 'ping_pong'
      touches: []
      actions: { ping: { on: 'a_bond'; invokes: 'usecase/ping' } }
    }>().not.toExtend<boundary.Manifest<typeof registry>>()
  })
})
