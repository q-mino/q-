// The deposits of `mailbox/deposits` in the relay's storage (MBX-1..MBX-3,
// MBX-8): one row per deposit, its deposit fact's position beside it; a
// deposit discarded keeps its row without its envelope, until the relay
// forgets it, a day after its discard. The domain's predicates, its selections, its query's source and
// its facts' writes, each one translation into SQL (ADP-8), compared with
// the oracle's (`packages/memory/src/oracle/mailbox.ts`) by the relay's
// stories (TST-1).

import type * as zz from '@q-mino/domains/library'
import type * as deposits_fact from '@q-mino/domains/mailbox/deposits/_fact.ts'
import type * as deposits_predicate from '@q-mino/domains/mailbox/deposits/_predicate.ts'
import type * as deposit_selections from '@q-mino/domains/mailbox/deposits/_deposit_selection.ts'
import type { the_envelopes_in_a_mailbox } from '@q-mino/domains/mailbox/deposits/_query.ts'
import { sql, type Sql } from './sql.ts'

/** The table of the deposits kept, and the index a collect reads by. */
export const the_deposits_tables = `
  CREATE TABLE IF NOT EXISTS deposits (
    id TEXT PRIMARY KEY,
    deposit_address TEXT NOT NULL,
    deposited_at TEXT NOT NULL,
    envelope TEXT,
    discarded_at TEXT,
    deposit_position INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS deposits_of_a_mailbox ON deposits (deposit_address, deposited_at, id);
`

/** What a fact's write knows of its step: the position its fact was recorded at. */
export interface Recording {
  readonly position: zz.position
}

/** A fact's write: the SQL it runs in its step, in order. */
export type Write = (recording: Recording) => readonly Sql[]

/**
 * The predicates of `deposits`. A deposit the relay forgot (MBX-8) is not
 * there: it could be named only by its own operation, whose fact the log
 * forgot with it, so that its retry is a new deposit.
 */
export const deposit_fragments: zz.PredicateFragments<
  zz.PredicatesIn<typeof deposits_predicate>,
  Sql
> = {
  'mailbox/deposits/predicate/a_deposit_has_this_id': (p) =>
    sql('EXISTS (SELECT 1 FROM deposits WHERE id = ?)', p.deposit_id),
  'mailbox/deposits/predicate/the_envelope_is_kept': (p) =>
    sql('EXISTS (SELECT 1 FROM deposits WHERE id = ? AND discarded_at IS NULL)', p.deposit_id),
}

/** The selections of the subject `deposit`, over a row of `deposits`. */
export const deposit_selection_fragments: zz.PredicateFragments<
  zz.SelectionsIn<typeof deposit_selections>,
  Sql
> = {
  'mailbox/deposits/selection/deposit/the_envelope_is_on_this_address': (p) =>
    sql('deposit_address = ?', p.deposit_address),
  'mailbox/deposits/selection/deposit/the_envelope_is_kept': () => sql('discarded_at IS NULL'),
}

/** Where the query finds its candidates, and how each field reads from a row. */
export const deposit_sources: {
  readonly the_envelopes_in_a_mailbox: zz.QuerySource<
    zz.FieldsOf<typeof the_envelopes_in_a_mailbox>,
    Sql,
    Sql
  >
} = {
  the_envelopes_in_a_mailbox: {
    from: sql('deposits'),
    fields: { id: sql('id'), deposited_at: sql('deposited_at'), envelope: sql('envelope') },
  },
}

/**
 * The relay forgets every deposit discarded a day or more before an instant
 * (MBX-8): the instant of a fact, by the relay's clock, or its configurator's now.
 */
export const forgetting = (at: string): Sql =>
  sql(
    'DELETE FROM deposits WHERE discarded_at IS NOT NULL AND julianday(discarded_at) <= julianday(?) - 1',
    at,
  )

/**
 * How each fact of `deposits` reaches the table: a deposit is a row; a
 * discard takes its envelope away. Each forgets, by its own time, what was
 * discarded a day or more before it (MBX-8).
 */
export const deposit_writes: zz.FactWrites<zz.FactsIn<typeof deposits_fact>, Write> = {
  'mailbox/deposits/fact/an_envelope_has_been_deposited':
    ({ new_deposit }) =>
    (recording) => [
      sql(
        'INSERT INTO deposits (id, deposit_address, deposited_at, envelope, deposit_position) VALUES (?, ?, ?, ?, ?)',
        new_deposit.id,
        new_deposit.deposit_address,
        new_deposit.deposited_at,
        new_deposit.envelope,
        Number(recording.position),
      ),
      forgetting(new_deposit.deposited_at),
    ],
  'mailbox/deposits/fact/an_envelope_has_been_discarded':
    ({ discarded_deposit }) =>
    () => [
      sql(
        'UPDATE deposits SET envelope = NULL, discarded_at = ? WHERE id = ?',
        discarded_deposit.discarded_at,
        discarded_deposit.id,
      ),
      forgetting(discarded_deposit.discarded_at),
    ],
}

/**
 * The first position the log must keep (MBX-8): the deposit fact of the
 * oldest deposit not forgotten, whose operation the duplicate branch may
 * meet again (DOM-11); with none, the last fact, so that a reader waiting
 * after it still meets it. Everything before is of deposits forgotten.
 */
export const the_first_position_kept = sql(
  "SELECT MIN(COALESCE((SELECT MIN(deposit_position) FROM deposits), seq), seq) AS kept_from FROM sqlite_sequence WHERE name = 'facts'",
)
