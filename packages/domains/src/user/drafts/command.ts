import { z } from 'zod'
import { command, NOT, dsl, fact, id, predicate, value } from './_scope_command.ts'

// A text she started, kept and dropped (USR-5): the screens keep it when she
// leaves it, and drop it when she uses or gives it up.

/** The draft for this does not hold this text: none is kept, or another. */
export const the_text_is_new = NOT(predicate.the_draft_holds_this_text)

/** No draft is kept for this. */
export const no_draft_is_kept = NOT(predicate.a_draft_is_kept)

/**
 * Anna starts typing "Bruno" for the bond she is opening, and the phone
 * closes the app: the draft is kept, and the screen gives it back. The same
 * text again changes nothing.
 */
export const keep_a_draft = command({
  input: z.strictObject({
    for: value.what_it_is_for,
    text: value.a_text,
  }),
  outcomes: {
    the_text_is_new_so_it_is_kept: [the_text_is_new, fact.a_draft_has_been_kept],
    the_text_is_kept_already_so_nothing_changes: [
      predicate.the_draft_holds_this_text,
      fact.a_draft_has_been_kept_again,
    ],
  },
  creator: (context) => (input) => {
    const draft_id = id.draft_id.parse(dsl.the_draft_for(input.for))
    return {
      the_text_is_new_so_it_is_kept: [
        { draft_id, text: input.text },
        { draft: { draft_id, for: input.for, text: input.text, kept_at: context.now } },
      ],
      the_text_is_kept_already_so_nothing_changes: [{ draft_id, text: input.text }, { draft_id }],
    }
  },
})

/** The bond is opened with its name, or Anna gives it up: the draft is dropped. None kept: nothing changes. */
export const drop_a_draft = command({
  input: z.strictObject({
    for: value.what_it_is_for,
  }),
  outcomes: {
    a_draft_is_kept_so_it_is_dropped: [predicate.a_draft_is_kept, fact.a_draft_has_been_dropped],
    no_draft_is_kept_so_nothing_changes: [no_draft_is_kept, fact.a_draft_has_been_dropped_again],
  },
  creator: (context) => (input) => {
    const draft_id = id.draft_id.parse(dsl.the_draft_for(input.for))
    return {
      a_draft_is_kept_so_it_is_dropped: [{ draft_id }, { draft_id, at: context.now }],
      no_draft_is_kept_so_nothing_changes: [{ draft_id }, { draft_id }],
    }
  },
})
