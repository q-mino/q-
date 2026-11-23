import { z } from 'zod'
import { _ui, activities, user } from './_scope_value.ts'

// An extension's own screen (UI-5; EXT-7, EXT-16, USR-7, USR-8): its name,
// version and state; to activate it, she is first told what it asks, the
// flaws the kernel cannot fence included, and accepts the manifest she was
// shown; a new manifest waits for her to accept it; she deactivates it. Its
// place `the_extension`, while active, in the kernel's mark of it, and in that
// mark its letters held and what happened to it without a fact.

/** What an activity of the screen is for. */
export const what_it_is_for = z.discriminatedUnion('for', [
  z.strictObject({ for: z.literal('activating') }),
  z.strictObject({ for: z.literal('deactivating') }),
  z.strictObject({ for: z.literal('an_action'), action: user.value.a_name }),
  z.strictObject({ for: z.literal('a_letter'), letter: z.string().min(1).max(512) }),
])

/** An activity the screen asked, what for, and whether it ended. */
export const an_activity_asked = z.strictObject({
  asked: _ui.value.what_it_asked,
  for: what_it_is_for,
  ended: z.boolean(),
})

/** The screen's state: the extension, the notice of its activation open or closed, what it asked. */
export const the_state = z.strictObject({
  extension: user.value.an_extension,
  the_notice: z.enum(['closed', 'open']),
  asked: z.array(an_activity_asked).max(64),
})

/** What happens on the screen. */
export const what_happens = z.discriminatedUnion('happens', [
  /** She asks to activate it, or to accept its new manifest: the notice opens. */
  z.strictObject({ happens: z.literal('she_asks_to_activate_it') }),
  /** She accepts the manifest she was shown (USR-7). */
  z.strictObject({
    happens: z.literal('she_accepts'),
    manifest: user.value.a_manifest,
    asked: _ui.value.what_it_asked,
  }),
  z.strictObject({ happens: z.literal('she_does_not_accept') }),
  z.strictObject({ happens: z.literal('she_deactivates_it'), asked: _ui.value.what_it_asked }),
  z.strictObject({
    happens: z.literal('she_taps_an_action'),
    mark: _ui.value.a_mark,
    action: user.value.a_name,
    asked: _ui.value.what_it_asked,
  }),
  z.strictObject({
    happens: z.literal('she_opens_a_page'),
    mark: _ui.value.a_mark,
    page: user.value.a_name,
  }),
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

/** What the screen is given: the extension (none if not installed), the letters held and what happened, the activities it asked. */
export const what_it_is_given = z.strictObject({
  extension: _ui.value.an_extension_seen.optional(),
  held_letters: z.array(user.value.a_held_letter).max(1024),
  happened: z.array(user.value.what_happened_without_a_fact).max(1024),
  activities: z.array(activities.value.activity_card).max(64),
})

/** A held letter in the mark, with the course of what she asked of it. */
export const a_letter_in_the_mark = z.strictObject({
  held: user.value.a_held_letter,
  course: _ui.value.a_course,
})

/** What the screen shows: no such extension, or the extension. */
export const what_it_shows = z.discriminatedUnion('shows', [
  z.strictObject({ shows: z.literal('no_such_extension') }),
  z.strictObject({
    shows: z.literal('the_extension'),
    extension: user.value.an_extension,
    version: user.value.a_version,
    is: z.enum(['active', 'not_active', 'waiting_for_the_new_manifest']),
    /** The notice, when open: what it asks, in the order USR-7 tells it. */
    the_notice: z.array(user.value.what_an_extension_asks).max(256).optional(),
    may: z.enum(['activate', 'accept_the_new_manifest', 'deactivate', 'wait']),
    /** The kernel's mark of it: its place `the_extension` while active, its letters held, what happened to it. */
    mark: z.strictObject({
      points: _ui.value.a_mark.optional(),
      held_letters: z.array(a_letter_in_the_mark).max(1024),
      happened: z.array(user.value.what_happened_without_a_fact).max(1024),
    }),
    courses: z.array(z.strictObject({ for: what_it_is_for, course: _ui.value.a_course })).max(64),
  }),
])
