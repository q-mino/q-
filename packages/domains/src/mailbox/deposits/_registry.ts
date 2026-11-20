// generated

// The path registry of `mailbox/deposits` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity.

import type * as zz from '../../library/index.ts'
import * as id from './_id.ts'
import * as value from './_value.ts'
import * as fact from './_fact.ts'
import * as predicate from './_predicate.ts'
import * as effect from './_effect.ts'
import * as deposit_selection from './_deposit_selection.ts'
import * as command from './_command.ts'
import * as query from './_query.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'mailbox/deposits/id/deposit_address': id.deposit_address,
  'mailbox/deposits/id/deposit_id': id.deposit_id,
  'mailbox/deposits/value/envelope': value.envelope,
  'mailbox/deposits/value/deposit_status': value.deposit_status,
  'mailbox/deposits/value/kept_deposit': value.kept_deposit,
  'mailbox/deposits/value/discarded_deposit': value.discarded_deposit,
  'mailbox/deposits/value/deposit': value.deposit,
  'mailbox/deposits/value/collected_envelope': value.collected_envelope,
  'mailbox/deposits/fact/an_envelope_has_been_deposited': fact.an_envelope_has_been_deposited,
  'mailbox/deposits/fact/an_envelope_has_been_discarded': fact.an_envelope_has_been_discarded,
  'mailbox/deposits/predicate/a_deposit_has_this_id': predicate.a_deposit_has_this_id,
  'mailbox/deposits/predicate/the_envelope_is_kept': predicate.the_envelope_is_kept,
  'mailbox/deposits/effect/wait_seven_days_from_the_deposit':
    effect.wait_seven_days_from_the_deposit,
  'mailbox/deposits/selection/deposit/the_envelope_is_on_this_address':
    deposit_selection.the_envelope_is_on_this_address,
  'mailbox/deposits/selection/deposit/the_envelope_is_kept': deposit_selection.the_envelope_is_kept,
  'mailbox/deposits/command/the_deposit_is_new': command.the_deposit_is_new,
  'mailbox/deposits/command/deposit_an_envelope': command.deposit_an_envelope,
  'mailbox/deposits/command/deposit_an_envelope_input': command.deposit_an_envelope_input,
  'mailbox/deposits/command/discard_an_envelope': command.discard_an_envelope,
  'mailbox/deposits/command/discard_an_envelope_input': command.discard_an_envelope_input,
  'mailbox/deposits/query/the_envelope_is_waiting_in_the_mailbox':
    query.the_envelope_is_waiting_in_the_mailbox,
  'mailbox/deposits/query/the_envelopes_in_a_mailbox': query.the_envelopes_in_a_mailbox,
  'mailbox/deposits/query/the_envelopes_in_a_mailbox_input': query.the_envelopes_in_a_mailbox_input,
  'mailbox/deposits/usecase/deposit_an_envelope': usecase.deposit_an_envelope,
  'mailbox/deposits/usecase/discard_an_envelope': usecase.discard_an_envelope,
  'mailbox/deposits/usecase/the_envelopes_in_a_mailbox': usecase.the_envelopes_in_a_mailbox,
  'mailbox/deposits/version/deposits': version.deposits,
} satisfies zz.Registry
