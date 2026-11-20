// The pure functions and the constants of `greetings` (DOM-5): the words it
// greets with and greets back with, how long a greeting waits, the meanings
// of its predicates for the adapters.

import type { value } from './_scope_dsl.ts'

/** The words of a greeting from the node: the user's gesture on a bond carries none (EXT-16). An Italian text the peer's user reads: provisional. */
export const the_words_of_a_greeting = 'ciao'

/** The words of a greeting back. An Italian text the peer's user reads: provisional. */
export const the_words_of_a_greeting_back = 'ciao anche a te'

/** How long a greeting waits for its greeting back: 60 seconds, as ping pong's ping (F7). */
export const a_greeting_waits = 60

/** A greeting with this identity is in the record, whatever came back. */
export const a_greeting_is_there = (
  the_greeting: value.greeting | undefined,
): the_greeting is value.greeting => the_greeting !== undefined

/** The greeting waits for what comes back. */
export const the_greeting_waits = (the_greeting: value.greeting | undefined): boolean =>
  the_greeting?.progress.stage === 'waiting'

/** The record of a greeting closed with what came back. */
export const closed_with =
  (outcome: value.outcome) =>
  (the_greeting: value.greeting): value.greeting => ({
    ...the_greeting,
    progress: { stage: 'closed', outcome },
  })
