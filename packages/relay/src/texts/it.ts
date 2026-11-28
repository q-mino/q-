// The words of the relay's page of a stand (INV-7), Italian, the first
// language (CLAUDE.md, "Language"): what the assistant is, what leaves the
// network, when it answers, the steps, the link. Every one provisional
// [Q, C, provisional: A to confirm]: the assistant's README, § Its words.

export const words = {
  title: "L'assistente di Cumino",
  what_it_is:
    "L'assistente è un contatto dentro Cumino a cui chiedere del progetto: come funziona, domande, idee, richieste di funzionalità, consigli. Risponde Claude, un'intelligenza artificiale.",
  before_writing: 'Prima di scrivergli',
  it_leaves_the_network: {
    before: 'Quello che gli scrivi ',
    marked: 'esce dalla rete di Cumino',
    after:
      ': lo legge Claude, un servizio esterno di Anthropic, e la chat resta sul computer di Alessandro, che cura Cumino e può leggerla. Non è una chat solo fra voi due.',
  },
  the_notes:
    "Se gli chiedi di salvare un'idea, finisce nelle note del progetto, anonima e riscritta con parole sue.",
  when_it_answers:
    'Risponde quando il computer di Alessandro è acceso: se è spento i tuoi messaggi aspettano fino a una settimana, e la risposta arriva più tardi.',
  what_it_answers: 'Risponde solo su Cumino, e a un numero limitato di messaggi al giorno.',
  how_to_add_it: 'Come aggiungerlo',
  install_cumino: 'Installa Cumino',
  make_your_face: 'Fai il tuo volto',
  turn_on_messaging: 'Accendi Messaggi, fra le estensioni',
  take_the_link:
    "Prendi il link qui sotto e aprilo sul telefono dove hai Cumino: l'assistente diventa un tuo contatto e ti scrive per primo.",
  the_button: 'Prendi il link',
  one_link_one_person:
    'Ogni link vale per una persona sola. Dal computer, inquadra il QR col telefono.',
  here_is_your_link: 'Ecco il tuo link',
  open_in_cumino: 'Apri in Cumino',
  the_qr: 'Il QR del link, da inquadrare col telefono',
  use_it_soon:
    "Usalo entro un giorno, e non darlo ad altri: vale per chi lo apre per primo. Se l'assistente non ti scrive entro un paio di giorni, prendine un altro.",
  no_links_now:
    "Ora non ci sono link: il computer dell'assistente è spento, o i link di oggi sono finiti. Riprova più tardi.",
  not_there_yet: "L'assistente non è ancora arrivato: torna fra qualche giorno.",
  back: 'Torna alla pagina',
  the_qr_too_long: 'Il link è troppo lungo per un QR: aprilo dal telefono.',
} as const
