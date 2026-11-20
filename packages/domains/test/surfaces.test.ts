import { describe, expect, test } from 'vitest'
import * as library from '../src/library/index.ts'
import * as ui from '../src/ui/index.ts'

describe('domains', () => {
  test('every domain exposes its index', () => {
    const surfaces = [library, ui]
    for (const surface of surfaces) expect(typeof surface).toBe('object')
  })
})
