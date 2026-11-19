import { describe, expect, test } from 'vitest'
import * as fc from 'fast-check'
import * as z from 'zod'
import {
  canonical_json,
  fingerprint_of,
  identity_of,
  operation_id,
  reaction_operation,
} from '../../src/library/index.ts'

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

describe('reaction_operation, the operation of a reaction to a part of a fact (DOM-16, LIB-10)', () => {
  const operation = (scope: string, id: string) => ({ scope, id: operation_id.parse(id) })
  const damage = 'reaction/damage/reaction/the_damaged_tool_goes_to_repair'

  // The corpus: the reaction, the fact's operation (its scope and id), the
  // part, and the id of the reaction's operation, whose scope is the reaction.
  test.each([
    [damage, 'member/A-MARTA', 'R-1', 0, 'lF64yMTVJ517v_1vnxN7tBskXc0BM9PYbDAuxnmeaOc'],
    [damage, 'member/A-MARTA', 'R-1', 1, '5Fu-VthZkUwnYpRAiMm-CEDGZoiJVh742uS7oJSrNrU'],
    [
      'reaction/retirement/reaction/the_reservations_of_the_tool_are_cancelled',
      'keeper/luca',
      '2b9c0e4e-1f8a-4c5d-9a71-0e3f6c2d8b14',
      0,
      'THXrq-fE07l5uWCncAlIYk8utf7yCLI8Jk9l78hVqTA',
    ],
    [
      'business/loans/reaction/the_next_reservation_on_the_sheet_is_taken_up',
      'reaction/retirement/reaction/the_reservations_of_the_tool_are_cancelled',
      'Lp9Sfe2Cw3q3O6DCfyBU9G9Gv7uBJEUOpUOgZxMD7cw',
      1,
      'Udd_CFqyTWvUW76VbTuileSGO9QLUbcSYpRDPaWkVp8',
    ],
    ['r', 'Città 🛠', 'x', 12, 'mHHgo39OpiEos_ezGUQfEH1Fx8a_Jgd7EKn780r_O6c'],
  ])('%s · %s · %s · %i', (reaction, scope, id, part, derived) => {
    expect(reaction_operation(reaction)({ operation: operation(scope, id), part })).toEqual({
      scope: reaction,
      id: derived,
    })
  })

  test('the fact delivered again is the same operation; another part, fact or reaction, another', () => {
    const first = reaction_operation(damage)({
      operation: operation('member/A-MARTA', 'R-1'),
      part: 0,
    })
    expect(
      reaction_operation(damage)({ operation: operation('member/A-MARTA', 'R-1'), part: 0 }),
    ).toEqual(first)
    expect(
      reaction_operation(damage)({ operation: operation('member/A-MARTA', 'R-1'), part: 1 }).id,
    ).not.toBe(first.id)
    expect(
      reaction_operation(damage)({ operation: operation('member/A-MARTA', 'R-2'), part: 0 }).id,
    ).not.toBe(first.id)
    expect(
      reaction_operation(damage)({ operation: operation('member/A-PAOLO', 'R-1'), part: 0 }).id,
    ).not.toBe(first.id)
    expect(
      reaction_operation('reaction/repair/reaction/r')({
        operation: operation('member/A-MARTA', 'R-1'),
        part: 0,
      }).id,
    ).not.toBe(first.id)
  })

  test("the fact's scope and id are told apart, so no two operations meet by concatenation", () => {
    expect(reaction_operation(damage)({ operation: operation('a/b', 'c'), part: 0 }).id).not.toBe(
      reaction_operation(damage)({ operation: operation('a', 'b/c'), part: 0 }).id,
    )
  })
})

describe('fingerprint_of, what a retry sends again (DOM-11, D100, LIB-11)', () => {
  // The corpus: a path, an input as sent, its canonical text (written by
  // hand, RFC 8785) and the fingerprint, computed with Node's SHA-256 over
  // the JSON of ['fingerprint_of', path, text].
  test.each<readonly [string, unknown, string, string]>([
    [
      'business/tools/usecase/add_a_tool',
      { id: 'drill', name: 'Cordless drill', category: 'power' },
      '{"category":"power","id":"drill","name":"Cordless drill"}',
      'tJIsg0Hyuf8L-Acf75KwLLKQ2v7UtuOp5KuAWv9JUZY',
    ],
    [
      'business/loans/usecase/borrow_a_tool',
      { tool_id: 'drill', member_id: 'M-12', loan_id: 'L11' },
      '{"loan_id":"L11","member_id":"M-12","tool_id":"drill"}',
      '6TaOW3KD3MT7dMj2V4R2Um0mTUbDx7mIYvytpL40fMg',
    ],
    [
      'persona/member/usecase/borrow_a_tool',
      { tool_id: 'drill' },
      '{"tool_id":"drill"}',
      'Y0xjHBCBE23i2nCyP-Sxy-KRGqY9t9f3inioVTf_TuI',
    ],
    [
      'business/tools/usecase/retire_a_tool',
      { reason: 'worn_out', id: 'drill', note: undefined },
      '{"id":"drill","reason":"worn_out"}',
      '0mPt8cc2ha4nqj5scxzmIFCK6nioDLaQrB7PdTT22mE',
    ],
    [
      'persona/workshop/usecase/close_a_job',
      { notification_id: 'N-88', job: { tool: 'drill-7', reference: 'RP1' } },
      '{"job":{"reference":"RP1","tool":"drill-7"},"notification_id":"N-88"}',
      'usNSyXyc8Vhcc1TEBp-3G6T4kTrN0Gwj2Szmc7U5THg',
    ],
    [
      'persona/visitor/usecase/the_catalogue',
      {},
      '{}',
      'xLJJu5kO_YITKYivd48x6jFuCSI0O4LR3tMO7rWIcB0',
    ],
    [
      'x',
      { é: 'Città 🛠', a: [1.0, 2.5, -3, 1e21, null, true, false], '\u0000': '' },
      String.raw`{"\u0000":"","a":[1,2.5,-3,1e+21,null,true,false],"é":"Città 🛠"}`,
      '24F3ffj29crAA9Coq5iiALpUBqUxpezoOTb2GDeOe34',
    ],
    [
      'x',
      { ｚ: 5, '😀': 4, é: 3, a: 2, B: 1 },
      '{"B":1,"a":2,"é":3,"😀":4,"ｚ":5}',
      'WT8RC2rtI1zdUJYLf82xOkyFV-Xsa7aNIi9_Yv7C_WY',
    ],
  ])('%s · %s', (path, input, text, fingerprint) => {
    expect(canonical_json(input)).toBe(text)
    expect(fingerprint_of({ path, input })).toBe(fingerprint)
  })

  /** A value with every object's members written in the reverse order. */
  const reversed = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(reversed)
      : typeof value === 'object' && value !== null
        ? Object.fromEntries(
            Object.entries(value)
              .toReversed()
              .map(([name, member]) => [name, reversed(member)]),
          )
        : value

  test('the order of the fields does not count (D100: equal as structures)', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (input) => {
        expect(fingerprint_of({ path: 'p', input: reversed(input) })).toBe(
          fingerprint_of({ path: 'p', input }),
        )
      }),
    )
  })

  test('the canonical text is the JSON of the value: the same request after any transport', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (input) => {
        const sent: unknown = JSON.parse(JSON.stringify(input))
        expect(JSON.parse(canonical_json(input))).toEqual(sent)
        expect(fingerprint_of({ path: 'p', input: sent })).toBe(
          fingerprint_of({ path: 'p', input }),
        )
      }),
    )
  })

  /** Equality as structures (D100), independent of the canonical text: lists by element, objects by their fields, whatever their order. */
  const equal = (a: unknown, b: unknown): boolean => {
    if (Array.isArray(a) || Array.isArray(b)) {
      return (
        Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((element, i) => equal(element, b[i]))
      )
    }
    if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
      const fields_of = (value: object) =>
        Object.entries(value).filter(([, member]) => member !== undefined)
      const fields = fields_of(a)
      const others = new Map(fields_of(b))
      return (
        fields.length === others.size &&
        fields.every(([name, member]) => others.has(name) && equal(member, others.get(name)))
      )
    }
    return a === b
  }

  test('two inputs, one fingerprint only if equal as structures', () => {
    fc.assert(
      fc.property(
        fc
          .jsonValue()
          .chain((a) =>
            fc.tuple(fc.constant(a), fc.oneof(fc.constant(reversed(a)), fc.jsonValue())),
          ),
        ([a, b]) => {
          expect(
            fingerprint_of({ path: 'p', input: a }) === fingerprint_of({ path: 'p', input: b }),
          ).toBe(equal(a, b))
        },
      ),
    )
  })

  test('another path, another fingerprint: the node is part of the request', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.jsonValue(), (a, b, input) => {
        fc.pre(a !== b)
        expect(fingerprint_of({ path: a, input })).not.toBe(fingerprint_of({ path: b, input }))
      }),
    )
  })

  test('a field absent and a field undefined are one request; a default left out, another', () => {
    expect(fingerprint_of({ path: 'p', input: { a: 1, b: undefined } })).toBe(
      fingerprint_of({ path: 'p', input: { a: 1 } }),
    )
    // The visitor's page size, 50 by default (SC-22): a retry sends what was
    // sent, never what the schema added (LIB-11).
    expect(fingerprint_of({ path: 'p', input: {} })).not.toBe(
      fingerprint_of({ path: 'p', input: { page_size: 50 } }),
    )
  })

  test('a value JSON cannot write as it is stops the fingerprint', () => {
    for (const input of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      10n,
      new Date('2026-11-19T10:00:00Z'),
      new Map(),
      [undefined],
      { f: () => 1 },
      { s: Symbol('s') },
      undefined,
    ]) {
      expect(() => fingerprint_of({ path: 'p', input })).toThrow()
    }
  })
})
