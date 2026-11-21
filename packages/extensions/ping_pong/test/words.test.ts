import * as boundary from '@q-mino/boundary'
import { describe, expect, test } from 'vitest'
import it from '../texts/it.json' with { type: 'json' }
import { the_manifest_of_ping_pong } from '../the_manifest.ts'

// Ping pong's words (EXT-16, WEB-22; part 22.2): its texts the kernel draws
// in its mark, in Italian (provisional, A to confirm: words she reads),
// parsed as the kernel parses them; a label for each of its actions, and
// words for each of its own events on `self`. The events the kernel tells in
// its own words (the base events, the wait over: USR-3) need none.

/** The events of a leaf on `self` the kernel tells in its own words (USR-3): its base events and the wait over. */
const told_by_the_kernel = new Set([
  'invalid_request',
  'version_not_supported',
  'identity_already_used',
  'the_wait_is_over',
])

describe('the words of ping pong (EXT-16)', () => {
  const words = boundary.the_words_of_an_extension.parse(it)

  test('each of its actions has a label: "Ping"', () => {
    expect(Object.keys(words.actions)).toEqual(Object.keys(the_manifest_of_ping_pong.actions))
    expect(words.actions['ping']).toBe('Ping')
  })

  test('each of its own events on self has words, and no word is for an event it does not have', () => {
    const own = Object.values(the_manifest_of_ping_pong.surfaces.self?.majors ?? {})
      .flatMap((leaves) => Object.values(leaves))
      .flatMap((leaf) => Object.keys(leaf.events))
      .filter((event) => !told_by_the_kernel.has(event))
    expect(Object.keys(words.events).sort()).toEqual([...new Set(own)].sort())
  })
})
