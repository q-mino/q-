// The first face (UI-5, 1a): her name, kept as a draft as she types it; the
// button off with no name, making while the face is made. Since the MVP's part 2
// drawn with the design's components (WEB-29).

import * as the_first_face from '@q-mino/domains/ui/the_first_face/_dsl.ts'
import type * as the_first_face_value from '@q-mino/domains/ui/the_first_face/_value.ts'
import { Field, Gesture, Screen } from '../design/index.ts'
import { a_screen, what_it_is_given } from './a_screen.ts'
import { TheCourse } from './parts.tsx'
import { the_app, what_it_asked_now } from './the_app.ts'

/** The words of the first face (provisional, A to confirm). */
export interface TheFirstFaceTexts {
  readonly title: string
  readonly your_name: string
  readonly make_it: string
  readonly making: string
}

export const TheFirstFace = (props: { texts: TheFirstFaceTexts }) => {
  const app = the_app()
  const screen = a_screen<the_first_face_value.the_state, the_first_face_value.what_happens>(app, {
    at_the_start: async () =>
      the_first_face.at_the_start(await app.node.a_draft({ for: 'the_name_of_my_first_face' })),
    after: the_first_face.after,
    told_the_end: (ended) => ended,
  })
  const given = what_it_is_given(app, screen.state, async (state) =>
    state.asked === undefined ? undefined : app.node.an_activity(state.asked.asked.activity_id),
  )
  const state = screen.state.value
  const read = given.value
  const it =
    state === undefined || read === undefined
      ? undefined
      : the_first_face.what_it_shows(state, read.given)
  return (
    <Screen title={props.texts.title} state={it?.the_button}>
      {it !== undefined && (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            screen.happens({
              happens: 'she_makes_the_face',
              asked: what_it_asked_now(app.device),
              face: app.device.draws_an_id(),
            })
          }}
        >
          <Field
            label={props.texts.your_name}
            name="name"
            holds={{
              holds: 'the_screens',
              value: it.name,
              types: (name) => {
                screen.happens({ happens: 'she_types_the_name', name })
              },
            }}
          />
          <div data-part="gestures">
            <Gesture
              kind="primary"
              label={it.the_button === 'making' ? props.texts.making : props.texts.make_it}
              off={it.the_button !== 'on'}
              does={{ does: 'submits' }}
            />
          </div>
          <TheCourse course={it.course} />
        </form>
      )}
    </Screen>
  )
}
