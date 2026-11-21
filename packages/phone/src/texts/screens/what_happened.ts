import type { WhatHappenedTexts } from '@q-mino/adapters-web/screens'

// What happened (provisional, A to confirm).

/** The letters held and what happened without a fact, told here and in an extension's mark. */
export const the_news = {
  the_held_letters: 'Lettere ferme',
  why_it_is_held: {
    it_could_not_be_delivered: 'Non è stata consegnata',
    what_came_back_was_refused: 'Quello che è tornato è stato rifiutato',
    it_was_done_otherwise_before: 'Era già stata fatta in un altro modo',
    the_app_could_not_read_what_came_back: 'L’app non è riuscita a leggere quello che è tornato',
  },
  send_it_again: 'Rimandala',
  why_aside: 'Perché',
  put_it_aside: 'Mettila da parte',
  what_happened: 'Avvisi',
  happened: {
    a_request_met_silence: 'Un contatto ha chiesto qualcosa e il telefono ha taciuto',
    a_letter_could_not_be_opened: 'È arrivata una lettera che non si apre',
    a_response_came_unasked: 'È arrivata una risposta che non avevi chiesto, o in ritardo',
    a_letter_was_refused: 'Una lettera è stata rifiutata',
    a_response_could_not_be_sent: 'Una tua risposta non è partita',
    an_extension_did_what_it_does_not_declare:
      'Ha fatto qualcosa che il suo manifesto non dichiara',
    an_extension_fell: 'Si è fermata',
    a_request_was_not_answered: 'Una richiesta non ha avuto risposta',
  },
  the_silence_because: {
    the_extension_is_not_installed: 'l’estensione non è installata',
    the_extension_is_not_active: 'l’estensione è spenta',
    the_extension_is_not_offered_to_the_bond: 'l’estensione non è offerta a quel contatto',
  },
  the_fall: {
    the_first: 'è ripartita',
    the_second: 'per la seconda volta, e resta ferma',
  },
} satisfies WhatHappenedTexts['the_news']

export const what_happened = {
  title: 'Cosa è successo',
  nothing_happened: 'Non è successo niente.',
  in_progress: 'In corso',
  the_activities: {
    make_my_first_face: 'Creo il tuo volto',
    prepare_a_ticket: 'Preparo un biglietto',
    open_their_ticket: 'Apro un biglietto ricevuto',
    rename_a_bond: 'Cambio il nome di un contatto',
    remove_a_bond: 'Tolgo un contatto',
    activate_an_extension: 'Accendo un’estensione',
    deactivate_an_extension: 'Spengo un’estensione',
    withdraw_the_offer_from_a_bond: 'Ritiro un’estensione offerta a un contatto',
    offer_an_extension_to_a_bond: 'Offro un’estensione a un contatto',
    ask_a_bond_for_the_extensions_in_common: 'Chiedo a un contatto le estensioni in comune',
    use_an_action: 'Uso un’azione di un’estensione',
    send_a_held_letter_again: 'Rimando una lettera ferma',
    put_a_held_letter_aside: 'Metto da parte una lettera ferma',
  },
  the_kernels: 'Cumino',
  the_news,
} satisfies WhatHappenedTexts
