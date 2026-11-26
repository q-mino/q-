// Greetings, the test extension, in a story (K-3, K-13; part M4 of
// messaging): as the screens see it, active, with its action and its two
// slots, on a bond's screen and on its row in her contacts; its words, the
// gallery's (the app does not carry it); and its part, carried as the
// composition root carries one, its module imported when first drawn. The
// same for the screens' tests and the gallery's stories.

import * as boundary from '@q-mino/boundary'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as user_value from '@q-mino/domains/user/_value.ts'
import greetings_manifest from '@q-mino/greetings/manifest.json' with { type: 'json' }
import { the_parts_carried } from '../the_parts.ts'
import { the_words_of_greetings } from '../texts/index.ts'

/** Greetings as the screens see it: active or not, its manifest as she is shown it. */
export const greetings_seen = (is: ui_value.an_extension_seen['is']): ui_value.an_extension_seen =>
  ui_value.an_extension_seen.parse({
    extension: 'greetings',
    version: '0.1.0',
    is,
    manifest: user_value.a_manifest.parse({
      name: 'greetings',
      version: '0.1.0',
      sees: { known: [] },
      touches: ['the_port_of_requests', 'its_storage'],
      extension_points: [
        { point: 'action', name: 'greet', place: 'a_bond' },
        { point: 'slot', name: 'the_greetings_of_a_bond', place: 'a_bond' },
        { point: 'slot', name: 'the_greetings_in_my_contacts', place: 'a_bond_in_my_contacts' },
      ],
      leaves_on_known: ['usecase/greet'],
      majors: { self: [1], known: [1] },
    }),
    what_it_asks: [{ asks: 'to_send_requests_on_your_bonds' }],
  })

/** Greetings' words, as the kernel parses an extension's (WEB-22). */
export const greetings_words = boundary.the_words_of_an_extension.parse(the_words_of_greetings)

/** Greetings carried with its part, as the composition root carries an extension (K-3). */
export const greetings_carried = the_parts_carried([
  {
    manifest: greetings_manifest,
    realm: () => {
      throw new Error('a story hosts no extension')
    },
    parts: {
      'parts/the_greetings.js': () => import('@q-mino/greetings/parts/the_greetings.js'),
    },
  },
])
