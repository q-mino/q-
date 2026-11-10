// generated

import { z } from 'zod'
import * as selection from './selection.ts'

/**
 * @see {@link selection.the_tool_is_in_service}
 */
export const the_tool_is_in_service = z.strictObject({
  $path: z.literal('tools/selection/the_tool_is_in_service'),
  ...selection.the_tool_is_in_service.shape,
})
export type $the_tool_is_in_service = z.output<typeof the_tool_is_in_service>
/** No parameters: the parse takes nothing. */
export const $the_tool_is_in_service = () =>
  the_tool_is_in_service.parse({ $path: 'tools/selection/the_tool_is_in_service' })
export const $$the_tool_is_in_service = (v: unknown) => the_tool_is_in_service.safeParse(v)
export const $$$the_tool_is_in_service = (v: unknown) => the_tool_is_in_service.parse(v)

/**
 * @see {@link selection.the_tool_is_in_one_of_these_categories}
 */
export const the_tool_is_in_one_of_these_categories = z.strictObject({
  $path: z.literal('tools/selection/the_tool_is_in_one_of_these_categories'),
  ...selection.the_tool_is_in_one_of_these_categories.shape,
})
export type $the_tool_is_in_one_of_these_categories = z.output<
  typeof the_tool_is_in_one_of_these_categories
>
export const $the_tool_is_in_one_of_these_categories = (
  v: /*omit the $path!*/ Omit<$the_tool_is_in_one_of_these_categories, '$path'>,
) =>
  the_tool_is_in_one_of_these_categories.parse({
    ...v,
    $path: 'tools/selection/the_tool_is_in_one_of_these_categories',
  })
export const $$the_tool_is_in_one_of_these_categories = (v: unknown) =>
  the_tool_is_in_one_of_these_categories.safeParse(v)
export const $$$the_tool_is_in_one_of_these_categories = (v: unknown) =>
  the_tool_is_in_one_of_these_categories.parse(v)
