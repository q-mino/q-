// Card (WEB-27): a part of a screen with its title, and without.

import { Card, Gesture, List, Row } from '@q-mino/adapters-web/design'
import { the_gallery } from '../../texts/index.ts'

const words = the_gallery.samples
const taps = { does: 'taps', taps: () => undefined } as const

export default { title: 'Design/Card', component: Card }

export const a_card_with_its_title = {
  render: () => (
    <Card title={words.names[1]}>
      <List>
        <Row glyph="hand_heart" title={words.a_handshake} />
      </List>
      <Gesture kind="secondary" label={words.rename_it} glyph="pencil" does={taps} />
    </Card>
  ),
}

export const a_card_without_a_title = {
  render: () => (
    <Card>
      <p>{words.the_storage}</p>
    </Card>
  ),
}
