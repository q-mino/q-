// generated

// The value schemas of `tools` under their names, with their output types under
// the same names: one import gives both.

import { z } from 'zod'
import * as value from './@value.ts'

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
 * Grows with the steps: `underRepair` (step 9).
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
 * A tool that can be lent.
 *
 * @see {@link value.tool_in_service}
 */
export const tool_in_service = value.tool_in_service
export type tool_in_service = z.output<typeof tool_in_service>

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
