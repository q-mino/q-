import { texts } from './it.ts'

// The gallery's words (WEB-28): its own, and the words its stories show,
// the app's own where the app has them (provisional, C's, 24 Nov 2026).
const common = texts.screens.common
const the_slot = common.the_points.the_slot
const a_contact = texts.screens.a_contact

export const the_gallery = {
  title: 'Galleria di Cumino',
  intro:
    'Ogni componente in ogni suo caso, in Roano (il tema chiaro) e Lavagna (il tema scuro), disegnato come lo disegna l’app.',
  themes: { light: 'Roano', dark: 'Lavagna' },
  all_the_stories: 'Tutta la galleria',
  no_such_story: (id: string) => `Nella galleria non c’è la storia «${id}».`,
  samples: {
    back: common.back,
    the_slot,
    the_mark_of: common.the_mark_of,
    no_network: common.no_network,
    the_relay_does_not_answer: common.the_relay_does_not_answer,
    in_progress: common.in_progress,
    done: common.how_it_ended.done,
    something_went_wrong: common.something_went_wrong,
    no_answer: a_contact.the_answer.no_answer.no_response,
    waiting: a_contact.the_answer.waiting,
    rename_it: a_contact.rename_it,
    remove_it: a_contact.remove_it,
    the_name: a_contact.the_name,
    give_the_name: a_contact.give_the_name,
    stop_renaming: a_contact.stop_renaming,
    your_name: texts.screens.the_first_face.your_name,
    make_it: texts.screens.the_first_face.make_it,
    the_storage: texts.the_storage.best_effort,
    a_name_hint: 'Lo vedono i contatti a cui lo dai.',
    a_name_fault: 'Scrivi almeno una lettera.',
    a_flaw_title: texts.screens.common.what_it_does_not_guarantee,
    contacts: 'I miei contatti',
    a_long_name: 'Bartolomeo Maria Giovanni della Rovere di Montefeltro',
    names: ['Anna', 'Bruno', 'Carla'],
    a_handshake: 'Stretta di mano di persona, il 21 novembre 2026',
    a_strip: 'una striscia',
    // Two extensions of the gallery only (WEB-30): the app ships none with a slot (WEB-23).
    the_extensions_of_a_story: {
      messages: {
        name: 'Messaggi',
        the_conversation: 'La conversazione',
        said: [
          { by: 'Bruno', words: 'Ci vediamo alle cinque?' },
          { by: 'Anna', words: 'Sì, al campetto.' },
        ],
      },
      dice: {
        name: 'Dadi',
        a_throw: 'Un tiro',
        throw_them: 'Tira',
        thrown: (who: string, points: number) => `${who} ha tirato un ${String(points)}.`,
      },
      ping: common.the_mark_of('Ping pong'),
    },
    the_tokens: {
      colours: 'I colori',
      type: 'I caratteri',
      spaces: 'Gli spazi',
      a_sentence: 'Cumino informa, non garantisce.',
    },
  },
} as const
