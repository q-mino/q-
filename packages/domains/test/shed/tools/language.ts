// The language of tools: the words of the shed's catalogue and their schemas.

import { z } from 'zod'
import { fact } from '../wlib.ts'

/** Opaque, generated on the node before the command (DOM-12); also the key. */
export const ToolId = z.string().min(1).brand<'ToolId'>()
export type ToolId = z.output<typeof ToolId>

export const ToolName = z.string().min(1).max(80)

export const Category = z.enum(['garden', 'power', 'hand', 'ladder'])
export type Category = z.output<typeof Category>

export const Notes = z.string().max(500)

/** Grows with the steps: `retired`, `underRepair`. */
export const ToolStatus = z.enum(['inService'])
export type ToolStatus = z.output<typeof ToolStatus>

/** A tool of the catalogue. */
export const Tool = z.strictObject({
  id: ToolId,
  name: ToolName,
  category: Category,
  notes: Notes.optional(),
  status: ToolStatus,
})
export type Tool = z.output<typeof Tool>

/** Input of "add tool". */
export const AddToolInput = z.strictObject({
  id: ToolId,
  name: ToolName,
  category: Category,
  notes: Notes.optional(),
})
export type AddToolInput = z.output<typeof AddToolInput>

/** A tool entered the catalogue. Its payload is the log, not the state: it evolves on its own (DOM-22). */
export const toolAdded = fact({
  name: 'tool added',
  version: 1,
  payload: z.strictObject({
    id: ToolId,
    name: ToolName,
    category: Category,
    notes: Notes.optional(),
    status: ToolStatus,
  }),
})
