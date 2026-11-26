import * as boundary from '@q-mino/boundary'
import type { registry } from './persona/self/_registry.ts'

// The declaration of messaging (MSG-10, EXT-10; part M2): what the user
// accepts when she activates it, written once. Its version is its
// package's, which the build writes into the manifest as data with the
// boundary's; the configuration of the generator takes the context of its
// mounted folders from it (`mounted_of`, EXT-11). It sees on `known` the
// time the request declares (MSG-8), an annotation of a message received
// (MSG-6), and neither the peer's key nor the bond's name: the bond names
// the chat, and the kernel's screen around the slot names the contact. It
// calls the port of requests, toward its own leaf `message` on a bond's
// node, and its storage. Its one part, the chat, is placed by the slot
// `the_chat` on a bond's screen (MSG-7); the slot on the row of a contact,
// `the_chat_in_my_contacts` on `a_bond_in_my_contacts`, comes with that
// place (MSG-15, K-13: part M4), and the part's module with the kernel's
// parts (K-3: `shows`, read again as the part's module in part M4). No
// action (an action invokes a leaf with the place's data alone, which
// cannot carry a text), no page (MSG-7).

export const manifest = boundary.manifest({
  name: 'messaging',
  sees: { known: ['the_declared_time'] },
  touches: ['the_port_of_requests', 'its_storage'],
  slots: { the_chat: { on: 'a_bond', shows: 'parts/the_chat.js' } },
}) satisfies boundary.Manifest<typeof registry>
