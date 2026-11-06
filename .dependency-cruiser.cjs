// The architecture's arrows (see docs/architecture.md § 2): who may import whom.
// Each domain declares the domains it consumes in its marker, domain.ts (LIB-14); the library's
// compiler turns the markers into these rules (LIB-19): it allows a domain the library, itself and
// the surface of the domains it consumes (GR-1, LIB-21). Run `pnpm compile` after changing a marker.
const arrowRules = [
  ...require('./packages/domains/src/arrows.generated.cjs'),
  ...require('./packages/domains/test/domains/arrows.generated.cjs'),
]

module.exports = {
  forbidden: [
    ...arrowRules,
    {
      name: 'library-imports-nothing',
      comment: 'The library imports no domain (LIB-2).',
      severity: 'error',
      from: { path: '^packages/domains/src/library/' },
      to: { path: '^packages/domains/src/', pathNot: '^packages/domains/src/library/' },
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
      from: { path: '^(packages/[^/]+/src/[^/]+)/', pathNot: '^packages/domains/src/' },
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
