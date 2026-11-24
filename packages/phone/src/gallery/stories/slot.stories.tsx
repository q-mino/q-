// Slot (EXT-16, WEB-30): a part of an extension's at a place, told its
// subject (here the contact Bruno), in its place and on the whole screen,
// with the chain of the marks around it in the corner; two extensions of
// the gallery only, Messaggi and Dadi, Dadi inside a slot of Messaggi's
// (no extension the app ships has a slot, WEB-23). The parts' own look is
// in the layer `extensions` (`gallery.css`), as an extension's would be.

import { Gesture, Mark, Slot, type WhereASlotIs } from '@q-mino/adapters-web/design'
import { the_gallery } from '../../texts/index.ts'

const words = the_gallery.samples
const theirs = words.the_extensions_of_a_story
const nothing = { does: 'taps', taps: () => undefined } as const

/** The subject a slot on a bond is told: the contact, as an extension sees it. */
interface AContactOfAStory {
  readonly name: string
}

const bruno: AContactOfAStory = { name: words.names[1] }

/** Dadi's mark, its slot on the bond: a throw of the contact's. */
const TheDice = (props: { at_first?: WhereASlotIs }) => (
  <Mark name={theirs.dice.name} title={words.the_mark_of(theirs.dice.name)}>
    <Slot
      place="a_bond"
      subject={bruno}
      label={theirs.dice.a_throw}
      words={words.the_slot}
      at_first={props.at_first ?? 'in_its_place'}
    >
      {(contact) => (
        <div class="a-throw-of-a-story">
          <p>{theirs.dice.thrown(contact.name, 5)}</p>
          <Gesture kind="extension" label={theirs.dice.throw_them} does={nothing} />
        </div>
      )}
    </Slot>
  </Mark>
)

/** Messaggi's mark, its slot on the bond: the conversation with the contact, and Dadi inside it. */
const TheMessages = (props: {
  at_first?: WhereASlotIs
  dice?: WhereASlotIs
  with_the_dice?: boolean
}) => (
  <Mark name={theirs.messages.name} title={words.the_mark_of(theirs.messages.name)}>
    <Slot
      place="a_bond"
      subject={bruno}
      label={theirs.messages.the_conversation}
      words={words.the_slot}
      at_first={props.at_first ?? 'in_its_place'}
    >
      {(contact) => (
        <>
          <ol class="a-conversation-of-a-story" aria-label={contact.name}>
            {theirs.messages.said.map((one, at) => (
              <li key={at} data-by={one.by === contact.name ? 'them' : 'me'}>
                {one.words}
              </li>
            ))}
          </ol>
          {props.with_the_dice === true && <TheDice at_first={props.dice ?? 'in_its_place'} />}
        </>
      )}
    </Slot>
  </Mark>
)

export default { title: 'Design/Slot', component: Slot }

export const a_slot_in_its_place = {
  render: () => <TheMessages />,
}

export const a_slot_on_the_whole_screen = {
  render: () => <TheMessages at_first="on_the_whole_screen" />,
}

export const an_extension_inside_another = {
  render: () => <TheMessages with_the_dice />,
}

export const an_extension_inside_another_on_the_whole_screen = {
  render: () => (
    <TheMessages with_the_dice at_first="on_the_whole_screen" dice="on_the_whole_screen" />
  ),
}
