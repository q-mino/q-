// generated

import { z } from 'zod'
import { a_tool_has_been_added } from './fact'

export type $a_tool_has_been_added = z.output<typeof a_tool_has_been_added>
export const $a_tool_has_been_added = (v: /*omit the brand!*/$a_tool_has_been_added) => a_tool_has_been_added.parse(v)
export const $$a_tool_has_been_added = (v: unknown) => a_tool_has_been_added.safeParse(v)
export const $$$a_tool_has_been_added = (v: unknown) => a_tool_has_been_added.parse(v)
