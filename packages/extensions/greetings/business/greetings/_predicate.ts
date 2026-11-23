// generated

// The predicates of `business/greetings` from `predicate.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `predicate.ts`.

import { z } from 'zod'
import * as predicate from './predicate.ts'

/**
 * A greeting with this identity has been sent, whatever came back.
 *
 * @see {@link predicate.a_greeting_has_this_id}
 */
export const a_greeting_has_this_id =
  predicate.a_greeting_has_this_id.brand<'business/greetings/predicate/a_greeting_has_this_id'>()
export type a_greeting_has_this_id = z.output<typeof a_greeting_has_this_id>

/**
 * This greeting waits for what comes back: sent, not closed.
 *
 * @see {@link predicate.the_greeting_waits}
 */
export const the_greeting_waits =
  predicate.the_greeting_waits.brand<'business/greetings/predicate/the_greeting_waits'>()
export type the_greeting_waits = z.output<typeof the_greeting_waits>

/**
 * A greeting back with this identity has been sent.
 *
 * @see {@link predicate.a_greeting_back_has_this_id}
 */
export const a_greeting_back_has_this_id =
  predicate.a_greeting_back_has_this_id.brand<'business/greetings/predicate/a_greeting_back_has_this_id'>()
export type a_greeting_back_has_this_id = z.output<typeof a_greeting_back_has_this_id>
