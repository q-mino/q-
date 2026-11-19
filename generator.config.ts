import type { Configuration } from './packages/generator/src/index.ts'
import { sight } from './packages/domains/test/shed/sight.ts'

// The trees the generator writes (DOM-25): `pnpm generate`, `pnpm generate:check`.

export default {
  trees: [
    {
      // Shed, the test domains: its generated files import the library (since
      // part 7.5; the wished library, `wlib.ts`, until then); its registries
      // are not compared with main's, since it changes as design, not as
      // releases.
      root: 'packages/domains/test/shed',
      sight,
      library: '../../src/library/index.ts',
      compared_with_main: false,
    },
  ],
} satisfies Configuration
