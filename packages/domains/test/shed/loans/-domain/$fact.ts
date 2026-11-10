// generated

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * Carries the change of state (DOM-5, V9): the whole new loan.
 *
 * @see {@link fact.a_tool_has_been_lent}
 */
export const a_tool_has_been_lent = z.strictObject({
  $path: z.literal('loans/fact/a_tool_has_been_lent'),
  ...fact.a_tool_has_been_lent.shape,
})
export type $a_tool_has_been_lent = z.output<typeof a_tool_has_been_lent>
export const $a_tool_has_been_lent = (
  v: /*omit the $path!*/ Omit<$a_tool_has_been_lent, '$path'>,
) => a_tool_has_been_lent.parse({ ...v, $path: 'loans/fact/a_tool_has_been_lent' })
export const $$a_tool_has_been_lent = (v: unknown) => a_tool_has_been_lent.safeParse(v)
export const $$$a_tool_has_been_lent = (v: unknown) => a_tool_has_been_lent.parse(v)

/**
 * Nothing to do (DOM-6): the member's ongoing loan of the tool stands.
 *
 * @see {@link fact.the_member_already_has_the_tool}
 */
export const the_member_already_has_the_tool = z.strictObject({
  $path: z.literal('loans/fact/the_member_already_has_the_tool'),
  ...fact.the_member_already_has_the_tool.shape,
})
export type $the_member_already_has_the_tool = z.output<typeof the_member_already_has_the_tool>
export const $the_member_already_has_the_tool = (
  v: /*omit the $path!*/ Omit<$the_member_already_has_the_tool, '$path'>,
) =>
  the_member_already_has_the_tool.parse({
    ...v,
    $path: 'loans/fact/the_member_already_has_the_tool',
  })
export const $$the_member_already_has_the_tool = (v: unknown) =>
  the_member_already_has_the_tool.safeParse(v)
export const $$$the_member_already_has_the_tool = (v: unknown) =>
  the_member_already_has_the_tool.parse(v)

/**
 * Carries the change of state (DOM-5, V9): the whole new reservation.
 *
 * @see {@link fact.a_tool_has_been_booked}
 */
export const a_tool_has_been_booked = z.strictObject({
  $path: z.literal('loans/fact/a_tool_has_been_booked'),
  ...fact.a_tool_has_been_booked.shape,
})
export type $a_tool_has_been_booked = z.output<typeof a_tool_has_been_booked>
export const $a_tool_has_been_booked = (
  v: /*omit the $path!*/ Omit<$a_tool_has_been_booked, '$path'>,
) => a_tool_has_been_booked.parse({ ...v, $path: 'loans/fact/a_tool_has_been_booked' })
export const $$a_tool_has_been_booked = (v: unknown) => a_tool_has_been_booked.safeParse(v)
export const $$$a_tool_has_been_booked = (v: unknown) => a_tool_has_been_booked.parse(v)

/**
 * Nothing to do (DOM-6): the member's reservation of the tool for the day stands.
 *
 * @see {@link fact.the_member_already_booked_the_tool}
 */
export const the_member_already_booked_the_tool = z.strictObject({
  $path: z.literal('loans/fact/the_member_already_booked_the_tool'),
  ...fact.the_member_already_booked_the_tool.shape,
})
export type $the_member_already_booked_the_tool = z.output<
  typeof the_member_already_booked_the_tool
>
export const $the_member_already_booked_the_tool = (
  v: /*omit the $path!*/ Omit<$the_member_already_booked_the_tool, '$path'>,
) =>
  the_member_already_booked_the_tool.parse({
    ...v,
    $path: 'loans/fact/the_member_already_booked_the_tool',
  })
export const $$the_member_already_booked_the_tool = (v: unknown) =>
  the_member_already_booked_the_tool.safeParse(v)
export const $$$the_member_already_booked_the_tool = (v: unknown) =>
  the_member_already_booked_the_tool.parse(v)
