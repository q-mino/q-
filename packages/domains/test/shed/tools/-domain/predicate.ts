import { z } from 'zod'
import { tool_id } from './value'

export const no_other_tool_has_this_id = z.strictObject({ id: tool_id })
