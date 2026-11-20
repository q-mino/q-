// The module of `mailbox` in q-'s oracle (TST-2): the state of
// `mailbox/deposits`, its predicates and selections as functions of that
// state, its sources and its writes, the meaning from the domain's `dsl`
// (DOM-5); and the domain's command and read ports over a cell (MBX-1..MBX-3).

import * as zz from '@q-mino/domains/library'
import { registry } from '@q-mino/domains/mailbox/deposits/_registry.ts'
import type * as deposits_fact from '@q-mino/domains/mailbox/deposits/_fact.ts'
import type * as deposits_predicate from '@q-mino/domains/mailbox/deposits/_predicate.ts'
import type * as deposit_selections from '@q-mino/domains/mailbox/deposits/_deposit_selection.ts'
import type { deposit_id } from '@q-mino/domains/mailbox/deposits/_id.ts'
import type { deposit } from '@q-mino/domains/mailbox/deposits/_value.ts'
import type { the_envelopes_in_a_mailbox as the_query } from '@q-mino/domains/mailbox/deposits/_query.ts'
import { a_deposit_is_there, the_envelope_is_kept } from '@q-mino/domains/mailbox/deposits/_dsl.ts'
import {
  deposit_an_envelope,
  discard_an_envelope,
  the_envelopes_in_a_mailbox,
} from '@q-mino/domains/mailbox/deposits/_usecase.ts'
import type { CommandCell, ReadCell } from './cell.ts'
import {
  after,
  algebra,
  composed,
  execute,
  native,
  page,
  read,
  recorded,
  selection_operators,
  type Field,
  type Selection,
  type Source,
  type Strategy,
} from './interpreter.ts'

/** The relay's deposits, by id: kept, or discarded and their envelope gone (MBX-2). */
export interface MailboxState {
  readonly deposits: ReadonlyMap<deposit_id, deposit>
}

/** A relay that has kept nothing yet. */
export const no_deposit: MailboxState = { deposits: new Map() }

export const mailbox_fragments: zz.PredicateFragments<
  zz.PredicatesIn<typeof deposits_predicate>,
  (state: MailboxState) => boolean
> = {
  'mailbox/deposits/predicate/a_deposit_has_this_id': (p) => (state) =>
    a_deposit_is_there(state.deposits.get(p.deposit_id)),
  'mailbox/deposits/predicate/the_envelope_is_kept': (p) => (state) =>
    the_envelope_is_kept(state.deposits.get(p.deposit_id)),
}

// The reads of the subject `mailbox/deposits/selection/deposit`: a deposit on the relay.

export const deposit_selection: zz.Algebra<
  zz.SelectionsIn<typeof deposit_selections>,
  Selection<MailboxState, deposit>
> = {
  ...selection_operators<MailboxState, deposit>(),
  predicate: {
    'mailbox/deposits/selection/deposit/the_envelope_is_on_this_address':
      (p) => () => (the_deposit) =>
        the_deposit.deposit_address === p.deposit_address,
    'mailbox/deposits/selection/deposit/the_envelope_is_kept': () => () => (the_deposit) =>
      the_envelope_is_kept(the_deposit),
  },
}

const the_deposits: Source<MailboxState, deposit> = (state) => [...state.deposits.values()]

export const deposit_sources: {
  readonly the_envelopes_in_a_mailbox: zz.QuerySource<
    zz.FieldsOf<typeof the_query>,
    Source<MailboxState, deposit>,
    Field<MailboxState, deposit>
  >
} = {
  the_envelopes_in_a_mailbox: {
    from: the_deposits,
    fields: {
      id: () => (the_deposit) => the_deposit.id,
      deposited_at: () => (the_deposit) => the_deposit.deposited_at,
      envelope: () => (the_deposit) => the_deposit.envelope,
    },
  },
}

export const mailbox_writes: zz.FactWrites<
  zz.FactsIn<typeof deposits_fact>,
  (state: MailboxState) => MailboxState
> = {
  'mailbox/deposits/fact/an_envelope_has_been_deposited':
    ({ new_deposit }) =>
    (state) => ({ deposits: new Map(state.deposits).set(new_deposit.id, new_deposit) }),
  'mailbox/deposits/fact/an_envelope_has_been_discarded':
    ({ discarded_deposit }) =>
    (state) => {
      const the_deposit = state.deposits.get(discarded_deposit.id)
      return the_deposit === undefined
        ? state
        : {
            deposits: new Map(state.deposits).set(discarded_deposit.id, {
              id: the_deposit.id,
              deposit_address: the_deposit.deposit_address,
              deposited_at: the_deposit.deposited_at,
              status: discarded_deposit.status,
              discarded_at: discarded_deposit.discarded_at,
            }),
          }
    },
}

/** The command use cases of `deposits`, whose ports the oracle builds. */
export const mailbox_command_use_cases = { deposit_an_envelope, discard_an_envelope }

/** The oracle's state adapter for the commands of `deposits` (TST-2): fragments, writes, the execution. */
export const mailbox_command_adapter = (cell: CommandCell<MailboxState>) => ({
  algebra: algebra<MailboxState, typeof mailbox_fragments>(mailbox_fragments),
  write: mailbox_writes,
  execute: execute(cell),
  recorded: recorded(cell),
})

/**
 * The ports of `mailbox/deposits` over the oracle (TST-2): its commands, and
 * its read, streamed natively, the reference, or composed by the library
 * over the cell's log (DOM-2, D69.3).
 */
export const mailbox_ports =
  (cell: CommandCell<MailboxState> & ReadCell<MailboxState>, by: Strategy = 'native') =>
  (versions: zz.Versions) => ({
    ...zz.command_use_case_ports({
      registry,
      versions,
      use_cases: mailbox_command_use_cases,
    })(mailbox_command_adapter(cell)),
    ...zz.read_use_case_ports({
      registry,
      versions,
      use_cases: { the_envelopes_in_a_mailbox },
    })({
      algebra: { ...deposit_selection, after },
      sources: deposit_sources,
      read: read(cell),
      page: page(cell),
      streams: {
        the_envelopes_in_a_mailbox: by === 'native' ? native(cell)(registry) : composed(cell),
      },
    }),
  })
