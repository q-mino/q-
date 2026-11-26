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
// its leaf on `self` with the bond (EXT-16). Since part M4 of messaging
// (K-3, K-13) its part, the first of an extension's package the kernel
// draws: two slots, on a bond's screen and on its row in her contacts, one
// module (`parts/the_greetings.js`, its export `part`). No page.

export const manifest = boundary.manifest({
  name: 'greetings',
  touches: ['the_port_of_requests', 'its_storage'],
  actions: { greet: { on: 'a_bond', invokes: 'usecase/greet_a_bond' } },
  slots: {
    the_greetings_of_a_bond: { on: 'a_bond', shows: 'parts/the_greetings.js' },
    the_greetings_in_my_contacts: { on: 'a_bond_in_my_contacts', shows: 'parts/the_greetings.js' },
  },
}) satisfies boundary.Manifest<typeof registry>
