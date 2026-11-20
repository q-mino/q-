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
        "A folder of a package is reachable from another folder only through its index.ts; in q-'s tree, through the doors of its map (DOM-25, MBX-4).",
      severity: 'error',
      from: { path: '^(packages/[^/]+/src/[^/]+)/', pathNot: tree_of_q },
      to: {
        path: '^packages/[^/]+/src/[^/]+/',
        pathNot: ['^$1/', '^packages/[^/]+/src/[^/]+/index\\.tsx?$'],
      },
    },
    {
      name: 'only-through-index-outside',
      comment:
        'From outside any folder (tests, other packages) a folder is reachable only through its index.ts.',
      severity: 'error',
      from: { pathNot: '^packages/[^/]+/src/[^/]+/' },
      to: {
        path: '^packages/[^/]+/src/[^/]+/',
        pathNot: '^packages/[^/]+/src/[^/]+/index\\.tsx?$',
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
