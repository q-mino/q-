// The handshake in person, the crossed QR (UI-5, WEB-1, WEB-2): opened, the
// screen prepares a ticket of hers; ready, it shows the QR of its link and
// plays the rear camera in its video, each text it reads told as a scan;
// the camera is on only while her QR is shown, off once it is not and when
// the screen closes. Bonded, she opens the contact or shakes another hand.

import * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as the_handshake_in_person from '@q-mino/domains/ui/the_handshake_in_person/_dsl.ts'
import type * as the_handshake_in_person_value from '@q-mino/domains/ui/the_handshake_in_person/_value.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { createEffect, createMemo, createSignal, Match, onCleanup, Show, Switch } from 'solid-js'
import { the_qr_of } from '../qr/index.ts'
import { the_ticket_in_a_link } from '../ticket_link/index.ts'
import { a_screen, what_it_is_given } from './a_screen.ts'
import { Back } from './parts.tsx'
import { the_app, the_words_of_an_end, what_it_asked_now } from './the_app.ts'

/** The words of the screen (provisional, A to confirm). */
export interface TheHandshakeInPersonTexts {
  readonly title: string
  readonly getting_the_ticket_ready: string
  readonly the_ticket_cannot_be_prepared: string
  readonly try_again: string
  readonly show_and_scan: string
  /** The QR's alternative text. */
  readonly the_qr: string
  /** Told above the link when it is longer than a QR holds. */
  readonly too_long_for_a_qr: string
  /** The camera when it is not on, by its case (WEB-2). */
  readonly the_camera: Readonly<Record<Exclude<ui_value.the_camera, 'on'>, string>>
  /** What she scanned that opens nothing, by its case. */
  readonly scanned: Readonly<
    Record<
      Exclude<
        Extract<the_handshake_in_person_value.what_it_shows, { shows: 'ready' }>['scanned'],
        'nothing'
      >,
      string
    >
  >
  readonly opening_their_ticket: (name: string) => string
  readonly bonded: (name: string) => string
  readonly bonded_already: (name: string) => string
  readonly open_the_contact: string
  readonly shake_another_hand: string
  readonly their_ticket_cannot_be_opened: (name: string) => string
  readonly scan_again: string
}

/** What a text the camera read holds, as the link of a ticket carries it (WEB-1), the ticket in her words or out of its form. */
const what_it_holds = (text: string): ui_value.what_it_holds => {
  const read = the_ticket_in_a_link(text)
  switch (read.carries) {
    case 'a_ticket': {
      const parsed = ui_value.what_it_holds.safeParse({ holds: 'a_ticket', ticket: read.ticket })
      return parsed.success ? parsed.data : { holds: 'a_ticket_out_of_its_form' }
    }
    case 'no_ticket':
      return { holds: 'no_ticket' }
    case 'a_ticket_out_of_its_form':
      return { holds: 'a_ticket_out_of_its_form' }
  }
}

/** The QR of her ticket's link, or the link alone when it is longer than a QR holds. */
const TheQr = (props: { link: string; texts: TheHandshakeInPersonTexts }) => {
  const qr = createMemo(() => the_qr_of(props.link))
  const drawn = () => {
    const it = qr()
    return it.drawn === 'a_qr' ? it : undefined
  }
  return (
    <Show
      when={drawn()}
      fallback={
        <>
          <p>{props.texts.too_long_for_a_qr}</p>
          <p>{props.link}</p>
        </>
      }
    >
      {(it) => (
        <img alt={props.texts.the_qr} src={`data:image/svg+xml,${encodeURIComponent(it().svg)}`} />
      )}
    </Show>
  )
}

/** Her QR and the camera's words while she scans (her ticket ready, or theirs not opened). */
const WhileSheScans = (props: {
  link: string | undefined
  camera: ui_value.the_camera
  texts: TheHandshakeInPersonTexts
}) => {
  const not_on = () => (props.camera === 'on' ? undefined : props.camera)
  return (
    <>
      <p>{props.texts.show_and_scan}</p>
      <Show when={props.link}>{(link) => <TheQr link={link()} texts={props.texts} />}</Show>
      <Show when={not_on()}>{(why) => <p role="status">{props.texts.the_camera[why()]}</p>}</Show>
    </>
  )
}

export const TheHandshakeInPerson = (props: { texts: TheHandshakeInPersonTexts }) => {
  const app = the_app()
  const screen = a_screen<
    the_handshake_in_person_value.the_state,
    the_handshake_in_person_value.what_happens
  >(app, {
    at_the_start: the_handshake_in_person.at_the_start,
    after: the_handshake_in_person.after,
    told_the_end: (ended) => ended,
  })
  const given = what_it_is_given(app, screen.state, async (state) => {
    const asked = [
      state.ticket?.prepared.asked,
      state.scanned?.scanned === 'their_ticket' ? state.scanned.opened.asked : undefined,
    ].flatMap((one) => (one === undefined ? [] : [one]))
    const [her_ticket, cards] = await Promise.all([
      state.ticket === undefined ? undefined : app.node.her_ticket(state.ticket.bond),
      Promise.all(asked.map((one) => app.node.an_activity(one.activity_id))),
    ])
    const activities = cards.flatMap((card): activities_value.activity_card[] =>
      card === undefined ? [] : [card],
    )
    const model: the_handshake_in_person_value.what_it_is_given =
      her_ticket === undefined ? { activities } : { ticket: her_ticket.ready, activities }
    return { model, link: her_ticket?.link }
  })
  const shown = () => {
    const state = screen.state()
    const read = given()
    return state === undefined || read === undefined
      ? undefined
      : the_handshake_in_person.what_it_shows(state, read.given.model)
  }
  const link = () => given()?.given.link
  const cannot_be_prepared = () => {
    const it = shown()
    return it?.shows === 'the_ticket_cannot_be_prepared' ? it : undefined
  }
  const ready = () => {
    const it = shown()
    return it?.shows === 'ready' ? it : undefined
  }
  const opening = () => {
    const it = shown()
    return it?.shows === 'opening_their_ticket' ? it : undefined
  }
  const bonded = () => {
    const it = shown()
    return it?.shows === 'bonded' ? it : undefined
  }
  const cannot_be_opened = () => {
    const it = shown()
    return it?.shows === 'their_ticket_cannot_be_opened' ? it : undefined
  }
  const scanned_nothing_to_open = () => {
    const scanned = ready()?.scanned
    return scanned === undefined || scanned === 'nothing' ? undefined : scanned
  }

  /** A ticket of hers for a bond to be, by her active face (stage 1 has one): its ids drawn at the gesture. */
  const a_new_ticket = (happens: 'the_screen_is_opened' | 'she_shakes_another_hand'): void => {
    void app.node.the_active_face().then((face) => {
      if (face === undefined) return
      screen.happens({
        happens,
        asked: what_it_asked_now(app.device),
        bond: app.device.draws_an_id(),
        face,
      })
    })
  }
  // Opened: once its state is there, the screen is opened, once.
  const started = createMemo(() => screen.state() !== undefined)
  createEffect(() => {
    if (started()) a_new_ticket('the_screen_is_opened')
  })

  // The camera, on while she scans; each text it reads told as a scan, with
  // an activity drawn; off once she no longer scans, and when the screen closes.
  const [video, set_video] = createSignal<HTMLVideoElement>()
  const scanning = createMemo(() => ready() !== undefined || cannot_be_opened() !== undefined)
  createEffect(() => {
    const element = video()
    if (element === undefined || !scanning()) return
    const a_scan = app.device.scans(element)
    // This scan's run over (she no longer scans, or the screen closed): what it reads then is told no more.
    let over = false
    const is_over = (): boolean => over
    onCleanup(() => {
      over = true
      void a_scan.then((scan) => {
        if (scan.is === 'on') scan.turn_off()
      })
    })
    void a_scan.then(async (scan) => {
      if (is_over()) return
      screen.happens({ happens: 'the_camera_is', camera: scan.is })
      if (scan.is !== 'on') return
      for await (const text of scan.texts) {
        if (is_over()) return
        screen.happens({
          happens: 'she_scans',
          holds: what_it_holds(text),
          asked: what_it_asked_now(app.device),
        })
      }
    })
  })

  return (
    <section aria-label={props.texts.title}>
      <Back
        onBack={() => {
          screen.happens({ happens: 'she_goes_back' })
        }}
      />
      <h1>{props.texts.title}</h1>
      <Show when={shown()}>
        <Switch>
          <Match when={shown()?.shows === 'getting_the_ticket_ready'}>
            <p role="status">{props.texts.getting_the_ticket_ready}</p>
          </Match>
          <Match when={cannot_be_prepared()}>
            {(it) => (
              <>
                <p role="status">{props.texts.the_ticket_cannot_be_prepared}</p>
                <p>{the_words_of_an_end(app.common, it().how)}</p>
                <button
                  type="button"
                  onClick={() => {
                    a_new_ticket('she_shakes_another_hand')
                  }}
                >
                  {props.texts.try_again}
                </button>
              </>
            )}
          </Match>
          <Match when={ready()}>
            {(it) => (
              <>
                <WhileSheScans link={link()} camera={it().camera} texts={props.texts} />
                <Show when={scanned_nothing_to_open()}>
                  {(scanned) => <p role="status">{props.texts.scanned[scanned()]}</p>}
                </Show>
              </>
            )}
          </Match>
          <Match when={opening()}>
            {(it) => <p role="status">{props.texts.opening_their_ticket(it().introduced_as)}</p>}
          </Match>
          <Match when={bonded()}>
            {(it) => (
              <>
                <p role="status">
                  {it().already
                    ? props.texts.bonded_already(it().introduced_as)
                    : props.texts.bonded(it().introduced_as)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    screen.happens({ happens: 'she_opens_the_contact' })
                  }}
                >
                  {props.texts.open_the_contact}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    a_new_ticket('she_shakes_another_hand')
                  }}
                >
                  {props.texts.shake_another_hand}
                </button>
              </>
            )}
          </Match>
          <Match when={cannot_be_opened()}>
            {(it) => (
              <>
                <p role="status">{props.texts.their_ticket_cannot_be_opened(it().introduced_as)}</p>
                <p>{the_words_of_an_end(app.common, it().how)}</p>
                <p>{props.texts.scan_again}</p>
                <WhileSheScans link={link()} camera={it().camera} texts={props.texts} />
              </>
            )}
          </Match>
        </Switch>
      </Show>
      <video
        ref={(element) => {
          set_video(() => element)
        }}
        muted
        playsinline
        hidden={!scanning()}
      />
    </section>
  )
}
