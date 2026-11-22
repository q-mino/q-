import type { AContactTexts } from '@q-mino/adapters-web/screens'

// A contact (Alessandro, 22 Nov 2026 [Q, A, 22 Nov 2026]; to be reviewed on the phones at step 27).

export const a_contact = {
  title: 'Un contatto',
  no_such_contact: 'Questo contatto non c’è più.',
  introduced_as: (name) => `si presenta come ${name}`,
  the_handshake: {
    in_person: (when) => `Stretta di mano di persona, il ${when}`,
    at_a_distance: (when) => `Stretta di mano a distanza, il ${when}`,
  },
  when: (at, time_zone) =>
    new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: time_zone,
    }).format(new Date(at)),
  the_confirmation: {
    awaited: 'Non ti ha ancora tra i suoi contatti',
    received: 'Ti ha tra i suoi contatti',
  },
  their_relays: 'I suoi relay:',
  rename_it: 'Cambia nome',
  the_name: 'Nome',
  give_the_name: 'Salva il nome',
  renaming: 'Salvo il nome…',
  stop_renaming: 'Lascia stare',
  remove_it: 'Elimina il contatto',
  remove_it_really: (name) => `Vuoi eliminare ${name} dai tuoi contatti?`,
  yes_remove_it: 'Sì, eliminalo',
  keep_it: 'No, tienilo',
  the_extensions: 'Estensioni',
  no_extension_active: 'Nessuna estensione accesa.',
  offered: 'offerta',
  not_offered: 'non offerta',
  the_offer: { offer: 'Offrila', withdraw_the_offer: 'Ritira l’offerta', wait: 'Un momento…' },
  ask_for_the_extensions_in_common: 'Chiedi le estensioni in comune',
  the_answer: {
    // [Q, C, provisional: A to confirm] (UI-5): the answer waiting, and no answer, by why.
    waiting: 'Aspetto la risposta…',
    in_common: (names) => `In comune: ${names.join(', ')}.`,
    none_in_common: 'Nessuna estensione in comune.',
    // [Q, C, provisional: A to confirm] (UI-5).
    no_answer: { no_response: 'Nessuna risposta.', the_peer_cannot_answer: 'Non può rispondere.' },
  },
} satisfies AContactTexts
