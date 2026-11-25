import type { TheServerTexts } from '@q-mino/adapters-web/screens'

// The server, 1c (Alessandro, 22 Nov 2026 [Q, A, 22 Nov 2026]; to be reviewed on the phones at step 27).

export const the_server = {
  title: 'Il server',
  it_carries_your_letters: (address) =>
    `Cumino porta le tue lettere attraverso un server: ${address}. Dichiara di essere un trasportatore.`,
  it_sees:
    'Vede: le caselle, quando ci arrivano lettere e quanto pesano, l’indirizzo di rete del telefono.',
  it_does_not_see:
    'Non vede: il tuo nome, i tuoi contatti, cosa c’è nelle lettere (sono sigillate).',
  it_is_told_not_guaranteed: 'Cumino non può verificarlo: te lo dice, non lo garantisce.',
  // [Q, C, provisional: A to confirm] (REL-8): the link to docs/relay.md, in English.
  its_public_configuration:
    'Cosa dichiara chi lo gestisce: la sua configurazione pubblica (in inglese)',
  go_on: 'Continua',
} satisfies TheServerTexts
