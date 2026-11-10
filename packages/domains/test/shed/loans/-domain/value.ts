import { z } from 'zod'
import { date_time_string } from '../../wlib.ts'
import * as tools from '../../tools/index.ts'

export const loan_id = z.string().min(1).brand<'loan_id'>()

/** A member of the shed. Who may act as one is the persona's (step 6), not this domain's. */
export const member_id = z.string().min(1).brand<'member_id'>()

/** Grows with the specifications: `returned` (specification 3). */
export const loan_stage = z.enum(['ongoing'])

/** The tool is with the member. */
export const loan_ongoing = z.strictObject({
  stage: z.literal(loan_stage.enum.ongoing),
})

/** Where a loan is in its course: each stage has only its own fields. */
export const loan_progress = z.discriminatedUnion('stage', [loan_ongoing])

/**
 * A loan. The fields every stage shares stay flat; the stage is nested in
 * `progress`, a discriminated union of stages with only their own fields.
 */
export const loan = z.strictObject({
  id: loan_id,
  tool_id: tools.value.tool_id,
  member_id: member_id,
  start_date: date_time_string,
  due_date: date_time_string,
  progress: loan_progress,
})

/** A loan in its course: the tool is with the member. */
export const ongoing_loan = loan.extend({
  progress: loan_ongoing,
})
