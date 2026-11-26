// Strip (WEB-27): what the phone tells of the network, over every screen.

import { Strip } from '@q-mino/adapters-web/design'
import { the_gallery } from '../../texts/index.ts'

const words = the_gallery.samples

export default { title: 'Design/Strip', component: Strip }

export const no_network = {
  render: () => <Strip glyph="wifi_off">{words.no_network}</Strip>,
}

export const the_relay_does_not_answer = {
  render: () => <Strip glyph="clock">{words.the_relay_does_not_answer}</Strip>,
}

export const the_relay_is_full = {
  render: () => <Strip glyph="circle_alert">{words.the_relay_is_full}</Strip>,
}
