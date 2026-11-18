import { z } from 'zod'
import { id } from './_scope_id.ts'

// The identities of `tools`: the values that name an instance (DOM-24). Their
// shape only: the generator brands them with their path in `_id.ts`, where
// every module, and every other domain, takes them from.

export const tool_id = id({ format: z.string().min(1) })

/**
 * A stay of a tool in repair: the drill Marta returned damaged on Tuesday,
 * and again in December, Luigi's. Chosen by `tools` from the operation that
 * sends the tool to repair (D75.8, `identity_of`), whoever sends it.
 */
export const repair_id = id({ format: z.string().min(1) })

/**
 * A sheet of tools Luca loads into the catalogue (SC-44): the town library's
 * 200 tools, given to the shed in one spreadsheet. Chosen by `tools` from the
 * operation that opens it (D75.8, `identity_of`): a sheet has no name of its
 * own, and a retry of Luca's request is the same sheet.
 */
export const sheet_id = id({ format: z.string().min(1) })

/**
 * A line of a sheet, a part of it (D94.1): line 37 of the library's sheet.
 * Named by the sheet and its number, which `dsl` encodes
 * (`the_line_of_the_sheet`), so that two sheets' line 37 are two lines.
 */
export const line_id = id({ format: z.string().min(1) })
