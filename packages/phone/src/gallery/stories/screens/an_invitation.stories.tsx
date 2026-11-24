// An invitation (UI-5; WEB-29): each case of the screen, over her contacts, as the link
// opened at the start and her gestures reach it (`phone/test/screens/an_invitation.test.tsx`).

import { TheScreens } from '@q-mino/adapters-web/screens'
import { texts } from '../../../texts/index.ts'
import { AScreenStory, type TheStorysHand } from '../../a_screen_story.tsx'
import { anna, anna_s_ticket_for, luca_s_link } from './fixtures_b.ts'

const invitation = texts.screens.an_invitation

// The ids a story draws, in order: the bond G1, her ticket's activity G2, then his ticket's opening G3.
const accepts = async (hand: TheStorysHand): Promise<void> => {
  await hand.until_it_says(invitation.wants_to_shake_your_hand('Luca'))
  hand.taps(invitation.accept)
  await hand.until(() => hand.node.activities_asked().length > 0)
}

/** Her ticket ready: his is opened (activity G3). */
const her_ticket_is_ready = async (hand: TheStorysHand): Promise<void> => {
  await accepts(hand)
  hand.node.comes_to_hold((now) => ({ ...now, tickets: [anna_s_ticket_for('G1')] }))
  await hand.until(() => hand.node.activities_asked().length > 1)
}

export default { title: 'Screens/An invitation', component: TheScreens }

export const the_invitation = {
  render: () => (
    <AScreenStory
      holds={anna}
      a_link={luca_s_link}
      plays={(hand) => hand.until_it_says(invitation.wants_to_shake_your_hand('Luca'))}
    />
  ),
}

export const the_invitation_with_no_name = {
  render: () => (
    <AScreenStory
      holds={anna}
      a_link={luca_s_link}
      plays={async (hand) => {
        await hand.until_it_says(invitation.wants_to_shake_your_hand('Luca'))
        hand.types('name', ' ')
        await hand.until(
          () =>
            [...hand.shown().querySelectorAll('button')].find(
              (one) => one.textContent.trim() === invitation.accept,
            )?.disabled === true,
        )
      }}
    />
  ),
}

export const not_an_invitation = {
  render: () => (
    <AScreenStory
      holds={anna}
      a_link={{ holds: 'a_ticket_out_of_its_form' }}
      plays={(hand) => hand.until_it_says(invitation.not_an_invitation)}
    />
  ),
}

export const on_its_way = {
  render: () => (
    <AScreenStory
      holds={anna}
      a_link={luca_s_link}
      plays={async (hand) => {
        await accepts(hand)
        await hand.until_it_says(invitation.on_its_way('Luca'))
      }}
    />
  ),
}

export const bonded = {
  render: () => (
    <AScreenStory
      holds={anna}
      a_link={luca_s_link}
      plays={async (hand) => {
        await her_ticket_is_ready(hand)
        hand.node.ends('G3', { ended: 'done', said: { event: 'you_are_bonded', payload: {} } })
        await hand.until_it_says(invitation.bonded('Luca'))
      }}
    />
  ),
}

export const his_ticket_no_longer_holds = {
  render: () => (
    <AScreenStory
      holds={anna}
      a_link={luca_s_link}
      plays={async (hand) => {
        await her_ticket_is_ready(hand)
        hand.node.ends('G3', {
          ended: 'cannot_be_done',
          said: { event: 'their_ticket_cannot_be_opened', payload: {} },
        })
        await hand.until_it_says(invitation.no_longer_holds('Luca'))
      }}
    />
  ),
}

export const her_ticket_cannot_be_prepared = {
  render: () => (
    <AScreenStory
      holds={anna}
      a_link={luca_s_link}
      plays={async (hand) => {
        await accepts(hand)
        hand.node.ends('G2', {
          ended: 'the_app_cannot_do_it',
          said: { event: 'invalid_request', payload: {} },
        })
        await hand.until_it_says(invitation.no_longer_holds('Luca'))
      }}
    />
  ),
}
