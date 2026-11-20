// generated

// The selection predicates of `mailbox/deposits` from `deposit_selection.ts`
// (DOM-25): the same objects under the same names, branded with their path
// (DOM-24), each schema with its output type under the same name, so that one
// import gives both. Only this module imports `deposit_selection.ts`.

import { z } from 'zod'
import * as selection from './deposit_selection.ts'

/**
 * The envelope was left on this deposit address.
 *
 * @see {@link selection.the_envelope_is_on_this_address}
 */
export const the_envelope_is_on_this_address =
  selection.the_envelope_is_on_this_address.brand<'mailbox/deposits/selection/deposit/the_envelope_is_on_this_address'>()
export type the_envelope_is_on_this_address = z.output<typeof the_envelope_is_on_this_address>

/**
 * The envelope is still kept: its seven days are running.
 *
 * @see {@link selection.the_envelope_is_kept}
 */
export const the_envelope_is_kept =
  selection.the_envelope_is_kept.brand<'mailbox/deposits/selection/deposit/the_envelope_is_kept'>()
export type the_envelope_is_kept = z.output<typeof the_envelope_is_kept>
