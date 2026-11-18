import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import { identity_of, operation_id } from '../../src/library/index.ts'

// The stable functions (LIB-10, TST-7; part 3.2): re-read against their
// corpus at every run. An undeclared change of a value below is a fault: an
// identity derived before it would no longer be found. The corpus was
// computed with another SHA-256 (Node's), so it checks the library's too,
// over one block and over many.

describe('identity_of, the identity of the instance an operation opens (DOM-12)', () => {
  const an_id = z.string().min(1).brand<'an_id'>()
  const operation = (scope: string, id: string) => ({ scope, id: operation_id.parse(id) })

  // The corpus: an operation's scope and id, the identity it opens.
  test.each([
    ['member/A-7', 'O-1', 'OzKxsg-alANAAKxGVj3lCaxUsLhHFNJR3j3hLegUTW4'],
    [
      'keeper/K-1',
      '2b9c0e4e-1f8a-4c5d-9a71-0e3f6c2d8b14',
      'Lp9Sfe2Cw3q3O6DCfyBU9G9Gv7uBJEUOpUOgZxMD7cw',
    ],
    [
      'reaction/damage/reaction/the_damaged_tool_goes_to_repair',
      'F1 0',
      'B_A-PJTQJEXl6T9yGW9o-LlvL6Gh-DIdNjdM0CSUow0',
    ],
    ['', 'x', 'kkpJGeNYsamk716J36nfR9VuKNuqlBoJSH6ZkBZBjI4'],
    ['visitor/S-9', 'Città 🛠', 'R7MuEfNGF2P0jVehbBrpSJ7U0l2Kx3zcUVOiNJyCQkM'],
    ['a'.repeat(1000), 'x', 'ZV9r93TXHAw7-vaOaI2PzkoGFLSDZDqMM7vNUa1iwps'],
  ])('%s · %s', (scope, id, identity) => {
    expect(identity_of(an_id)(operation(scope, id))).toBe(identity)
  })

  test('a retry is the same instance; another operation, or the same id in another scope, another', () => {
    const first = identity_of(an_id)(operation('keeper/K-1', 'O-1'))
    expect(identity_of(an_id)(operation('keeper/K-1', 'O-1'))).toBe(first)
    expect(identity_of(an_id)(operation('keeper/K-1', 'O-2'))).not.toBe(first)
    expect(identity_of(an_id)(operation('member/K-1', 'O-1'))).not.toBe(first)
  })

  test('the scope and the id are told apart, so no two operations meet by concatenation', () => {
    expect(identity_of(an_id)(operation('a/b', 'c'))).not.toBe(
      identity_of(an_id)(operation('a', 'b/c')),
    )
  })

  test("the identity is in the identity's format, which may refuse it", () => {
    expect(an_id.safeParse(identity_of(an_id)(operation('a', 'b'))).success).toBe(true)
    const short = z.string().max(8)
    expect(() => identity_of(short)(operation('a', 'b'))).toThrow()
  })
})
