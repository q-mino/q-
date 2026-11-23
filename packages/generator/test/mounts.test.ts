import { describe, expect, it } from 'vitest'
import { mounts, scopes, type Tree } from '../src/index.ts'
import { component, exported, file, folder, text_in } from './trees.ts'

// The folders mounted below a node of another tree (EXT-11, PER-6, "A
// mounted folder"; part 12.3), on a tree as an extension's is read: its
// business, and its personas `self` and `known`, mounted below the kernel's
// nodes, the context of `known` composed of two schemas of the boundary.

/** An extension's tree: a business, `self` and `known` mounted, a folder below `known`. */
const extension = (below: readonly ReturnType<typeof folder>[] = []): Tree => ({
  sight: { business: {}, persona: { business: ['usecase', 'id', 'fact'] } },
  library: '../../domains/src/library/index.ts',
  folders: [
    folder('business/greetings', [file('id', 'id'), file('usecase', 'usecase')]),
    folder('persona/known', [file('usecase', 'usecase')]),
    folder('persona/self', [file('usecase', 'usecase')]),
    ...below,
  ],
  mounted: {
    'persona/known': { from: '@q-mino/boundary', context: ['the_bond', 'the_peer_key'] },
    'persona/self': { from: '@q-mino/boundary', context: [] },
  },
})

describe('EXT-11: a mounted folder', () => {
  it('its point’s _node.ts imports the context’s schemas by name and composes them', () => {
    const text = text_in(mounts(extension()).files, 'persona/known/_node.ts')
    expect(text).toContain(`import { the_bond, the_peer_key } from '@q-mino/boundary'`)
    expect(text).toContain(`import type * as zz from '../../../../domains/src/library/index.ts'`)
    expect(text).toContain(`export const known = {
  mounted: 'persona/known',
  context: z.strictObject({ ...the_bond.shape, ...the_peer_key.shape }),
} satisfies zz.Mounted`)
    expect(text).toContain('export type known_context = zz.ContextOf<typeof known>')
  })

  it('a context of the root’s alone imports nothing of the boundary', () => {
    const text = text_in(mounts(extension()).files, 'persona/self/_node.ts')
    expect(text).not.toContain('@q-mino/boundary')
    expect(text).toContain('context: z.strictObject({})')
  })

  it('the point and the scopes below read the context from the mounted folder’s _node.ts', () => {
    const tree = extension([
      folder('persona/known/@x', []),
      folder('persona/known/deep', [file('usecase', 'usecase')]),
    ])
    expect(text_in(scopes(tree).files, 'persona/known/_scope.ts')).toContain(
      `import type { known_context } from './_node.ts'`,
    )
    expect(text_in(scopes(tree).files, 'persona/known/deep/_scope.ts')).toContain(
      `import type { known_context } from '../_node.ts'`,
    )
    expect(text_in(scopes(tree).files, 'business/greetings/_scope.ts')).not.toContain('_node.ts')
    expect(mounts(tree).failures).toEqual([])
  })

  it('refuses a node in a mounted folder, one that takes below it, and a folder outside the map', () => {
    const tree: Tree = {
      ...extension([
        folder('persona/known/deep', [file('node', 'node', [taking('deep', true)])]),
        folder('persona/known/fine', [file('node', 'node', [taking('fine', false)])]),
      ]),
      mounted: {
        ...extension().mounted,
        'auth/known': { from: '@q-mino/boundary', context: [] },
      },
    }
    const with_a_node: Tree = {
      ...tree,
      folders: tree.folders.map((each) =>
        each.segments.join('/') === 'persona/self'
          ? { ...each, files: [...each.files, file('node', 'node', [taking('self', false)])] }
          : each,
      ),
    }
    expect(mounts(with_a_node).failures.map((failure) => [failure.path, failure.rule])).toEqual([
      ['persona/known/deep/node.ts', 'EXT-11'],
      ['persona/self/node.ts', 'EXT-11'],
      ['auth/known/', 'EXT-11'],
    ])
  })
})

/** A node's export, with what its declaration adds: whether it takes. */
const taking = (name: string, takes: boolean) => {
  const built = component({ kind: 'node' })
  if (built.is !== 'component') throw new Error('a node is a component')
  return exported(name, { ...built, node: { closes: false, accumulates: false, takes } })
}
