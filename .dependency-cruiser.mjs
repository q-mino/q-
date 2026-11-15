import { sight } from './packages/domains/test/shed/sight.ts'

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

// Shed's layout (its architecture, not the library's): a domain's folder sits in
// the folder of its kind. The library knows only the prefixes: the tree is made
// of the `@` folders, and in them `_x.ts` is the generator's, any other `.ts`
// the author's (DOM-25).
const authored = '^packages/.+/@[^/]+/[^_/][^/]*\\.ts$'
const tests = '\\.test\\.ts$'
const shed = '^packages/domains/test/shed/'

// What each folder of Shed's tree sees of the others (LIB-1, DOM-25): one
// source, read here as by the generator, which writes it into the heres.
const kinds = `@(?:${Object.keys(sight)
  .map((kind) => kind.slice(1))
  .join('|')})`
const sightRules = Object.entries(sight).map(([from, seen]) => ({
  name: `shed-sight-of-${from.slice(1)}`,
  comment: `Shed: the heres of a folder under ${from} take of another folder only the door sight.ts opens to ${from} (_door_${from.slice(1)}.ts), besides their own folder's twins and their ancestors' (LIB-1, DOM-25).`,
  severity: 'error',
  from: { path: `${shed}${from}/(@[^/]+/|)_here_[a-z]+\\.ts$` },
  to: {
    path: `${shed}${kinds}/`,
    pathNot: [
      `${shed}${from}/$1_[^/]+\\.ts$`,
      `${shed}${from}/_[^/]+\\.ts$`,
      ...Object.keys(seen).map((folder) => `${shed}${folder}/[^/]+/_door_${from.slice(1)}\\.ts$`),
    ],
  },
}))

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
    ...sightRules,
    {
      name: 'shed-authored-through-its-here',
      comment:
        "Shed: an authored file of the tree imports of the tree only its here, which carries its folder's components, the doors of its ancestors to the folders below (_door_below.ts) and the doors sight.ts opens to it (DOM-25, LIB-1).",
      severity: 'error',
      from: { path: `${shed}(@[^/]+)/(@[^/]+/|)[^_/][^/]*\\.ts$`, pathNot: tests },
      to: {
        path: `${shed}${kinds}/`,
        pathNot: `${shed}$1/$2_here_[a-z]+\\.ts$`,
      },
    },
    {
      name: 'authored-only-through-generated',
      comment:
        'An authored file of the tree (fact.ts in an @ folder) is imported only by its generated twin (_fact.ts), which brands its components with their path and gives every schema its type (DOM-24, DOM-25).',
      severity: 'error',
      from: { path: '^(.+/)_([^/]+)\\.ts$' },
      to: { path: authored, pathNot: ['^$1$2\\.ts$', tests] },
    },
    {
      name: 'authored-only-through-generated-others',
      comment:
        'A file that is not generated never imports an authored file of the tree (fact.ts in an @ folder): it imports its generated twin (_fact.ts) (DOM-25).',
      severity: 'error',
      from: { pathNot: '/_[^/]+\\.ts$' },
      to: { path: authored, pathNot: tests },
    },
    {
      name: 'authored-only-through-here',
      comment:
        'An authored file of the tree takes the components of its own folder from the here of its kind (_here_command.ts), never from their twins nor from the point (_here.ts) (DOM-25).',
      severity: 'error',
      from: { path: '^(.+/@[^/]+/)[^_/][^/]*\\.ts$', pathNot: tests },
      to: { path: '^$1_[^/]+\\.ts$', pathNot: '^$1_here_[a-z]+\\.ts$' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'only-through-index-inside',
      comment: 'A folder of a package is reachable from another folder only through its index.ts.',
      severity: 'error',
      from: { path: '^(packages/[^/]+/src/[^/]+)/' },
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
    exclude: { path: '(^|/)(dist|\\.tsbuild|node_modules)/' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'types', 'default'],
      extensions: ['.ts', '.tsx', '.js'],
    },
  },
}
