import { describe, expect, expectTypeOf, test } from 'vitest'
import type { ComponentTree } from '../../src/library/index.ts'
import { tree, type DomainPath, type Flat } from '../domains/index.ts'
import type { Reachable } from '../domains/town/lending/domain.paths.ts'

describe('the compiled test domains (LIB-19)', () => {
  test('the root index is a tree of components', () => {
    const asTree: ComponentTree = tree
    expect(Object.keys(asTree)).toEqual(['town'])
  })

  test('a component is reached by its path, with its function and its schema', () => {
    const lend = tree.town.lending.loans.lend
    const input = lend.input.parse({ book: 'b1', reader: 'r1', on: 10 })
    expect(lend.run(input)).toEqual({ book: 'b1', reader: 'r1', due: 24 })
    expect(tree.town.catalog.books.isAvailable.reads).toEqual({
      read: 'instance',
      of: 'town/catalog/books/book',
    })
  })

  test('schemas are strict: an undeclared field never passes (DOM-21)', () => {
    const lend = tree.town.lending.loans.lend
    expect(lend.input.safeParse({ book: 'b1', reader: 'r1', on: 10, extra: 1 }).success).toBe(false)
  })

  test('a folder and the modules of the same name are one node (LIB-16)', () => {
    expect(Object.keys(tree.town.lending.loans).sort()).toEqual([
      'history',
      'isLate',
      'lend',
      'loan',
    ])
  })

  test('types: domain paths, flat paths, reachable paths', () => {
    expectTypeOf<DomainPath>().toEqualTypeOf<'town/catalog' | 'town/lending'>()
    expectTypeOf<Flat['town/lending/loans/lend']>().toEqualTypeOf(tree.town.lending.loans.lend)
    expectTypeOf<keyof Reachable>().toEqualTypeOf<
      | 'town/catalog/books/isAvailable'
      | 'town/lending/loans/history/entry'
      | 'town/lending/loans/isLate'
      | 'town/lending/loans/lend'
      | 'town/lending/loans/loan'
    >()
  })
})
