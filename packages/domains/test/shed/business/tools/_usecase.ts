// generated

// The use cases of `tools` under their names (DOM-2).

import * as usecase from './usecase.ts'

/**
 * The keeper adds a tool to the catalogue: a new drill on the shelf.
 *
 * @see {@link usecase.add_a_tool}
 */
export const add_a_tool = usecase.add_a_tool

/**
 * The keeper retires a tool: broken, lost, worn out or given away.
 *
 * @see {@link usecase.retire_a_tool}
 */
export const retire_a_tool = usecase.retire_a_tool

/**
 * The tool goes to the workshop: Luca found the drill broken on the shelf,
 * or a standing order brings the news of a damaged return.
 *
 * @see {@link usecase.send_a_tool_to_repair}
 */
export const send_a_tool_to_repair = usecase.send_a_tool_to_repair

/**
 * The keeper puts a repaired tool back on the shelf.
 *
 * @see {@link usecase.put_a_repaired_tool_back_in_service}
 */
export const put_a_repaired_tool_back_in_service = usecase.put_a_repaired_tool_back_in_service

/**
 * The workshop closes a stay in repair: Rossi's system, the drill back on the shelf (SC-34).
 *
 * @see {@link usecase.close_a_repair}
 */
export const close_a_repair = usecase.close_a_repair

/**
 * The keeper renames a tool: the members read the new name on their rows (SC-19).
 *
 * @see {@link usecase.rename_a_tool}
 */
export const rename_a_tool = usecase.rename_a_tool

/**
 * The keeper loads a sheet of tools into the catalogue: the town library's
 * 200 tools, line by line, a line whose id is taken left and said (SC-44).
 *
 * @see {@link usecase.load_the_tools_of_a_sheet}
 */
export const load_the_tools_of_a_sheet = usecase.load_the_tools_of_a_sheet

/**
 * The keeper loads a short sheet in one go: Paolo's twelve tools, what went
 * in and what was left told at once (SC-54).
 *
 * @see {@link usecase.load_the_tools_of_a_short_sheet}
 */
export const load_the_tools_of_a_short_sheet = usecase.load_the_tools_of_a_short_sheet

/**
 * The desk goes one line further on a sheet of tools, or closes it: a step
 * of the loading of a sheet (DOM-20). Invoked by the desk's own standing
 * orders (DOM-16): when the sheet opens, and after each step that advanced
 * it.
 *
 * @see {@link usecase.continue_the_loading_of_a_sheet}
 */
export const continue_the_loading_of_a_sheet = usecase.continue_the_loading_of_a_sheet

/**
 * A visitor browses the catalogue: the garden tools, say, read once.
 *
 * @see {@link usecase.the_catalogue}
 */
export const the_catalogue = usecase.the_catalogue
