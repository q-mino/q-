// A page (UI-5; EXT-16, WEB-22, WEB-23): an extension's page opened from its own screen, and
// the page no longer there (`phone/test/screens/the_points.test.tsx`).

import { TheScreens } from '@q-mino/adapters-web/screens'
import { AScreenStory, type TheStorysHand } from '../../a_screen_story.tsx'
import { anna, opens_the_extension, ping_pong, words } from './fixtures_a.ts'

export default { title: 'Screens/A page', component: TheScreens }

const with_a_page = ping_pong('active', [
  { point: 'page', name: 'the_scores', place: 'the_extension' },
])

/** Ping pong's words with a label for its page `the_scores`. */
const with_the_scores_labelled = {
  ping_pong: { ...words.extensions.ping_pong, pages: { the_scores: 'I punteggi' } },
}

const opens_the_page = async (hand: TheStorysHand): Promise<void> => {
  await opens_the_extension(hand, 'Ping pong')
  const opens = words.common.the_points.opens_the_page('I punteggi')
  await hand.until_it_says(opens)
  hand.taps(opens)
  await hand.until_it_says(words.common.the_points.no_document)
}

export const the_page_of_an_extension = {
  render: () => (
    <AScreenStory
      holds={{ ...anna, extensions: [with_a_page] }}
      words={with_the_scores_labelled}
      plays={opens_the_page}
    />
  ),
}

export const the_page_no_longer_there = {
  render: () => (
    <AScreenStory
      holds={{ ...anna, extensions: [with_a_page] }}
      words={with_the_scores_labelled}
      plays={async (hand) => {
        await opens_the_page(hand)
        hand.node.comes_to_hold((now) => ({
          ...now,
          extensions: [{ ...with_a_page, is: 'not_active' }],
        }))
        await hand.until_it_says(words.a_page.no_longer_there)
      }}
    />
  ),
}
