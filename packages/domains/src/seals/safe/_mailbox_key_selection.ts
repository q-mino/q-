// generated

// The selection predicates of `seals/safe` from `mailbox_key_selection.ts`
// (DOM-25): the same objects under the same names, branded with their path
// (DOM-24), each schema with its output type under the same name, so that one
// import gives both. Only this module imports `mailbox_key_selection.ts`.

import { z } from 'zod'
import * as selection from './mailbox_key_selection.ts'

/**
 * The mailbox key has this id.
 *
 * @see {@link selection.the_mailbox_key_has_this_id}
 */
export const the_mailbox_key_has_this_id =
  selection.the_mailbox_key_has_this_id.brand<'seals/safe/selection/mailbox_key/the_mailbox_key_has_this_id'>()
export type the_mailbox_key_has_this_id = z.output<typeof the_mailbox_key_has_this_id>

/**
 * The mailbox key is drawn: it has its R and its D.
 *
 * @see {@link selection.the_mailbox_key_is_drawn}
 */
export const the_mailbox_key_is_drawn =
  selection.the_mailbox_key_is_drawn.brand<'seals/safe/selection/mailbox_key/the_mailbox_key_is_drawn'>()
export type the_mailbox_key_is_drawn = z.output<typeof the_mailbox_key_is_drawn>
