import { describe, expect, test } from 'vitest'
import * as library from '../src/library/index.ts'
import * as seals from '../src/seals/index.ts'
import * as post from '../src/post/index.ts'
import * as mailbox from '../src/mailbox/index.ts'
import * as bonds from '../src/bonds/index.ts'
import * as conversations from '../src/conversations/index.ts'
import * as auth from '../src/auth/index.ts'
import * as persona from '../src/persona/index.ts'
import * as user from '../src/user/index.ts'
import * as ui from '../src/ui/index.ts'

describe('domains', () => {
  test('every domain exposes its index', () => {
    const surfaces = [library, seals, post, mailbox, bonds, conversations, auth, persona, user, ui]
    for (const surface of surfaces) expect(typeof surface).toBe('object')
  })
})
