import { describe, expect, it } from 'vitest'
import { map_rules, type CruiserRule } from '../src/index.ts'
import { sight } from './trees.ts'

// The map's rules the core gives the cruiser (DOM-25), for Shed's map, read
// as the cruiser reads them.

// The cruiser's reading of a rule (dependency-cruiser's semantics): `from`
// matches the importer, `to` the imported, each but what its `pathNot`
// exempts; `$n` in `to` names a group of the importer's match.
const list = (paths: string | readonly string[] | undefined): readonly string[] =>
  paths === undefined ? [] : typeof paths === 'string' ? [paths] : paths

const broken = (rules: readonly CruiserRule[], from: string, to: string): readonly string[] =>
  rules
    .filter((rule) => {
      const match = rule.from.path === undefined ? [from] : new RegExp(rule.from.path).exec(from)
      if (match === null) return false
      if (list(rule.from.pathNot).some((path) => new RegExp(path).test(from))) return false
      const bound = (path: string): RegExp =>
        new RegExp(path.replace(/\$([0-9])/g, (_, group: string) => match[Number(group)] ?? ''))
      if (rule.to.path !== undefined && !bound(rule.to.path).test(to)) return false
      return !list(rule.to.pathNot).some((path) => bound(path).test(to))
    })
    .map((rule) => rule.name)

describe("SC-45, the map's rules for the cruiser (DOM-25)", () => {
  const rules = map_rules({
    root: 'packages/domains/test/shed',
    sight,
    library: 'wlib.ts',
    compared_with_main: false,
  })
  const at = (path: string): string => `packages/domains/test/shed/${path}`
  const imports = (from: string, to: string): readonly string[] => broken(rules, at(from), at(to))

  it('a scope takes of another folder only the door the map opens to its top', () => {
    expect(imports('persona/member/_scope_usecase.ts', 'business/tools/_door_persona.ts')).toEqual(
      [],
    )
    expect(imports('persona/member/_scope_usecase.ts', 'business/tools/_door_business.ts')).toEqual(
      ['shed-sight-of-persona'],
    )
    expect(imports('persona/member/_scope_usecase.ts', 'business/tools/_usecase.ts')).toEqual([
      'shed-sight-of-persona',
    ])
    expect(imports('business/loans/_scope_command.ts', 'business/tools/_door_business.ts')).toEqual(
      [],
    )
    expect(
      imports('reaction/damage/_scope_reaction.ts', 'business/loans/_door_reaction.ts'),
    ).toEqual([])
    expect(imports('business/loans/_scope_command.ts', 'persona/_dsl.ts')).toEqual([
      'shed-sight-of-business',
    ])
  })

  it("a past major's scope takes the next major's and the domain's twins, never another folder's", () => {
    expect(imports('business/loans/1/_scope_fact.ts', 'business/loans/_fact.ts')).toEqual([])
    expect(imports('business/loans/1/_scope_fact.ts', 'business/tools/_door_business.ts')).toEqual(
      [],
    )
    expect(imports('business/loans/1/_scope_fact.ts', 'business/tools/_fact.ts')).toEqual([
      'shed-past-major-of-business',
    ])
  })

  it('an authored file takes of the tree its scope alone, and only its twin imports it', () => {
    expect(imports('business/loans/command.ts', 'business/loans/_scope_command.ts')).toEqual([])
    expect(imports('business/loans/command.ts', 'business/loans/_fact.ts')).toEqual([
      'shed-authored-through-its-scope',
      'shed-authored-only-through-scope',
    ])
    expect(imports('business/loans/_usecase.ts', 'business/loans/usecase.ts')).toEqual([])
    expect(imports('persona/member/_usecase.ts', 'business/loans/usecase.ts')).toEqual([
      'shed-authored-only-through-generated',
    ])
    expect(imports('configurator.ts', 'business/loans/usecase.ts')).toEqual([
      'shed-authored-only-through-generated-others',
    ])
  })

  it('the current version knows no past major, but for its list of majors', () => {
    expect(imports('business/loans/_registry.ts', 'business/loans/1/_registry.ts')).toEqual([
      'shed-the-current-knows-no-past',
    ])
    expect(imports('business/loans/_majors.ts', 'business/loans/1/_registry.ts')).toEqual([])
  })
})
