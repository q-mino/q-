// The quiet of a story's nodes (TST-11; DOM-14, DOM-16): everything set
// going has run its course up to its next wait, on the log's bell, the
// story's clock or a stop. Seen from a turn of the event loop, when every
// promise settled: what the harness counts as at work is over (a
// transaction of its IndexedDB in flight, a real timer of a node's running,
// a call of its transports not answered). A condition, not a count of
// turns: how much of the work fits in a turn depends on the machine's load.
// The oracle's cells and the relay's stores wait on nothing but promises,
// so a turn comes after them all. No hook in the code that ships: the
// harnesses count what they give the node (A, 24 Nov 2026).

/** A real timer of so many milliseconds. */
export const a_timer = (milliseconds: number) => (): Promise<void> =>
  new Promise<void>((done) => {
    setTimeout(done, milliseconds)
  })

/**
 * The real timers of a node's (its realm's short waits, its release's
 * pauses), each counted while it runs: the node is not quiet before it
 * rings.
 */
export const the_timers_of_a_node = () => {
  let running = 0
  return {
    /** A real timer of so many milliseconds, counted while it runs. */
    a_timer: (milliseconds: number) => async (): Promise<void> => {
      running += 1
      try {
        await a_timer(milliseconds)()
      } finally {
        running -= 1
      }
    },
    /** Whether a timer of the node's is running. */
    running: (): boolean => running > 0,
  }
}

/**
 * Turns of the event loop until nothing the harness counts is at work: seen
 * after a turn, then every 2 ms; at most about two seconds, else the story
 * fails (a node that does not quiet down fails there, never goes on mute).
 */
export const until_quiet = async (at_work: () => boolean, what: string): Promise<void> => {
  await a_timer(0)()
  for (let round = 0; round < 1000; round += 1) {
    if (!at_work()) return
    await a_timer(2)()
  }
  throw new Error(`${what}: it did not come to pass`)
}
