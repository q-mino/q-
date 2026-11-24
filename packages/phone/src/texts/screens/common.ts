import type { TheCommonTexts } from '@q-mino/adapters-web/screens'

// The words every screen shares (Alessandro, 22 Nov 2026 [Q, A, 22 Nov 2026]; to be reviewed on the phones at step 27).

/** What a kernel's leaf said, by its event (USR-3), in her words. */
const the_kernels_events = new Map<string, string>([
  ['your_face_is_being_made', 'il tuo volto è pronto'],
  ['your_ticket_is_being_prepared', 'il biglietto si sta preparando'],
  ['you_are_bonded', 'siete legati'],
  ['you_met_in_person', 'vi siete incontrati di persona'],
  ['your_introduction_is_sent', 'la tua presentazione è partita'],
  ['the_bond_is_renamed', 'il nome è cambiato'],
  ['the_bond_is_removed', 'il contatto è eliminato'],
  ['the_extension_is_active', 'l’estensione è accesa'],
  ['the_extension_is_deactivated', 'l’estensione è spenta'],
  ['the_offer_is_withdrawn', 'l’estensione non è più offerta'],
  ['the_extension_is_offered_again', 'l’estensione è offerta di nuovo'],
  ['the_bond_is_asked', 'la domanda è partita'],
  ['you_have_a_face_already', 'hai già un volto'],
  ['you_opened_their_ticket_already', 'avevi già aperto il suo biglietto'],
  ['the_bond_was_removed_already', 'il contatto era già eliminato'],
  ['the_extension_was_active_already', 'l’estensione era già accesa'],
  ['the_extension_was_not_active', 'l’estensione non era accesa'],
  ['the_offer_was_withdrawn_already', 'l’estensione non era già più offerta'],
  ['the_extension_was_offered_already', 'l’estensione era già offerta'],
  ['the_ticket_cannot_be_prepared', 'il biglietto non si può preparare'],
  ['their_ticket_cannot_be_opened', 'il suo biglietto non si apre: usato o scaduto'],
  ['there_is_no_such_bond', 'questo contatto non c’è'],
  ['the_manifest_is_not_the_installed_one', 'non è il manifesto installato'],
  ['the_extension_cannot_be_deactivated', 'l’estensione non si può spegnere'],
  ['the_offer_cannot_be_withdrawn', 'l’offerta non si può ritirare'],
  ['the_extension_cannot_be_offered', 'l’estensione non si può offrire'],
  ['the_bond_cannot_be_asked', 'non si può chiedere a questo contatto'],
])

export const common = {
  back: 'Indietro',
  opening: 'Apro Cumino…',
  // The start's fault, in A's words for the start [Q, A, 22 Nov 2026].
  it_does_not_start: 'Cumino non parte.',
  why: 'Perché',
  // The data of an older test release (WEB-8) [Q, A, 23 Nov 2026].
  the_data_of_an_older_test_release:
    'I dati di questa app vengono da una versione di prova precedente che non so più leggere: cancellali per ripartire.',
  // [Q, C, provisional: A to confirm]
  clear_the_data_and_start_again: 'Cancella i dati e riparti',
  in_progress: 'In corso…',
  how_it_ended: {
    done: 'Fatto',
    done_already: 'Era già fatto',
    cannot_be_done: 'Non si può fare',
    no_longer_followed: 'Non lo seguo più',
    the_extension_cannot_be_reached: 'L’estensione non si raggiunge',
    the_app_cannot_do_it: 'L’app non riesce a farlo',
  },
  cannot_be_reached: { it_is_not_active: 'è spenta', it_has_stopped: 'si è fermata' },
  the_kernels_events: (event) => the_kernels_events.get(event),
  something_went_wrong: 'Qualcosa non è arrivato al telefono: riprova.',
  the_mark_of: (name) => `Estensione «${name}»`,
  // A word an extension's words lack, drawn as a fault in place of the whole text (WEB-22).
  a_word_missing: (name) => `«${name}»: manca la parola dell’estensione`,
  // The strip (UI-5): no network told apart from a relay silent [Q, A, 23 Nov 2026].
  no_network: 'Sei senza rete.',
  the_relay_does_not_answer: 'Il server non risponde: le lettere aspettano e partono appena torna.',
  the_points: {
    opens_the_page: (label) => `Apri la pagina «${label}»`,
    no_document: 'L’app non ha il riquadro di questa estensione.',
  },
} satisfies TheCommonTexts
