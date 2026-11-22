import type * as boundary from '@q-mino/boundary'
import type { manifest } from '../manifest.ts'
import type { registry } from '../persona/self/_registry.ts'

// Ping pong's words in Italian (EXT-16, WEB-22; A, 22 Nov 2026), the texts
// the kernel draws in its mark (provisional, A to confirm: words she reads):
// its name, the label of its action, and words for each own event of the
// leaf its action invokes on `self`, typed by its declaration and the
// registry of `self`, so that a word missing does not compile. The events
// the kernel tells in its own words (the base events, the wait over: USR-3)
// need none. Its build writes it as data, `texts/it.json`
// (`pnpm --filter @q-mino/ping_pong words`), the one form the kernel reads:
// no module of the extension runs to draw.

export const words = {
  name: 'Ping pong',
  actions: { ping: 'Ping' },
  slots: {},
  pages: {},
  events: {
    the_ping_is_sent: 'ping mandato, aspetto il pong',
    the_ping_cannot_be_sent: 'il ping non può partire',
    pong: 'pong!',
    no_response: 'nessuna risposta',
    the_peer_cannot_answer: 'non può rispondere',
    called_off: 'ping annullato',
  },
} satisfies boundary.Words<typeof manifest, typeof registry>
