// An extension (UI-5; EXT-7, USR-7, USR-8, EXT-16): its own screen, its notice, its news
// (`phone/test/screens/the_extensions.test.tsx`).

import { TheScreens } from '@q-mino/adapters-web/screens'
import * as user_value from '@q-mino/domains/user/_value.ts'
import { AScreenStory, type TheStorysHand } from '../../a_screen_story.tsx'
import {
  anna,
  opens_the_extension,
  ping_pong,
  the_manifest,
  what_ping_pong_asks,
  words,
} from './fixtures_a.ts'

export default { title: 'Screens/An extension', component: TheScreens }

const its = words.an_extension

const the_extension = (
  holds: Parameters<typeof AScreenStory>[0]['holds'],
  then?: (hand: TheStorysHand) => Promise<void>,
) => (
  <AScreenStory
    holds={{ ...anna, ...holds }}
    plays={async (hand) => {
      await opens_the_extension(hand, 'Ping pong')
      await then?.(hand)
    }}
  />
)

const asks_to_activate = async (hand: TheStorysHand): Promise<void> => {
  hand.taps(its.may.activate)
  await hand.until_it_says(its.the_notice('Ping pong', '0.1.0'))
}

export const not_active = { render: () => the_extension({ extensions: [ping_pong('not_active')] }) }

export const active = { render: () => the_extension({ extensions: [ping_pong('active')] }) }

export const the_notice_of_what_it_asks = {
  render: () => the_extension({ extensions: [ping_pong('not_active')] }, asks_to_activate),
}

export const activating_it_in_progress = {
  render: () =>
    the_extension({ extensions: [ping_pong('not_active')] }, async (hand) => {
      await asks_to_activate(hand)
      hand.taps(its.accept)
      await hand.until_it_says(its.may.wait)
    }),
}

export const waiting_for_the_new_manifest = {
  render: () =>
    the_extension({
      extensions: [
        ping_pong('waiting_for_the_new_manifest', [], the_manifest('0.2.0'), [
          ...what_ping_pong_asks,
          { asks: 'a_storage_of_its_own' },
        ]),
      ],
    }),
}

export const the_new_manifest_notice = {
  render: () =>
    the_extension(
      {
        extensions: [
          ping_pong('waiting_for_the_new_manifest', [], the_manifest('0.2.0'), [
            ...what_ping_pong_asks,
            { asks: 'a_storage_of_its_own' },
          ]),
        ],
      },
      async (hand) => {
        hand.taps(its.may.accept_the_new_manifest)
        await hand.until_it_says(its.the_notice('Ping pong', '0.2.0'))
      },
    ),
}

export const deactivating_it_in_progress = {
  render: () =>
    the_extension({ extensions: [ping_pong('active')] }, async (hand) => {
      hand.taps(its.may.deactivate)
      await hand.until_it_says(its.may.wait)
    }),
}

const its_letter = user_value.a_held_letter.parse({
  whose: { of: 'an_extension', extension: 'ping_pong' },
  letter: 'P1',
  what: 'Un ping a un contatto tolto',
  why: { why: 'it_could_not_be_delivered', because: 'il relay non risponde' },
})

const with_news = {
  extensions: [ping_pong('active')],
  held_letters: [its_letter],
  happened: [
    {
      happened: 'a_request_met_silence',
      bond: 'L_b',
      extension: 'ping_pong',
      because: 'the_extension_is_not_offered_to_the_bond',
    },
  ],
} as const

export const its_news_in_its_mark = {
  render: () =>
    the_extension(with_news, async (hand) => {
      await hand.until_it_says('Un ping a un contatto tolto')
    }),
}

export const a_letter_sent_again_in_progress = {
  render: () =>
    the_extension(with_news, async (hand) => {
      await hand.until_it_says('Un ping a un contatto tolto')
      hand.taps(its.the_news.send_it_again)
      await hand.until(() => hand.node.activities_asked().length === 1)
      await hand.until_it_says(words.common.in_progress)
    }),
}

export const no_such_extension = {
  render: () =>
    the_extension({ extensions: [ping_pong('active')] }, async (hand) => {
      hand.node.comes_to_hold((now) => ({ ...now, extensions: [] }))
      await hand.until_it_says(its.no_such_extension)
    }),
}
