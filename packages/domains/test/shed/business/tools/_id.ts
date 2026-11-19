// generated

// The identities of `business/tools` from `id.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `id.ts`.

import { z } from 'zod'
import * as id from './id.ts'

/**
 * @see {@link id.tool_id}
 */
export const tool_id = id.tool_id.brand<'business/tools/id/tool_id'>()
export type tool_id = z.output<typeof tool_id>

/**
 * A stay of a tool in repair: the drill Marta returned damaged on Tuesday,
 * and again in December, Luigi's. Chosen by `tools` from the operation that
 * sends the tool to repair (D75.8, `identity_of`), whoever sends it.
 *
 * @see {@link id.repair_id}
 */
export const repair_id = id.repair_id.brand<'business/tools/id/repair_id'>()
export type repair_id = z.output<typeof repair_id>

/**
 * A sheet of tools Luca loads into the catalogue (SC-44): the town library's
 * 200 tools, given to the shed in one spreadsheet. Chosen by `tools` from the
 * operation that opens it (D75.8, `identity_of`): a sheet has no name of its
 * own, and a retry of Luca's request is the same sheet.
 *
 * @see {@link id.sheet_id}
 */
export const sheet_id = id.sheet_id.brand<'business/tools/id/sheet_id'>()
export type sheet_id = z.output<typeof sheet_id>

/**
 * A line of a sheet, a part of it (D94.1): line 37 of the library's sheet.
 * Named by the sheet and its number, which `dsl` encodes
 * (`the_line_of_the_sheet`), so that two sheets' line 37 are two lines.
 *
 * @see {@link id.line_id}
 */
export const line_id = id.line_id.brand<'business/tools/id/line_id'>()
export type line_id = z.output<typeof line_id>
