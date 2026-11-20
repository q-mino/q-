import { describe, expect, test } from 'vitest'
import * as library from '../src/library/index.ts'
import * as auth from '../src/auth/index.ts'
import * as persona from '../src/persona/index.ts'
import * as user from '../src/user/index.ts'
import * as ui from '../src/ui/index.ts'

describe('domains', () => {
  test('every domain exposes its index', () => {
    const surfaces = [library, auth, persona, user, ui]
    for (const surface of surfaces) expect(typeof surface).toBe('object')
  })
})
