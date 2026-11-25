// Mark (EXT-16, WEB-30): the kernel's mark of an extension, with an action
// of it beside a gesture of the kernel's; two marks, one inside the other,
// as an extension inside another's slot; the corner of a screen an
// extension holds, its name, or the chain of two.

import { Card, Corner, Gesture, Mark, Notice } from '@q-mino/adapters-web/design'
import { the_gallery } from '../../texts/index.ts'

const words = the_gallery.samples
const theirs = words.the_extensions_of_a_story
const nothing = { does: 'taps', taps: () => undefined } as const

export default { title: 'Design/Mark', component: Mark }

/** On a contact: «Cambia nome» is the kernel's, «Ping» is in ping pong's mark, in its kind. */
export const a_mark_on_a_contact = {
  render: () => (
    <>
      <Card title={words.names[1]}>
        <p class="gallery-row">
          <Gesture kind="secondary" label={words.rename_it} glyph="pencil" does={nothing} />
        </p>
      </Card>
      <Mark name="Ping pong" title={theirs.ping}>
        <div data-part="action">
          <Gesture kind="extension" label="Ping" does={nothing} />
          <Notice kind="information">pong!</Notice>
        </div>
      </Mark>
    </>
  ),
}

export const two_marks_one_inside_the_other = {
  render: () => (
    <Mark name={theirs.messages.name} title={words.the_mark_of(theirs.messages.name)}>
      <p>{theirs.messages.said[0].words}</p>
      <Mark name={theirs.dice.name} title={words.the_mark_of(theirs.dice.name)}>
        <div data-part="action">
          <Gesture kind="extension" label={theirs.dice.throw_them} does={nothing} />
        </div>
      </Mark>
    </Mark>
  ),
}

export const the_corner_of_an_extension = {
  render: () => <Corner label={words.the_slot.who_has_the_screen} chain={['Ping pong']} />,
}

export const the_corner_of_an_extension_inside_another = {
  render: () => (
    <Corner
      label={words.the_slot.who_has_the_screen}
      chain={[theirs.messages.name, theirs.dice.name]}
    >
      <Gesture
        kind="quiet"
        label={words.the_slot.gives_it_back}
        glyph="minimize_2"
        does={nothing}
      />
    </Corner>
  ),
}
