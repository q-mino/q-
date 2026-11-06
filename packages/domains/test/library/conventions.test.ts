import { describe, expect, test } from 'vitest'
import {
  analyze,
  compile,
  roleOf,
  type CompileErrorCode,
  type SourceExport,
  type SourceTree,
} from '../../src/library/index.ts'

const values = (...names: string[]): SourceExport[] =>
  names.map((name) => ({ name, form: 'value' }))

/** A small valid tree: a grouping `shop` with the domains `stock` and `orders` (orders → stock). */
const valid: SourceTree = {
  folders: ['shop', 'shop/stock', 'shop/orders', 'shop/orders/carts'],
  markers: [
    { folder: 'shop/stock', consumes: [] },
    { folder: 'shop/orders', consumes: ['shop/stock'] },
  ],
  modules: [
    { path: 'shop/stock/items.schema.ts', exports: values('item', 'inStock') },
    { path: 'shop/stock/items.predicate.ts', exports: values('inStock') },
    { path: 'shop/stock/items.reads.ts', exports: values('inStock') },
    { path: 'shop/orders/carts.schema.ts', exports: values('add') },
    { path: 'shop/orders/carts.command.ts', exports: values('add') },
    { path: 'shop/orders/carts/lines.schema.ts', exports: values('line') },
  ],
}

const codesOf = (tree: SourceTree): readonly CompileErrorCode[] => {
  const result = analyze(tree)
  return result.ok ? [] : result.errors.map((e) => e.code)
}

const withModules = (tree: SourceTree, ...modules: SourceTree['modules']): SourceTree => ({
  ...tree,
  modules: [...tree.modules, ...modules],
})

describe('roles of modules (LIB-15)', () => {
  test('the suffix gives the kind; no suffix is a helper', () => {
    expect(roleOf('a/b/groups.command.ts')).toEqual({
      role: 'component',
      folder: 'a/b',
      name: 'groups',
      kind: 'command',
    })
    expect(roleOf('a/dates.ts')).toEqual({ role: 'helper' })
    expect(roleOf('a/domain.ts')).toEqual({ role: 'marker', folder: 'a' })
  })

  test('generated files and the library are not sources', () => {
    for (const path of ['a/index.ts', 'a/domain.paths.ts', 'a/groups.types.ts'])
      expect(roleOf(path)).toEqual({ role: 'generated' })
    expect(roleOf('library/conventions/names.ts')).toEqual({ role: 'library' })
  })

  test('an unknown suffix is not a helper', () => {
    expect(roleOf('a/groups.helper.ts')).toEqual({
      role: 'unknown-kind',
      folder: 'a',
      suffix: 'helper',
    })
  })
})

describe('analysis (LIB-14..17)', () => {
  test('a valid tree gives its components by path', () => {
    const result = analyze(valid)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.analysis.components).toEqual([
      { path: 'shop/orders/carts/add', domain: 'shop/orders', kind: 'command' },
      { path: 'shop/orders/carts/lines/line', domain: 'shop/orders', kind: 'schema' },
      { path: 'shop/stock/items/inStock', domain: 'shop/stock', kind: 'predicate' },
      { path: 'shop/stock/items/item', domain: 'shop/stock', kind: 'schema' },
    ])
  })

  const cases: readonly [string, SourceTree, CompileErrorCode][] = [
    [
      'a name that is not camelCase',
      withModules(valid, { path: 'shop/stock/Items.schema.ts', exports: values('x') }),
      'name-invalid',
    ],
    [
      'an unknown kind',
      withModules(valid, { path: 'shop/stock/items.helper.ts', exports: [] }),
      'kind-unknown',
    ],
    [
      'a domain inside a domain',
      { ...valid, markers: [...valid.markers, { folder: 'shop/orders/carts', consumes: [] }] },
      'domain-in-domain',
    ],
    [
      'a component in a grouping',
      withModules(valid, { path: 'shop/prices.schema.ts', exports: values('price') }),
      'outside-domain',
    ],
    [
      'a type export',
      withModules(valid, {
        path: 'shop/stock/units.schema.ts',
        exports: [{ name: 'Unit', form: 'type' }],
      }),
      'export-not-value',
    ],
    [
      'a default export',
      withModules(valid, {
        path: 'shop/stock/units.schema.ts',
        exports: [{ name: 'default', form: 'default' }],
      }),
      'export-not-value',
    ],
    [
      'a command and a predicate with the same path',
      withModules(valid, { path: 'shop/stock/items.command.ts', exports: values('inStock') }),
      'path-duplicate',
    ],
    [
      'a component whose path is a folder',
      withModules(valid, { path: 'shop/orders/carts.schema.ts', exports: values('lines') }),
      'path-is-node',
    ],
    [
      'a function without its schema',
      withModules(valid, {
        path: 'shop/orders/carts.command.ts',
        exports: values('add', 'remove'),
      }),
      'schema-missing',
    ],
    [
      'a predicate without its reads',
      withModules(valid, { path: 'shop/stock/items.reads.ts', exports: [] }),
      'reads-missing',
    ],
    [
      'reads without a predicate',
      withModules(valid, {
        path: 'shop/stock/items.reads.ts',
        exports: values('inStock', 'onSale'),
      }),
      'reads-orphan',
    ],
    [
      'a marker without a literal list',
      { ...valid, markers: [{ folder: 'shop/stock', consumes: null }, ...valid.markers.slice(1)] },
      'marker-invalid',
    ],
    [
      'an arrow to something that is not a domain',
      {
        ...valid,
        markers: [{ folder: 'shop/stock', consumes: ['shop/prices'] }, ...valid.markers.slice(1)],
      },
      'consumes-unknown',
    ],
    [
      'an arrow to itself',
      {
        ...valid,
        markers: [{ folder: 'shop/stock', consumes: ['shop/stock'] }, ...valid.markers.slice(1)],
      },
      'consumes-self',
    ],
    [
      'a cycle of arrows (GR-1)',
      {
        ...valid,
        markers: [{ folder: 'shop/stock', consumes: ['shop/orders'] }, ...valid.markers.slice(1)],
      },
      'consumes-cycle',
    ],
  ]
  test.each(cases)('rejects %s', (_name, tree, code) => {
    expect(codesOf(tree)).toContain(code)
  })

  test('a later module of the same node replaces nothing: duplicate kinds cannot exist, names merge', () => {
    const tree = withModules(valid, {
      path: 'shop/orders/carts/lines.command.ts',
      exports: values('line'),
    })
    expect(codesOf(tree)).toEqual([])
  })
})

describe('generation (LIB-19)', () => {
  const result = compile(valid, { rootFromRepo: 'packages/x/src' })
  const files = result.ok
    ? new Map(result.files.map((f) => [f.path, f.text]))
    : new Map<string, string>()

  test('an index in every folder, types beside schemas, reachable paths per domain, the arrows', () => {
    expect([...files.keys()]).toEqual([
      'arrows.generated.cjs',
      'index.ts',
      'shop/index.ts',
      'shop/orders/carts.types.ts',
      'shop/orders/carts/index.ts',
      'shop/orders/carts/lines.types.ts',
      'shop/orders/domain.paths.ts',
      'shop/orders/index.ts',
      'shop/stock/domain.paths.ts',
      'shop/stock/index.ts',
      'shop/stock/items.types.ts',
    ])
  })

  test('a folder and the modules of the same name are one node (LIB-16)', () => {
    expect(files.get('shop/orders/index.ts')).toContain('carts: {\n...carts$folder,')
  })

  test('a domain reaches its own paths and the surface of what it consumes (LIB-21)', () => {
    const reachable = files.get('shop/orders/domain.paths.ts') ?? ''
    expect(reachable).toContain("'shop/stock/items/inStock'")
    expect(reachable).not.toContain("'shop/stock/items/item'")
  })

  test('the arrows allow only the surface of a consumed domain', () => {
    expect(files.get('arrows.generated.cjs')).toContain(
      JSON.stringify('^packages/x/src/shop/stock/.*\\.(predicate)\\.ts$'),
    )
  })

  test('the output is stable: same tree, same files', () => {
    const shuffled: SourceTree = {
      folders: valid.folders.slice().reverse(),
      markers: valid.markers.slice().reverse(),
      modules: valid.modules.slice().reverse(),
    }
    expect(compile(shuffled, { rootFromRepo: 'packages/x/src' })).toEqual(result)
  })
})
