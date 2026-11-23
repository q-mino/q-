import type { TheHandshakeInPersonTexts } from '@q-mino/adapters-web/screens'

// The handshake in person, the crossed QR (Alessandro, 22 Nov 2026 [Q, A, 22 Nov 2026]; to be reviewed on the phones at step 27).
export const the_handshake_in_person = {
  title: 'Stretta di mano di persona',
  getting_the_ticket_ready: 'Preparo il tuo biglietto…',
  the_ticket_cannot_be_prepared: 'Il tuo biglietto non si può preparare.',
  try_again: 'Riprova',
  show_and_scan: 'Mostra il tuo QR e inquadra il suo.',
  the_qr: 'Il QR del tuo biglietto',
  too_long_for_a_qr: 'Il tuo biglietto è troppo lungo per un QR: ecco il suo link.',
  the_camera: {
    off: 'Accendo la fotocamera…',
    refused: 'La fotocamera non è permessa: consentila al browser per inquadrare il suo QR.',
    missing: 'Non trovo una fotocamera.',
    busy: 'La fotocamera è occupata da un’altra app.',
  },
  // [Q, A, 23 Nov 2026]: the gesture that turns the camera, shown only where the device has more than one.
  turn_the_camera: {
    to_the_rear: 'Usa la fotocamera posteriore',
    to_the_front: 'Usa la fotocamera anteriore',
  },
  scanned: {
    no_ticket: 'Il QR inquadrato non porta un biglietto.',
    a_ticket_out_of_its_form: 'Il QR inquadrato porta un biglietto guasto.',
  },
  // [Q, A, 23 Nov 2026]: her QR stays once she read theirs, until «Fatto» (UI-5, 23 Nov 2026).
  their_ticket_read:
    'Ho letto il suo codice. Tieni il telefono fermo finché anche l’altro non legge il tuo.',
  done: 'Fatto',
  opening_their_ticket: (name) => `Apro il biglietto di ${name}…`,
  // "di persona" only when her node said so (BND-10, 21 Nov 2026).
  bonded: (name) => `Nuovo contatto: si presenta come ${name}.`,
  bonded_in_person: (name) => `Nuovo contatto: si presenta come ${name}, di persona.`,
  // [Q, A, 22 Nov 2026]: as the bond made, no identity claimed (WEB-20).
  bonded_already: (name) => `Era già tra i tuoi contatti: si presenta come ${name}.`,
  open_the_contact: 'Apri il contatto',
  shake_another_hand: 'Stringi un’altra mano',
  their_ticket_cannot_be_opened: (name) => `Il biglietto di ${name} non si apre.`,
  scan_again: 'Puoi inquadrarne un altro.',
} satisfies TheHandshakeInPersonTexts
