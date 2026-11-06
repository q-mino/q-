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
  prettier,
)
