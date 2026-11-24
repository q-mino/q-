// List and Row (WEB-27): rows plain, with a detail, opened, with gestures after, a long title.

import { Gesture, List, Row } from '@q-mino/adapters-web/design'
import { the_gallery } from '../../texts/index.ts'

const words = the_gallery.samples
const nothing = () => undefined

export default { title: 'Design/List', component: List }

export const rows_she_opens = {
  render: () => (
    <List label={words.contacts}>
      {words.names.map((name) => (
        <Row key={name} title={name} glyph="user" detail={words.a_handshake} opens={nothing} />
      ))}
    </List>
  ),
}

export const rows_with_gestures = {
  render: () => (
    <List label={words.contacts}>
      {words.names.map((name) => (
        <Row
          key={name}
          title={name}
          glyph="user"
          trail={
            <Gesture
              kind="quiet"
              label={words.rename_it}
              glyph="pencil"
              does={{ does: 'taps', taps: nothing }}
            />
          }
        />
      ))}
    </List>
  ),
}

export const plain_rows = {
  render: () => (
    <List>
      {words.names.map((name) => (
        <Row key={name} title={name} />
      ))}
    </List>
  ),
}

export const a_long_title = {
  render: () => (
    <List>
      <Row title={words.a_long_name} glyph="user" detail={words.a_handshake} opens={nothing} />
    </List>
  ),
}
