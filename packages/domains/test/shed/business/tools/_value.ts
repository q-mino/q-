// generated

// The values of `business/tools` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * @see {@link value.tool_name}
 */
export const tool_name = value.tool_name
export type tool_name = z.output<typeof tool_name>

/**
 * @see {@link value.category}
 */
export const category = value.category
export type category = z.output<typeof category>

/**
 * @see {@link value.notes}
 */
export const notes = value.notes
export type notes = z.output<typeof notes>

/**
 * In service, lent and booked; under repair, neither, until it is back; retired, for good.
 *
 * @see {@link value.tool_status}
 */
export const tool_status = value.tool_status
export type tool_status = z.output<typeof tool_status>

/**
 * @see {@link value.retire_reason}
 */
export const retire_reason = value.retire_reason
export type retire_reason = z.output<typeof retire_reason>

/**
 * Why and when a tool left service.
 *
 * @see {@link value.retirement}
 */
export const retirement = value.retirement
export type retirement = z.output<typeof retirement>

/**
 * A stay in repair: which one, and since when. Why it went (a damaged
 * return, a tool found broken) is not the workshop's: the facts that sent
 * it there say it.
 *
 * @see {@link value.repair}
 */
export const repair = value.repair
export type repair = z.output<typeof repair>

/**
 * A tool that can be lent.
 *
 * @see {@link value.tool_in_service}
 */
export const tool_in_service = value.tool_in_service
export type tool_in_service = z.output<typeof tool_in_service>

/**
 * A tool in the workshop: it can be neither lent nor booked until it is back in service.
 *
 * @see {@link value.tool_under_repair}
 */
export const tool_under_repair = value.tool_under_repair
export type tool_under_repair = z.output<typeof tool_under_repair>

/**
 * A tool out of service; it stays in the catalogue, for the history of the loans.
 *
 * @see {@link value.retired_tool}
 */
export const retired_tool = value.retired_tool
export type retired_tool = z.output<typeof retired_tool>

/**
 * A tool of the catalogue: its states share every field, so any field reads without narrowing.
 *
 * @see {@link value.tool}
 */
export const tool = value.tool
export type tool = z.output<typeof tool>

/**
 * What a visitor sees of a tool in the catalogue.
 *
 * @see {@link value.catalogue_entry}
 */
export const catalogue_entry = value.catalogue_entry
export type catalogue_entry = z.output<typeof catalogue_entry>

/**
 * A tool as a line of a sheet writes it: its id, the label Luca will stick
 * on it, its name, category and notes; the rest the catalogue gives it when
 * it is added (SC-44).
 *
 * @see {@link value.tool_on_a_line}
 */
export const tool_on_a_line = value.tool_on_a_line
export type tool_on_a_line = z.output<typeof tool_on_a_line>

/**
 * A line of a sheet of tools: a part of the sheet (D94.1), its number on the
 * sheet, from 1, and the tool it writes. The desk goes down the lines in
 * their order, one tool a line.
 *
 * @see {@link value.sheet_line}
 */
export const sheet_line = value.sheet_line
export type sheet_line = z.output<typeof sheet_line>

/**
 * @see {@link value.loading_stage}
 */
export const loading_stage = value.loading_stage
export type loading_stage = z.output<typeof loading_stage>

/**
 * The desk goes down the sheet's lines, one at a time, by number (D109);
 * the cursor marks the last line handled, none before the first (D112.1).
 * The library's, opaque: the desk never writes it.
 *
 * @see {@link value.loading_under_way}
 */
export const loading_under_way = value.loading_under_way
export type loading_under_way = z.output<typeof loading_under_way>

/**
 * No line is left to go down: the sheet is loaded (D112.2).
 *
 * @see {@link value.loading_complete}
 */
export const loading_complete = value.loading_complete
export type loading_complete = z.output<typeof loading_complete>

/**
 * Where the loading of a sheet is in its course.
 *
 * @see {@link value.loading_progress}
 */
export const loading_progress = value.loading_progress
export type loading_progress = z.output<typeof loading_progress>

/**
 * A sheet of tools Luca hands to the desk to load into the catalogue, a
 * process with a cursor (DOM-20, DOM-23, D97, D112), whose state is its own
 * aggregate in `tools`, which owns the life cycle of the tools it adds: when
 * it was opened and how far the desk has gone. Its lines are its parts
 * (`sheet_line`), kept beside it by the sheet's id. By nesting, as the
 * desk's sheets in `loans`.
 *
 * @see {@link value.loading_sheet}
 */
export const loading_sheet = value.loading_sheet
export type loading_sheet = z.output<typeof loading_sheet>

/**
 * A sheet the desk is loading.
 *
 * @see {@link value.sheet_being_loaded}
 */
export const sheet_being_loaded = value.sheet_being_loaded
export type sheet_being_loaded = z.output<typeof sheet_being_loaded>

/**
 * A sheet the desk has gone down to its last line.
 *
 * @see {@link value.loaded_sheet}
 */
export const loaded_sheet = value.loaded_sheet
export type loaded_sheet = z.output<typeof loaded_sheet>
