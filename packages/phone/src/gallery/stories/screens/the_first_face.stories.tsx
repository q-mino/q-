// The first face (UI-5; WEB-29): each case of the start with no face, as her node holds it
// and as her gestures reach it (`phone/test/screens/the_first_face.test.tsx`).

import { TheScreens } from '@q-mino/adapters-web/screens'
import { AScreenStory, type TheStorysHand } from '../../a_screen_story.tsx'
import { words } from './fixtures_a.ts'

export default { title: 'Screens/The first face', component: TheScreens }

/** She types her name and asks for the face; the activity is asked. */
const makes_it = async (hand: TheStorysHand): Promise<void> => {
  await hand.until_it_says(words.the_first_face.make_it)
  hand.types('name', 'Anna')
  await hand.until(() => hand.shown().querySelector('button:not([disabled])') !== null)
  await hand.until_it_says(words.the_first_face.make_it)
  hand.taps(words.the_first_face.make_it)
  await hand.until(() => hand.node.activities_asked().length === 1)
}

export const no_name_yet = {
  render: () => <AScreenStory />,
}

export const her_name_as_a_draft = {
  render: () => (
    <AScreenStory
      holds={{ drafts: [{ for: { for: 'the_name_of_my_first_face' }, text: 'Ann' }] }}
    />
  ),
}

export const making_it = {
  render: () => <AScreenStory plays={makes_it} />,
}

export const the_app_cannot_make_it = {
  render: () => (
    <AScreenStory
      plays={async (hand) => {
        await makes_it(hand)
        hand.node.ends('G1', {
          ended: 'the_app_cannot_do_it',
          said: { event: 'invalid_request', payload: {} },
        })
        await hand.until_it_says(words.common.how_it_ended.the_app_cannot_do_it)
      }}
    />
  ),
}
