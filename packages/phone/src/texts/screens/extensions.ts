import * as boundary from '@q-mino/boundary'
import ping_pong from '@q-mino/ping_pong/texts/it.json' with { type: 'json' }

// The words of the extensions the app carries, in Italian (EXT-16, WEB-22):
// each extension's own, the data of its `texts/` (`it.json`, which ping
// pong's build writes from its typed module), parsed as the kernel parses
// them: no module of the extension runs to draw (provisional, A to confirm:
// words she reads). The phone carries ping pong, preinstalled (PNG-5); its
// composition is step 25's.
export const extensions = {
  ping_pong: boundary.the_words_of_an_extension.parse(ping_pong),
}
