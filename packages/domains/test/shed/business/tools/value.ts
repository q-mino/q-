import { z } from 'zod'
import { cursor, date_time } from '../../wlib.ts'
import { id } from './_scope_value.ts'

export const tool_name = z.string().min(1).max(80)

export const category = z.enum(['garden', 'power', 'hand', 'ladder'])

export const notes = z.string().max(500)

/** In service, lent and booked; under repair, neither, until it is back; retired, for good. */
export const tool_status = z.enum(['inService', 'underRepair', 'retired'])

export const retire_reason = z.enum(['broken', 'lost', 'worn_out', 'given_away'])

/** Why and when a tool left service. */
export const retirement = z.strictObject({
  date: date_time,
  reason: retire_reason,
  notes: notes.optional(),
})

/**
 * A stay in repair: which one, and since when. Why it went (a damaged
 * return, a tool found broken) is not the workshop's: the facts that sent
 * it there say it.
 */
export const repair = z.strictObject({
  id: id.repair_id,
  since: date_time,
})

/** A field a state does not have: in the type, `?: undefined`; in the data, absent. */
const absent = z.undefined().optional()

/** Every field of every state of a tool. Not a state: each state subtracts from it. */
const every_tool_field = z.strictObject({
  id: id.tool_id,
  name: tool_name,
  category: category,
  notes: notes.optional(),
  addDate: date_time,
  status: tool_status,
  repair: repair,
  retirement: retirement,
})

/** A tool that can be lent. */
export const tool_in_service = every_tool_field.extend({
  status: z.literal(tool_status.enum.inService),
  repair: absent,
  retirement: absent,
})

/** A tool in the workshop: it can be neither lent nor booked until it is back in service. */
export const tool_under_repair = every_tool_field.extend({
  status: z.literal(tool_status.enum.underRepair),
  retirement: absent,
})

/** A tool out of service; it stays in the catalogue, for the history of the loans. */
export const retired_tool = every_tool_field.extend({
  status: z.literal(tool_status.enum.retired),
  repair: absent,
})

/** A tool of the catalogue: its states share every field, so any field reads without narrowing. */
export const tool = z.discriminatedUnion('status', [
  tool_in_service,
  tool_under_repair,
  retired_tool,
])

/** What a visitor sees of a tool in the catalogue. */
export const catalogue_entry = tool_in_service.pick({
  id: true,
  name: true,
  category: true,
  notes: true,
})

/**
 * A tool as a line of a sheet writes it: its id, the label Luca will stick
 * on it, its name, category and notes; the rest the catalogue gives it when
 * it is added (SC-44).
 */
export const tool_on_a_line = tool_in_service.pick({
  id: true,
  name: true,
  category: true,
  notes: true,
})

/**
 * A line of a sheet of tools: a part of the sheet (D94.1), its number on the
 * sheet, from 1, and the tool it writes. The desk goes down the lines in
 * their order, one tool a line.
 */
export const sheet_line = z.strictObject({
  id: id.line_id,
  sheet_id: id.sheet_id,
  number: z.number().int().min(1),
  tool: tool_on_a_line,
})

export const loading_stage = z.enum(['loading', 'complete'])

/**
 * The desk goes down the sheet's lines, one at a time, by number (D109);
 * the cursor marks the last line handled, none before the first (D112.1).
 * The library's, opaque: the desk never writes it.
 */
export const loading_under_way = z.strictObject({
  stage: z.literal(loading_stage.enum.loading),
  cursor: cursor.optional(),
})

/** No line is left to go down: the sheet is loaded (D112.2). */
export const loading_complete = z.strictObject({
  stage: z.literal(loading_stage.enum.complete),
  end_date: date_time,
})

/** Where the loading of a sheet is in its course. */
export const loading_progress = z.discriminatedUnion('stage', [loading_under_way, loading_complete])

/**
 * A sheet of tools Luca hands to the desk to load into the catalogue, a
 * process with a cursor (DOM-20, DOM-23, D97, D112), whose state is its own
 * aggregate in `tools`, which owns the life cycle of the tools it adds: when
 * it was opened and how far the desk has gone. Its lines are its parts
 * (`sheet_line`), kept beside it by the sheet's id. By nesting, as the
 * desk's sheets in `loans`.
 */
export const loading_sheet = z.strictObject({
  id: id.sheet_id,
  start_date: date_time,
  progress: loading_progress,
})

/** A sheet the desk is loading. */
export const sheet_being_loaded = loading_sheet.extend({
  progress: loading_under_way,
})

/** A sheet the desk has gone down to its last line. */
export const loaded_sheet = loading_sheet.extend({
  progress: loading_complete,
})
