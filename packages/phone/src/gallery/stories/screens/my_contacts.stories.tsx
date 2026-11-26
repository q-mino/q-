// Her contacts (UI-5; WEB-29): each case of the home, as her node holds it
// and as her gestures open it (`phone/test/screens/my_contacts.test.tsx`);
// since part M4 of messaging a row holding an extension's slot, greetings',
// the test extension's (MSG-15, K-3, K-13: `phone/test/screens/a_part.test.tsx`).

import { TheScreens } from '@q-mino/adapters-web/screens'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import { texts } from '../../../texts/index.ts'
import { AScreenStory } from '../../a_screen_story.tsx'
import {
  greetings_carried,
  greetings_seen,
  greetings_words,
  ten_in_rome,
  type WhatTheNodeHolds,
} from '../../../the_node_of_a_story/index.ts'

const words = texts.screens

/** Anna, her face F_a, the face she acts as. */
const anna: Partial<WhatTheNodeHolds> = {
  faces: [{ face: 'F_a', name: 'Anna' }],
  the_active_face: 'F_a',
}

const her_contacts: Partial<WhatTheNodeHolds> = {
  ...anna,
  contacts: [
    ui_value.a_contact_seen.parse({
      bond: 'L_b',
      name: 'Bruno',
      introduced_as: 'Bruno',
      confirmation: { state: 'received', at: ten_in_rome },
    }),
    ui_value.a_contact_seen.parse({
      bond: 'L_c',
      name: 'Carla R.',
      introduced_as: 'Carla',
      confirmation: { state: 'awaited' },
    }),
  ],
}

export default { title: 'Screens/My contacts', component: TheScreens }

export const none_yet = {
  render: () => <AScreenStory holds={anna} />,
}

export const some_contacts = {
  render: () => <AScreenStory holds={her_contacts} />,
}

export const the_menu_open = {
  render: () => (
    <AScreenStory
      holds={her_contacts}
      plays={async (hand) => {
        await hand.until_it_says('Bruno')
        hand.taps(words.my_contacts.the_menu)
        await hand.until(() => hand.shown().querySelector('nav') !== null)
      }}
    />
  ),
}

/** Greetings active and offered to Bruno: his row holds its slot, compact, a line; Carla's none. */
export const a_row_with_an_extension_s_slot = {
  render: () => (
    <AScreenStory
      holds={{
        ...her_contacts,
        extensions: [greetings_seen('active')],
        offers: [{ extension: 'greetings', bonds: ['L_b'] }],
      }}
      words={{ ...words.extensions, greetings: greetings_words }}
      parts={greetings_carried}
      plays={async (hand) => {
        await hand.until(() => hand.shown().querySelector('.the-greetings') !== null)
      }}
    />
  ),
}
