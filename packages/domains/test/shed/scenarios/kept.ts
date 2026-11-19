import * as zz from '../../../src/library/index.ts'
import { drill } from './shed.ts'

// What the shed's store kept before `loans` 2.0.0 (4 November 2026), as it
// was stored (DOM-22, Shed's step 10): the drill added at `tools` 1.0.0, and
// Marta's loan of the drill at `loans` 1.x, due at an instant (`due_date`),
// with the two waits queued with it. The log is never rewritten: a release
// reads them through its versions (SC-8), and stops at its start if no major
// reads them (SC-9).

/** The version `loans` wrote at before 2.0.0: the last minor of 1.x. */
const loans_1 = '1.4.0'

/** The drill, as Luca added it on Sunday 1 November at `tools` 1.0.0. */
export const the_drill_added: zz.StoredEnvelope = {
  parts: [
    {
      path: 'business/tools/fact/a_tool_has_been_added',
      version: '1.0.0',
      payload: {
        added_tool: {
          id: drill.id,
          name: drill.name,
          category: drill.category,
          status: 'inService',
          addDate: '2026-11-01T09:00:00-05:00',
        },
      },
      resources: [{ path: 'business/tools/id/tool_id', value: drill.id }],
    },
  ],
  operation: { id: zz.operation_id.parse('T1'), scope: 'keeper/luca' },
  correlation: zz.correlation.parse('correlation-T1'),
  branch: 'the_tool_is_new_so_it_is_added',
  composed: {},
  fingerprint: zz.fingerprint_of({ path: 'business/tools/usecase/add_a_tool', input: drill }),
}

/** What Marta's phone sent to borrow the drill, under the operation L1: her retry sends it again. */
export const marta_borrows_the_drill = { loan_id: 'L1', tool_id: drill.id, member_id: 'M-12' }

/** The operation of Marta's request, and its scope (DOM-11). */
export const marta_s_operation = { operation: 'L1', scope: 'member/M-12' }

/** The resources of the loan's part, every identity of its payload (DOM-10). */
const the_loan_s_resources: readonly zz.Resource[] = [
  { path: 'business/loans/id/loan_id', value: 'L1' },
  { path: 'business/tools/id/tool_id', value: drill.id },
  { path: 'business/loans/id/member_id', value: 'M-12' },
]

/**
 * Marta's loan of the drill at `loans` 1.x, lent at an instant and due 14
 * days after it, at the same hour (`due_date`), as 1.x wrote it.
 */
export const marta_s_loan_at_1 = (loan: {
  readonly lent: string
  readonly due: string
}): zz.StoredEnvelope => ({
  parts: [
    {
      path: 'business/loans/fact/a_tool_has_been_lent',
      version: loans_1,
      payload: {
        new_loan: {
          id: 'L1',
          tool_id: drill.id,
          member_id: 'M-12',
          start_date: loan.lent,
          due_date: loan.due,
          progress: { stage: 'ongoing', term: 'running' },
        },
      },
      resources: the_loan_s_resources,
    },
  ],
  operation: {
    id: zz.operation_id.parse(marta_s_operation.operation),
    scope: marta_s_operation.scope,
  },
  correlation: zz.correlation.parse('correlation-L1'),
  branch: 'the_tool_is_available_so_it_is_lent',
  composed: {},
  fingerprint: zz.fingerprint_of({
    path: 'business/loans/usecase/borrow_a_tool',
    input: marta_borrows_the_drill,
  }),
})

/**
 * The waits queued at 1.x with Marta's loan: the eve's, at the instant a
 * day before the due date, its payload with the due date (a shape 2.0.0
 * changed, `earlier`); the overdue wait, at the due date, its payload the
 * loan alone (delegated).
 */
export const marta_s_waits_at_1 = (loan: {
  readonly eve: string
  readonly due: string
}): readonly zz.StoredEntry[] => [
  {
    effect: 'business/loans/effect/wait_until_the_eve_of_the_due_date',
    id: zz.entry_id.parse('L1'),
    version: loans_1,
    payload: { loan_id: 'L1', tool_id: drill.id, member_id: 'M-12', due_date: loan.due },
    not_before: zz.date_time.parse(loan.eve),
    resources: the_loan_s_resources,
    correlation: zz.correlation.parse('correlation-L1'),
  },
  {
    effect: 'business/loans/effect/wait_until_the_due_date',
    id: zz.entry_id.parse('L1'),
    version: loans_1,
    payload: { loan_id: 'L1' },
    not_before: zz.date_time.parse(loan.due),
    resources: the_loan_s_resources,
    correlation: zz.correlation.parse('correlation-L1'),
  },
]

/** Marta's loan of Monday 2 November at 10:12, due on the 16th at 10:12 (Shed's step 10). */
export const kept_before_2_0_0 = {
  facts: [
    the_drill_added,
    marta_s_loan_at_1({ lent: '2026-11-02T10:12:00-05:00', due: '2026-11-16T10:12:00-05:00' }),
  ],
  entries: marta_s_waits_at_1({
    eve: '2026-11-15T10:12:00-05:00',
    due: '2026-11-16T10:12:00-05:00',
  }),
}
