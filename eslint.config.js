import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import solid from 'eslint-plugin-solid/configs/typescript'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
  globalIgnores(['**/dist/', '**/.tsbuild/', '**/coverage/']),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
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
    // DOM-25: a branch's condition and a query's selection are named, never composed inline.
    files: ['packages/domains/**/@*.ts', 'packages/domains/**/@*/**/*.ts'],
    rules: {
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
            'ImportDeclaration[source.value=/_here(_[a-z]+)?\\.ts$/] ~ ImportDeclaration[source.value=/_here(_[a-z]+)?\\.ts$/]',
          message:
            'A file imports one here, the one of its layer (DOM-25): it gives the builders of the layer and the components below it.',
        },
      ],
    },
  },
  prettier,
)
