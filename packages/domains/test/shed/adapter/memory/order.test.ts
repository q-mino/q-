import { describe, expect, test } from 'vitest'
import { compare_values } from './index.ts'

// The value order of the oracle (LIB-9, D109), an interpreter rule (V10):
// what the other adapters and the UI must agree with. The order of a query
// is closed by its identity by the library (`read_use_case_ports`); the
// values compare here.

const sorted = (values: readonly unknown[]): readonly unknown[] => values.toSorted(compare_values)

describe('the value order of the oracle (LIB-9)', () => {
  test('text by Unicode code point, no collation', () => {
    expect(sorted(['rake', 'Shovel', 'rakes', 'é', 'z'])).toEqual([
      'Shovel',
      'rake',
      'rakes',
      'z',
      'é',
    ])
    // By code point, not by UTF-16 code unit: U+FFFF before U+1F600, whose
    // first unit (U+D83D) is smaller.
    expect(sorted(['😀', '￿'])).toEqual(['￿', '😀'])
  })

  test('an absent value after any value, ascending', () => {
    expect(sorted([null, 'a', ''])).toEqual(['', 'a', null])
    // `toSorted` puts `undefined` last without asking: the comparison, then.
    expect(compare_values(undefined, 'a')).toBeGreaterThan(0)
    expect(compare_values('a', undefined)).toBeLessThan(0)
    expect(compare_values(undefined, null)).toBe(0)
  })

  test('false before true; numbers by value', () => {
    expect(sorted([true, false])).toEqual([false, true])
    expect(sorted([10, 9, -1])).toEqual([-1, 9, 10])
  })
})
