// The assistant's words, in Italian (CLAUDE.md, "Language"; AST-5, AST-6;
// the README's § Its words): the face's name, the welcome, the notices of
// the caps, the apology. Claude's replies are its own, guided by the system
// prompt (AST-10). Every word [Q, C, provisional: A to confirm].

export const it = {
  /** The face (AST-2). */
  the_face: 'Assistente di Cumino',
  /** The welcome (AST-5): the only message the assistant writes unasked. */
  the_welcome:
    "Ciao, sono l'assistente di Cumino. Sono Claude, un'intelligenza artificiale: puoi chiedermi come funziona Cumino, fare domande, proporre idee o chiedere consigli sul progetto. Quello che mi scrivi esce dalla rete di Cumino: lo legge Claude, un servizio esterno. Se mi chiedi di salvare un'idea, la annoto nelle note del progetto, anonima e con parole mie. Rispondo quando il computer di Alessandro, che cura Cumino, è acceso: se tardo è spento, e ti rispondo appena si riaccende.",
  /** The notice of a bond's cap (AST-6). */
  the_notice_of_a_bond_s_cap:
    'Per oggi ho risposto a tanti tuoi messaggi: riscrivimi domani. Fino ad allora quello che mi scrivi resta senza risposta.',
  /** The notice of the day's cap (AST-6). */
  the_notice_of_the_day_s_cap:
    'Oggi ho risposto a molte persone e mi fermo fino a domani: riscrivimi allora.',
  /** The apology (AST-6): two attempts over their time or out of their form. */
  the_apology:
    'Non sono riuscito a rispondere a questo messaggio. Riprova più tardi, magari con altre parole.',
  /** The reply of the scripted answerer, a run before Alessandro's login (AST-7): it says it is a test. */
  the_scripted_reply: (messages: number): string =>
    `Questa è una risposta di prova dell'assistente: ho letto ${String(messages)} ${messages === 1 ? 'messaggio' : 'messaggi'}. Le risposte vere arrivano quando Claude è collegato.`,
} as const
