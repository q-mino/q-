import { describe, expect, test } from 'vitest'
import * as library from '../src/library/index.ts'

describe('domains', () => {
  test('every domain exposes its index', () => {
    const surfaces = [library]
    for (const surface of surfaces) expect(typeof surface).toBe('object')
  })
})
