// The handshake at a distance (UI-5; WEB-29): each case of the screen, as her
// gestures reach it (`phone/test/screens/the_handshake_at_a_distance.test.tsx`).

import { TheScreens } from '@q-mino/adapters-web/screens'
import { texts } from '../../../texts/index.ts'
import { AScreenStory, type TheStorysHand } from '../../a_screen_story.tsx'
import { anna, anna_s_ticket_for, opens_from_her_contacts } from './fixtures_b.ts'

const words = texts.screens
const at_a_distance = words.the_handshake_at_a_distance

// The ids a story draws, in order: the activity G1, its bond G2, then G3 and G4 for a second link.
const opens_the_screen = (hand: TheStorysHand): Promise<void> =>
  opens_from_her_contacts(
    hand,
    words.my_contacts.the_entries.the_handshake_at_a_distance,
    at_a_distance.title,
  )

/** She makes a link: its ticket asked for. */
const makes_a_link = async (hand: TheStorysHand): Promise<void> => {
  await opens_the_screen(hand)
  hand.taps(at_a_distance.make_a_link)
  await hand.until(() => hand.node.activities_asked().length > 0)
}

/** Her ticket ready, the link shown. */
const the_link_is_ready = async (hand: TheStorysHand): Promise<void> => {
  await makes_a_link(hand)
  hand.node.comes_to_hold((now) => ({ ...now, tickets: [anna_s_ticket_for('G2')] }))
  hand.node.ends('G1', {
    ended: 'done',
    said: { event: 'your_ticket_is_being_prepared', payload: {} },
  })
  await hand.until(() => hand.shown().querySelector('input[name="link"]') !== null)
}

export default { title: 'Screens/The handshake at a distance', component: TheScreens }

export const the_flaw_told_first = {
  render: () => (
    <AScreenStory
      holds={anna}
      plays={async (hand) => {
        await opens_the_screen(hand)
        await hand.until_it_says(at_a_distance.the_flaw)
      }}
    />
  ),
}

export const getting_the_link_ready = {
  render: () => (
    <AScreenStory
      holds={anna}
      plays={async (hand) => {
        await makes_a_link(hand)
        await hand.until_it_says(at_a_distance.getting_the_link_ready)
      }}
    />
  ),
}

export const the_link_ready_to_share = {
  render: () => <AScreenStory holds={anna} plays={the_link_is_ready} />,
}

export const the_link_ready_to_copy = {
  render: () => (
    <AScreenStory
      holds={anna}
      shares={false}
      plays={async (hand) => {
        await the_link_is_ready(hand)
        await hand.until_it_says(at_a_distance.copy_the_link)
      }}
    />
  ),
}

export const the_link_is_copied = {
  render: () => (
    <AScreenStory
      holds={anna}
      shares={false}
      plays={async (hand) => {
        await the_link_is_ready(hand)
        hand.taps(at_a_distance.copy_the_link)
        await hand.until_it_says(at_a_distance.the_link_is_copied)
      }}
    />
  ),
}

export const the_link_cannot_be_prepared = {
  render: () => (
    <AScreenStory
      holds={anna}
      plays={async (hand) => {
        await makes_a_link(hand)
        hand.node.ends('G1', {
          ended: 'cannot_be_done',
          said: { event: 'the_ticket_cannot_be_prepared', payload: {} },
        })
        await hand.until_it_says(at_a_distance.the_link_cannot_be_prepared)
      }}
    />
  ),
}
