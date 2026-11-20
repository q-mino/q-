import * as boundary from '@q-mino/boundary'
import type { registry } from './persona/self/_registry.ts'

// The declaration of the test extension (EXT-10; part 12.4): what the user
// accepts, written once. Its version is its package's, which the build
// writes into the manifest as data with the boundary's; its leaves on `self`
// are typed by the registry the generator writes (`invokes`), imported as a
// type, since the generator's configuration loads this module at `pnpm
// generate`, before the registry is written again. The configuration takes
// the context of its mounted folders from it (`mounted_of`, EXT-11). Its
// actions and its leaves come with its business.

export const manifest = boundary.manifest({
  name: 'greetings',
  touches: ['the_port_of_requests', 'its_storage'],
}) satisfies boundary.Manifest<typeof registry>
