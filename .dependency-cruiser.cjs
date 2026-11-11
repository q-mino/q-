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
      name: 'shed-domains-isolated',
      comment:
        'Shed: a test domain imports of another only its identities, id.ts (GR-3, V11); the adapters link them.',
      severity: 'error',
      from: { path: '^packages/domains/test/shed/([^/_][^/]*)/' },
      to: {
        path: '^packages/domains/test/shed/[^/]+/',
        pathNot: [
          '^packages/domains/test/shed/$1/',
          '^packages/domains/test/shed/[^/_][^/]*/_domain/id\\.ts$',
        ],
      },
    },
    {
      name: 'authored-only-through-generated',
      comment:
        'An authored module of a domain (_fact.ts) is imported only by its generated twin (fact.ts), which brands its components with their path and gives every schema its type (DOM-24, DOM-25).',
      severity: 'error',
      from: { path: '^(.+/)([^/_][^/]*)\\.ts$' },
      to: {
        path: ['/_domain/_[^/]+\\.ts$', '/_domain/[^/]+/_[^/]+\\.ts$'],
        pathNot: '^$1_$2\\.ts$',
      },
    },
    {
      name: 'module-folder-only-through-index-inside',
      comment:
        "A domain's module folder (DOM-25) is reachable from another folder only through its generated index.ts.",
      severity: 'error',
      from: { path: '^(packages/domains/.+/_domain/[^/]+)/' },
      to: {
        path: '^packages/domains/.+/_domain/[^/]+/',
        pathNot: ['^$1/', '^packages/domains/.+/_domain/[^/]+/index\\.ts$'],
      },
    },
    {
      name: 'module-folder-only-through-index-outside',
      comment:
        "From outside any module folder, a domain's module folder (DOM-25) is reachable only through its generated index.ts.",
      severity: 'error',
      from: { pathNot: '^packages/domains/.+/_domain/[^/]+/' },
      to: {
        path: '^packages/domains/.+/_domain/[^/]+/',
        pathNot: '^packages/domains/.+/_domain/[^/]+/index\\.ts$',
      },
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
