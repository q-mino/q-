import { createHash } from 'node:crypto'
import { describe, expect, test } from 'vitest'
import { the_hash_of, the_policy_of_the_app } from '../build/the_realms.ts'

// The app's policy (PWA-4): measured in a browser at step 25 (the preview:
// the realm's script runs under the policy its frame inherits, a script with
// another hash does not, libsodium's WebAssembly compiles), its form here.

describe('the app’s policy', () => {
  test('a realm’s script is named by the hash of its text as the frame holds it inline', () => {
    const script = 'parent.postMessage("</script>", "*")'
    const inline = 'parent.postMessage("<\\/script>", "*")'
    expect(the_hash_of(script)).toBe(
      `'sha256-${createHash('sha256').update(inline, 'utf8').digest('base64')}'`,
    )
  })

  test('its own files, the realms by hash, WebAssembly, the relay’s origin, no frame navigates', () => {
    const policy = the_policy_of_the_app(['a()'], 'https://relay.cumino.test/some/path').split('; ')
    expect(policy).toContain(`script-src 'self' 'wasm-unsafe-eval' ${the_hash_of('a()')}`)
    expect(policy).toContain("connect-src 'self' https://relay.cumino.test")
    expect(policy).toContain("frame-src 'none'")
    expect(policy).toContain("default-src 'self'")
    expect(policy.some((each) => each.includes("'unsafe-eval'"))).toBe(false)
  })
})
