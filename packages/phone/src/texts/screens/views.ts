import type { TheViewsWords } from '@q-mino/adapters-web/screens'

// The words of the views in the page's address (WEB-25), which she reads in
// the browser's bar: `/q-/#/contatti/…`. Letters, digits and `-` only, all
// different. [Q, A, 24 Nov 2026] ("Confermo")
export const views = {
  my_contacts: 'contatti',
  the_handshake_in_person: 'di-persona',
  the_handshake_at_a_distance: 'a-distanza',
  an_invitation: 'invito',
  the_extensions: 'estensioni',
  what_happened: 'cosa-e-successo',
  the_server: 'server',
  the_introduction: 'introduzione',
} satisfies TheViewsWords
