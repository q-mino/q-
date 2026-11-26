import type * as zz from '@q-mino/domains/library'

// The import of an extension's configurator, made when the kernel loads it
// (PWA-3), tried again after a pause when it fails [Q, C, 27 Nov 2026]
// (part M3, found by the round end to end on the test site): GitHub Pages
// answers 429 to an address that asks too much, and a cold start asks some
// 1 800 files (the modules of the start, then the service worker's precache
// of every file), so the import of ping pong's configurator, at its
// activation a few seconds later, was refused twice in a row: its fall, its
// load again, its second fall, and the extension stopped ("si è fermata")
// for a refusal of the network, not a fault of its own. Each import of the
// same module is fetched again by the browser after a failure, so a pause
// is enough. A configurator that fails for good (a broken release) falls
// once the pauses are over, about half a minute later. Rejected: the
// extensions off left out of the precache (an extension activated offline
// would not load, PWA-5); a pause in the hosting before its load again
// after a fall (a fall of the extension's own would wait as a refusal of
// the network does, EXT-15).

/** The pauses before each new try, in milliseconds: 2, 4, 8 and 16 seconds, then the last try's failure is the import's. */
export const the_pauses_of_an_import: readonly number[] = [2_000, 4_000, 8_000, 16_000]

/** An import, tried again after each pause while it fails; the last failure thrown. */
export const the_import_of_an_extension =
  (elapsed: zz.Elapsed, pauses: readonly number[] = the_pauses_of_an_import) =>
  async <module>(load: () => Promise<module>): Promise<module> => {
    for (const pause of pauses) {
      try {
        return await load()
      } catch {
        await elapsed(pause)
      }
    }
    return load()
  }
