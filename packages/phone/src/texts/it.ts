import { screens } from './screens/index.ts'

// App texts. Italian is the first language: another language is a new file
// with the same shape, without touching the code. The words of the start,
// of the storage kept and of the update are provisional (A to confirm: the
// words she reads, PWA-5).
export const texts = {
  app: {
    name: 'q-',
    reading: 'Cumino',
    testChannel: 'Versione di prova',
  },
  start: {
    opening: 'Cumino si apre…',
    another_tab: 'Cumino è già aperto in un’altra scheda o finestra.',
    used_elsewhere: 'Cumino ora è aperto in un’altra scheda o finestra.',
    use_here: 'Usa qui',
    closed_for_a_new_release:
      'Una versione nuova di Cumino si è aperta in un’altra scheda: questa si è chiusa.',
    reload: 'Riapri',
    it_does_not_start: 'Cumino non parte.',
    why: 'Perché',
  },
  the_storage: {
    best_effort: 'Il browser può cancellare i dati di Cumino se il telefono resta senza spazio.',
    not_told: 'Il browser non dice se terrà i dati di Cumino.',
  },
  update: {
    available: 'C’è una versione nuova di Cumino.',
    whatChanges:
      'Se aggiorni, Cumino si chiude e si riapre con la versione nuova: ciò che hai resta sul telefono.',
    apply: 'Aggiorna',
    later: 'Più tardi',
  },
  about: {
    title: 'Informazioni',
    version: 'Versione',
    code: 'Codice',
  },
  screens,
} as const
