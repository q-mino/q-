import { describe, expect, it } from 'vitest'
import { next_import, scopes } from '../src/index.ts'
import { namespaces_in, shed, text_in } from './trees.ts'

// The scopes the core writes from a tree as read (DOM-25), on a tree with
// Shed's map and folders, its files reduced to their kinds.

const text_of = (path: string): string => text_in(scopes(shed).files, path)

const namespaces_of = (path: string): readonly string[] => namespaces_in(scopes(shed).files, path)

describe('SC-45, the map: what a folder sees of the others (DOM-25, GR-1, GR-3, GR-9)', () => {
  it('a persona sees of a business domain the door to the personas, of auth its door', () => {
    expect(namespaces_of('persona/member/_scope_usecase.ts')).toEqual([
      '_persona ../_door_below.ts',
      'loans ../../business/loans/_door_persona.ts',
      'tools ../../business/tools/_door_persona.ts',
      'accounts ../../auth/accounts/_door_persona.ts',
    ])
  })

  it('a business domain sees of another its door to the business, and never its own', () => {
    expect(namespaces_of('business/loans/_scope_command.ts')).toEqual([
      'id ./_id.ts',
      'value ./_value.ts',
      'fact ./_fact.ts',
      'tools ../tools/_door_business.ts',
    ])
    expect(namespaces_of('business/loans/an_ongoing_loan/_scope_command.ts')).toEqual([
      '_loans ../_door_below.ts',
      'tools ../../tools/_door_business.ts',
    ])
  })

  it('a reaction above the domains sees their doors to the reactions; one in a domain, no door that opens identities only', () => {
    expect(namespaces_of('reaction/damage/_scope_reaction.ts')).toEqual([
      'dsl ./_dsl.ts',
      'loans ../../business/loans/_door_reaction.ts',
      'tools ../../business/tools/_door_reaction.ts',
    ])
    expect(namespaces_of('business/loans/_scope_reaction.ts')).toEqual([
      'value ./_value.ts',
      'fact ./_fact.ts',
      'usecase ./_usecase.ts',
    ])
  })

  it('auth sees no other folder; an identity sees nothing', () => {
    expect(namespaces_of('auth/accounts/_scope_lookup.ts')).toEqual(['id ./_id.ts'])
    expect(namespaces_of('business/loans/_scope_id.ts')).toEqual([])
  })
})

describe('the scopes of a folder (DOM-25)', () => {
  it('the point binds the builders to the context of the node at or above it', () => {
    expect(text_of('persona/member/_scope.ts')).toContain(
      "import type { member_context } from './_node.ts'",
    )
    expect(text_of('persona/member/_scope_node.ts')).toContain(
      'wlib.builders_at<persona_context>()',
    )
    expect(text_of('business/loans/_scope.ts')).toContain('wlib.builders_at<wlib.RootContext>()')
  })

  it("a past major's scope gives earlier, delegate and the next major, never the domain's dsl (DOM-22)", () => {
    expect(text_of('business/loans/1/_scope_fact.ts')).toContain(
      "export { earlier, delegate } from './_scope.ts'",
    )
    expect(namespaces_of('business/loans/1/_scope_fact.ts')).toEqual([
      'next ../_fact.ts',
      'id ../_id.ts',
      'value ../_value.ts',
      'tools ../../tools/_door_business.ts',
    ])
  })
})

describe('the order of the imports (DOM-25)', () => {
  const graph: Readonly<Record<string, readonly string[]>> = {
    'fact.ts': ['_scope_fact.ts'],
    '_scope_fact.ts': ['_id.ts'],
    'id.ts': ['_scope_id.ts'],
    '_scope_id.ts': [],
  }
  const imports = (path: string): readonly string[] | undefined =>
    graph[path] ?? (path === '_id.ts' ? ['id.ts'] : undefined)
  const authored = new Set(['fact.ts', 'id.ts'])

  it('imports a file once the authored files its imports reach are imported', () => {
    expect(next_import(['fact.ts', 'id.ts'], authored, imports)).toEqual({
      is: 'file',
      path: 'id.ts',
    })
    expect(next_import(['fact.ts'], authored, imports)).toEqual({ is: 'file', path: 'fact.ts' })
    expect(next_import([], authored, imports)).toEqual({ is: 'done' })
  })

  it('names a file that reaches a missing module', () => {
    expect(
      next_import(['other.ts'], authored, (path) =>
        path === 'other.ts' ? ['_door_persona.ts'] : undefined,
      ),
    ).toEqual({
      is: 'blocked',
      path: 'other.ts',
      by: '_door_persona.ts',
    })
  })
})
