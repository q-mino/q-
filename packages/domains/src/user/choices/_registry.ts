// generated

// The path registry of `user/choices` (DOM-24): every path with its component,
// in the order of the twins. The configurator gives it to the library, which
// reads it in reverse, from a component to its path, by object identity.

import type * as zz from '../../library/index.ts'
import * as id from './_id.ts'
import * as value from './_value.ts'
import * as fact from './_fact.ts'
import * as predicate from './_predicate.ts'
import * as choice_selection from './_choice_selection.ts'
import * as command from './_command.ts'
import * as query from './_query.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'user/choices/id/choice': id.choice,
  'user/choices/value/the_active_face': value.the_active_face,
  'user/choices/fact/the_active_face_has_been_changed': fact.the_active_face_has_been_changed,
  'user/choices/fact/the_active_face_has_been_changed_again':
    fact.the_active_face_has_been_changed_again,
  'user/choices/predicate/this_face_is_the_active_one': predicate.this_face_is_the_active_one,
  'user/choices/selection/choice/the_choice_is_this_one': choice_selection.the_choice_is_this_one,
  'user/choices/command/another_face': command.another_face,
  'user/choices/command/change_face': command.change_face,
  'user/choices/command/change_face_input': command.change_face_input,
  'user/choices/query/the_active_face': query.the_active_face,
  'user/choices/query/the_active_face_input': query.the_active_face_input,
  'user/choices/usecase/change_face': usecase.change_face,
  'user/choices/usecase/the_active_face': usecase.the_active_face,
  'user/choices/version/choices': version.choices,
} satisfies zz.Registry
