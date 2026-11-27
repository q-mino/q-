// generated

// The path registry of `stand/invitations` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity.

import type * as zz from '../../library/index.ts'
import * as id from './_id.ts'
import * as value from './_value.ts'
import * as fact from './_fact.ts'
import * as predicate from './_predicate.ts'
import * as effect from './_effect.ts'
import * as invitation_selection from './_invitation_selection.ts'
import * as command from './_command.ts'
import * as query from './_query.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'stand/invitations/id/stand': id.stand,
  'stand/invitations/id/invitation_id': id.invitation_id,
  'stand/invitations/id/take_id': id.take_id,
  'stand/invitations/value/ticket': value.ticket,
  'stand/invitations/value/invitation_status': value.invitation_status,
  'stand/invitations/value/invitation_on_the_stand': value.invitation_on_the_stand,
  'stand/invitations/value/taken_invitation': value.taken_invitation,
  'stand/invitations/value/invitation_taken_away': value.invitation_taken_away,
  'stand/invitations/value/invitation': value.invitation,
  'stand/invitations/value/invitation_in_sight': value.invitation_in_sight,
  'stand/invitations/value/invitation_in_hand': value.invitation_in_hand,
  'stand/invitations/fact/an_invitation_has_been_left': fact.an_invitation_has_been_left,
  'stand/invitations/fact/an_invitation_has_been_taken': fact.an_invitation_has_been_taken,
  'stand/invitations/fact/an_invitation_has_been_taken_away':
    fact.an_invitation_has_been_taken_away,
  'stand/invitations/fact/the_invitation_was_taken_before_its_time':
    fact.the_invitation_was_taken_before_its_time,
  'stand/invitations/predicate/an_invitation_has_this_id': predicate.an_invitation_has_this_id,
  'stand/invitations/predicate/the_stand_has_room': predicate.the_stand_has_room,
  'stand/invitations/predicate/it_can_be_taken_until_then': predicate.it_can_be_taken_until_then,
  'stand/invitations/predicate/the_invitation_is_on_the_stand':
    predicate.the_invitation_is_on_the_stand,
  'stand/invitations/predicate/the_invitation_is_still_on_its_stand':
    predicate.the_invitation_is_still_on_its_stand,
  'stand/invitations/predicate/the_invitation_has_been_taken':
    predicate.the_invitation_has_been_taken,
  'stand/invitations/effect/wait_until_it_can_no_longer_be_taken':
    effect.wait_until_it_can_no_longer_be_taken,
  'stand/invitations/selection/invitation/the_invitation_is_on_this_stand':
    invitation_selection.the_invitation_is_on_this_stand,
  'stand/invitations/selection/invitation/the_invitation_can_be_taken':
    invitation_selection.the_invitation_can_be_taken,
  'stand/invitations/selection/invitation/the_invitation_was_taken_by':
    invitation_selection.the_invitation_was_taken_by,
  'stand/invitations/command/an_invitation_can_be_left': command.an_invitation_can_be_left,
  'stand/invitations/command/leave_an_invitation': command.leave_an_invitation,
  'stand/invitations/command/leave_an_invitation_input': command.leave_an_invitation_input,
  'stand/invitations/command/take_an_invitation': command.take_an_invitation,
  'stand/invitations/command/take_an_invitation_input': command.take_an_invitation_input,
  'stand/invitations/command/take_away_an_invitation': command.take_away_an_invitation,
  'stand/invitations/command/take_away_an_invitation_input': command.take_away_an_invitation_input,
  'stand/invitations/query/the_invitation_waits_on_the_stand':
    query.the_invitation_waits_on_the_stand,
  'stand/invitations/query/the_invitations_on_a_stand': query.the_invitations_on_a_stand,
  'stand/invitations/query/the_invitations_on_a_stand_input':
    query.the_invitations_on_a_stand_input,
  'stand/invitations/query/the_invitation_taken': query.the_invitation_taken,
  'stand/invitations/query/the_invitation_taken_input': query.the_invitation_taken_input,
  'stand/invitations/usecase/leave_an_invitation': usecase.leave_an_invitation,
  'stand/invitations/usecase/take_an_invitation': usecase.take_an_invitation,
  'stand/invitations/usecase/take_away_an_invitation': usecase.take_away_an_invitation,
  'stand/invitations/usecase/the_invitations_on_a_stand': usecase.the_invitations_on_a_stand,
  'stand/invitations/usecase/the_invitation_taken': usecase.the_invitation_taken,
  'stand/invitations/version/invitations': version.invitations,
} satisfies zz.Registry
