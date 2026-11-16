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

// Shed's tree (DOM-25): the folders its map names (sight.ts: what each folder
// sees of the others, LIB-1), and everything below them; in them `_x.ts` is the
// generator's, any other `.ts` the author's; a folder prefixed with `@` is a
// folder of service, outside the tree. The map is one source, read here
// as by the generator, which writes it into the doors and the scopes. A domain's
// folder sits in the folder of its kind: Shed's layout, not the library's.
const shed = '^packages/domains/test/shed/'
const kinds = `(?:${Object.keys(sight).join('|')})`
// A folder named by a number is a past major of its domain (business/loans/1/): in the tree, outside the path (DOM-25, PER-17).
const major = '[0-9]+/'
const tree = `${shed}${kinds}/(?:[^@/][^/]*/|)(?:${major}|)`
const authored = `${tree}[^_/][^/]*\\.ts$`
const tests = '\\.test\\.ts$'
const sightRules = Object.entries(sight).map(([from, seen]) => ({
  name: `shed-sight-of-${from}`,
  comment: `Shed: the scopes of a folder under ${from} take of another folder only the door sight.ts opens to ${from} (_door_${from}.ts), besides their own folder's twins and their ancestors' (LIB-1, DOM-25).`,
  severity: 'error',
  from: { path: `${shed}${from}/([^@/][^/]*/|)_scope_[a-z]+\\.ts$` },
  to: {
    path: `${shed}${kinds}/`,
    pathNot: [
      `${shed}${from}/$1_[^/]+\\.ts$`,
      `${shed}${from}/_[^/]+\\.ts$`,
      ...Object.keys(seen).map((folder) => `${shed}${folder}/[^/]+/_door_${from}\\.ts$`),
    ],
  },
}))
const pastMajorRules = Object.entries(sight).map(([from, seen]) => ({
  name: `shed-past-major-of-${from}`,
  comment: `Shed: the scopes of a past major of a domain under ${from} (business/loans/1/) take, besides their own twins and what the domain's scopes take, the twins of the next major: a later major's folder, or the domain's own (PER-17, DOM-25).`,
  severity: 'error',
  from: { path: `${shed}${from}/([^@/][^/]*/)(${major})_scope_[a-z]+\\.ts$` },
  to: {
    path: `${shed}${kinds}/`,
    pathNot: [
      `${shed}${from}/$1$2_[^/]+\\.ts$`,
      `${shed}${from}/$1(?:${major}|)_[^/]+\\.ts$`,
      `${shed}${from}/_[^/]+\\.ts$`,
      ...Object.keys(seen).map((folder) => `${shed}${folder}/[^/]+/_door_${from}\\.ts$`),
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
    ...pastMajorRules,
    {
      name: 'shed-authored-through-its-scope',
      comment:
        "Shed: an authored file of the tree imports of the tree only its scope, which carries its folder's components, the doors of its ancestors to the folders below (_door_below.ts) and the doors sight.ts opens to it (DOM-25, LIB-1).",
      severity: 'error',
      from: { path: `${shed}(${kinds})/([^@/][^/]*/|)(${major}|)[^_/][^/]*\\.ts$`, pathNot: tests },
      to: {
        path: `${shed}${kinds}/`,
        pathNot: `${shed}$1/$2$3_scope_[a-z]+\\.ts$`,
      },
    },
    {
      name: 'shed-the-current-knows-no-past',
      comment:
        "Shed: no file of a domain's current version imports a past major (business/loans/1/): the past major goes to the current, never back, so that deleting its folder changes nothing else (PER-17, DOM-25).",
      severity: 'error',
      from: { path: `${shed}${kinds}/[^@/][^/]*/[^/]+\\.ts$` },
      to: { path: `${shed}${kinds}/[^@/][^/]*/${major}` },
    },
    {
      name: 'authored-only-through-generated',
      comment:
        'An authored file of the tree (fact.ts) is imported only by its generated twin (_fact.ts), which brands its components with their path and gives every schema its type (DOM-24, DOM-25).',
      severity: 'error',
      from: { path: '^(.+/)_([^/]+)\\.ts$' },
      to: { path: authored, pathNot: ['^$1$2\\.ts$', tests] },
    },
    {
      name: 'authored-only-through-generated-others',
      comment:
        'A file that is not generated never imports an authored file of the tree (fact.ts): it imports its generated twin (_fact.ts) (DOM-25).',
      severity: 'error',
      from: { pathNot: '/_[^/]+\\.ts$' },
      to: { path: authored, pathNot: tests },
    },
    {
      name: 'authored-only-through-scope',
      comment:
        'An authored file of the tree takes the components of its own folder from the scope of its kind (_scope_command.ts), never from their twins nor from the point (_scope.ts) (DOM-25).',
      severity: 'error',
      from: { path: `^(${tree.slice(1)})[^_/][^/]*\\.ts$`, pathNot: tests },
      to: { path: '^$1_[^/]+\\.ts$', pathNot: '^$1_scope_[a-z]+\\.ts$' },
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
