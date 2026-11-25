import type { TheIntroductionTexts } from '@q-mino/adapters-web/screens'

// The introduction (UI-6; the MVP's part 4, C, 25 Nov 2026): provisional, for
// the session of fixes.

export const the_introduction = {
  title: 'Come funziona Cumino',
  the_cards: {
    what_cumino_is: {
      title: 'Una rete di mani strette',
      says: [
        'Cumino è una rete di lettere fra persone vere, senza un centro: nessuno la possiede, ogni telefono è un nodo.',
        'Un contatto è una mano stretta. Vi scambiate i segni di persona, inquadrando l’uno il QR dell’altra, o a distanza, con un link. Nessuno ti scrive se non vi siete stretti la mano.',
      ],
    },
    how_the_letters_travel: {
      title: 'Le lettere viaggiano sigillate',
      says: [
        'Ogni lettera parte sigillata dal tuo telefono e passa da un server, che vede le buste: quando arrivano e quanto pesano, non chi sei né cosa c’è dentro.',
        'Se il server non risponde, le lettere aspettano sul telefono e partono appena torna.',
      ],
    },
    the_extensions: {
      title: 'Il resto lo accendi tu',
      says: [
        'Da solo Cumino fa poco: tiene i tuoi contatti e porta le lettere. Ogni altra cosa è un’estensione, che accendi tu e offri ai contatti che vuoi.',
        'La prima è il ping pong: accendila da Estensioni, offrila a un contatto e mandagli un ping. Se anche lui l’ha accesa, ti risponde.',
      ],
    },
  },
  it_informs:
    'Cumino ti informa, non ti garantisce: ti dice tutto ciò che riesce a sapere di una lettera, e anche ciò che non può verificare.',
  where_she_is: (number, of) => `Scheda ${String(number)} di ${String(of)}`,
  to_the_next_card: 'Avanti',
  to_the_server: 'Continua',
  back_where_she_was: 'Fine',
  to_the_card_before: 'Prima',
  skip: 'Salta',
} satisfies TheIntroductionTexts
