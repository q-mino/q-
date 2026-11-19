import type { ConstructKind } from '@q-mino/domains/library'
import type { FileKind } from './model.ts'

// What a scope gives a file of each kind (DOM-25): the builders of its kind,
// the library's functions its constructs name, the twins of its folder in the
// layers below it, and whether it carries the folder's ancestors and the doors
// the map opens to it. The tables are the generator's reading of DOM-25,
// DOM-16 and DOM-22, no kind of domain in them (LIB-1).

/** The builders of the point (`_scope.ts`), in the order `builders_at` gives them. */
export const point_builders = [
  'id',
  'fact',
  'predicate',
  'selection',
  'calculation',
  'effect',
  'AND',
  'OR',
  'NOT',
  'command',
  'cursor_step',
  'query',
  'command_use_case',
  'read_use_case',
  'command_use_case_over',
  'read_use_case_over',
  'lookup',
  'reaction',
  'node',
  'version',
  'earlier',
  'delegate',
] as const

export type BuilderName = (typeof point_builders)[number]

const composed = ['AND', 'OR', 'NOT'] as const

/**
 * The builders of each kind (DOM-25: "the builders of its kind", with AND, OR,
 * NOT where conditions are composed). Every builder of a kind, whatever the
 * folder: a rule on which of them a folder may use is the architecture's, and
 * the generator's checks keep it (DOM-25), not the scope.
 */
export const builders_of: Readonly<Record<FileKind, readonly BuilderName[]>> = {
  id: ['id'],
  value: [],
  dsl: [],
  fact: ['fact'],
  predicate: ['predicate', ...composed],
  selection: ['selection', ...composed],
  calculation: ['calculation'],
  effect: ['effect'],
  lookup: ['lookup'],
  command: ['command', 'cursor_step', ...composed],
  query: ['query', ...composed],
  usecase: ['command_use_case', 'read_use_case', 'command_use_case_over', 'read_use_case_over'],
  node: ['node', ...composed],
  reaction: ['reaction'],
  version: ['version'],
}

/** The builders of every kind in a past major's folder: its components are written whole or delegated (DOM-22). */
export const past_builders: readonly BuilderName[] = ['earlier', 'delegate']

/**
 * The library's functions a kind's constructs name, from the library's module:
 * a command picks its effects, composes transitions, walks a list, derives an
 * instance's id (DOM-12, DOM-13, DOM-19, DOM-20); a translation gives `nothing` (DOM-16).
 */
export const functions_of: Readonly<Partial<Record<FileKind, readonly string[]>>> = {
  command: ['pick', 'composes', 'each', 'identity_of'],
  reaction: ['nothing'],
}

const the_vocabulary: readonly FileKind[] = [
  'id',
  'value',
  'dsl',
  'fact',
  'predicate',
  'effect',
  'selection',
  'calculation',
  'lookup',
]

/**
 * The kinds of the folder's own files a kind's scope gives, as namespaces: the
 * layers below it (DOM-25), `id` < `value` < `dsl` < the vocabulary (`fact`,
 * `predicate`, `effect`, `selection`, `calculation`, `lookup`) < `command`,
 * `query` < `usecase`, so that every import goes one way. A node sits above
 * the vocabulary and below the leaves, since the point of its folder
 * (`_scope.ts`) reads its context; no scope gives the node's twin, which is
 * the point's. A reaction takes its folder's facts and use cases (DOM-16),
 * and the values and the functions of `dsl` its translation needs.
 */
export const below: Readonly<Record<FileKind, readonly FileKind[]>> = {
  id: [],
  value: ['id'],
  dsl: ['id', 'value'],
  fact: ['id', 'value', 'dsl'],
  predicate: ['id', 'value', 'dsl'],
  selection: ['id', 'value', 'dsl'],
  calculation: ['id', 'value', 'dsl'],
  effect: ['id', 'value', 'dsl'],
  lookup: ['id', 'value', 'dsl'],
  node: the_vocabulary,
  command: the_vocabulary,
  query: the_vocabulary,
  usecase: [...the_vocabulary, 'command', 'query'],
  reaction: ['value', 'dsl', 'fact', 'usecase'],
  version: [],
}

/**
 * The kinds of another folder a kind's scope may see through a door: a door is
 * carried when the map opens it with one of them. An identity and a version
 * see nothing; a reaction the facts it reacts to and the use cases it invokes
 * (DOM-16, GR-9); every other kind whatever the map opens.
 */
export const seen_of = (kind: FileKind): ((seen: ConstructKind) => boolean) => {
  switch (kind) {
    case 'id':
    case 'version':
      return () => false
    case 'reaction':
      return (seen) => seen === 'fact' || seen === 'usecase'
    default:
      return () => true
  }
}

/** Whether a kind's scope carries the folder's ancestors (DOM-25): every kind but those that see nothing. */
export const sees_its_ancestors = (kind: FileKind): boolean => kind !== 'id' && kind !== 'version'

/** The order of the kinds, for the namespaces of a scope: the layers, bottom up. */
export const layer_order: readonly FileKind[] = [
  ...the_vocabulary,
  'node',
  'command',
  'query',
  'usecase',
  'reaction',
  'version',
]

/** What a kind is called in the comments of the generated files. */
export const plural_of: Readonly<Record<FileKind, string>> = {
  id: 'identities',
  value: 'values',
  dsl: 'functions',
  fact: 'facts',
  predicate: 'predicates',
  selection: 'selection predicates',
  calculation: 'calculations',
  effect: 'effects',
  lookup: 'lookups',
  command: 'commands',
  query: 'queries',
  usecase: 'use cases',
  node: 'node',
  reaction: 'reactions',
  version: 'version',
}

/** The kinds whose components the twin brands with their path (DOM-24). */
export const branded: ReadonlySet<ConstructKind> = new Set<ConstructKind>([
  'id',
  'fact',
  'predicate',
  'selection',
  'calculation',
  'effect',
])
