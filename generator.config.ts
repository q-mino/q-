import type { Configuration } from './packages/generator/src/index.ts'
import { sight } from './packages/domains/test/shed/sight.ts'
import { sight as the_sight_of_q } from './packages/domains/src/sight.ts'

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
    {
      // q-'s tree, the kernel's domains (MBX-4): the folders its map names,
      // the relay's since part 8.1. Released to clients: its registries are
      // compared with main's (DOM-24, PER-17).
      root: 'packages/domains/src',
      sight: the_sight_of_q,
      library: 'library/index.ts',
      compared_with_main: true,
    },
  ],
} satisfies Configuration
