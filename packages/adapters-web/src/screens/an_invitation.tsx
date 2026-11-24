// An invitation, a link of a ticket she opened (UI-5, WEB-1): who wants to
// shake her hand, at a distance; the name she gives them, theirs by default;
// she accepts or declines. Accepted, her ticket is prepared and, once it is
// ready, the screen is told so once, and theirs is opened on it; offline,
// it waits, and says so. A link out of its form is told, and opens nothing. Since the MVP's part 2 drawn
// with the design's components (WEB-29).

import { computed } from '@preact/signals'
import * as an_invitation from '@q-mino/domains/ui/an_invitation/_dsl.ts'
import type * as an_invitation_value from '@q-mino/domains/ui/an_invitation/_value.ts'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { useEffect } from 'preact/hooks'
import { Field, Gesture, Notice, Screen } from '../design/index.ts'
import { a_screen, kept, what_it_is_given } from './a_screen.ts'
import { Back, the_kind_of_an_end } from './parts.tsx'
import { the_app, the_words_of_an_end, what_it_asked_now } from './the_app.ts'

/** The words of the screen (provisional, A to confirm). */
export interface AnInvitationTexts {
  readonly title: string
  readonly not_an_invitation: string
  readonly wants_to_shake_your_hand: (name: string) => string
  readonly if_you_accept: string
  readonly the_name_you_give: string
  readonly accept: string
  readonly decline: string
  readonly on_its_way: (name: string) => string
  /** Told while on its way: offline, it waits for the network. */
  readonly it_waits_offline: string
  readonly bonded: (name: string) => string
  readonly bonded_already: (name: string) => string
  readonly no_longer_holds: (name: string) => string
}

export const AnInvitation = (props: {
  texts: AnInvitationTexts
  screen: Extract<ui_value.a_screen, { screen: 'an_invitation' }>
}) => {
  const app = the_app()
  const opened_on = kept(() => props.screen)
  const screen = a_screen<an_invitation_value.the_state, an_invitation_value.what_happens>(app, {
    at_the_start: () => an_invitation.at_the_start(opened_on.link),
    after: an_invitation.after,
    told_the_end: (ended) => ended,
  })
  const given = what_it_is_given(app, screen.state, async (state) => {
    const step = state.step
    if (step.step !== 'accepted') return { model: { activities: [] }, ready: undefined }
    const asked = [step.prepared.asked, step.opened?.asked].flatMap((one) =>
      one === undefined ? [] : [one],
    )
    const [her_ticket, cards] = await Promise.all([
      app.node.her_ticket(step.bond),
      Promise.all(asked.map((one) => app.node.an_activity(one.activity_id))),
    ])
    const activities = cards.flatMap((card): activities_value.activity_card[] =>
      card === undefined ? [] : [card],
    )
    const model: an_invitation_value.what_it_is_given = { activities }
    return { model, ready: her_ticket?.ready }
  })
  // Her ticket ready for the bond she accepted on, before theirs is opened:
  // the screen is told once (its model opens theirs on it).
  const her_ticket_ready = kept(() =>
    computed(() => {
      const step = screen.state.value?.step
      const ready = given.value?.given.ready
      return step?.step === 'accepted' && step.opened === undefined && ready?.bond === step.bond
        ? ready.bond
        : undefined
    }),
  )
  useEffect(
    () =>
      her_ticket_ready.subscribe((bond) => {
        if (bond !== undefined) screen.happens({ happens: 'her_ticket_is_ready', bond })
      }),
    [],
  )

  /** She accepts, by her active face (stage 1 has one): the bond's id and the two activities' drawn at the tap. */
  const accepts = (): void => {
    void app.node.the_active_face().then((face) => {
      if (face === undefined) return
      screen.happens({
        happens: 'she_accepts',
        bond: app.device.draws_an_id(),
        face,
        to_prepare: what_it_asked_now(app.device),
        to_open: what_it_asked_now(app.device),
      })
    })
  }

  const state = screen.state.value
  const read = given.value
  const shown =
    state === undefined || read === undefined
      ? undefined
      : an_invitation.what_it_shows(state, read.given.model)
  const taps = (does: () => void) => ({ does: 'taps', taps: does }) as const
  return (
    <Screen
      title={props.texts.title}
      state={shown?.shows}
      back={
        <Back
          onBack={() => {
            screen.happens({ happens: 'she_goes_back' })
          }}
        />
      }
    >
      {shown?.shows === 'not_an_invitation' && (
        <Notice kind="information">{props.texts.not_an_invitation}</Notice>
      )}
      {shown?.shows === 'the_invitation' && (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            accepts()
          }}
        >
          <p>{props.texts.wants_to_shake_your_hand(shown.introduced_as)}</p>
          <p>{props.texts.if_you_accept}</p>
          <Field
            label={props.texts.the_name_you_give}
            name="name"
            holds={{
              holds: 'the_screens',
              value: shown.name,
              types: (name) => {
                screen.happens({ happens: 'she_types_the_name', name })
              },
            }}
          />
          <div data-part="gestures">
            <Gesture
              kind="primary"
              label={props.texts.accept}
              off={shown.the_button !== 'on'}
              does={{ does: 'submits' }}
            />
            <Gesture
              kind="secondary"
              label={props.texts.decline}
              does={taps(() => {
                screen.happens({ happens: 'she_declines' })
              })}
            />
          </div>
        </form>
      )}
      {shown?.shows === 'on_its_way' && (
        <>
          <Notice kind="waiting">{props.texts.on_its_way(shown.introduced_as)}</Notice>
          <p>{props.texts.it_waits_offline}</p>
        </>
      )}
      {shown?.shows === 'bonded' && (
        <Notice kind="done">
          {shown.already
            ? props.texts.bonded_already(shown.introduced_as)
            : props.texts.bonded(shown.introduced_as)}
        </Notice>
      )}
      {shown?.shows === 'the_invitation_no_longer_holds' && (
        <>
          <Notice kind="fault">{props.texts.no_longer_holds(shown.introduced_as)}</Notice>
          <Notice kind={the_kind_of_an_end(shown.how)}>
            {the_words_of_an_end(app.common, shown.how)}
          </Notice>
        </>
      )}
    </Screen>
  )
}
