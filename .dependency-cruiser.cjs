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
// the folder of its kind. The library knows only the prefixes: `@x` is the
// author's, `_x` the generator's (DOM-25).
const kinds = '(?:business|persona)'
const shed = '^packages/domains/test/shed/'

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

module.exports = {
  forbidden: [
    ...arrowRules,
    {
      name: 'shed-business-isolated',
      comment:
        'Shed: a business domain imports of another only its identities, _id.ts (GR-3, V11), and nothing of a persona; the adapters link them.',
      severity: 'error',
      from: { path: `${shed}business/([^/]+)/` },
      to: {
        path: `${shed}${kinds}/`,
        pathNot: [`${shed}business/$1/`, `${shed}business/[^/]+/_id\\.ts$`],
      },
    },
    {
      name: 'shed-persona-through-doors',
      comment:
        'Shed: a persona imports of a business domain only its door, _index.ts, which exposes its use cases and identities and nothing else (DOM-2, DOM-25, GR-1), and nothing of another persona.',
      severity: 'error',
      from: { path: `${shed}persona/([^/]+)/` },
      to: {
        path: `${shed}${kinds}/`,
        pathNot: [`${shed}persona/$1/`, `${shed}business/[^/]+/_index\\.ts$`],
      },
    },
    {
      name: 'authored-only-through-generated',
      comment:
        'An authored module (@fact.ts) is imported only by its generated twin (_fact.ts), which brands its components with their path and gives every schema its type (DOM-24, DOM-25).',
      severity: 'error',
      from: { path: '^(.+/)_([^/]+)\\.ts$' },
      to: { path: '/@[^/]+\\.ts$', pathNot: '^$1@$2\\.ts$' },
    },
    {
      name: 'authored-only-through-generated-others',
      comment:
        'A file that is not generated never imports an authored module (@fact.ts): it imports its generated twin (_fact.ts) (DOM-25).',
      severity: 'error',
      from: { pathNot: '/_[^/]+\\.ts$' },
      to: { path: '/@[^/]+\\.ts$' },
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
