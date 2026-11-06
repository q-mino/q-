import { expect, test } from 'vitest'
import * as surface from '../src/index.ts'

test('adapters-web exposes its index', () => {
  expect(typeof surface).toBe('object')
})
