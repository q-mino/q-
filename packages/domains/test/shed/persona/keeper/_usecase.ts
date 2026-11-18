// generated

// The use cases of `keeper` under their names (DOM-2), the leaves of its tree.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * The keeper retires a tool: the ladder is broken.
 *
 * @see {@link usecase.retire_a_tool}
 */
export const retire_a_tool = usecase.retire_a_tool

/**
 * The input of `retire_a_tool`, declared inline.
 *
 * @see {@link usecase.retire_a_tool}
 */
export const retire_a_tool_input = usecase.retire_a_tool.input
export type retire_a_tool_input = z.output<typeof retire_a_tool_input>

/**
 * The keeper sends a tool to the workshop: the drill is broken on the shelf.
 *
 * @see {@link usecase.send_a_tool_to_repair}
 */
export const send_a_tool_to_repair = usecase.send_a_tool_to_repair

/**
 * The input of `send_a_tool_to_repair`, declared inline.
 *
 * @see {@link usecase.send_a_tool_to_repair}
 */
export const send_a_tool_to_repair_input = usecase.send_a_tool_to_repair.input
export type send_a_tool_to_repair_input = z.output<typeof send_a_tool_to_repair_input>

/**
 * The keeper puts the repaired drill back on the shelf.
 *
 * @see {@link usecase.put_a_repaired_tool_back_in_service}
 */
export const put_a_repaired_tool_back_in_service = usecase.put_a_repaired_tool_back_in_service

/**
 * The input of `put_a_repaired_tool_back_in_service`, declared inline.
 *
 * @see {@link usecase.put_a_repaired_tool_back_in_service}
 */
export const put_a_repaired_tool_back_in_service_input =
  usecase.put_a_repaired_tool_back_in_service.input
export type put_a_repaired_tool_back_in_service_input = z.output<
  typeof put_a_repaired_tool_back_in_service_input
>

/**
 * Luca reads how many times each tool of the shed went out this month, the
 * idle ones at zero, once (SC-21): the snapshot alone, as the visitor's
 * catalogue.
 *
 * @see {@link usecase.the_loans_of_the_month}
 */
export const the_loans_of_the_month = usecase.the_loans_of_the_month

/**
 * The input of `the_loans_of_the_month`, declared inline.
 *
 * @see {@link usecase.the_loans_of_the_month}
 */
export const the_loans_of_the_month_input = usecase.the_loans_of_the_month.input
export type the_loans_of_the_month_input = z.output<typeof the_loans_of_the_month_input>

/**
 * Luca loads a sheet of tools into the catalogue (SC-44): the town library
 * gives the shed its 200 tools in one spreadsheet, a line a tool, which his
 * screen sends as it is. The desk goes down the lines one at a time, and his
 * screen follows it (D58.2): a tool in the catalogue, a line left because
 * its id is taken, until the sheet is loaded; or its wait is over, and he
 * follows it again from where it was (D72.8). A line the schema refuses
 * refuses the sheet, before any line goes in.
 *
 * @see {@link usecase.load_tools_from_a_sheet}
 */
export const load_tools_from_a_sheet = usecase.load_tools_from_a_sheet

/**
 * The input of `load_tools_from_a_sheet`, declared inline.
 *
 * @see {@link usecase.load_tools_from_a_sheet}
 */
export const load_tools_from_a_sheet_input = usecase.load_tools_from_a_sheet.input
export type load_tools_from_a_sheet_input = z.output<typeof load_tools_from_a_sheet_input>

/**
 * Luca loads a short sheet in one go (SC-54): Paolo gives the shed the
 * twelve tools of his garage, on a sheet his screen sends as it is, and
 * reads at once what went in and what was left, from the parts of the one
 * fact (D113).
 *
 * @see {@link usecase.load_tools_from_a_short_sheet}
 */
export const load_tools_from_a_short_sheet = usecase.load_tools_from_a_short_sheet

/**
 * The input of `load_tools_from_a_short_sheet`, declared inline.
 *
 * @see {@link usecase.load_tools_from_a_short_sheet}
 */
export const load_tools_from_a_short_sheet_input = usecase.load_tools_from_a_short_sheet.input
export type load_tools_from_a_short_sheet_input = z.output<
  typeof load_tools_from_a_short_sheet_input
>
