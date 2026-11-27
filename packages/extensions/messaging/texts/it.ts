import type * as boundary from '@q-mino/boundary'
import type { manifest } from '../manifest.ts'
import type { registry } from '../persona/self/_registry.ts'

// Messaging's words in Italian (EXT-16, WEB-22; MSG-10; part M2), the texts
// the kernel draws for it: its name and the labels of its slots, typed by its
// declaration and the registry of `self`, so that a word missing does not
// compile. No action, so no words of events: the part tells its messages
// in its own words (part M5). Provisional [Q, C, provisional: A to
// confirm]. Its build writes it as data, `texts/it.json`
// (`pnpm --filter @q-mino/messaging words`), the one form the kernel reads.

export const words = {
  name: 'Messaggi',
  actions: {},
  // The slot on a row of her contacts (MSG-15, part M4): the same part, the same word.
  slots: { the_chat: 'Chat', the_chat_in_my_contacts: 'Chat' },
  pages: {},
  events: {},
} satisfies boundary.Words<typeof manifest, typeof registry>

/**
 * The words of its part, the chat (MSG-7, MSG-13, MSG-6; part M5): what it
 * tells inside the kernel's mark, in the line on a contact's row and on the
 * whole screen, the conversation. The part's own, never read by the kernel
 * (so not in `texts/it.json`). Provisional [Q, C, provisional: A to confirm].
 * The times come formatted by the part, in the phone's zone.
 */
export const the_words_of_the_chat = {
  /** In its place: the chat in a line, on a contact's row and under the slot's head on a contact's screen. */
  the_line: {
    none: 'Nessun messaggio ancora',
    mine: 'Tu:',
    to_read: (how_many: number) => `${String(how_many)} da leggere`,
    not_read: 'La chat non si legge ora',
  },
  /** On the whole screen: the conversation. */
  the_conversation: {
    the_list: 'Messaggi della chat',
    reading: 'Lettura dei messaggi…',
    none: 'Scrivete il primo messaggio',
    not_read: 'La chat non si legge ora: i Messaggi non rispondono.',
    read_again: 'Riprova',
    older: 'Messaggi precedenti',
    /** Who wrote it and when, to a screen reader: «Tu, oggi alle 10:00». */
    by_me: (when: string) => `Tu, ${when}`,
    by_them: (when: string) => `Il tuo contatto, ${when}`,
    /** The gesture that shows a message's annotations, after its time and its stage. */
    details: 'dettagli',
    send_again: 'Invia di nuovo',
  },
  /** Where her message stands, in a word (MSG-13): never told by a glyph alone. */
  the_stages: {
    on_its_way: 'in uscita',
    delivered: 'consegnato',
    no_receipt: 'nessuna ricevuta in 7 giorni',
    could_not_be_delivered: 'non consegnabile',
    called_off: 'annullato',
    held: 'trattenuto',
    put_aside: 'messo da parte',
  },
  /** The same, in a line on a contact's row, where room is short. */
  the_stages_in_a_line: {
    on_its_way: 'in uscita',
    delivered: 'consegnato',
    no_receipt: 'nessuna ricevuta',
    could_not_be_delivered: 'non consegnabile',
    called_off: 'annullato',
    held: 'trattenuto',
    put_aside: 'messo da parte',
  },
  /** A message on its way while the phone has no network. */
  when_there_is_a_network: 'partirà appena possibile',
  /** Its annotations, at a tap (MSG-6, MSG-13). */
  the_annotations: {
    written: 'Scritto',
    received: 'Ricevuto',
    received_by: (when: string) => `${when}, dal tuo telefono`,
    declared: 'Ora dichiarata',
    declared_by: (when: string) => `${when}, la dice il suo telefono`,
    signature: 'Firma',
    signature_valid: 'valida: è di un tuo contatto',
    mailbox: 'Casella',
    the_bond_s_mailbox: 'quella del vostro legame',
    relay: 'Ora del relay',
    relay_missing: 'non disponibile',
    stage: 'Stato',
    learned: 'Saputo',
    learned_by: (when: string) => `${when}, dal tuo telefono`,
    why: {
      on_its_way: 'aspetta la ricevuta del tuo contatto, fino a 7 giorni',
      on_its_way_with_no_network: 'il telefono non ha rete: partirà appena possibile',
      delivered: 'la ricevuta del tuo contatto è arrivata',
      no_receipt:
        'in 7 giorni non è arrivata la ricevuta: forse non l’ha ricevuto, forse la ricevuta si è persa',
      could_not_be_delivered: 'il telefono del tuo contatto non può riceverlo',
      called_off: 'hai spento i Messaggi, o li hai tolti a questo contatto, mentre aspettava',
      held: 'la sua lettera è ferma: la trovi in «Cosa è successo»',
      put_aside: 'hai messo da parte la sua lettera in «Cosa è successo»',
    },
  },
  /** When, in words: today, yesterday, or the date. */
  the_times: {
    today_at: (hour: string) => `oggi alle ${hour}`,
    yesterday_at: (hour: string) => `ieri alle ${hour}`,
    on_at: (date: string, hour: string) => `${date} alle ${hour}`,
    today: 'Oggi',
    yesterday: 'Ieri',
    yesterday_short: 'ieri',
  },
  /** The field and its gesture. */
  the_field: {
    label: 'Scrivi un messaggio',
    send: 'Invia',
    not_written: 'Il messaggio non è stato scritto: riprova.',
    no_network: 'Il telefono non ha rete: i messaggi partiranno appena possibile.',
  },
  /** What a screen reader is told politely, as it comes. */
  announced: {
    theirs: (text: string) => `Nuovo messaggio: ${text}`,
    mine: (stage: string, text: string) => `Tuo messaggio, ${stage}: ${text}`,
  },
} as const
