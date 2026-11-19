import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import { $Delegated, kind_of } from '../../src/library/index.ts'
import { registry as accounts } from '../shed/auth/accounts/_registry.ts'
import { registry as loans_1 } from '../shed/business/loans/1/_registry.ts'
import { registry as an_ongoing_loan } from '../shed/business/loans/an_ongoing_loan/_registry.ts'
import { registry as loans } from '../shed/business/loans/_registry.ts'
import { registry as tools } from '../shed/business/tools/_registry.ts'
import { registry as persona } from '../shed/persona/_registry.ts'
import { registry as keeper } from '../shed/persona/keeper/_registry.ts'
import { registry as member_1 } from '../shed/persona/member/1/_registry.ts'
import { registry as member } from '../shed/persona/member/_registry.ts'
import { registry as visitor } from '../shed/persona/visitor/_registry.ts'
import { registry as workshop } from '../shed/persona/workshop/_registry.ts'
import { registry as damage } from '../shed/reaction/damage/_registry.ts'
import { registry as repair } from '../shed/reaction/repair/_registry.ts'
import { registry as retirement } from '../shed/reaction/retirement/_registry.ts'

// The language at runtime (part 3.2, LIB-2): every registry of Shed, the
// library's test domains, imported, so that every authored file ran its
// builders; each component found by the kind its builder gave, the segment of
// its path after its folders (DOM-24, DOM-25).

const registries: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  'auth/accounts': accounts,
  'business/loans': loans,
  'business/loans/1': loans_1,
  'business/loans/an_ongoing_loan': an_ongoing_loan,
  'business/tools': tools,
  persona,
  'persona/keeper': keeper,
  'persona/member': member,
  'persona/member/1': member_1,
  'persona/visitor': visitor,
  'persona/workshop': workshop,
  'reaction/damage': damage,
  'reaction/repair': repair,
  'reaction/retirement': retirement,
}

/** The kinds whose scope composes conditions (DOM-25): a named condition takes its file's. */
const composing = ['predicate', 'selection', 'command', 'query']

/** A path's kind, its subject if it has one, and its name. */
const parse = (path: string) => {
  const segments = path.split('/')
  const name = segments.at(-1) ?? ''
  const after = segments.at(-3) ?? ''
  return after === 'selection' || after === 'calculation'
    ? { kind: after, subject: segments.at(-2), name }
    : { kind: segments.at(-2) ?? '', subject: undefined, name }
}

/** The input of a component, as its builder keeps it: none for a value. */
const input_of = (component: unknown): unknown =>
  typeof component === 'object' || typeof component === 'function'
    ? component !== null && 'input' in component
      ? component.input
      : undefined
    : undefined

describe('the builders of Shed, at runtime', () => {
  for (const [folder, registry] of Object.entries(registries)) {
    test(`${folder}: every component by the kind its builder gave`, () => {
      expect(Object.keys(registry).length).toBeGreaterThan(0)
      for (const [path, component] of Object.entries(registry)) {
        const { kind, subject, name } = parse(path)
        const built = kind_of(component)
        const base = path.slice(0, -'_input'.length)
        if (name.endsWith('_input') && base in registry) {
          // A leaf's, a command's or a query's input, as declared (DOM-25), or,
          // for a delegated leaf of a past major, the next major's delegated.
          const owner = registry[base]
          const delegated =
            typeof component === 'object' && component !== null && $Delegated in component
          expect(delegated ? component[$Delegated] : component, path).toBe(
            delegated && typeof owner === 'object' && owner !== null && $Delegated in owner
              ? input_of(owner[$Delegated])
              : input_of(owner),
          )
        } else if (kind === 'value') {
          expect(built, path).toBeUndefined()
          expect(component, path).toBeInstanceOf(z.ZodType)
        } else if (built?.kind === 'condition') {
          expect(composing, path).toContain(kind)
        } else {
          expect(built?.kind, path).toBe(kind)
          if (built?.kind === 'selection' || built?.kind === 'calculation')
            expect(built.subject, path).toBe(subject)
        }
      }
    })
  }

  test('one object, one path: no object is under two paths (DOM-24)', () => {
    // A business folder below a domain's is of the domain: its paths are in
    // both registries, the same paths (SC-31).
    const paths = new Map<unknown, string>()
    for (const registry of Object.values(registries))
      for (const [path, component] of Object.entries(registry)) {
        expect(paths.get(component) ?? path, path).toBe(path)
        paths.set(component, path)
      }
  })

  test('every kind of construct is met', () => {
    const kinds = new Set(
      Object.values(registries).flatMap((registry) =>
        Object.values(registry).map((component) => kind_of(component)?.kind ?? 'value'),
      ),
    )
    expect([...kinds].sort()).toEqual([
      'calculation',
      'command',
      'condition',
      'effect',
      'fact',
      'id',
      'lookup',
      'node',
      'predicate',
      'query',
      'reaction',
      'selection',
      'usecase',
      'value',
      'version',
    ])
  })
})
