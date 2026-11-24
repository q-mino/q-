// The extensions (UI-5; EXT-7): the list, each way an extension is in it
// (`phone/test/screens/the_extensions.test.tsx`).

import { TheScreens } from '@q-mino/adapters-web/screens'
import { AScreenStory } from '../../a_screen_story.tsx'
import {
  anna,
  opens_an_entry,
  ping_pong,
  the_manifest,
  what_ping_pong_asks,
  words,
} from './fixtures_a.ts'

export default { title: 'Screens/The extensions', component: TheScreens }

const the_list = (extension: ReturnType<typeof ping_pong> | undefined) => (
  <AScreenStory
    holds={{ ...anna, extensions: extension === undefined ? [] : [extension] }}
    plays={async (hand) => {
      await opens_an_entry(hand, words.my_contacts.the_entries.the_extensions)
      await hand.until_it_says(extension === undefined ? words.the_extensions.none : 'Ping pong')
    }}
  />
)

export const none_installed = { render: () => the_list(undefined) }

export const one_not_active = { render: () => the_list(ping_pong('not_active')) }

export const one_active = { render: () => the_list(ping_pong('active')) }

export const one_waiting_for_the_new_manifest = {
  render: () =>
    the_list(
      ping_pong('waiting_for_the_new_manifest', [], the_manifest('0.2.0'), [
        ...what_ping_pong_asks,
        { asks: 'a_storage_of_its_own' },
      ]),
    ),
}
