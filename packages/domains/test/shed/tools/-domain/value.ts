import { z } from 'zod'
import { date_time_string } from '../../wlib.ts'

// A brand's literal is the value's path (DOM-24), the generator's: written by
// hand until the generator exists.

export const tool_id = z.string().min(1).brand<'tools/value/tool_id'>()

export const tool_name = z.string().min(1).max(80)

export const category = z.enum(['garden', 'power', 'hand', 'ladder'])

export const notes = z.string().max(500)

/** Grows with the steps: `underRepair` (step 9). */
export const tool_status = z.enum(['inService', 'retired'])

export const retire_reason = z.enum(['broken', 'lost', 'worn_out', 'given_away'])

/** Why and when a tool left service. */
export const retirement = z.strictObject({
  date: date_time_string,
  reason: retire_reason,
  notes: notes.optional(),
})

/** A field a state does not have: in the type, `?: undefined`; in the data, absent. */
const absent = z.undefined().optional()

/** Every field of every state of a tool. Not a state: each state subtracts from it. */
const every_tool_field = z.strictObject({
  id: tool_id,
  name: tool_name,
  category: category,
  notes: notes.optional(),
  addDate: date_time_string,
  status: tool_status,
  retirement: retirement,
})

/** A tool that can be lent. */
export const tool_in_service = every_tool_field.extend({
  status: z.literal(tool_status.enum.inService),
  retirement: absent,
})

/** A tool out of service; it stays in the catalogue, for the history of the loans. */
export const retired_tool = every_tool_field.extend({
  status: z.literal(tool_status.enum.retired),
})

/** A tool of the catalogue: its states share every field, so any field reads without narrowing. */
export const tool = z.discriminatedUnion('status', [tool_in_service, retired_tool])

/** What a visitor sees of a tool in the catalogue. */
export const catalogue_entry = tool_in_service.pick({
  id: true,
  name: true,
  category: true,
  notes: true,
})
