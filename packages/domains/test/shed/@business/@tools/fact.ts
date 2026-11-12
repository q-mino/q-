import { z } from 'zod'
import { tool_id } from './_id.ts'
import { retired_tool, tool } from './_value.ts'
import * as wlib from '../../wlib.ts'

/**
 * Carries the change of state (DOM-5, V9): every value it writes. The
 * adapters of the domain materialize it.
 */
export const a_tool_has_been_added = wlib.fact({
  payload: z.strictObject({
    added_tool: tool,
  }),
})

/**
 * A partial value: the tool's id and the fields the retirement changes. Name,
 * category and add date stay as they were.
 */
export const a_tool_has_been_retired = wlib.fact({
  payload: z.strictObject({
    retired_tool: retired_tool.pick({ id: true, status: true, retirement: true }),
  }),
})

/** Nothing to do (DOM-6): the first retirement stands, the state does not change. */
export const the_tool_was_already_retired = wlib.fact({
  payload: z.strictObject({
    tool_id: tool_id,
  }),
})
