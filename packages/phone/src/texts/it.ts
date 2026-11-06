// App texts. Italian is the first language: another language is a new file
// with the same shape, without touching the code.
export const texts = {
  app: {
    name: 'Q-',
    reading: 'Cumino',
    empty: 'Qui non c’è ancora niente: è solo lo scheletro dell’app.',
    testChannel: 'Versione di prova',
  },
  update: {
    available: 'C’è una versione nuova.',
    whatChanges: 'Cosa cambia per te: ancora niente, è una prova dell’avviso.',
    apply: 'Aggiorna',
    later: 'Più tardi',
  },
  about: {
    title: 'Informazioni',
    version: 'Versione',
    code: 'Codice',
  },
} as const
