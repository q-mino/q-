import { describe, expect, test } from 'vitest'
import { route, through_a_frames_fence } from '../../src/index.ts'

// The routing of a request by what it invokes (EXT-6, F8) and a frame's
// fence (EXT-4, EXT-16; part 12.4): pure functions the kernel's entry
// (step 13) and the frames (steps 16, 22) are wired through.

const a_ping = {
  of: 'an_extension',
  extension: 'ping_pong',
  persona: 'known',
  use_case: 'usecase/ping',
  version: '1.0.0',
} as const

describe('the routing of a request (EXT-6, F8)', () => {
  test('the kernel’s use cases are never silent', () => {
    expect(
      route({
        invokes: {
          of: 'the_kernel',
          persona: 'known',
          use_case: 'usecase/the_extensions_in_common',
          version: '1.0.0',
        },
        installed: [],
        active: [],
        offered_to_the_bond_of_the_caller: [],
      }),
    ).toEqual({ routed: 'to_the_kernel' })
  })

  test('an extension’s leaf: not installed, not active, not offered, in that order, else routed', () => {
    const routed = (installed: string[], active: string[], offered: string[]) =>
      route({ invokes: a_ping, installed, active, offered_to_the_bond_of_the_caller: offered })
    expect(routed([], [], [])).toEqual({
      routed: 'to_silence',
      why: 'the_extension_is_not_installed',
    })
    expect(routed(['ping_pong'], [], ['ping_pong'])).toEqual({
      routed: 'to_silence',
      why: 'the_extension_is_not_active',
    })
    expect(routed(['ping_pong'], ['ping_pong'], [])).toEqual({
      routed: 'to_silence',
      why: 'the_extension_is_not_offered_to_the_bond',
    })
    expect(routed(['ping_pong'], ['ping_pong'], ['ping_pong'])).toEqual({
      routed: 'to_an_extension',
      extension: 'ping_pong',
    })
  })
})

describe('a frame’s fence (EXT-4)', () => {
  const now = '2026-11-20T10:00:00+01:00'
  const an_invocation = {
    message: 'invoke',
    id: 'F1',
    use_case: 'usecase/send_a_ping',
    version: '1.0.0',
    input: { bond: 'B-BRUNO' },
  }

  test('served: its own extension’s leaf on self, the name the kernel’s', () => {
    expect(
      through_a_frames_fence({
        frame: { extension: 'ping_pong', shown: true },
        active: true,
        message: an_invocation,
        now,
      }),
    ).toEqual({
      fenced: 'served',
      exchange: 'invoke',
      id: 'F1',
      invokes: {
        of: 'an_extension',
        extension: 'ping_pong',
        persona: 'self',
        use_case: 'usecase/send_a_ping',
        version: '1.0.0',
      },
      input: { bond: 'B-BRUNO' },
    })
  })

  test('refused and traced: not active, not shown, another extension named, a persona named', () => {
    const fenced = (message: unknown, active: boolean, shown: boolean) => {
      const through = through_a_frames_fence({
        frame: { extension: 'ping_pong', shown },
        active,
        message,
        now,
      })
      return through.fenced === 'refused' && through.traced.why === 'a_frame_fenced'
        ? through.traced.fence
        : through.fenced
    }
    expect(fenced(an_invocation, false, true)).toBe('the_extension_is_not_active')
    expect(fenced(an_invocation, true, false)).toBe('the_frame_is_not_shown')
    expect(fenced({ ...an_invocation, extension: 'greetings' }, true, true)).toBe(
      'not_a_frames_message',
    )
    expect(fenced({ ...an_invocation, persona: 'known' }, true, true)).toBe('not_a_frames_message')
  })
})
