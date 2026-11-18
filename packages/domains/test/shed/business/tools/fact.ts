import { z } from 'zod'
import * as wlib from '../../wlib.ts'
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

/**
 * The keeper gave the tool another name (SC-19): a partial value, its id and
 * its new name. Whoever shows the tool by name reads the new one: the
 * catalogue, and the rows of the members' loans and reservations, whose
 * view of the tools `loans` reads from the catalogue (GR-3).
 */
export const a_tool_has_been_renamed = fact({
  payload: z.strictObject({
    renamed_tool: z.strictObject({ id: id.tool_id, name: value.tool_name }),
  }),
})

/**
 * The desk has begun loading a sheet of tools (D97, D112, SC-44): the whole
 * new sheet and its lines, as Luca handed them over. Its steps add one tool
 * a line.
 */
export const the_loading_of_a_sheet_has_begun = fact({
  payload: z.strictObject({
    new_sheet: value.sheet_being_loaded,
    lines: z.array(value.sheet_line).min(1),
  }),
})

/**
 * The desk has gone one line further on the sheet: the step's part (DOM-20),
 * beside the line's own, the tool added or the line left. The cursor is the
 * library's, which writes it.
 */
export const the_loading_of_the_sheet_has_advanced = fact({
  payload: z.strictObject({
    sheet_id: id.sheet_id,
    cursor: wlib.cursor,
  }),
})

/**
 * Nothing to add (D95): the id the line gives its tool is in the catalogue
 * already, a tool of the shed or one an earlier line of the sheet added. The
 * line is left, and the catalogue does not change: line 37 names `drill-7`,
 * the label of the shed's own drill.
 */
export const the_tool_of_the_line_was_already_in_the_catalogue = fact({
  payload: z.strictObject({
    sheet_id: id.sheet_id,
    line_id: id.line_id,
    number: value.sheet_line.shape.number,
    tool_id: id.tool_id,
  }),
})

/** No line of the sheet is left to go down: the desk closes it (D112.2). */
export const the_sheet_has_been_loaded = fact({
  payload: z.strictObject({
    loaded_sheet: value.loaded_sheet.pick({ id: true, progress: true }),
  }),
})
