import { describe, expect, it } from 'vitest'
import { doors, scopes } from '../src/index.ts'
import { file, folder, namespaces_in, shed } from './trees.ts'

// The doors the core writes from a tree as read (DOM-25), on a tree with
// Shed's map and folders.

const written = doors(shed)

const namespaces_of = (path: string): readonly string[] => namespaces_in(written.files, path)

const paths = written.files.map((one) => one.path)

describe('SC-45, the map: what a door exposes (DOM-25, GR-1, GR-3, GR-9)', () => {
  it('a business domain opens to the personas its use cases, identities and facts, in the order of the map, and its subtree under its name', () => {
    expect(namespaces_of('business/loans/_door_persona.ts')).toEqual([
      'usecase ./_usecase.ts',
      'id ./_id.ts',
      'fact ./_fact.ts',
      'an_ongoing_loan ./an_ongoing_loan/_door_persona.ts',
    ])
    expect(namespaces_of('business/loans/an_ongoing_loan/_door_persona.ts')).toEqual([
      'usecase ./_usecase.ts',
    ])
  })

  it('a business domain opens to another its identities alone; a folder below with none is not carried', () => {
    expect(namespaces_of('business/loans/_door_business.ts')).toEqual(['id ./_id.ts'])
    expect(paths).not.toContain('business/loans/an_ongoing_loan/_door_business.ts')
  })

  it('auth opens to the personas its lookups and identities; nothing opens a persona, a reaction or a past major', () => {
    expect(namespaces_of('auth/accounts/_door_persona.ts')).toEqual([
      'lookup ./_lookup.ts',
      'id ./_id.ts',
    ])
    expect(paths.filter((path) => /^(persona|reaction)\/.+\/_door_(?!below)/.test(path))).toEqual(
      [],
    )
    expect(paths.filter((path) => path.startsWith('business/loans/1/'))).toEqual([])
  })

  it('a door that would expose nothing is not written, and no scope carries it', () => {
    expect(paths.filter((path) => path.startsWith('business/notes/'))).toEqual([])
    expect(
      scopes(shed)
        .files.filter((one) => one.text.includes('notes/_door_'))
        .map((one) => one.path),
    ).toEqual([])
  })

  it('a folder with folders below it opens to them every twin; one with past majors alone below it, none', () => {
    expect(namespaces_of('persona/_door_below.ts')).toEqual([
      'value ./_value.ts',
      'node ./_node.ts',
    ])
    expect(namespaces_of('business/loans/_door_below.ts')).toEqual([
      'id ./_id.ts',
      'value ./_value.ts',
      'fact ./_fact.ts',
      'command ./_command.ts',
      'usecase ./_usecase.ts',
      'reaction ./_reaction.ts',
    ])
    expect(paths).not.toContain('persona/member/_door_below.ts')
    expect(paths).not.toContain('business/tools/_door_below.ts')
  })

  it('stops on two files of a kind the map opens: a door gives one namespace per kind', () => {
    const two = doors({
      ...shed,
      folders: [
        folder('business/tools', [file('id', 'id'), file('more_ids', 'id')]),
        folder('business/loans', [file('id', 'id')]),
      ],
    })
    expect(two.failures).toEqual([
      {
        path: 'business/tools/_door_business.ts',
        line: 1,
        rule: 'DOM-25',
        sentence:
          'business/tools holds 2 files of identities (id.ts, more_ids.ts), which the map opens to business: a door gives one namespace per kind, from one file',
      },
      {
        path: 'business/tools/_door_persona.ts',
        line: 1,
        rule: 'DOM-25',
        sentence:
          'business/tools holds 2 files of identities (id.ts, more_ids.ts), which the map opens to persona: a door gives one namespace per kind, from one file',
      },
    ])
  })
})
