import { z } from 'zod'
import { command_use_case_over, value, tools } from './_scope_usecase.ts'

// The use cases of `workshop`, the leaves of its tree (PER-6, D88.1): what
// Rossi's system may ask of the shed, in its own words, and nothing else
// (D24: what is not here, it cannot reach). An integration waits for the
// outcome, never for the facts that follow (D74).

/**
 * Rossi's system closes a job (SC-34): the drill is back on the shelf, and
 * the job names the shed's tool and the stay in repair, from the ticket Luca
 * handed over with it. Its notification is the operation (D91.2): sent again
 * when the shed does not answer, the same, it is the duplicate branch and
 * one fact; the same id with another job is `identity_already_used`.
 */
export const close_a_job = command_use_case_over({
  use_case: tools.usecase.close_a_repair,
  input: z.strictObject({
    notification_id: value.notification_id,
    job: z.strictObject({ tool: tools.id.tool_id, reference: tools.id.repair_id }),
  }),
  operation: { identity: 'notification_id' },
  creator: () => (input) => ({ tool_id: input.job.tool, repair_id: input.job.reference }),
  events: {
    the_job_is_closed: z.strictObject({ tool: tools.id.tool_id }),
    /** No such tool, or not in that stay: the system knows which job it closed. */
    there_is_no_such_open_job: z.strictObject({}),
  },
  projection: {
    the_tool_is_under_this_repair_so_it_is_back_in_service: (fact) => ({
      event: 'the_job_is_closed',
      payload: { tool: fact.repaired_tool.id },
    }),
    rejected: () => ({ event: 'there_is_no_such_open_job', payload: {} }),
  },
})
