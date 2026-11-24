// The parts the screens share (UI-1, UI-3, UI-4): the course of what a
// screen asked, told; the gesture back; since part 22.2 the kernel's mark of
// an extension and the points it holds at a place (EXT-16, WEB-22); since
// the MVP's part 2 drawn with the design's components (WEB-27, WEB-29).

import { Gesture, List, Notice, Row, type ANoticeKind } from '../design/index.ts'
import * as ui from '@q-mino/domains/ui/_dsl.ts'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import type { ComponentChildren } from 'preact'
import {
  in_its_words,
  the_app,
  the_word_or_its_fault,
  the_words_of_an_actions_end,
  the_words_of_an_end,
} from './the_app.ts'

/**
 * How an end is told, by its case (WEB-29): done, or done already, is
 * `done`; an answer that did not come, an end not followed, what cannot be
 * done and what the extension told are `information`, the normal outcomes
 * of a network of people (silence is one, never an error); what the app or
 * an extension could not do is a `fault`. [Q, C, 24 Nov 2026]
 */
export const the_kind_of_an_end = (how: activities_value.how_it_ended): ANoticeKind => {
  switch (how.ended) {
    case 'done':
    case 'done_already':
      return 'done'
    case 'cannot_be_done':
    case 'no_longer_followed':
    case 'the_extension_told_how_it_ended':
      return 'information'
    case 'the_extension_cannot_be_reached':
    case 'the_app_cannot_do_it':
      return 'fault'
  }
}

/** The course of what a screen asked: nothing, in progress, or how it ended, in her words. */
export const TheCourse = (props: { course: ui_value.a_course }) => {
  const app = the_app()
  switch (props.course.course) {
    case 'nothing_asked':
      return null
    case 'in_progress':
      return <Notice kind="waiting">{app.common.in_progress}</Notice>
    case 'ended':
      return (
        <Notice kind={the_kind_of_an_end(props.course.how)}>
          {the_words_of_an_end(app.common, props.course.how)}
        </Notice>
      )
  }
}

/** The gesture back. */
export const Back = (props: { onBack: () => void }) => {
  const app = the_app()
  return (
    <Gesture
      kind="quiet"
      label={app.common.back}
      glyph="arrow_left"
      does={{
        does: 'taps',
        taps: () => {
          props.onBack()
        },
      }}
    />
  )
}

/**
 * The kernel's mark of an extension (EXT-16): a section with its name, from
 * its words, and a border, around what it holds; a name the app does not
 * have, drawn as a fault (WEB-22). Its look is the layer `frame`'s, last of
 * all (WEB-26; redrawn by the MVP's part 3).
 */
export const TheMark = (props: { extension: string; children: ComponentChildren }) => {
  const app = the_app()
  const title = in_its_words(
    app.common,
    app.words(props.extension)?.name,
    props.extension,
    app.common.the_mark_of,
  )
  return (
    <section class="mark" aria-label={title}>
      <h2>{title}</h2>
      {props.children}
    </section>
  )
}

/** How an action's course is told beside it: in progress, or how it ended in its extension's words. */
const TheCourseOfAnAction = (props: { extension: string; course: ui_value.a_course }) => {
  const app = the_app()
  switch (props.course.course) {
    case 'nothing_asked':
      return null
    case 'in_progress':
      return <Notice kind="waiting">{app.common.in_progress}</Notice>
    case 'ended':
      return (
        <Notice kind={the_kind_of_an_end(props.course.how)}>
          {the_words_of_an_actions_end(app.common, app.words(props.extension), props.course.how)}
        </Notice>
      )
  }
}

/**
 * The points a mark holds at its place (UI-4, EXT-16, WEB-22): each action,
 * a gesture the kernel draws with the extension's label, off while its
 * activity is in progress, and how it ended in the extension's words; each
 * slot, what the app does not draw yet (`APartNotDrawn`); each page, the
 * gesture that opens it, by its label. A word the extension's words lack is
 * drawn as a fault, never silently its name.
 */
export const ThePoints = (props: {
  mark: ui_value.a_mark
  /** The course of the last activity of an action. */
  course_of: (action: string) => ui_value.a_course
  taps: (action: string) => void
  opens: (page: string) => void
}) => {
  const app = the_app()
  const words = app.words(props.mark.extension)
  return (
    <>
      {props.mark.actions.map((action) => (
        <div key={action} data-part="action">
          <Gesture
            kind="secondary"
            label={the_word_or_its_fault(app.common, words?.actions[action], action)}
            off={!ui.it_may_ask(props.course_of(action))}
            does={{
              does: 'taps',
              taps: () => {
                props.taps(action)
              },
            }}
          />
          <TheCourseOfAnAction extension={props.mark.extension} course={props.course_of(action)} />
        </div>
      ))}
      {props.mark.slots.map((slot) => (
        <APartNotDrawn key={slot} />
      ))}
      {props.mark.pages.length > 0 && (
        <List>
          {props.mark.pages.map((page) => (
            <Row
              key={page}
              glyph="chevron_right"
              title={in_its_words(
                app.common,
                words?.pages[page],
                page,
                app.common.the_points.opens_the_page,
              )}
              opens={() => {
                props.opens(page)
              }}
            />
          ))}
        </List>
      )}
    </>
  )
}

/**
 * A slot or a page of an extension, in its mark (EXT-16, WEB-23): a
 * component of the extension's in the kernel's mark, deferred until an
 * extension the app carries has one (ping pong has none). Until then the
 * app tells it does not have it, a fault of its composition, never a blank.
 * [Q, C, 24 Nov 2026]
 */
export const APartNotDrawn = () => {
  const app = the_app()
  return <Notice kind="fault">{app.common.the_points.no_document}</Notice>
}
