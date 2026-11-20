import comments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import solid from 'eslint-plugin-solid/configs/typescript'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import configuration from './generator.config.ts'
import { sight } from './packages/domains/test/shed/sight.ts'

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
        projectService: {
          allowDefaultProject: ['*.js', '*.cjs', '*.mjs', '*.ts'],
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
    // The tree of Shed: the folders its map names (sight.ts), its `@` folders of service aside.
    files: Object.keys(sight).map((top) => `packages/domains/test/shed/${top}/**/*.ts`),
    ignores: ['packages/domains/test/shed/**/@*/**'],
    rules: tree_rules,
  },
  {
    // The trees of the extensions, as Shed's (CLAUDE.md, GR-10; part 12.4).
    files: extension_trees.flatMap((tree) =>
      Object.keys(tree.sight).map((top) => `${tree.root}/${top}/**/*.ts`),
    ),
    ignores: extension_trees.map((tree) => `${tree.root}/**/@*/**`),
    rules: tree_rules,
  },
  prettier,
)
