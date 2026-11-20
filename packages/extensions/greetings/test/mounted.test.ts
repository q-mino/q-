import { describe, expect, test } from 'vitest'
import { known } from '../persona/known/_node.ts'
import { self } from '../persona/self/_node.ts'

// The test extension's tree, generated with its mounted points (EXT-11, part
// 12.3; a check of part 12.2): each point bound to the context the kernel's
// node gives there, as its configuration names it from `boundary`, and
// nothing more.

describe('the mounted points of an extension’s tree (EXT-11)', () => {
  test('on known the bond, opaque; nothing it does not declare', () => {
    expect(known.mounted).toBe('persona/known')
    expect(known.context.parse({ bond: 'B-1' })).toEqual({ bond: 'B-1' })
    expect(known.context.safeParse({ bond: 'B-1', peer_key: 'K' }).success).toBe(false)
    expect(known.context.safeParse({}).success).toBe(false)
  })

  test('on self the root’s context alone', () => {
    expect(self.mounted).toBe('persona/self')
    expect(self.context.parse({})).toEqual({})
    expect(self.context.safeParse({ bond: 'B-1' }).success).toBe(false)
  })
})
