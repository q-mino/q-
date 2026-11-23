import { z } from 'zod'
import { _ui, activities, user } from './_scope_value.ts'

// What happened (UI-5; F6, USR-8: nothing happens in silence): what is in
// progress, the letters held and what happened without a fact; the kernel's
// by themselves, each extension's in the kernel's mark of it (EXT-16). A held
// letter she sends again, or puts aside with her reason.

/** An activity the screen asked of a letter, and whether it ended. */
export const an_activity_asked = z.strictObject({
  asked: _ui.value.what_it_asked,
  letter: z.string().min(1).max(512),
  ended: z.boolean(),
})

/** The screen's state: what it asked. */
export const the_state = z.strictObject({ asked: z.array(an_activity_asked).max(64) })

/** What happens on the screen. */
export const what_happens = z.discriminatedUnion('happens', [
  z.strictObject({
    happens: z.literal('she_sends_a_letter_again'),
    held: user.value.a_held_letter,
    asked: _ui.value.what_it_asked,
  }),
  z.strictObject({
    happens: z.literal('she_puts_a_letter_aside'),
    held: user.value.a_held_letter,
    because: z.string().max(1024),
    asked: _ui.value.what_it_asked,
  }),
  _ui.value.she_goes_back,
  _ui.value.what_it_asked_ended,
])

/** A turn of the screen. */
export const a_turn = z.strictObject({
  state: the_state,
  asks: z.array(_ui.value.what_it_asks).max(8),
  goes: _ui.value.where_it_goes,
})

/** What the screen is given: the activities in progress, the letters held, what happened, the activities it asked. */
export const what_it_is_given = z.strictObject({
  in_progress: z.array(activities.value.activity_card).max(1024),
  held_letters: z.array(user.value.a_held_letter).max(1024),
  happened: z.array(user.value.what_happened_without_a_fact).max(1024),
  activities: z.array(activities.value.activity_card).max(64),
})

/** A held letter, with the course of what she asked of it. */
export const a_letter_shown = z.strictObject({
  held: user.value.a_held_letter,
  course: _ui.value.a_course,
})

/** What the screen shows: nothing; or what is in progress, the kernel's, and each extension's in its mark. */
export const what_it_shows = z.discriminatedUnion('shows', [
  z.strictObject({ shows: z.literal('nothing_happened') }),
  z.strictObject({
    shows: z.literal('what_happened'),
    in_progress: z.array(activities.value.activity_card).max(1024),
    the_kernels: z.strictObject({
      held_letters: z.array(a_letter_shown).max(1024),
      happened: z.array(user.value.what_happened_without_a_fact).max(1024),
    }),
    in_their_marks: z
      .array(
        z.strictObject({
          extension: z.string().max(64),
          held_letters: z.array(a_letter_shown).max(1024),
          happened: z.array(user.value.what_happened_without_a_fact).max(1024),
        }),
      )
      .max(256),
  }),
])
