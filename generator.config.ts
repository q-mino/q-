import type { Configuration } from './packages/generator/src/index.ts'
import { sight } from './packages/domains/test/shed/sight.ts'
import { sight as the_sight_of_q } from './packages/domains/src/sight.ts'
import { sight as the_sight_of_greetings } from './packages/extensions/greetings/sight.ts'
import { manifest as the_manifest_of_greetings } from './packages/extensions/greetings/manifest.ts'
import { sight as the_sight_of_ping_pong } from './packages/extensions/ping_pong/sight.ts'
import { manifest as the_manifest_of_ping_pong } from './packages/extensions/ping_pong/manifest.ts'
import { sight as the_sight_of_messaging } from './packages/extensions/messaging/sight.ts'
import { manifest as the_manifest_of_messaging } from './packages/extensions/messaging/manifest.ts'
import { mounted_of } from './packages/boundary/src/index.ts'

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
    {
      // The test extension's tree (EXT-9, EXT-11; part 12.3): its personas
      // mounted below the kernel's nodes, each point given the context the
      // kernel's node gives there, by the names of `boundary`'s schemas,
      // which `mounted_of` takes from its manifest's `sees` (part 12.4):
      // every leaf on `known` sees the bond, and what `sees.known` lists;
      // `self` sees the root's context alone. A test tree, not given to
      // peers: not compared with main's, as Shed.
      root: 'packages/extensions/greetings',
      sight: the_sight_of_greetings,
      library: '../../domains/src/library/index.ts',
      compared_with_main: false,
      mounted: mounted_of(the_manifest_of_greetings),
    },
    {
      // Ping pong, the first extension (EXT-9, EXT-11; part 14.1): its
      // personas mounted below the kernel's nodes, with the context its
      // manifest's `sees` gives (`mounted_of`): the bond alone on `known`,
      // the root's context on `self`. Its surfaces are given to peers:
      // compared with main's (PER-17).
      root: 'packages/extensions/ping_pong',
      sight: the_sight_of_ping_pong,
      library: '../../domains/src/library/index.ts',
      compared_with_main: true,
      mounted: mounted_of(the_manifest_of_ping_pong),
    },
    {
      // Messaging, the first extension after ping pong (MSG-1; part M2): its
      // personas mounted below the kernel's nodes, with the context its
      // manifest's `sees` gives (`mounted_of`): on `known` the bond and the
      // time the request declares (MSG-8), on `self` the root's context. Its
      // surfaces are given to peers: compared with main's (PER-17).
      root: 'packages/extensions/messaging',
      sight: the_sight_of_messaging,
      library: '../../domains/src/library/index.ts',
      compared_with_main: true,
      mounted: mounted_of(the_manifest_of_messaging),
    },
  ],
} satisfies Configuration
