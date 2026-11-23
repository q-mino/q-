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

  test('instants as text, in the order of their time: across the hour that repeats in autumn', () => {
    // As the clock writes them (A, 23 Nov 2026): 01:45 in Toronto at -04:00,
    // then 01:15 at -05:00, half an hour later. Told with their offsets,
    // their text would order them the other way.
    const earlier = new Date(Date.UTC(2026, 10, 1, 5, 45)).toISOString()
    const later = new Date(Date.UTC(2026, 10, 1, 6, 15)).toISOString()
    expect([earlier, later]).toEqual(['2026-11-01T05:45:00.000Z', '2026-11-01T06:15:00.000Z'])
    expect(sorted([later, earlier])).toEqual([earlier, later])
    expect(Date.parse(later) - Date.parse(earlier)).toBe(30 * 60_000)
  })

  test('false before true; numbers by value', () => {
    expect(sorted([true, false])).toEqual([false, true])
    expect(sorted([10, 9, -1])).toEqual([-1, 9, 10])
  })
})
