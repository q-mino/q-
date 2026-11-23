import comments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import solid from 'eslint-plugin-solid/configs/typescript'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import configuration from './generator.config.ts'
import { sight } from './packages/domains/test/shed/sight.ts'
import { sight as the_sight_of_q } from './packages/domains/src/sight.ts'

// The rules of a domains' tree (DOM-25, CLAUDE.md): a branch's condition and a query's selection are
// named, never composed inline; a file imports one scope; no derogation: no cast but `as const`, no directive.
const tree_rules = {
  'no-restricted-syntax': [
    'error',
    {
      selector:
        "CallExpression[callee.name='command'] > ObjectExpression > Property[key.name='outcomes'] > ObjectExpression > Property > ArrayExpression > CallExpression:first-child",
      message:
        "A branch's condition is a predicate or a named condition (DOM-25): name it in a constant.",
    },
    {
      selector:
        "CallExpression[callee.name='query'] > ObjectExpression > Property[key.name='selection'] > CallExpression",
      message:
        "A query's selection is a selection predicate or a named condition (DOM-25): name it in a constant.",
    },
    {
      selector:
        'ImportDeclaration[source.value=/_scope(_[a-z]+)?\\.ts$/] ~ ImportDeclaration[source.value=/_scope(_[a-z]+)?\\.ts$/]',
      message:
        'A file imports one scope, the one of its kind (DOM-25): it gives the builders of the kind and what it sees.',
    },
  ],
  '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
  '@eslint-community/eslint-comments/no-use': ['error', { allow: [] }],
  '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': true }],
}

// An extension's declaration (EXT-10; A, 21 Nov 2026): its actions' `invokes` are typed by the registry of its
// leaves on `self` only through the `satisfies`, which no compiler asks for: the lint asks it of the export
// `manifest` of every extension's `manifest.ts`.
const the_rule_of_a_manifest = {
  'no-restricted-syntax': [
    'error',
    {
      selector:
        "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name='manifest']:not([init.type='TSSatisfiesExpression'][init.typeAnnotation.typeName.left.name='boundary'][init.typeAnnotation.typeName.right.name='Manifest'][init.typeAnnotation.typeArguments.params.0.exprName.name='registry'])",
      message:
        "An extension's manifest satisfies `boundary.Manifest<typeof registry>` (EXT-10): its actions' `invokes` typed by the registry of its leaves on `self`.",
    },
  ],
}

// The extensions' trees (EXT-9, EXT-11, GR-10): the folders each map names, from the generator's
// configuration as the cruiser reads them; not their `adapter/`, `configurator.ts`, `manifest.ts`, tests.
const extension_trees = configuration.trees.filter((tree) =>
  tree.root.startsWith('packages/extensions/'),
)

export default defineConfig(
  globalIgnores(['**/dist/', '**/.tsbuild/', '**/coverage/', '**/.generated/']),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  comments.recommended,
  {
    // A derogation says why on its line, for one rule and the next line only, and fails once it is no longer needed (CLAUDE.md).
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      '@eslint-community/eslint-comments/require-description': 'error',
      '@eslint-community/eslint-comments/no-use': [
        'error',
        { allow: ['eslint-disable-next-line'] },
      ],
    },
  },
  {
    languageOptions: {
      parserOptions: {
        // The root's TypeScript files are in a project of their own (`tsconfig.config.json`, EXT-11).
        projectService: {
          allowDefaultProject: ['*.js', '*.cjs', '*.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { module: 'writable', require: 'readonly' },
    },
  },
  {
    // Solid: components run once, props are reactive getters (no destructuring).
    files: ['packages/phone/src/**/*.tsx', 'packages/adapters-web/src/**/*.tsx'],
    ...solid,
  },
  {
    // The trees of the domains: the folders Shed's map names (sight.ts), and q-'s
    // (`packages/domains/src/sight.ts`, MBX-4), their `@` folders of service aside.
    files: [
      ...Object.keys(sight).map((top) => `packages/domains/test/shed/${top}/**/*.ts`),
      ...Object.keys(the_sight_of_q).map((top) => `packages/domains/src/${top}/**/*.ts`),
    ],
    ignores: ['packages/domains/test/shed/**/@*/**', 'packages/domains/src/**/@*/**'],
    rules: tree_rules,
  },
  {
    // `user` wears the persona `self` only, never a remote peer's (GR-7, D76; part 13.3): its files
    // import no other persona of the kernel, by a relative path or the package's.
    files: ['packages/domains/src/user/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)persona/(known|unknown|anonymous)(/|\\.ts$|$)',
              message:
                '`user` uses only the persona `self`, never the personas of remote peers (GR-7).',
            },
          ],
        },
      ],
    },
  },
  {
    // The trees of the extensions, as Shed's (CLAUDE.md, GR-10; part 12.4).
    files: extension_trees.flatMap((tree) =>
      Object.keys(tree.sight).map((top) => `${tree.root}/${top}/**/*.ts`),
    ),
    ignores: extension_trees.map((tree) => `${tree.root}/**/@*/**`),
    rules: tree_rules,
  },
  {
    // The declaration of every extension (EXT-10).
    files: ['packages/extensions/*/manifest.ts'],
    rules: the_rule_of_a_manifest,
  },
  prettier,
)
