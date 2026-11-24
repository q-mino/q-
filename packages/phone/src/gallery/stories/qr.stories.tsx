// Qr (WEB-27) and Viewfinder: a QR she shows, dark on its paper in both
// themes; where the camera shows what it sees, its corners over it.

import { the_qr_of } from '@q-mino/adapters-web'
import { Qr, Viewfinder } from '@q-mino/adapters-web/design'
import { texts } from '../../texts/index.ts'

const a_link = 'https://q-mino-prova.github.io/q-/#ticket=una-stretta-di-mano-della-galleria'

export default { title: 'Design/Qr', component: Qr }

export const a_qr = {
  render: () => {
    const qr = the_qr_of(a_link)
    return qr.drawn === 'a_qr' ? (
      <Qr svg={qr.svg} label={texts.screens.the_handshake_in_person.the_qr} />
    ) : (
      <p>{a_link}</p>
    )
  },
}

export const a_viewfinder = {
  render: () => (
    <Viewfinder hidden={false}>
      <video muted playsInline />
    </Viewfinder>
  ),
}
