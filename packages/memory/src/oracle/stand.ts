// The module of `stand` in q-'s oracle (TST-2, INV-10): the state of
// `stand/invitations`, its predicates and selections as functions of that
// state, its sources and its writes, the meaning from the domain's `dsl`
// (DOM-5); and the domain's command and read ports over a cell (INV-2..INV-4).

import * as zz from '@q-mino/domains/library'
import { registry } from '@q-mino/domains/stand/invitations/_registry.ts'
import type * as invitations_fact from '@q-mino/domains/stand/invitations/_fact.ts'
import type * as invitations_predicate from '@q-mino/domains/stand/invitations/_predicate.ts'
import type * as invitation_selections from '@q-mino/domains/stand/invitations/_invitation_selection.ts'
import type { invitation_id, stand } from '@q-mino/domains/stand/invitations/_id.ts'
import type { invitation } from '@q-mino/domains/stand/invitations/_value.ts'
import type {
  the_invitation_taken as the_query_of_a_take,
  the_invitations_on_a_stand as the_query_of_a_stand,
} from '@q-mino/domains/stand/invitations/_query.ts'
import {
  an_invitation_is_there,
  it_can_be_taken_until,
  the_invitation_has_been_taken,
  the_invitation_is_on_the_stand,
  there_is_room_with,
} from '@q-mino/domains/stand/invitations/_dsl.ts'
import {
  leave_an_invitation,
  take_an_invitation,
  take_away_an_invitation,
  the_invitation_taken,
  the_invitations_on_a_stand,
} from '@q-mino/domains/stand/invitations/_usecase.ts'
import type { CommandCell, ReadCell } from './cell.ts'
import {
  after,
  algebra,
  execute,
  page,
  read,
  recorded,
  selection_operators,
  type Field,
  type Selection,
  type Source,
} from './interpreter.ts'

/** The relay's invitations, by id: on their stand, taken, or taken away (INV-1). */
export interface StandState {
  readonly invitations: ReadonlyMap<invitation_id, invitation>
}

/** A relay whose stands hold nothing yet. */
export const no_invitation: StandState = { invitations: new Map() }

/** How many invitations a stand holds, neither taken nor taken away. */
const on_the_stand = (state: StandState, the_stand: stand): number =>
  [...state.invitations.values()].filter(
    (each) => each.stand === the_stand && the_invitation_is_on_the_stand(each),
  ).length

export const stand_fragments: zz.PredicateFragments<
  zz.PredicatesIn<typeof invitations_predicate>,
  (state: StandState) => boolean
> = {
  'stand/invitations/predicate/an_invitation_has_this_id': (p) => (state) =>
    an_invitation_is_there(state.invitations.get(p.invitation_id)),
  'stand/invitations/predicate/the_stand_has_room': (p) => (state) =>
    there_is_room_with(on_the_stand(state, p.stand)),
  'stand/invitations/predicate/it_can_be_taken_until_then': (p) => () =>
    it_can_be_taken_until(p.now)(p.takeable_until),
  'stand/invitations/predicate/the_invitation_is_on_the_stand': (p) => (state) => {
    const the_invitation = state.invitations.get(p.invitation_id)
    return the_invitation?.stand === p.stand && the_invitation_is_on_the_stand(the_invitation)
  },
  'stand/invitations/predicate/the_invitation_is_still_on_its_stand': (p) => (state) =>
    the_invitation_is_on_the_stand(state.invitations.get(p.invitation_id)),
  'stand/invitations/predicate/the_invitation_has_been_taken': (p) => (state) =>
    the_invitation_has_been_taken(state.invitations.get(p.invitation_id)),
}

// The reads of the subject `stand/invitations/selection/invitation`: an invitation on the relay.

export const invitation_selection: zz.Algebra<
  zz.SelectionsIn<typeof invitation_selections>,
  Selection<StandState, invitation>
> = {
  ...selection_operators<StandState, invitation>(),
  predicate: {
    'stand/invitations/selection/invitation/the_invitation_is_on_this_stand':
      (p) => () => (the_invitation) =>
        the_invitation.stand === p.stand,
    'stand/invitations/selection/invitation/the_invitation_can_be_taken':
      () => () => (the_invitation) =>
        the_invitation_is_on_the_stand(the_invitation),
    'stand/invitations/selection/invitation/the_invitation_was_taken_by':
      (p) => () => (the_invitation) =>
        the_invitation.take_id === p.take_id,
  },
}

const the_invitations: Source<StandState, invitation> = (state) => [...state.invitations.values()]

export const invitation_sources: {
  readonly the_invitations_on_a_stand: zz.QuerySource<
    zz.FieldsOf<typeof the_query_of_a_stand>,
    Source<StandState, invitation>,
    Field<StandState, invitation>
  >
  readonly the_invitation_taken: zz.QuerySource<
    zz.FieldsOf<typeof the_query_of_a_take>,
    Source<StandState, invitation>,
    Field<StandState, invitation>
  >
} = {
  the_invitations_on_a_stand: {
    from: the_invitations,
    fields: {
      id: () => (the_invitation) => the_invitation.id,
      left_at: () => (the_invitation) => the_invitation.left_at,
      takeable_until: () => (the_invitation) => the_invitation.takeable_until,
    },
  },
  the_invitation_taken: {
    from: the_invitations,
    fields: {
      id: () => (the_invitation) => the_invitation.id,
      ticket: () => (the_invitation) => the_invitation.ticket,
      takeable_until: () => (the_invitation) => the_invitation.takeable_until,
    },
  },
}

export const stand_writes: zz.FactWrites<
  zz.FactsIn<typeof invitations_fact>,
  (state: StandState) => StandState
> = {
  'stand/invitations/fact/an_invitation_has_been_left':
    ({ new_invitation }) =>
    (state) => ({
      invitations: new Map(state.invitations).set(new_invitation.id, new_invitation),
    }),
  'stand/invitations/fact/an_invitation_has_been_taken':
    ({ taken_invitation }) =>
    (state) => {
      const the_invitation = state.invitations.get(taken_invitation.id)
      return the_invitation?.status !== 'on_the_stand'
        ? state
        : {
            invitations: new Map(state.invitations).set(taken_invitation.id, {
              id: the_invitation.id,
              stand: the_invitation.stand,
              ticket: the_invitation.ticket,
              left_at: the_invitation.left_at,
              takeable_until: the_invitation.takeable_until,
              status: taken_invitation.status,
              taken_at: taken_invitation.taken_at,
              take_id: taken_invitation.take_id,
            }),
          }
    },
  'stand/invitations/fact/an_invitation_has_been_taken_away':
    ({ invitation_taken_away }) =>
    (state) => {
      const the_invitation = state.invitations.get(invitation_taken_away.id)
      return the_invitation === undefined
        ? state
        : {
            invitations: new Map(state.invitations).set(invitation_taken_away.id, {
              id: the_invitation.id,
              stand: the_invitation.stand,
              left_at: the_invitation.left_at,
              takeable_until: the_invitation.takeable_until,
              status: invitation_taken_away.status,
              taken_away_at: invitation_taken_away.taken_away_at,
            }),
          }
    },
  'stand/invitations/fact/the_invitation_was_taken_before_its_time': () => (state) => state,
}

/** The command use cases of `invitations`, whose ports the oracle builds. */
export const stand_command_use_cases = {
  leave_an_invitation,
  take_an_invitation,
  take_away_an_invitation,
}

/** The oracle's state adapter for the commands of `invitations` (TST-2): fragments, writes, the execution. */
export const stand_command_adapter = (cell: CommandCell<StandState>) => ({
  algebra: algebra<StandState, typeof stand_fragments>(stand_fragments),
  write: stand_writes,
  execute: execute(cell),
  recorded: recorded(cell),
})

/**
 * The ports of `stand/invitations` over the oracle (TST-2): its commands,
 * and its reads, snapshots, which no leaf streams (INV-5).
 */
export const stand_ports =
  (cell: CommandCell<StandState> & ReadCell<StandState>) => (versions: zz.Versions) => ({
    ...zz.command_use_case_ports({
      registry,
      versions,
      use_cases: stand_command_use_cases,
    })(stand_command_adapter(cell)),
    ...zz.read_use_case_ports({
      registry,
      versions,
      use_cases: { the_invitations_on_a_stand, the_invitation_taken },
    })({
      algebra: { ...invitation_selection, after },
      sources: invitation_sources,
      read: read(cell),
      page: page(cell),
      streams: {},
    }),
  })
