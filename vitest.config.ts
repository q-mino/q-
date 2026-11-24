import { defineConfig } from 'vitest/config'

// Two projects: every test in Node, with no DOM; and those that need a DOM,
// in a DOM of test (happy-dom): the screens' rendering (step 22, in the
// phone's tests, with its Italian texts), Preact's JSX compiled by vitest's
// own transform from the tsconfig (`jsx: react-jsx`, `jsxImportSource:
// preact`), no plugin. No happy-dom in the Node project
// (WEB-21): what a test there gives for a page is typed by its parts.
const the_screens = 'packages/phone/test/screens/**/*.test.{ts,tsx}'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          include: [
            'packages/*/test/**/*.test.{ts,tsx}',
            'packages/extensions/*/test/**/*.test.ts',
          ],
          exclude: [the_screens, '**/node_modules/**'],
        },
      },
      {
        test: {
          name: 'screens',
          include: [the_screens],
          environment: 'happy-dom',
        },
      },
    ],
  },
})
