import { z } from 'zod'
import { date_time_string } from '../../wlib'

export const tool_id = z.string().min(1).brand<'tool_id'>()

export const tool_name = z.string().min(1).max(80)

export const category = z.enum(['garden', 'power', 'hand', 'ladder'])

export const notes = z.string().max(500)

/** Grows with the steps: `retired`, `underRepair`. */
export const tool_status = z.enum(['inService'])

/** A tool of the catalogue. */
export const tool = z.strictObject({
  id: tool_id,
  name: tool_name,
  category: category,
  notes: notes.optional(),
  status: tool_status,
  addDate: date_time_string,
})
