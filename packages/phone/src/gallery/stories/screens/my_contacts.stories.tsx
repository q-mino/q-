// Her contacts (UI-5; WEB-29): each case of the home, as her node holds it
// and as her gestures open it (`phone/test/screens/my_contacts.test.tsx`).

import { TheScreens } from '@q-mino/adapters-web/screens'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import { texts } from '../../../texts/index.ts'
import { AScreenStory } from '../../a_screen_story.tsx'
import { ten_in_rome, type WhatTheNodeHolds } from '../../a_node_of_a_story.ts'

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
