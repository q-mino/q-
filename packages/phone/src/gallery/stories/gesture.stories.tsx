// Gesture (WEB-27): each kind, with a glyph, off, and the gestures of a screen together.

import { Gesture } from '@q-mino/adapters-web/design'
import { the_gallery } from '../../texts/index.ts'

const words = the_gallery.samples
const nothing = { does: 'taps', taps: () => undefined } as const

export default { title: 'Design/Gesture', component: Gesture }

export const a_primary_gesture = {
  render: () => <Gesture kind="primary" label={words.give_the_name} does={nothing} />,
}

export const a_secondary_gesture = {
  render: () => <Gesture kind="secondary" label={words.rename_it} glyph="pencil" does={nothing} />,
}

export const a_quiet_gesture = {
  render: () => <Gesture kind="quiet" label={words.back} glyph="arrow_left" does={nothing} />,
}

export const a_dangerous_gesture = {
  render: () => <Gesture kind="dangerous" label={words.remove_it} glyph="trash_2" does={nothing} />,
}

export const a_gesture_off = {
  render: () => <Gesture kind="primary" label={words.in_progress} does={nothing} off />,
}

export const the_gestures_of_a_screen = {
  render: () => (
    <p class="gallery-row">
      <Gesture kind="primary" label={words.give_the_name} does={nothing} />
      <Gesture kind="secondary" label={words.stop_renaming} does={nothing} />
      <Gesture kind="dangerous" label={words.remove_it} glyph="trash_2" does={nothing} />
    </p>
  ),
}
