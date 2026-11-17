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
 * The keeper renames a tool: the members read the new name on their rows (SC-19).
 *
 * @see {@link usecase.rename_a_tool}
 */
export const rename_a_tool = usecase.rename_a_tool

/**
 * A visitor browses the catalogue: the garden tools, say, read once.
 *
 * @see {@link usecase.the_catalogue}
 */
export const the_catalogue = usecase.the_catalogue
