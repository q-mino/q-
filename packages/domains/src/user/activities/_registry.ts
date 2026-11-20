// generated

// The path registry of `user/activities` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity.

import type * as zz from '../../library/index.ts'
import * as id from './_id.ts'
import * as value from './_value.ts'
import * as fact from './_fact.ts'
import * as predicate from './_predicate.ts'
import * as effect from './_effect.ts'
import * as activity_selection from './_activity_selection.ts'
import * as command from './_command.ts'
import * as query from './_query.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'user/activities/id/activity_id': id.activity_id,
  'user/activities/value/their_ticket': value.their_ticket,
  'user/activities/value/offered': value.offered,
  'user/activities/value/the_place': value.the_place,
  'user/activities/value/what_is_asked': value.what_is_asked,
  'user/activities/value/how_it_ended': value.how_it_ended,
  'user/activities/value/an_asked_activity': value.an_asked_activity,
  'user/activities/value/stage': value.stage,
  'user/activities/value/activity_card': value.activity_card,
  'user/activities/fact/an_activity_has_been_asked': fact.an_activity_has_been_asked,
  'user/activities/fact/an_activity_has_been_asked_again': fact.an_activity_has_been_asked_again,
  'user/activities/fact/an_activity_has_ended': fact.an_activity_has_ended,
  'user/activities/predicate/an_activity_has_this_id': predicate.an_activity_has_this_id,
  'user/activities/predicate/the_activity_is_in_progress': predicate.the_activity_is_in_progress,
  'user/activities/effect/carry_out_an_activity': effect.carry_out_an_activity,
  'user/activities/selection/activity/the_activity_has_this_id':
    activity_selection.the_activity_has_this_id,
  'user/activities/selection/activity/the_activity_is_in_progress':
    activity_selection.the_activity_is_in_progress,
  'user/activities/command/the_activity_is_new': command.the_activity_is_new,
  'user/activities/command/ask_for_an_activity': command.ask_for_an_activity,
  'user/activities/command/ask_for_an_activity_input': command.ask_for_an_activity_input,
  'user/activities/command/end_an_activity': command.end_an_activity,
  'user/activities/command/end_an_activity_input': command.end_an_activity_input,
  'user/activities/query/an_activity': query.an_activity,
  'user/activities/query/an_activity_input': query.an_activity_input,
  'user/activities/query/the_activities_in_progress': query.the_activities_in_progress,
  'user/activities/query/the_activities_in_progress_input': query.the_activities_in_progress_input,
  'user/activities/usecase/ask_for_an_activity': usecase.ask_for_an_activity,
  'user/activities/usecase/end_an_activity': usecase.end_an_activity,
  'user/activities/usecase/an_activity': usecase.an_activity,
  'user/activities/usecase/the_activities_in_progress': usecase.the_activities_in_progress,
  'user/activities/version/activities': version.activities,
} satisfies zz.Registry
