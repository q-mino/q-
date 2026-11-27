// The invitations of `stand/invitations` in the relay's storage (INV-1..INV-4,
// INV-8, MBX-8): one row per invitation, its leave fact's position beside
// it; a taken one keeps its ticket for who took it, one taken away loses
// it; every one is forgotten a day after its time to be taken is over. The
// domain's predicates, its selections, its queries' sources and its facts'
// writes, each one translation into SQL (ADP-8), compared with the oracle's
// (`packages/memory/src/oracle/stand.ts`) by the stand's stories (TST-1).

import type * as zz from '@q-mino/domains/library'
import type * as invitations_fact from '@q-mino/domains/stand/invitations/_fact.ts'
import type * as invitations_predicate from '@q-mino/domains/stand/invitations/_predicate.ts'
import type * as invitation_selections from '@q-mino/domains/stand/invitations/_invitation_selection.ts'
import type {
  the_invitation_taken,
  the_invitations_on_a_stand,
} from '@q-mino/domains/stand/invitations/_query.ts'
import {
  it_can_be_taken_until,
  the_room_on_a_stand,
} from '@q-mino/domains/stand/invitations/_dsl.ts'
import type { Write } from './deposits.ts'
import { sql, type Sql } from './sql.ts'

/** The table of the invitations, and the index a stand is read by. */
export const the_invitations_tables = `
  CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,
    stand TEXT NOT NULL,
    ticket TEXT,
    left_at TEXT NOT NULL,
    takeable_until TEXT NOT NULL,
    status TEXT NOT NULL,
    taken_at TEXT,
    take_id TEXT,
    taken_away_at TEXT,
    left_position INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS invitations_on_a_stand ON invitations (stand, status, left_at, id);
  CREATE INDEX IF NOT EXISTS invitations_by_take ON invitations (take_id);
`

/**
 * The predicates of `invitations`. An invitation the relay forgot (INV-8) is
 * not there: it could be named only by its own operation, whose fact the log
 * forgot with it. Whether it can be taken until then is the domain's `dsl`
 * over the parameters alone, a constant of SQL.
 */
export const invitation_fragments: zz.PredicateFragments<
  zz.PredicatesIn<typeof invitations_predicate>,
  Sql
> = {
  'stand/invitations/predicate/an_invitation_has_this_id': (p) =>
    sql('EXISTS (SELECT 1 FROM invitations WHERE id = ?)', p.invitation_id),
  'stand/invitations/predicate/the_stand_has_room': (p) =>
    sql(
      "(SELECT COUNT(*) FROM invitations WHERE stand = ? AND status = 'on_the_stand') < ?",
      p.stand,
      the_room_on_a_stand,
    ),
  'stand/invitations/predicate/it_can_be_taken_until_then': (p) =>
    sql(it_can_be_taken_until(p.now)(p.takeable_until) ? 'TRUE' : 'FALSE'),
  'stand/invitations/predicate/the_invitation_is_on_the_stand': (p) =>
    sql(
      "EXISTS (SELECT 1 FROM invitations WHERE id = ? AND stand = ? AND status = 'on_the_stand')",
      p.invitation_id,
      p.stand,
    ),
  'stand/invitations/predicate/the_invitation_is_still_on_its_stand': (p) =>
    sql(
      "EXISTS (SELECT 1 FROM invitations WHERE id = ? AND status = 'on_the_stand')",
      p.invitation_id,
    ),
  'stand/invitations/predicate/the_invitation_has_been_taken': (p) =>
    sql("EXISTS (SELECT 1 FROM invitations WHERE id = ? AND status = 'taken')", p.invitation_id),
}

/** The selections of the subject `invitation`, over a row of `invitations`. */
export const invitation_selection_fragments: zz.PredicateFragments<
  zz.SelectionsIn<typeof invitation_selections>,
  Sql
> = {
  'stand/invitations/selection/invitation/the_invitation_is_on_this_stand': (p) =>
    sql('stand = ?', p.stand),
  'stand/invitations/selection/invitation/the_invitation_can_be_taken': () =>
    sql("status = 'on_the_stand'"),
  'stand/invitations/selection/invitation/the_invitation_was_taken_by': (p) =>
    sql('take_id = ?', p.take_id),
}

/** Where the queries find their candidates, and how each field reads from a row. */
export const invitation_sources: {
  readonly the_invitations_on_a_stand: zz.QuerySource<
    zz.FieldsOf<typeof the_invitations_on_a_stand>,
    Sql,
    Sql
  >
  readonly the_invitation_taken: zz.QuerySource<zz.FieldsOf<typeof the_invitation_taken>, Sql, Sql>
} = {
  the_invitations_on_a_stand: {
    from: sql('invitations'),
    fields: { id: sql('id'), left_at: sql('left_at'), takeable_until: sql('takeable_until') },
  },
  the_invitation_taken: {
    from: sql('invitations'),
    fields: { id: sql('id'), ticket: sql('ticket'), takeable_until: sql('takeable_until') },
  },
}

/**
 * The relay forgets every invitation whose time to be taken was over a day
 * or more before an instant (INV-8): taken, or taken away; one still on its
 * stand waits for its wait's return. The instant of a fact, by the relay's
 * clock, or its configurator's now.
 */
export const forgetting_the_invitations = (at: string): Sql =>
  sql(
    "DELETE FROM invitations WHERE status <> 'on_the_stand' AND julianday(takeable_until) <= julianday(?) - 1",
    at,
  )

/**
 * How each fact of `invitations` reaches the table: a leave is a row; a take
 * marks it taken by its take; a take-away takes its ticket away. Each
 * forgets, by its own time, the invitations over a day or more before it.
 */
export const invitation_writes: zz.FactWrites<zz.FactsIn<typeof invitations_fact>, Write> = {
  'stand/invitations/fact/an_invitation_has_been_left':
    ({ new_invitation }) =>
    (recording) => [
      sql(
        'INSERT INTO invitations (id, stand, ticket, left_at, takeable_until, status, left_position) VALUES (?, ?, ?, ?, ?, ?, ?)',
        new_invitation.id,
        new_invitation.stand,
        new_invitation.ticket,
        new_invitation.left_at,
        new_invitation.takeable_until,
        new_invitation.status,
        Number(recording.position),
      ),
      forgetting_the_invitations(new_invitation.left_at),
    ],
  'stand/invitations/fact/an_invitation_has_been_taken':
    ({ taken_invitation }) =>
    () => [
      sql(
        'UPDATE invitations SET status = ?, taken_at = ?, take_id = ? WHERE id = ?',
        taken_invitation.status,
        taken_invitation.taken_at,
        taken_invitation.take_id,
        taken_invitation.id,
      ),
    ],
  'stand/invitations/fact/an_invitation_has_been_taken_away':
    ({ invitation_taken_away }) =>
    () => [
      sql(
        'UPDATE invitations SET status = ?, ticket = NULL, taken_away_at = ? WHERE id = ?',
        invitation_taken_away.status,
        invitation_taken_away.taken_away_at,
        invitation_taken_away.id,
      ),
      forgetting_the_invitations(invitation_taken_away.taken_away_at),
    ],
  'stand/invitations/fact/the_invitation_was_taken_before_its_time': () => () => [],
}
