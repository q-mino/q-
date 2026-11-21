// The parts the screens share (UI-1, UI-3, UI-4): the course of what a
// screen asked, told; the gesture back; since part 22.2 the kernel's mark of
// an extension and the points it holds at a place (EXT-16, WEB-22).

import * as ui from '@q-mino/domains/ui/_dsl.ts'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import { For, Match, Show, Switch, type JSX } from 'solid-js'
import { TheFrame } from './a_frame.tsx'
import { the_app, the_words_of_an_actions_end, the_words_of_an_end } from './the_app.ts'

/** The course of what a screen asked: nothing, in progress, or how it ended, in her words. */
export const TheCourse = (props: { course: ui_value.a_course }) => {
  const app = the_app()
  return (
    <Switch>
      <Match when={props.course.course === 'in_progress'}>
        <p role="status">{app.common.in_progress}</p>
      </Match>
      <Match when={props.course.course === 'ended' ? props.course : undefined}>
        {(ended) => <p role="status">{the_words_of_an_end(app.common, ended().how)}</p>}
      </Match>
    </Switch>
  )
}

/** The gesture back. */
export const Back = (props: { onBack: () => void }) => {
  const app = the_app()
  return (
    <button
      type="button"
      onClick={() => {
        props.onBack()
      }}
    >
      {app.common.back}
    </button>
  )
}

/** The kernel's mark of an extension around what it holds (EXT-16): its name and a border. */
export const the_marks_style = { border: '2px solid', padding: '0.5em', margin: '0.5em 0' }

/** The kernel's mark of an extension (EXT-16): a section with its name and a border, around what it holds. */
export const TheMark = (props: { extension: string; children: JSX.Element }) => {
  const app = the_app()
  return (
    <section aria-label={app.common.the_mark_of(props.extension)} style={the_marks_style}>
      <h2>{app.common.the_mark_of(props.extension)}</h2>
      {props.children}
    </section>
  )
}

/** A course ended, or none. */
const an_end = (course: ui_value.a_course) => (course.course === 'ended' ? course : undefined)

/**
 * The points a mark holds at its place (UI-4, EXT-16, WEB-22): each action,
 * a gesture the kernel draws with the extension's label, off while its
 * activity is in progress, and how it ended in the extension's words; each
 * slot, a frame told the place; each page, the gesture that opens it.
 */
export const ThePoints = (props: {
  mark: ui_value.a_mark
  /** Whether the extension is active, as the screen read it: a frame is served only then (EXT-4). */
  active: boolean
  /** The course of the last activity of an action. */
  course_of: (action: string) => ui_value.a_course
  taps: (action: string) => void
  opens: (page: string) => void
}) => {
  const app = the_app()
  const words = () => app.words(props.mark.extension)
  return (
    <>
      <For each={props.mark.actions}>
        {(action) => (
          <p>
            <button
              type="button"
              disabled={!ui.it_may_ask(props.course_of(action))}
              onClick={() => {
                props.taps(action)
              }}
            >
              {words()?.actions[action] ?? action}
            </button>{' '}
            <Switch>
              <Match when={props.course_of(action).course === 'in_progress'}>
                <small role="status">{app.common.in_progress}</small>
              </Match>
              <Match when={an_end(props.course_of(action))}>
                {(ended) => (
                  <small role="status">
                    {the_words_of_an_actions_end(app.common, words(), ended().how)}
                  </small>
                )}
              </Match>
            </Switch>
          </p>
        )}
      </For>
      <For each={props.mark.slots}>
        {(slot) => (
          <TheFrame
            frame={{ extension: props.mark.extension, point: 'slot', name: slot }}
            told={props.mark.told}
            active={props.active}
          />
        )}
      </For>
      <Show when={props.mark.pages.length > 0}>
        <ul>
          <For each={props.mark.pages}>
            {(page) => (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    props.opens(page)
                  }}
                >
                  {app.common.the_points.opens_the_page(page)}
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </>
  )
}
