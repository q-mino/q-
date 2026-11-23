import type { ACompositionFault } from '@q-mino/adapters-common'
import { screens } from './screens/index.ts'

// App texts. Italian is the first language: another language is a new file
// with the same shape, without touching the code. The words of the start,
// of the storage kept and of the update, and the sentence of each
// composition fault: Alessandro's (22 Nov 2026 [Q, A, 22 Nov 2026], to be
// reviewed on the phones at step 27; PWA-5).
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
    an_extension_does_not_compose: 'Cumino non parte: un’estensione non si compone.',
    /** Each case of a composition fault (EXT-4), by the name of the extension in its manifest [Q, A, 22 Nov 2026]. */
    the_composition_faults: {
      the_manifest_does_not_parse: (name) => `«${name}»: il suo manifesto non si legge.`,
      a_boundary_major_not_spoken: (name) =>
        `«${name}»: è fatta per una versione di Cumino diversa da questa.`,
      a_name_not_unique: (name) => `«${name}»: c’è già un’estensione con questo nome.`,
      a_port_not_offered: (name) =>
        `«${name}»: chiede a Cumino qualcosa che Cumino non dà alle estensioni.`,
      a_leaf_on_known_that_does_not_answer_in_one_event: (name) =>
        `«${name}»: risponderebbe ai tuoi contatti in più volte, e Cumino risponde una volta sola.`,
      an_input_on_known_the_kernel_cannot_check: (name) =>
        `«${name}»: Cumino non saprebbe controllare quello che i tuoi contatti le chiedono.`,
      a_surface_with_no_leaves_at_its_version: (name) =>
        `«${name}»: dichiara una versione in cui non fa niente.`,
      a_json_schema_not_read: (name) =>
        `«${name}»: Cumino non riesce a leggere cosa chiede o cosa risponde.`,
      an_action_on_no_leaf_of_self: (name) => `«${name}»: un suo pulsante non porta a niente.`,
      a_ready_that_differs: (name) =>
        `«${name}»: appena partita, si presenta diversa dal suo manifesto.`,
    } satisfies Record<ACompositionFault['fault'], (name: string) => string>,
    why: 'Perché',
    // The data of an older test release (WEB-8), the screens' words, once.
    the_data_of_an_older_test_release: screens.common.the_data_of_an_older_test_release,
    clear_the_data_and_start_again: screens.common.clear_the_data_and_start_again,
  },
  the_storage: {
    best_effort: 'Il browser può cancellare i dati di Cumino se il telefono resta senza spazio.',
    not_told: 'Il browser non dice se terrà i dati di Cumino.',
  },
  update: {
    available: 'C’è una versione nuova di Cumino.',
    whatChanges:
      'Se aggiorni, Cumino si chiude e si riapre con la versione nuova. Un’estensione con un manifesto nuovo si ferma finché non lo accetti.',
    apply: 'Aggiorna',
    later: 'Più tardi',
  },
  about: {
    title: 'Informazioni',
    version: 'Versione',
    code: 'Codice',
    committed_on: (when: string) => `del ${when}`,
  },
  screens,
} as const
