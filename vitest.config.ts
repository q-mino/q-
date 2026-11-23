import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

// Two projects: every test in Node, with no DOM; and those that need a DOM,
// in a DOM of test (happy-dom): the screens' rendering (step 22, in the
// phone's tests, with its Italian texts), Solid compiled for the browser, and
// an extension's realm in a frame (PWA-3). No happy-dom in the Node project
// (WEB-21): what a test there gives for a page is typed by its parts.
const the_screens = 'packages/phone/test/screens/**/*.test.{ts,tsx}'
const a_realm_in_a_frame = 'packages/adapters-web/test/frames/a_realm_in_a_frame.test.ts'

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
          exclude: [the_screens, a_realm_in_a_frame, '**/node_modules/**'],
        },
      },
      {
        plugins: [solid()],
        test: {
          name: 'screens',
          include: [the_screens, a_realm_in_a_frame],
          environment: 'happy-dom',
        },
      },
    ],
  },
})
