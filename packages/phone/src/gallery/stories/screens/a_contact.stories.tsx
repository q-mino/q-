// A contact (UI-5; WEB-29): each case of the card and her gestures on it, as her node holds
// it (`phone/test/screens/a_contact.test.tsx`).

import { TheScreens } from '@q-mino/adapters-web/screens'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import { AScreenStory, type TheStorysHand } from '../../a_screen_story.tsx'
import {
  anna_with_contacts,
  opens_the_contact,
  ping_pong,
  said,
  the_draft_of_carla,
  words,
} from './fixtures_a.ts'

export default { title: 'Screens/A contact', component: TheScreens }

const its = words.a_contact

const answered = (hand: TheStorysHand, answer: ui_value.the_extensions_in_common): void => {
  hand.node.comes_to_hold((now) => ({ ...now, in_common: [{ bond: 'L_b', answer }] }))
}

const the_contact = (name: string, then?: (hand: TheStorysHand) => Promise<void>) => (
  <AScreenStory
    holds={anna_with_contacts}
    plays={async (hand) => {
      await opens_the_contact(hand, name)
      await then?.(hand)
    }}
  />
)

export const met_in_person = { render: () => the_contact('Bruno') }

export const met_at_a_distance = { render: () => the_contact('Carla R.') }

export const renaming_it = {
  render: () =>
    the_contact('Carla R.', async (hand) => {
      hand.taps(its.rename_it)
      await hand.until(() => hand.shown().querySelector('input[name="name"]') !== null)
      hand.types('name', 'Carla Rossi')
      await hand.until(() => hand.node.handed().length > 0)
    }),
}

export const renaming_in_progress = {
  render: () =>
    the_contact('Carla R.', async (hand) => {
      hand.taps(its.rename_it)
      await hand.until(() => hand.shown().querySelector('input[name="name"]') !== null)
      hand.types('name', 'Carla Rossi')
      await hand.until(() => hand.node.handed().length > 0)
      hand.taps(its.give_the_name)
      await hand.until_it_says(its.renaming)
      hand.taps(its.renaming)
      await hand.until(() => hand.node.activities_asked().length === 1)
    }),
}

export const renamed = {
  render: () =>
    the_contact('Carla R.', async (hand) => {
      hand.taps(its.rename_it)
      await hand.until(() => hand.shown().querySelector('input[name="name"]') !== null)
      hand.types('name', 'Carla Rossi')
      await hand.until(() => hand.node.handed().length > 0)
      hand.taps(its.give_the_name)
      await hand.until_it_says(its.renaming)
      hand.taps(its.renaming)
      await hand.until(() => hand.node.activities_asked().length === 1)
      hand.node.ends('G1', { ended: 'done', said: said('the_bond_is_renamed') })
      await hand.until_it_says(words.common.how_it_ended.done)
    }),
}

export const renaming_with_a_draft_kept = {
  render: () => (
    <AScreenStory
      holds={{
        ...anna_with_contacts,
        drafts: [{ for: the_draft_of_carla, text: 'Carla Ro' }],
      }}
      plays={async (hand) => {
        await opens_the_contact(hand, 'Carla R.')
        hand.taps(its.rename_it)
        await hand.until(() => hand.shown().querySelector('input[name="name"]') !== null)
      }}
    />
  ),
}

export const removing_it_asked = {
  render: () =>
    the_contact('Bruno', async (hand) => {
      hand.taps(its.remove_it)
      await hand.until_it_says(its.remove_it_really('Bruno'))
    }),
}

export const removing_it_in_progress = {
  render: () =>
    the_contact('Bruno', async (hand) => {
      hand.taps(its.remove_it)
      await hand.until_it_says(its.yes_remove_it)
      hand.taps(its.yes_remove_it)
      await hand.until_it_says(words.common.in_progress)
    }),
}

export const no_such_contact = {
  render: () =>
    the_contact('Carla R.', async (hand) => {
      hand.node.comes_to_hold((now) => ({
        ...now,
        cards: now.cards.filter((card) => card.bond !== 'L_c'),
      }))
      await hand.until_it_says(its.no_such_contact)
    }),
}

export const the_extension_offered = {
  render: () =>
    the_contact('Bruno', async (hand) => {
      await hand.until_it_says(its.offered)
    }),
}

export const the_extension_not_offered = {
  render: () =>
    the_contact('Carla R.', async (hand) => {
      await hand.until_it_says(its.not_offered)
    }),
}

export const withdrawing_the_offer_in_progress = {
  render: () =>
    the_contact('Bruno', async (hand) => {
      hand.taps(its.the_offer.withdraw_the_offer)
      await hand.until_it_says(its.the_offer.wait)
    }),
}

export const no_extension_active = {
  render: () => (
    <AScreenStory
      holds={{ ...anna_with_contacts, extensions: [ping_pong('not_active')] }}
      plays={async (hand) => {
        await opens_the_contact(hand, 'Bruno')
        await hand.until_it_says(its.no_extension_active)
      }}
    />
  ),
}

export const asking_for_the_extensions_in_common = {
  render: () =>
    the_contact('Bruno', async (hand) => {
      hand.taps(its.ask_for_the_extensions_in_common)
      await hand.until(() => hand.node.activities_asked().length === 1)
    }),
}

export const the_answer_is_awaited = {
  render: () =>
    the_contact('Bruno', async (hand) => {
      answered(hand, { answer: 'waiting' })
      await hand.until_it_says(its.the_answer.waiting)
    }),
}

export const the_extensions_in_common = {
  render: () =>
    the_contact('Bruno', async (hand) => {
      answered(hand, { answer: 'in_common', extensions: ['ping_pong'] })
      await hand.until_it_says(its.the_answer.in_common(['Ping pong']))
    }),
}

export const none_in_common = {
  render: () =>
    the_contact('Bruno', async (hand) => {
      answered(hand, { answer: 'in_common', extensions: [] })
      await hand.until_it_says(its.the_answer.none_in_common)
    }),
}

export const no_answer = {
  render: () =>
    the_contact('Bruno', async (hand) => {
      answered(hand, { answer: 'no_answer', why: 'no_response' })
      await hand.until_it_says(its.the_answer.no_answer.no_response)
    }),
}

export const the_relay_does_not_answer = {
  render: () =>
    the_contact('Bruno', async (hand) => {
      hand.node.comes_to_hold((now) => ({
        ...now,
        the_relay: { ...now.the_relay, met: 'did_not_answer' },
      }))
      await hand.until(() =>
        (hand.shown().closest('main')?.parentElement?.textContent ?? '').includes(
          words.common.the_relay_does_not_answer,
        ),
      )
    }),
}

export const no_network = {
  render: () =>
    the_contact('Bruno', async (hand) => {
      hand.node.comes_to_hold((now) => ({
        ...now,
        the_relay: { ...now.the_relay, met: 'did_not_answer' },
        the_network: 'offline',
      }))
      await hand.until(() =>
        (hand.shown().closest('main')?.parentElement?.textContent ?? '').includes(
          words.common.no_network,
        ),
      )
    }),
}
