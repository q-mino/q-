import { z } from 'zod'
import { command, NOT, _user, fact, id, predicate } from './_scope_command.ts'

// The face she acts as (USR-6): chosen at her first face, changed with
// "Cambia volto" once she has more. The office does not check the face is
// hers: it sees no other domain (GR-2); `self` refuses what she then asks
// with a face not hers, and the screens show the faces `self` reads.

/** This face is not the active one: none is chosen, or another. */
export const another_face = NOT(predicate.this_face_is_the_active_one)

/** Anna makes her first face, F_a, and acts as it; later she changes to another. The same face again changes nothing. */
export const change_face = command({
  input: z.strictObject({
    face: _user.value.a_face,
  }),
  outcomes: {
    another_face_so_it_is_changed: [another_face, fact.the_active_face_has_been_changed],
    the_same_face_so_nothing_changes: [
      predicate.this_face_is_the_active_one,
      fact.the_active_face_has_been_changed_again,
    ],
  },
  creator: (context) => (input) => ({
    another_face_so_it_is_changed: [
      { face: input.face },
      {
        active_face: {
          choice: id.choice.parse('the_active_face'),
          face: input.face,
          since: context.now,
        },
      },
    ],
    the_same_face_so_nothing_changes: [{ face: input.face }, { face: input.face }],
  }),
})
