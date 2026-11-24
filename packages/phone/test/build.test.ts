import { describe, expect, test } from 'vitest'
import { the_policy_of_the_app } from '../build/the_policy.ts'

// The app's policy (PWA-4): measured in a browser at step 25 (the preview:
// libsodium's WebAssembly compiles), its form here; since 24 Nov 2026 no
// script by its hash, the extensions integrated (EXT-13).

describe('the app’s policy', () => {
  test('its own files, WebAssembly, the relay’s origin, no frame, no script by its hash', () => {
    const policy = the_policy_of_the_app('https://relay.cumino.test/some/path').split('; ')
    expect(policy).toContain("script-src 'self' 'wasm-unsafe-eval'")
    expect(policy).toContain("connect-src 'self' https://relay.cumino.test")
    expect(policy).toContain("frame-src 'none'")
    expect(policy).toContain("default-src 'self'")
    expect(policy.some((each) => each.includes("'unsafe-eval'"))).toBe(false)
    expect(policy.some((each) => each.includes("'sha256-"))).toBe(false)
  })
})
