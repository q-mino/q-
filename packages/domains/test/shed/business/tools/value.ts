import { z } from 'zod'
import { date_time_string } from '../../wlib.ts'
import { id } from './_scope_value.ts'

export const tool_name = z.string().min(1).max(80)

export const category = z.enum(['garden', 'power', 'hand', 'ladder'])

export const notes = z.string().max(500)

/** In service, lent and booked; under repair, neither, until it is back; retired, for good. */
export const tool_status = z.enum(['inService', 'underRepair', 'retired'])

export const retire_reason = z.enum(['broken', 'lost', 'worn_out', 'given_away'])

/** Why and when a tool left service. */
export const retirement = z.strictObject({
  date: date_time_string,
  reason: retire_reason,
  notes: notes.optional(),
})

/**
 * A stay in repair: which one, and since when. Why it went (a damaged
 * return, a tool found broken) is not the workshop's: the facts that sent
 * it there say it.
 */
export const repair = z.strictObject({
  id: id.repair_id,
  since: date_time_string,
})

/** A field a state does not have: in the type, `?: undefined`; in the data, absent. */
const absent = z.undefined().optional()

/** Every field of every state of a tool. Not a state: each state subtracts from it. */
const every_tool_field = z.strictObject({
  id: id.tool_id,
  name: tool_name,
  category: category,
  notes: notes.optional(),
  addDate: date_time_string,
  status: tool_status,
  repair: repair,
  retirement: retirement,
})

/** A tool that can be lent. */
export const tool_in_service = every_tool_field.extend({
  status: z.literal(tool_status.enum.inService),
  repair: absent,
  retirement: absent,
})

/** A tool in the workshop: it can be neither lent nor booked until it is back in service. */
export const tool_under_repair = every_tool_field.extend({
  status: z.literal(tool_status.enum.underRepair),
  retirement: absent,
})

/** A tool out of service; it stays in the catalogue, for the history of the loans. */
export const retired_tool = every_tool_field.extend({
  status: z.literal(tool_status.enum.retired),
  repair: absent,
})

/** A tool of the catalogue: its states share every field, so any field reads without narrowing. */
export const tool = z.discriminatedUnion('status', [
  tool_in_service,
  tool_under_repair,
  retired_tool,
])

/** What a visitor sees of a tool in the catalogue. */
export const catalogue_entry = tool_in_service.pick({
  id: true,
  name: true,
  category: true,
  notes: true,
})
