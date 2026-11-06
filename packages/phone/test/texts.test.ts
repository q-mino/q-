import { expect, test } from 'vitest'
import { texts } from '../src/texts/index.ts'

test('Italian is the first language and has every update text', () => {
  expect(texts.update.later).toBe('Più tardi')
  expect(texts.update.apply).toBe('Aggiorna')
})
