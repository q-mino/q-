// The handshake at a distance, from who invites (UI-5, WEB-1): the flaw told
// first; she makes a link, a ticket of hers for a bond to be; ready, the link,
// shared with the phone's share, or copied where the phone has none (WEB-18);
// one that cannot be prepared told, with how; again, another link, for
// another bond. Since the MVP's part 2 drawn with the design's components
// (WEB-29).

import * as the_handshake_at_a_distance from '@q-mino/domains/ui/the_handshake_at_a_distance/_dsl.ts'
import type * as the_handshake_at_a_distance_value from '@q-mino/domains/ui/the_handshake_at_a_distance/_value.ts'
import { Field, Flaw, Gesture, Notice, Screen, type AGestureKind } from '../design/index.ts'
import { a_screen, what_it_is_given } from './a_screen.ts'
import { Back, the_kind_of_an_end } from './parts.tsx'
import { the_app, the_words_of_an_end, what_it_asked_now } from './the_app.ts'

/** The words of the screen (provisional, A to confirm). */
export interface TheHandshakeAtADistanceTexts {
  readonly title: string
  /** Whoever opens the link becomes her contact; it holds once, for 48 hours. */
  readonly the_flaw: string
  readonly make_a_link: string
  readonly getting_the_link_ready: string
  readonly the_link_cannot_be_prepared: string
  readonly try_again: string
  /** The label of the link, to copy. */
  readonly your_link: string
  /** The gesture that shares the link with the phone's share (Web Share). */
  readonly share_the_link: string
  /** Where the phone has no share: the gesture that copies the link, and once it is copied. */
  readonly copy_the_link: string
  readonly the_link_is_copied: string
  readonly make_another: string
}

/** The gesture that makes a link, in the words of where it is. */
const MakeALink = (props: { kind: AGestureKind; words: string; makes: () => void }) => (
  <Gesture
    kind={props.kind}
    glyph="link"
    label={props.words}
    does={{
      does: 'taps',
      taps: () => {
        props.makes()
      },
    }}
  />
)

export const TheHandshakeAtADistance = (props: { texts: TheHandshakeAtADistanceTexts }) => {
  const app = the_app()
  const screen = a_screen<
    the_handshake_at_a_distance_value.the_state,
    the_handshake_at_a_distance_value.what_happens
  >(app, {
    at_the_start: the_handshake_at_a_distance.at_the_start,
    after: the_handshake_at_a_distance.after,
    told_the_end: (ended) => ended,
  })
  const the_phone: the_handshake_at_a_distance_value.what_it_is_given['the_phone'] =
    app.device.the_navigator.share === undefined ? 'copies' : 'shares'
  const given = what_it_is_given(app, screen.state, async (state) => {
    if (state.ticket === undefined) return { model: { the_phone }, link: undefined }
    const [her_ticket, activity] = await Promise.all([
      app.node.her_ticket(state.ticket.bond),
      app.node.an_activity(state.ticket.asked.activity_id),
    ])
    const model: the_handshake_at_a_distance_value.what_it_is_given = {
      ...(her_ticket === undefined ? {} : { ticket: her_ticket.ready }),
      ...(activity === undefined ? {} : { activity }),
      the_phone,
    }
    return { model, link: her_ticket?.link }
  })
  const hands_on = (link: string): void => {
    const navigator = app.device.the_navigator
    if (navigator.share !== undefined) {
      // A share she cancels, or the browser refuses, leaves the link on the screen, to share again.
      void navigator.share({ url: link }).catch(() => undefined)
      return
    }
    void navigator.clipboard.writeText(link).then(
      () => {
        screen.happens({ happens: 'the_link_is_copied' })
      },
      () => undefined,
    )
  }

  /** She makes a link, by her active face (stage 1 has one): its ids drawn at the tap. */
  const makes_a_link = (): void => {
    void app.node.the_active_face().then((face) => {
      if (face === undefined) return
      screen.happens({
        happens: 'she_makes_a_link',
        asked: what_it_asked_now(app.device),
        bond: app.device.draws_an_id(),
        face,
      })
    })
  }
  const state = screen.state.value
  const read = given.value
  const shown =
    state === undefined || read === undefined
      ? undefined
      : the_handshake_at_a_distance.what_it_shows(state, read.given.model)
  const link = shown?.shows === 'the_link' ? read?.given.link : undefined
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
      {shown?.shows === 'the_flaw_told' && (
        <>
          <Flaw title={app.common.what_it_does_not_guarantee}>{props.texts.the_flaw}</Flaw>
          <div data-part="gestures">
            <MakeALink kind="primary" words={props.texts.make_a_link} makes={makes_a_link} />
          </div>
        </>
      )}
      {shown?.shows === 'getting_the_link_ready' && (
        <Notice kind="waiting">{props.texts.getting_the_link_ready}</Notice>
      )}
      {shown?.shows === 'the_link_cannot_be_prepared' && (
        <>
          <Notice kind="fault">{props.texts.the_link_cannot_be_prepared}</Notice>
          <Notice kind={the_kind_of_an_end(shown.how)}>
            {the_words_of_an_end(app.common, shown.how)}
          </Notice>
          <div data-part="gestures">
            <MakeALink kind="primary" words={props.texts.try_again} makes={makes_a_link} />
          </div>
        </>
      )}
      {shown?.shows === 'the_link' && link !== undefined && (
        <>
          <Field
            label={props.texts.your_link}
            name="link"
            holds={{ holds: 'a_text_to_copy', value: link }}
          />
          <div data-part="gestures">
            {shown.gesture === 'copied' ? (
              <div data-part="the-gesture" data-state={shown.gesture}>
                <Notice kind="done">{props.texts.the_link_is_copied}</Notice>
              </div>
            ) : (
              <div data-part="the-gesture" data-state={shown.gesture}>
                <Gesture
                  kind="primary"
                  glyph={shown.gesture === 'share' ? 'share_2' : 'copy'}
                  label={
                    shown.gesture === 'share'
                      ? props.texts.share_the_link
                      : props.texts.copy_the_link
                  }
                  does={taps(() => {
                    hands_on(link)
                  })}
                />
              </div>
            )}
            <MakeALink kind="secondary" words={props.texts.make_another} makes={makes_a_link} />
          </div>
        </>
      )}
    </Screen>
  )
}
