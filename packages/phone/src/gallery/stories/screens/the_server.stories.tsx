// The server (UI-5; WEB-29): the relay told once, after the first face is made
// (`phone/test/screens/the_first_face.test.tsx`).

import { TheScreens } from '@q-mino/adapters-web/screens'
import { AScreenStory } from '../../a_screen_story.tsx'
import { words } from './fixtures_a.ts'

export default { title: 'Screens/The server', component: TheScreens }

export const what_it_carries_and_does_not_see = {
  render: () => (
    <AScreenStory
      plays={async (hand) => {
        await hand.until_it_says(words.the_first_face.make_it)
        hand.types('name', 'Anna')
        await hand.until(() => hand.shown().querySelector('button:not([disabled])') !== null)
        hand.taps(words.the_first_face.make_it)
        await hand.until(() => hand.node.activities_asked().length === 1)
        hand.node.comes_to_hold((now) => ({ ...now, faces: [{ face: 'F_a', name: 'Anna' }] }))
        hand.node.ends('G1', {
          ended: 'done',
          said: { event: 'your_face_is_being_made', payload: {} },
        })
        await hand.until_it_says(words.the_server.go_on)
      }}
    />
  ),
}
