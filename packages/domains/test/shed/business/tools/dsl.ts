// The domain's pure functions over its values, added at need: usable by the
// adapters, the interface and the client. Not concepts of the library. DOM-5

import { id, type value } from './_scope_dsl.ts'

export const the_tool_is_in_the_catalogue = (
  the_tool: value.tool | undefined,
): the_tool is value.tool => the_tool !== undefined

export const the_tool_is_in_service = (the_tool: value.tool | undefined): boolean =>
  the_tool?.status === 'inService'

export const the_tool_is_retired = (the_tool: value.tool | undefined): boolean =>
  the_tool?.status === 'retired'

export const the_tool_is_under_repair = (the_tool: value.tool | undefined): boolean =>
  the_tool?.status === 'underRepair'

/** The tool is in the workshop for this stay, not another (SC-34). */
export const the_tool_is_under_this_repair =
  (the_tool: value.tool | undefined) =>
  (repair_id: id.repair_id): boolean =>
    the_tool?.status === 'underRepair' && the_tool.repair.id === repair_id

/**
 * The identity of a line of a sheet (SC-44): the sheet and the line's
 * number, encoded with no ambiguity, so that two sheets' line 37 are two
 * lines.
 */
export const the_line_of_the_sheet = (line: {
  readonly sheet_id: id.sheet_id
  readonly number: number
}): id.line_id => id.line_id.parse(JSON.stringify([line.sheet_id, line.number]))

/**
 * No two lines of a short sheet name one tool (SC-54): loaded in one go,
 * every line reads the catalogue as it was before the sheet, so a repeated
 * id would be added twice (D113, the lines of a list without repeats).
 */
export const each_tool_is_on_one_line = (lines: readonly { readonly id: id.tool_id }[]): boolean =>
  new Set(lines.map((line) => line.id)).size === lines.length
