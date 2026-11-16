import { z } from 'zod'
import { fact, id, value } from './_scope_fact.ts'

/**
 * Carries the change of state (DOM-5, V9): every value it writes. The
 * adapters of the domain materialize it.
 */
export const a_tool_has_been_added = fact({
  payload: z.strictObject({
    added_tool: value.tool,
  }),
})

/**
 * A partial value: the tool's id and the fields the retirement changes. Name,
 * category and add date stay as they were.
 */
export const a_tool_has_been_retired = fact({
  payload: z.strictObject({
    retired_tool: value.retired_tool.pick({ id: true, status: true, retirement: true }),
  }),
})

/** Nothing to do (DOM-6): the first retirement stands, the state does not change. */
export const the_tool_was_already_retired = fact({
  payload: z.strictObject({
    tool_id: id.tool_id,
  }),
})

/**
 * The tool went to the workshop: a partial value, its id, its new status and
 * the stay in repair, whose id `tools` chose from the operation (D75.8). The
 * drill Marta returned damaged, or one Luca found broken on the shelf.
 */
export const a_tool_has_been_sent_to_repair = fact({
  payload: z.strictObject({
    tool_under_repair: value.tool_under_repair.pick({ id: true, status: true, repair: true }),
  }),
})

/** Nothing to do (DOM-6, D93): the tool is in the workshop already, its stay in repair stands. */
export const the_tool_was_already_under_repair = fact({
  payload: z.strictObject({
    tool_id: id.tool_id,
  }),
})

/** Nothing to do (DOM-6, D93): the tool was retired before it could go to the workshop. */
export const the_tool_was_retired_before_the_repair = fact({
  payload: z.strictObject({
    tool_id: id.tool_id,
  }),
})

/** The tool is back from the workshop, in service: its id and status; the stay in repair is over. */
export const a_tool_has_been_repaired = fact({
  payload: z.strictObject({
    repaired_tool: value.tool_in_service.pick({ id: true, status: true }),
  }),
})
