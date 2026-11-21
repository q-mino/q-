import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

// Two projects: every test in Node, with no DOM; and the screens' rendering
// (step 22, in the phone's tests, with its Italian texts), Solid compiled for
// the browser, in a DOM of test (happy-dom).
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
        plugins: [solid()],
        test: { name: 'screens', include: [the_screens], environment: 'happy-dom' },
      },
    ],
  },
})
