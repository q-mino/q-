import * as boundary from '@q-mino/boundary'
import type { registry } from './persona/self/_registry.ts'

// The declaration of the test extension (EXT-10; part 12.4): what the user
// accepts, written once. Its version is its package's, which the build
// writes into the manifest as data with the boundary's; its leaves on `self`
// are typed by the registry the generator writes (`invokes`), imported as a
// type, since the generator's configuration loads this module at `pnpm
// generate`, before the registry is written again. The configuration takes
// the context of its mounted folders from it (`mounted_of`, EXT-11). It sees
// on `known` the bond alone; it calls the port of requests, toward its own
// leaf `greet` on a bond's node, and its storage; on a bond's screen, the
// action `greet` (the label "Saluta", its `texts/` with step 16) invokes
// its leaf on `self` with the bond (EXT-16). No slot, no page: a part's
// document comes with steps 16 and 22.

export const manifest = boundary.manifest({
  name: 'greetings',
  touches: ['the_port_of_requests', 'its_storage'],
  actions: { greet: { on: 'a_bond', invokes: 'usecase/greet_a_bond' } },
}) satisfies boundary.Manifest<typeof registry>
