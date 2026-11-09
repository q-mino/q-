// generated

import { z } from 'zod'
import { no_other_tool_has_this_id } from './predicate'

export type $no_other_tool_has_this_id = z.output<typeof no_other_tool_has_this_id>
export const $no_other_tool_has_this_id = (v: /*omit the brand!*/ $no_other_tool_has_this_id) =>
  no_other_tool_has_this_id.parse(v)
export const $$no_other_tool_has_this_id = (v: unknown) => no_other_tool_has_this_id.safeParse(v)
export const $$$no_other_tool_has_this_id = (v: unknown) => no_other_tool_has_this_id.parse(v)
