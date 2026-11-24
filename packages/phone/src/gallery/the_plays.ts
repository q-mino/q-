// The plays of the gallery's stories (WEB-29): a story of a screen opens the
// app on a node of a story and plays her gestures on it until it shows its
// case; the page is ready for the screenshots only once every play has
// ended (`data-ready`, WEB-28). A play that fails says it in the console
// and on its story; the page is ready anyway. [Q, C, 24 Nov 2026]

/** The plays started, kept while the page is open: the gallery's own state, at its edge. */
const the_plays: Promise<unknown>[] = []

/** A play starts: the page waits for it. */
export const a_play_starts = (play: Promise<unknown>): void => {
  the_plays.push(play)
}

/** Every play started ended, those a play started on its way too. */
export const the_plays_end = async (): Promise<void> => {
  let seen = 0
  while (seen < the_plays.length) {
    seen = the_plays.length
    await Promise.allSettled(the_plays.slice())
  }
}
