import { expect, test } from 'vitest'
import * as surface from '../src/index.ts'

test('relay exposes its index', () => {
  expect(typeof surface).toBe('object')
})
