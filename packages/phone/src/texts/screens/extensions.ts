import * as boundary from '@q-mino/boundary'
import ping_pong from '@q-mino/ping_pong/texts/it.json' with { type: 'json' }

// The words of the extensions the app carries, in Italian (EXT-16, WEB-22):
// each extension's own, from its `texts/`, parsed as the kernel parses them
// (provisional, A to confirm: words she reads). The phone carries ping pong,
// preinstalled (PNG-5); its composition is step 25's.
export const extensions = {
  ping_pong: boundary.the_words_of_an_extension.parse(ping_pong),
}
