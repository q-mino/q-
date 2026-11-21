import type { MyContactsTexts } from '@q-mino/adapters-web/screens'

// Her contacts, the home (provisional, A to confirm).

const how_many = (count: number, one: string, more: string): string =>
  count === 1 ? `1 ${one}` : `${String(count)} ${more}`

export const my_contacts = {
  title: 'I miei contatti',
  none_yet: 'Non hai ancora contatti. Stringi una mano:',
  introduced_as: (name) => `si presenta come ${name}`,
  they_have_you: 'ti ha',
  not_yet: 'non ti ha ancora',
  the_menu: 'Menu',
  close_the_menu: 'Chiudi il menu',
  the_entries: {
    the_handshake_in_person: 'Stretta di mano di persona',
    the_handshake_at_a_distance: 'Stretta di mano a distanza',
    the_extensions: 'Estensioni',
    what_happened: 'Cosa è successo',
  },
  something_happened: (held_letters, happened) =>
    [
      held_letters > 0 ? how_many(held_letters, 'lettera ferma', 'lettere ferme') : '',
      happened > 0 ? how_many(happened, 'avviso', 'avvisi') : '',
    ]
      .filter((part) => part !== '')
      .join(', ') + ': guarda cosa è successo',
} satisfies MyContactsTexts
