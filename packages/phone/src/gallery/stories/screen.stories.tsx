// Screen (WEB-27): its areas, filled by the other components; with the strip over it.

import { Field, Flaw, Gesture, List, Notice, Row, Screen, Strip } from '@q-mino/adapters-web/design'
import { the_gallery } from '../../texts/index.ts'

const words = the_gallery.samples
const nothing = () => undefined
const taps = { does: 'taps', taps: nothing } as const

export default { title: 'Design/Screen', component: Screen }

export const a_screen_of_contacts = {
  render: () => (
    <Screen
      title={words.contacts}
      gestures={<Gesture kind="primary" label={words.make_it} glyph="plus" does={taps} />}
    >
      <List label={words.contacts}>
        {words.names.map((name) => (
          <Row key={name} title={name} glyph="user" detail={words.a_handshake} opens={nothing} />
        ))}
      </List>
      <Flaw title={words.a_flaw_title}>{words.the_storage}</Flaw>
    </Screen>
  ),
}

export const a_screen_with_the_strip = {
  render: () => (
    <Screen
      title={words.rename_it}
      strip={<Strip glyph="wifi_off">{words.no_network}</Strip>}
      back={<Gesture kind="quiet" label={words.back} glyph="arrow_left" does={taps} />}
      gestures={
        <>
          <Gesture kind="primary" label={words.give_the_name} does={{ does: 'submits' }} />
          <Gesture kind="secondary" label={words.stop_renaming} does={taps} />
        </>
      }
    >
      <Field label={words.the_name} name="name" value="Bruno" types={nothing} />
      <Notice kind="waiting">{words.waiting}</Notice>
    </Screen>
  ),
}
