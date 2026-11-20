import configuration from './generator.config.ts'
import { map_rules } from './packages/generator/src/index.ts'

// The architecture's arrows (see docs/architecture.md): who may import whom.
// Arrows go from the consumer to the consumed. Anything not listed is forbidden.
const arrows = {
  library: [],
  seals: ['library'],
  post: ['library', 'seals'],
  mailbox: ['library'],
  desk: ['library', 'mailbox'],
  bonds: ['library'],
  reaction: ['library', 'seals', 'bonds'],
  conversations: ['library'],
  auth: ['library'],
  persona: ['library', 'auth', 'bonds', 'conversations'],
  user: ['library', 'persona'],
  ui: ['library', 'user'],
}

const domain = (name) => `^packages/domains/src/${name}/`

// The folders of q-'s tree, the ones its map names (MBX-4): inside them a folder is reached through the
// doors and the scopes the map opens (DOM-25), kept by the tree's rules below, not through an index.ts.
const tree_of_q = configuration.trees
  .filter((tree) => tree.root === 'packages/domains/src')
  .flatMap((tree) => Object.keys(tree.sight))
  .map((top) => `${domain(top)}`)

// What a folder outside q-'s tree reaches of it (MBX-5): its generated files (`_registry.ts`, `_fact.ts`, `_node.ts`…),
// not its scopes and doors, which are the tree's inside; its authored files only through their twins, by its map's rules.
const surface_of_q = tree_of_q.map((top) => `${top}(?:.*/|)_(?!scope_|door_)[^/]+\\.ts$`)

// The packages of the extensions (GR-10, EXT-9): each imports its library, zod and `boundary`, nothing else of the
// repository; `boundary` imports zod only; no package of the kernel imports an extension but the configurators that
// compose it. Inside an extension's tree `boundary` is imported only by the generated point of a mounted folder
// (`_node.ts`, EXT-11), from the generator's configuration; outside the tree, as by any file of the package.
const extensions = configuration.trees.filter((tree) =>
  tree.root.startsWith('packages/extensions/'),
)
const extension_rules = extensions.flatMap((tree) => {
  const name = tree.root.split('/').at(-1)
  const root = `^${tree.root}/`
  const mounted = Object.keys(tree.mounted ?? {}).map((folder) => `${root}${folder}/_node\\.ts$`)
  return [
    {
      name: `extension-${name}-imports`,
      comment: `${name} imports of the repository its library, zod and boundary only: no domain of the kernel, no adapter, no configurator, no other extension (GR-10).`,
      severity: 'error',
      from: { path: root },
      to: {
        path: '^packages/',
        pathNot: [root, '^packages/boundary/', '^packages/domains/src/library/'],
      },
    },
    {
      name: `extension-${name}-boundary-at-the-mounted-points`,
      comment: `${name}: inside its tree boundary is imported only by the generated point of a mounted folder (_node.ts), never by an authored file, which imports its scope (GR-10, EXT-11, DOM-25).`,
      severity: 'error',
      from: {
        path: `${root}(${Object.keys(tree.sight).join('|')})/`,
        pathNot: mounted,
      },
      to: { path: '^packages/boundary/' },
    },
  ]
})

const arrowRules = Object.entries(arrows).map(([from, allowed]) => ({
  name: `arrows-of-${from}`,
  comment: `${from} may import only: ${allowed.length > 0 ? allowed.join(', ') : 'nothing'}`,
  severity: 'error',
  from: { path: domain(from) },
  to: {
    path: '^packages/domains/src/[^/]+/',
    pathNot: [domain(from), ...allowed.map(domain)],
  },
}))

export default {
  forbidden: [
    ...arrowRules,
    ...extension_rules,
    {
      name: 'boundary-imports-zod-only',
      comment:
        'boundary imports zod only: schemas and types, no domain, no package of the repository (GR-10, EXT-9).',
      severity: 'error',
      from: { path: '^packages/boundary/' },
      to: {
        pathNot: ['^packages/boundary/', 'node_modules/zod/'],
      },
    },
    {
      name: 'the-kernel-composes-the-extensions',
      comment:
        "No package of the kernel imports an extension but the configurators that compose it: phone its bundle, memory its configurator (GR-10); the repository's configuration may.",
      severity: 'error',
      from: { path: '^packages/', pathNot: ['^packages/(phone|memory)/', '^packages/extensions/'] },
      to: { path: '^packages/extensions/' },
    },
    {
      name: 'the-generator-knows-no-boundary',
      comment:
        'The generator imports no boundary: it writes the module the configuration names (EXT-11, § 2).',
      severity: 'error',
      from: { path: '^packages/generator/' },
      to: { path: '^packages/boundary/' },
    },
    // The rules of each tree of the generator, from its map (DOM-25): the map is one source, read by
    // the generator, which writes it into the doors and the scopes, and by the cruiser through it.
    ...configuration.trees.flatMap(map_rules),
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'only-through-index-inside',
      comment:
        "A folder of a package is reachable from another folder only through its index.ts; in q-'s tree, through the doors of its map (DOM-25, MBX-4); q-'s tree from outside it, through its generated files (MBX-5).",
      severity: 'error',
      from: { path: '^(packages/[^/]+/src/[^/]+)/', pathNot: tree_of_q },
      to: {
        path: '^packages/[^/]+/src/[^/]+/',
        pathNot: ['^$1/', '^packages/[^/]+/src/[^/]+/index\\.tsx?$', ...surface_of_q],
      },
    },
    {
      name: 'only-through-index-outside',
      comment:
        "From outside any folder (tests, other packages) a folder is reachable only through its index.ts; q-'s tree through its generated files, but its scopes and doors, which are its inside (MBX-5).",
      severity: 'error',
      from: { pathNot: '^packages/[^/]+/src/[^/]+/' },
      to: {
        path: '^packages/[^/]+/src/[^/]+/',
        pathNot: ['^packages/[^/]+/src/[^/]+/index\\.tsx?$', ...surface_of_q],
      },
    },
    {
      name: 'domains-no-node',
      comment: 'Domains import no Node module.',
      severity: 'error',
      from: { path: '^packages/domains/src/' },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'domains-no-other-package',
      comment: 'Domains import no adapter and no configurator.',
      severity: 'error',
      from: { path: '^packages/domains/src/' },
      to: { path: '^packages/(?!domains/)' },
    },
    {
      name: 'domains-npm-allowlist',
      comment: 'Domains may use only these npm packages.',
      severity: 'error',
      from: { path: '^packages/domains/src/' },
      to: {
        dependencyTypes: [
          'npm',
          'npm-dev',
          'npm-optional',
          'npm-peer',
          'npm-no-pkg',
          'npm-unknown',
        ],
        pathNot: 'node_modules/(zod)/',
      },
    },
    {
      name: 'generator-imports-the-library-only',
      comment:
        "The generator imports of the domains the library only (§ 2, DOM-25): it finds the components of a tree by the marks the library's builders leave, and imports the authored files at runtime, which no arrow shows.",
      severity: 'error',
      from: { path: '^packages/generator/(src|shell)/' },
      to: { path: '^packages/domains/', pathNot: '^packages/domains/src/library/' },
    },
    {
      name: 'generator-core-no-node',
      comment:
        "The generator's core compiles without Node, as the domains (§ 2, DOM-25): from a tree as read to the files to write and the failures; the shell reads, imports and writes.",
      severity: 'error',
      from: { path: '^packages/generator/src/' },
      to: {
        dependencyTypes: [
          'core',
          'npm',
          'npm-dev',
          'npm-optional',
          'npm-peer',
          'npm-no-pkg',
          'npm-unknown',
        ],
      },
    },
    {
      name: 'nothing-imports-the-generator',
      comment:
        "No package imports the generator (§ 2): a tool of the author, run by pnpm generate, never by a node; only the repository's configuration does.",
      severity: 'error',
      from: { path: '^packages/', pathNot: '^packages/generator/' },
      to: { path: '^packages/generator/' },
    },
    {
      name: 'adapters-do-not-import-configurators',
      severity: 'error',
      from: { path: '^packages/adapters-' },
      to: { path: '^packages/(phone|relay|memory)/' },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true, pathNot: '^virtual:' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(dist|\\.tsbuild|node_modules|\\.generated)/' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'types', 'default'],
      extensions: ['.ts', '.tsx', '.js'],
    },
  },
}
