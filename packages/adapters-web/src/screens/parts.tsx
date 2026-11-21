// The parts the screens share (UI-1, UI-3): the course of what a screen
// asked, told; the gesture back.

import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import { Match, Switch } from 'solid-js'
import { the_app, the_words_of_an_end } from './the_app.ts'

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
