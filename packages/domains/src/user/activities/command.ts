import { z } from 'zod'
import { command, NOT, pick, effect, fact, id, predicate, value } from './_scope_command.ts'

// What she asks her node, and how it ended (USR-2, USR-3): her gesture kept
// with its id before the first attempt (DOM-12), carried out by the
// library's queue (LIB-12), and its end, the return of the effect.

/** No activity with this id has been asked. */
export const the_activity_is_new = NOT(predicate.an_activity_has_this_id)

/**
 * Anna taps "Ping" on her bond with Bruno, or renames it, or activates ping
 * pong: the screen asks for an activity, with the id it drew (DOM-12). The
 * office keeps it in progress and queues its carrying out. The same id
 * again (a tap repeated, a screen reloaded) changes nothing.
 */
export const ask_for_an_activity = command({
  input: z.strictObject({
    activity_id: id.activity_id,
    what: value.what_is_asked,
  }),
  outcomes: {
    the_activity_is_new_so_it_is_asked: [
      the_activity_is_new,
      fact.an_activity_has_been_asked,
      pick(effect, 'carry_out_an_activity'),
    ],
    the_activity_was_asked_already_so_nothing_changes: [
      predicate.an_activity_has_this_id,
      fact.an_activity_has_been_asked_again,
    ],
  },
  creator: (context) => (input) => ({
    the_activity_is_new_so_it_is_asked: [
      { activity_id: input.activity_id },
      { activity: { activity_id: input.activity_id, what: input.what, asked_at: context.now } },
      {
        carry_out_an_activity: {
          id: input.activity_id,
          payload: { activity_id: input.activity_id, what: input.what },
        },
      },
    ],
    the_activity_was_asked_already_so_nothing_changes: [
      { activity_id: input.activity_id },
      { activity_id: input.activity_id },
    ],
  }),
})

/**
 * Bruno's pong came back, or the bond is renamed, or ping pong is off: the
 * activity ends, how in her words (USR-3), the return of its carrying out.
 * One that is not in progress is refused: a held letter, shown (DOM-15).
 */
export const end_an_activity = command({
  input: z.strictObject({
    activity_id: id.activity_id,
    how_it_ended: value.how_it_ended,
  }),
  outcomes: {
    the_activity_is_in_progress_so_it_ends: [
      predicate.the_activity_is_in_progress,
      fact.an_activity_has_ended,
    ],
  },
  creator: (context) => (input) => ({
    the_activity_is_in_progress_so_it_ends: [
      { activity_id: input.activity_id },
      { activity_id: input.activity_id, how_it_ended: input.how_it_ended, at: context.now },
    ],
  }),
})
