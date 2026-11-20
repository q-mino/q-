import type { TreeConfiguration } from './configuration.ts'

// The rules of a tree for `.dependency-cruiser.mjs` (DOM-25), from its map:
// the imports the generated files make, kept for every import, generated or
// written by hand. The map is one source, read by the generator, which
// writes it into the doors and the scopes, and by the cruiser, which takes
// these rules from here; the configuration imports this function. A rule
// names the tree by its root's last folder (`shed-sight-of-persona`). Of the
// tree's layout it knows what DOM-25 says: the folders the map names and
// those below, `@` for a folder of service, a number for a past major, `_`
// for the generator's files, tests aside; and that a domain's folder sits in
// the folder of its kind, where its doors are.

/** A path condition of a rule of dependency-cruiser: a pattern, and those that exempt from it (`$1` names a group of the `from` path). */
export interface CruiserPaths {
  readonly path?: string
  readonly pathNot?: string | readonly string[]
}

/** A forbidden rule of dependency-cruiser. */
export interface CruiserRule {
  readonly name: string
  readonly comment: string
  readonly severity: 'error'
  readonly from: CruiserPaths
  readonly to: CruiserPaths
}

const escaped = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The rules of a tree's map for the cruiser: what a folder's scopes, a past major's, the authored files and the current version may import. */
export const map_rules = (configuration: TreeConfiguration): readonly CruiserRule[] => {
  const name =
    configuration.root
      .split('/')
      .filter((segment) => segment !== '')
      .at(-1) ?? 'tree'
  const root = `^${escaped(configuration.root.replace(/\/+$/, ''))}/`
  const tops = Object.keys(configuration.sight)
  const kinds = `(?:${tops.join('|')})`
  // A folder named by a number is a past major of its domain (business/loans/1/): in the tree, outside the path (DOM-22, DOM-25).
  const major = '[0-9]+/'
  // The folders below a top, at any depth (a business domain's own tree, D105), then a past major if any; one pattern with no
  // nested repetition, which the cruiser refuses as unsafe: a first folder not a major, then any folders with no `@`.
  const folders = '(?:[^@/0-9][^@]*/|)'
  const tree = `${root}${kinds}/${folders}(?:${major}|)`
  const authored = `${tree}[^_/][^/]*\\.ts$`
  const tests = '\\.test\\.ts$'
  const seen_by = (from: string): readonly string[] =>
    Object.keys(configuration.sight[from] ?? {}).flatMap((folder) => [
      `${root}${escaped(folder)}/_door_${escaped(from)}\\.ts$`,
      `${root}${escaped(folder)}/[^/]+/_door_${escaped(from)}\\.ts$`,
    ])
  return [
    ...tops.map((from) => ({
      name: `${name}-sight-of-${from}`,
      comment: `${name}: the scopes of a folder under ${from} take of another folder only the door the map opens to ${from} (_door_${from}.ts), besides their own folder's twins and their ancestors' (LIB-1, DOM-25).`,
      severity: 'error' as const,
      from: {
        path: `${root}${escaped(from)}/(${folders})_scope_[a-z]+\\.ts$`,
        pathNot: `${root}${escaped(from)}/[^/]+/${major}`,
      },
      to: {
        path: `${root}${kinds}/`,
        pathNot: [
          `${root}${escaped(from)}/$1_[^/]+\\.ts$`,
          `${root}${escaped(from)}/_[^/]+\\.ts$`,
          `${root}${escaped(from)}/${folders}_door_below\\.ts$`,
          ...seen_by(from),
        ],
      },
    })),
    ...tops.map((from) => ({
      name: `${name}-past-major-of-${from}`,
      comment: `${name}: the scopes of a past major of a domain under ${from} (business/loans/1/) take, besides their own twins and what the domain's scopes take, the twins of the next major: a later major's folder, or the domain's own (PER-17, DOM-25).`,
      severity: 'error' as const,
      from: { path: `${root}${escaped(from)}/([^@/][^/]*/)(${major})_scope_[a-z]+\\.ts$` },
      to: {
        path: `${root}${kinds}/`,
        pathNot: [
          `${root}${escaped(from)}/$1$2_[^/]+\\.ts$`,
          `${root}${escaped(from)}/$1(?:${major}|)_[^/]+\\.ts$`,
          `${root}${escaped(from)}/_[^/]+\\.ts$`,
          ...seen_by(from),
        ],
      },
    })),
    {
      name: `${name}-authored-through-its-scope`,
      comment: `${name}: an authored file of the tree imports of the tree only its scope, which carries its folder's components, the doors of its ancestors to the folders below (_door_below.ts) and the doors the map opens to it (DOM-25, LIB-1).`,
      severity: 'error',
      from: { path: `${root}(${kinds})/(${folders})(${major}|)[^_/][^/]*\\.ts$`, pathNot: tests },
      to: { path: `${root}${kinds}/`, pathNot: `${root}$1/$2$3_scope_[a-z]+\\.ts$` },
    },
    {
      name: `${name}-the-current-knows-no-past`,
      comment: `${name}: no file of a domain's current version imports a past major (business/loans/1/): the past major goes to the current, never back, so that deleting its folder changes nothing else (PER-17, DOM-25). The one exception is the generator's list of the domain's majors (_majors.ts), which it rewrites when a folder is deleted (DOM-22).`,
      severity: 'error',
      from: {
        path: `${root}${kinds}/[^@/][^/]*/[^/]+\\.ts$`,
        pathNot: `${root}${kinds}/[^@/][^/]*/_majors\\.ts$`,
      },
      to: { path: `${root}${kinds}/[^@/][^/]*/${major}` },
    },
    {
      name: `${name}-authored-only-through-generated`,
      comment: `${name}: an authored file of the tree (fact.ts) is imported only by its generated twin (_fact.ts), which brands its components with their path and gives every schema its type (DOM-24, DOM-25).`,
      severity: 'error',
      from: { path: '^(.+/)_([^/]+)\\.ts$' },
      to: { path: authored, pathNot: ['^$1$2\\.ts$', tests] },
    },
    {
      name: `${name}-authored-only-through-generated-others`,
      comment: `${name}: a file that is not generated never imports an authored file of the tree (fact.ts): it imports its generated twin (_fact.ts) (DOM-25).`,
      severity: 'error',
      from: { pathNot: '/_[^/]+\\.ts$' },
      to: { path: authored, pathNot: tests },
    },
    {
      name: `${name}-authored-only-through-scope`,
      comment: `${name}: an authored file of the tree takes the components of its own folder from the scope of its kind (_scope_command.ts), never from their twins nor from the point (_scope.ts) (DOM-25).`,
      severity: 'error',
      from: { path: `^(${tree.slice(1)})[^_/][^/]*\\.ts$`, pathNot: tests },
      to: { path: '^$1_[^/]+\\.ts$', pathNot: '^$1_scope_[a-z]+\\.ts$' },
    },
  ]
}
