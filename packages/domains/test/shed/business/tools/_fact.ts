// generated

// The facts of `business/tools` from `fact.ts` (DOM-25): the same objects under
// the same names, branded with their path (DOM-24), each schema with its output
// type under the same name, so that one import gives both. Only this module
// imports `fact.ts`.

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * Carries the change of state (DOM-5, V9): every value it writes. The
 * adapters of the domain materialize it.
 *
 * @see {@link fact.a_tool_has_been_added}
 */
export const a_tool_has_been_added =
  fact.a_tool_has_been_added.brand<'business/tools/fact/a_tool_has_been_added'>()
export type a_tool_has_been_added = z.output<typeof a_tool_has_been_added>

/**
 * A partial value: the tool's id and the fields the retirement changes. Name,
 * category and add date stay as they were.
 *
 * @see {@link fact.a_tool_has_been_retired}
 */
export const a_tool_has_been_retired =
  fact.a_tool_has_been_retired.brand<'business/tools/fact/a_tool_has_been_retired'>()
export type a_tool_has_been_retired = z.output<typeof a_tool_has_been_retired>

/**
 * Nothing to do (DOM-6): the first retirement stands, the state does not change.
 *
 * @see {@link fact.a_tool_has_been_retired_again}
 */
export const a_tool_has_been_retired_again =
  fact.a_tool_has_been_retired_again.brand<'business/tools/fact/a_tool_has_been_retired_again'>()
export type a_tool_has_been_retired_again = z.output<typeof a_tool_has_been_retired_again>

/**
 * The tool went to the workshop: a partial value, its id, its new status and
 * the stay in repair, whose id `tools` chose from the operation (D75.8). The
 * drill Marta returned damaged, or one Luca found broken on the shelf.
 *
 * @see {@link fact.a_tool_has_been_sent_to_repair}
 */
export const a_tool_has_been_sent_to_repair =
  fact.a_tool_has_been_sent_to_repair.brand<'business/tools/fact/a_tool_has_been_sent_to_repair'>()
export type a_tool_has_been_sent_to_repair = z.output<typeof a_tool_has_been_sent_to_repair>

/**
 * Nothing to do (DOM-6, D93): the tool is in the workshop already, its stay in repair stands.
 *
 * @see {@link fact.a_tool_has_been_sent_to_repair_again}
 */
export const a_tool_has_been_sent_to_repair_again =
  fact.a_tool_has_been_sent_to_repair_again.brand<'business/tools/fact/a_tool_has_been_sent_to_repair_again'>()
export type a_tool_has_been_sent_to_repair_again = z.output<
  typeof a_tool_has_been_sent_to_repair_again
>

/**
 * Nothing to do (DOM-6, D93): the tool was retired before it could go to the workshop.
 *
 * @see {@link fact.the_tool_was_retired_before_the_repair}
 */
export const the_tool_was_retired_before_the_repair =
  fact.the_tool_was_retired_before_the_repair.brand<'business/tools/fact/the_tool_was_retired_before_the_repair'>()
export type the_tool_was_retired_before_the_repair = z.output<
  typeof the_tool_was_retired_before_the_repair
>

/**
 * The tool is back from the workshop, in service: its id and status; the stay in repair is over.
 *
 * @see {@link fact.a_tool_has_been_repaired}
 */
export const a_tool_has_been_repaired =
  fact.a_tool_has_been_repaired.brand<'business/tools/fact/a_tool_has_been_repaired'>()
export type a_tool_has_been_repaired = z.output<typeof a_tool_has_been_repaired>

/**
 * The keeper gave the tool another name (SC-19): a partial value, its id and
 * its new name. Whoever shows the tool by name reads the new one: the
 * catalogue, and the rows of the members' loans and reservations, whose
 * view of the tools `loans` reads from the catalogue (GR-3).
 *
 * @see {@link fact.a_tool_has_been_renamed}
 */
export const a_tool_has_been_renamed =
  fact.a_tool_has_been_renamed.brand<'business/tools/fact/a_tool_has_been_renamed'>()
export type a_tool_has_been_renamed = z.output<typeof a_tool_has_been_renamed>

/**
 * The desk has begun loading a sheet of tools (D97, D112, SC-44): the whole
 * new sheet and its lines, as Luca handed them over. Its steps add one tool
 * a line.
 *
 * @see {@link fact.the_loading_of_a_sheet_has_begun}
 */
export const the_loading_of_a_sheet_has_begun =
  fact.the_loading_of_a_sheet_has_begun.brand<'business/tools/fact/the_loading_of_a_sheet_has_begun'>()
export type the_loading_of_a_sheet_has_begun = z.output<typeof the_loading_of_a_sheet_has_begun>

/**
 * The desk has gone one line further on the sheet: the step's part (DOM-20),
 * beside the line's own, the tool added or the line left. The cursor is the
 * library's, which writes it.
 *
 * @see {@link fact.the_loading_of_the_sheet_has_advanced}
 */
export const the_loading_of_the_sheet_has_advanced =
  fact.the_loading_of_the_sheet_has_advanced.brand<'business/tools/fact/the_loading_of_the_sheet_has_advanced'>()
export type the_loading_of_the_sheet_has_advanced = z.output<
  typeof the_loading_of_the_sheet_has_advanced
>

/**
 * Nothing to add (D95): the id the line gives its tool is in the catalogue
 * already, a tool of the shed or one an earlier line of the sheet added. The
 * line is left, and the catalogue does not change: line 37 names `drill-7`,
 * the label of the shed's own drill.
 *
 * @see {@link fact.a_tool_has_been_added_again}
 */
export const a_tool_has_been_added_again =
  fact.a_tool_has_been_added_again.brand<'business/tools/fact/a_tool_has_been_added_again'>()
export type a_tool_has_been_added_again = z.output<typeof a_tool_has_been_added_again>

/**
 * No line of the sheet is left to go down: the desk closes it (D112.2).
 *
 * @see {@link fact.the_sheet_has_been_loaded}
 */
export const the_sheet_has_been_loaded =
  fact.the_sheet_has_been_loaded.brand<'business/tools/fact/the_sheet_has_been_loaded'>()
export type the_sheet_has_been_loaded = z.output<typeof the_sheet_has_been_loaded>

/**
 * The desk has loaded a short sheet in one go (D113, SC-54): the sheet,
 * filed complete at once, beside the sheets it walks line by line. Its lines
 * are the fact's other parts, one per line, the tool added or the line left.
 *
 * @see {@link fact.a_sheet_has_been_loaded_at_once}
 */
export const a_sheet_has_been_loaded_at_once =
  fact.a_sheet_has_been_loaded_at_once.brand<'business/tools/fact/a_sheet_has_been_loaded_at_once'>()
export type a_sheet_has_been_loaded_at_once = z.output<typeof a_sheet_has_been_loaded_at_once>
