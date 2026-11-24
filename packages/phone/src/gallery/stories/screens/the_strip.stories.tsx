// The strip over the screens (UI-5; WEB-29): what the phone tells of the network and
// of the relay, over her contacts (`phone/test/screens/a_contact.test.tsx`).

import { TheScreens } from '@q-mino/adapters-web/screens'
import { texts } from '../../../texts/index.ts'
import { nothing_held } from '../../../the_node_of_a_story/index.ts'
import { AScreenStory } from '../../a_screen_story.tsx'
import { anna } from './fixtures_b.ts'

const words = texts.screens.common

export default { title: 'Screens/The strip', component: TheScreens }

export const no_network = {
  render: () => (
    <AScreenStory
      holds={{
        ...anna,
        the_network: 'offline',
        the_relay: { ...nothing_held.the_relay, met: 'did_not_answer' },
      }}
      plays={(hand) => hand.until_the_app_says(words.no_network)}
    />
  ),
}

export const the_relay_does_not_answer = {
  render: () => (
    <AScreenStory
      holds={{ ...anna, the_relay: { ...nothing_held.the_relay, met: 'did_not_answer' } }}
      plays={(hand) => hand.until_the_app_says(words.the_relay_does_not_answer)}
    />
  ),
}
