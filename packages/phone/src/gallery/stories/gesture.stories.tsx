// Gesture (WEB-27): each kind, with a glyph, off, and the gestures of a screen together;
// an action of an extension beside a gesture of the kernel's (WEB-30).

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

export const an_action_of_an_extension = {
  render: () => <Gesture kind="extension" label="Ping" does={nothing} />,
}

/** «Ping», an extension's, never read as «Cambia nome», the kernel's (the MVP's part 3). */
export const an_action_beside_a_gesture_of_the_kernel = {
  render: () => (
    <p class="gallery-row">
      <Gesture kind="secondary" label={words.rename_it} glyph="pencil" does={nothing} />
      <Gesture kind="extension" label="Ping" does={nothing} />
    </p>
  ),
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
