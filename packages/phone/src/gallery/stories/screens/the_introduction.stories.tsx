// The introduction (UI-6; WEB-29): its three cards read the first time,
// after the first face is made, skippable on to the server; and read again
// from the menu, back where she was after the last
// (`phone/test/screens/the_introduction.test.tsx`).

import { TheScreens } from '@q-mino/adapters-web/screens'
import { AScreenStory, type TheStorysHand } from '../../a_screen_story.tsx'
import { anna, words } from './fixtures_a.ts'

export default { title: 'Screens/The introduction', component: TheScreens }

const its = words.the_introduction

/** Her first face made: the introduction, read the first time. */
const her_first_face_made = async (hand: TheStorysHand): Promise<void> => {
  await hand.until_it_says(words.the_first_face.make_it)
  hand.types('name', 'Anna')
  await hand.until(() => hand.shown().querySelector('button:not([disabled])') !== null)
  hand.taps(words.the_first_face.make_it)
  await hand.until(() => hand.node.activities_asked().length === 1)
  hand.node.comes_to_hold((now) => ({ ...now, faces: [{ face: 'F_a', name: 'Anna' }] }))
  hand.node.ends('G1', { ended: 'done', said: { event: 'your_face_is_being_made', payload: {} } })
  await hand.until_it_says(its.the_cards.what_cumino_is.title)
}

/** The introduction opened from the menu of her contacts: read again. */
const from_the_menu = async (hand: TheStorysHand): Promise<void> => {
  await hand.until_it_says(words.my_contacts.the_menu)
  hand.taps(words.my_contacts.the_menu)
  await hand.until(() => hand.shown().querySelector('nav') !== null)
  hand.taps(words.my_contacts.the_entries.the_introduction)
  await hand.until_it_says(its.the_cards.what_cumino_is.title)
}

/** She turns to the next card, until it says its title. */
const turns_to = async (hand: TheStorysHand, title: string): Promise<void> => {
  hand.taps(its.to_the_next_card)
  await hand.until_it_says(title)
}

export const the_first_time_what_cumino_is = {
  render: () => <AScreenStory plays={her_first_face_made} />,
}

export const the_first_time_how_the_letters_travel = {
  render: () => (
    <AScreenStory
      plays={async (hand) => {
        await her_first_face_made(hand)
        await turns_to(hand, its.the_cards.how_the_letters_travel.title)
      }}
    />
  ),
}

export const the_first_time_the_extensions = {
  render: () => (
    <AScreenStory
      plays={async (hand) => {
        await her_first_face_made(hand)
        await turns_to(hand, its.the_cards.how_the_letters_travel.title)
        await turns_to(hand, its.the_cards.the_extensions.title)
        await hand.until_it_says(its.to_the_server)
      }}
    />
  ),
}

export const read_again_from_the_menu = {
  render: () => <AScreenStory holds={anna} plays={from_the_menu} />,
}

export const read_again_its_last_card = {
  render: () => (
    <AScreenStory
      holds={anna}
      plays={async (hand) => {
        await from_the_menu(hand)
        await turns_to(hand, its.the_cards.how_the_letters_travel.title)
        await turns_to(hand, its.the_cards.the_extensions.title)
        await hand.until_it_says(its.back_where_she_was)
      }}
    />
  ),
}
