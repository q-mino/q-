import type { AnExtensionTexts } from '@q-mino/adapters-web/screens'
import { the_news } from './what_happened.ts'

// An extension's own screen (Alessandro, 22 Nov 2026 [Q, A, 22 Nov 2026]; to be reviewed on the phones at step 27).

/** Where a point is drawn, by its place's name; a place of no kernel's screen, by its name. */
const the_places = new Map<string, string>([
  ['a_bond', 'sulla schermata di ogni contatto a cui la offri'],
  ['the_extension', 'sulla sua schermata'],
])

const the_place = (place: string): string => the_places.get(place) ?? `nel posto «${place}»`

export const an_extension = {
  title: 'Un’estensione',
  no_such_extension: 'Questa estensione non è installata.',
  the_version: (version) => `versione ${version}`,
  is: {
    active: 'accesa',
    not_active: 'spenta',
    waiting_for_the_new_manifest: 'aspetta che accetti il nuovo manifesto',
  },
  may: {
    activate: 'Accendila',
    accept_the_new_manifest: 'Leggi il nuovo manifesto',
    deactivate: 'Spegnila',
    wait: 'Un momento…',
  },
  the_notice: (extension, version) => `Prima di accettare: cosa chiede «${extension}» ${version}`,
  what_it_asks: {
    to_see_the_peers_key: 'Vedere la chiave del volto dei tuoi contatti',
    to_see_the_name_of_the_bond: 'Vedere il nome che dai ai tuoi contatti',
    to_send_requests_on_your_bonds: 'Mandare richieste ai tuoi contatti a nome tuo',
    a_storage_of_its_own: 'Uno spazio suo per i suoi dati, che legge solo lei',
    the_network_as_far_as_the_browser_leaves_it:
      'Falla: può usare la rete quanto il browser glielo lascia, e Cumino non può impedirlo',
    its_frames_act_with_no_tap:
      'Falla: i suoi riquadri possono fare cose senza che tu tocchi niente, e Cumino non può impedirlo',
  },
  to_answer_your_bonds: (leaves) => `Rispondere ai tuoi contatti (${leaves.join(', ')})`,
  a_place_on_your_screens: {
    action: (name, place) => `Un’azione «${name}» ${the_place(place)}`,
    slot: (name, place) => `Un riquadro «${name}» ${the_place(place)}`,
    page: (name, place) => `Una pagina «${name}» ${the_place(place)}`,
  },
  accept: 'Accetto',
  do_not_accept: 'Non accetto',
  no_news: 'Nessuna notizia.',
  the_news,
} satisfies AnExtensionTexts
