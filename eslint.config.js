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
          allowDefaultProject: ['*.js', '*.cjs', '*.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.js', '**/*.cjs'],
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
    files: ['packages/domains/src/**/-domain/**/*.ts', 'packages/domains/test/**/-domain/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name='command'] > ObjectExpression > Property[key.name='outcomes'] > ObjectExpression > Property > ArrayExpression > CallExpression:first-child",
          message:
            "A branch's condition is a predicate or a named condition (DOM-25): name it in a constant.",
        },
        {
          selector:
            "CallExpression[callee.property.name='query'] > ObjectExpression > Property[key.name='selection'] > CallExpression",
          message:
            "A query's selection is a selection predicate or a named condition (DOM-25): name it in a constant.",
        },
      ],
    },
  },
  prettier,
)
