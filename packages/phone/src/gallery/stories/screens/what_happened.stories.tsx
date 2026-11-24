// What happened (UI-5; F6, USR-8, EXT-16): nothing, or what is in progress, the kernel's news
// and each extension's in its mark (`phone/test/screens/what_happened.test.tsx`).

import { TheScreens } from '@q-mino/adapters-web/screens'
import * as user_value from '@q-mino/domains/user/_value.ts'
import * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { ten_in_rome } from '../../../the_node_of_a_story/index.ts'
import { AScreenStory, type TheStorysHand } from '../../a_screen_story.tsx'
import { anna, opens_an_entry, ping_pong, words } from './fixtures_a.ts'

export default { title: 'Screens/What happened', component: TheScreens }

const the_kernel_s_letter = user_value.a_held_letter.parse({
  whose: { of: 'the_kernel', office: 'bonds' },
  letter: 'K1',
  what: 'La conferma a Bruno',
  why: { why: 'it_could_not_be_delivered', because: 'il relay non risponde' },
})

const ping_pong_s_letter = user_value.a_held_letter.parse({
  whose: { of: 'an_extension', extension: 'ping_pong' },
  letter: 'P1',
  what: 'Un ping a un contatto tolto',
  why: { why: 'what_came_back_was_refused' },
})

const with_news = {
  ...anna,
  extensions: [ping_pong('active')],
  activities: [
    activities_value.activity_card.parse({
      activity_id: 'A1',
      what: { activity: 'rename_a_bond', bond: 'L_b', name: 'Bruno B.' },
      asked_at: ten_in_rome,
      stage: { stage: 'in_progress' },
    }),
  ],
  held_letters: [the_kernel_s_letter, ping_pong_s_letter],
  happened: [
    { happened: 'a_letter_could_not_be_opened' },
    { happened: 'an_extension_fell', extension: 'ping_pong', fall: 'the_first' },
  ],
} as const

const opens_what_happened = async (hand: TheStorysHand): Promise<void> => {
  await opens_an_entry(hand, words.my_contacts.the_entries.what_happened)
}

const sends_the_ping_again = async (hand: TheStorysHand): Promise<void> => {
  await hand.until_it_says(words.what_happened.the_activities.rename_a_bond)
  hand.taps(words.what_happened.the_news.send_it_again)
  await hand.until(() => hand.node.activities_asked().length === 1)
}

export const nothing_happened = {
  render: () => (
    <AScreenStory
      holds={anna}
      plays={async (hand) => {
        await opens_what_happened(hand)
        await hand.until_it_says(words.what_happened.nothing_happened)
      }}
    />
  ),
}

export const the_news_of_the_kernel_and_of_an_extension = {
  render: () => (
    <AScreenStory
      holds={with_news}
      plays={async (hand) => {
        await opens_what_happened(hand)
        await hand.until_it_says(words.what_happened.the_activities.rename_a_bond)
      }}
    />
  ),
}

export const a_held_letter_sent_again_in_progress = {
  render: () => (
    <AScreenStory
      holds={with_news}
      plays={async (hand) => {
        await opens_what_happened(hand)
        await sends_the_ping_again(hand)
        await hand.until_it_says(words.common.in_progress)
      }}
    />
  ),
}

export const a_held_letter_sent_again_done = {
  render: () => (
    <AScreenStory
      holds={with_news}
      plays={async (hand) => {
        await opens_what_happened(hand)
        await sends_the_ping_again(hand)
        hand.node.ends('G1', {
          ended: 'done',
          said: { event: 'the_letter_is_sent_again', payload: {} },
        })
        await hand.until_it_says(words.common.how_it_ended.done)
      }}
    />
  ),
}
