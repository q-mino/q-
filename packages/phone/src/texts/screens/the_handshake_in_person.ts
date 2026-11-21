import type { TheHandshakeInPersonTexts } from '@q-mino/adapters-web/screens'

// The handshake in person, the crossed QR (provisional, A to confirm).
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
  scanned: {
    no_ticket: 'Il QR inquadrato non porta un biglietto.',
    a_ticket_out_of_its_form: 'Il QR inquadrato porta un biglietto guasto.',
  },
  opening_their_ticket: (name) => `Apro il biglietto di ${name}…`,
  // [Q, C, provisional: A to confirm] (BND-10, 21 Nov 2026): "di persona" only when her node said so.
  bonded: (name) => `Hai ${name}.`,
  bonded_in_person: (name) => `Hai ${name}, di persona.`,
  bonded_already: (name) => `${name} era già tra i tuoi contatti.`,
  open_the_contact: 'Apri il contatto',
  shake_another_hand: 'Stringi un’altra mano',
  their_ticket_cannot_be_opened: (name) => `Il biglietto di ${name} non si apre.`,
  scan_again: 'Puoi inquadrarne un altro.',
} satisfies TheHandshakeInPersonTexts
