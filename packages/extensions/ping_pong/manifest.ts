import * as boundary from '@q-mino/boundary'
import type { registry } from './persona/self/_registry.ts'

// The declaration of ping pong (PNG-5, EXT-10; part 14.1): what the user
// accepts when she activates it, written once. Its version is its
// package's, which the build writes into the manifest as data with the
// boundary's; its leaves on `self` are typed by the registry the generator
// writes (`invokes`), imported as a type, since the generator's
// configuration loads this module at `pnpm generate`, before the registry
// is written again. The configuration takes the context of its mounted
// folders from it (`mounted_of`, EXT-11). It sees on `known` the bond alone;
// it calls the port of requests, toward its own leaf `ping` on a bond's
// node, and its storage; on a bond's screen, the action `ping` (the label
// "Ping", in its words, `texts/it.ts`) invokes its leaf on `self` with the
// bond, which follows the ping to its pong (EXT-16, DOM-3): where the pong
// is shown. No slot, no page in stage 1's first release of it: the slot of
// a bond's pings, a frame that follows a read of them, is the remedy
// deferred of PNG-4's declared flaw (a pong later than the leaf's 70
// seconds is recorded but shown on no screen), an extension point that
// asks more of an activation (EXT-10).

export const manifest = boundary.manifest({
  name: 'ping_pong',
  touches: ['the_port_of_requests', 'its_storage'],
  actions: { ping: { on: 'a_bond', invokes: 'usecase/send_a_ping' } },
}) satisfies boundary.Manifest<typeof registry>
