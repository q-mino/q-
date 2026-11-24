// The handshake in person (UI-5; WEB-29): each case of the screen, as her node holds it
// and as her gestures reach it (`phone/test/screens/the_handshake_in_person.test.tsx`).

import { TheScreens } from '@q-mino/adapters-web/screens'
import { texts } from '../../../texts/index.ts'
import { a_camera_refused } from '../../../the_node_of_a_story/index.ts'
import { AScreenStory, type TheStorysHand } from '../../a_screen_story.tsx'
import {
  anna,
  bruno_s_ticket,
  her_ticket_is_ready,
  opens_from_her_contacts,
  the_link_of,
  until_it_shows,
} from './fixtures_b.ts'

const words = texts.screens
const in_person = words.the_handshake_in_person

// The ids a story draws, in order: her ticket's activity G1, its bond G2, then each scan or activity after.
const bond = 'G2'

const opens_the_handshake = (hand: TheStorysHand): Promise<void> =>
  opens_from_her_contacts(
    hand,
    words.my_contacts.the_entries.the_handshake_in_person,
    in_person.title,
  )

/** Her ticket is ready and the camera is on, the QR shown. */
const the_camera_is_on = async (hand: TheStorysHand): Promise<void> => {
  await opens_the_handshake(hand)
  await her_ticket_is_ready(hand, bond)
  await hand.until(() => hand.camera.is_on())
  await hand.until(() => !hand.shown().textContent.includes(in_person.the_camera.off))
}

/** Her ticket is ready, the camera as the story's device gives it. */
const her_ticket_is_shown = async (hand: TheStorysHand, camera_says: string): Promise<void> => {
  await opens_the_handshake(hand)
  await her_ticket_is_ready(hand, bond)
  await hand.until_it_says(camera_says)
}

/** Their ticket scanned: opening it is asked (activity G3). */
const their_ticket_is_read = async (hand: TheStorysHand): Promise<void> => {
  await the_camera_is_on(hand)
  hand.camera.shows(the_link_of(bruno_s_ticket))
  await hand.until_it_says(in_person.their_ticket_read)
}

export default { title: 'Screens/The handshake in person', component: TheScreens }

export const getting_the_ticket_ready = {
  render: () => (
    <AScreenStory
      holds={anna}
      plays={async (hand) => {
        await opens_the_handshake(hand)
        await hand.until_it_says(in_person.getting_the_ticket_ready)
      }}
    />
  ),
}

export const the_ticket_cannot_be_prepared = {
  render: () => (
    <AScreenStory
      holds={anna}
      plays={async (hand) => {
        await opens_the_handshake(hand)
        await hand.until(() => hand.node.activities_asked().length > 0)
        hand.node.ends('G1', {
          ended: 'cannot_be_done',
          said: { event: 'the_ticket_cannot_be_prepared', payload: {} },
        })
        await until_it_shows(hand, 'the_ticket_cannot_be_prepared')
      }}
    />
  ),
}

export const the_camera_not_answered_yet = {
  render: () => (
    <AScreenStory
      holds={anna}
      scans={() => new Promise<never>(() => undefined)}
      plays={(hand) => her_ticket_is_shown(hand, in_person.the_camera.off)}
    />
  ),
}

export const the_camera_on = {
  render: () => <AScreenStory holds={anna} plays={the_camera_is_on} />,
}

export const the_camera_refused = {
  render: () => (
    <AScreenStory
      holds={anna}
      scans={a_camera_refused}
      plays={(hand) => her_ticket_is_shown(hand, in_person.the_camera.refused)}
    />
  ),
}

export const the_camera_missing = {
  render: () => (
    <AScreenStory
      holds={anna}
      scans={() => Promise.resolve({ is: 'missing' })}
      plays={(hand) => her_ticket_is_shown(hand, in_person.the_camera.missing)}
    />
  ),
}

export const the_camera_busy = {
  render: () => (
    <AScreenStory
      holds={anna}
      scans={() => Promise.resolve({ is: 'busy' })}
      plays={(hand) => her_ticket_is_shown(hand, in_person.the_camera.busy)}
    />
  ),
}

export const two_cameras_with_the_turn_gesture = {
  render: () => (
    <AScreenStory
      holds={anna}
      cameras="more_than_one"
      plays={async (hand) => {
        await the_camera_is_on(hand)
        await hand.until_it_says(in_person.turn_the_camera.to_the_rear)
      }}
    />
  ),
}

export const the_camera_turned_to_the_rear = {
  render: () => (
    <AScreenStory
      holds={anna}
      cameras="more_than_one"
      plays={async (hand) => {
        await the_camera_is_on(hand)
        await hand.until_it_says(in_person.turn_the_camera.to_the_rear)
        hand.taps(in_person.turn_the_camera.to_the_rear)
        await hand.until_it_says(in_person.turn_the_camera.to_the_front)
      }}
    />
  ),
}

export const a_text_with_no_ticket = {
  render: () => (
    <AScreenStory
      holds={anna}
      plays={async (hand) => {
        await the_camera_is_on(hand)
        hand.camera.shows('ciao')
        await hand.until_it_says(in_person.scanned.no_ticket)
      }}
    />
  ),
}

export const a_ticket_out_of_its_form = {
  render: () => (
    <AScreenStory
      holds={anna}
      plays={async (hand) => {
        await the_camera_is_on(hand)
        hand.camera.shows('https://cumino.example/q-/#ticket=!!!')
        await hand.until_it_says(in_person.scanned.a_ticket_out_of_its_form)
      }}
    />
  ),
}

export const their_ticket_read = {
  render: () => <AScreenStory holds={anna} plays={their_ticket_is_read} />,
}

export const bonded_in_person = {
  render: () => (
    <AScreenStory
      holds={anna}
      plays={async (hand) => {
        await their_ticket_is_read(hand)
        hand.node.ends('G3', { ended: 'done', said: { event: 'you_met_in_person', payload: {} } })
        await hand.until_it_says(in_person.done)
        hand.taps(in_person.done)
        await hand.until_it_says(in_person.bonded_in_person('Bruno'))
      }}
    />
  ),
}

export const bonded_at_a_distance_after_the_scan = {
  render: () => (
    <AScreenStory
      holds={anna}
      plays={async (hand) => {
        await their_ticket_is_read(hand)
        hand.node.ends('G3', { ended: 'done', said: { event: 'you_are_bonded', payload: {} } })
        await hand.until_it_says(in_person.done)
        hand.taps(in_person.done)
        await hand.until_it_says(in_person.bonded('Bruno'))
      }}
    />
  ),
}

export const opening_their_ticket = {
  render: () => (
    <AScreenStory
      holds={anna}
      plays={async (hand) => {
        await their_ticket_is_read(hand)
        hand.taps(in_person.done)
        await hand.until_it_says(in_person.opening_their_ticket('Bruno'))
      }}
    />
  ),
}

export const bonded_already = {
  render: () => (
    <AScreenStory
      holds={anna}
      plays={async (hand) => {
        await their_ticket_is_read(hand)
        hand.taps(in_person.done)
        await hand.until_it_says(in_person.opening_their_ticket('Bruno'))
        hand.node.ends('G3', {
          ended: 'done_already',
          said: { event: 'you_opened_their_ticket_already', payload: {} },
        })
        await hand.until_it_says(in_person.bonded_already('Bruno'))
      }}
    />
  ),
}

export const their_ticket_cannot_be_opened = {
  render: () => (
    <AScreenStory
      holds={anna}
      plays={async (hand) => {
        await their_ticket_is_read(hand)
        hand.node.ends('G3', {
          ended: 'cannot_be_done',
          said: { event: 'their_ticket_cannot_be_opened', payload: {} },
        })
        await hand.until_it_says(in_person.their_ticket_cannot_be_opened('Bruno'))
      }}
    />
  ),
}
