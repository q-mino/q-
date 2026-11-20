// generated

// The commands of `business/greetings` from `command.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `command.ts`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * No greeting has this identity: the node has not sent it.
 *
 * @see {@link command.the_greeting_is_new}
 */
export const the_greeting_is_new = command.the_greeting_is_new
export type the_greeting_is_new = z.output<typeof the_greeting_is_new>

/**
 * Anna greets her bond with Bruno (EXT-12, EXT-16): from the action on
 * their bond's screen, which gives the bond alone, the office sends her
 * greeting, named by the operation that sends it, and asks Bruno's node for
 * a greeting back, waiting 60 seconds. Asked again under the same
 * operation, it is the recorded fact (DOM-11).
 *
 * @see {@link command.greet_a_bond}
 */
export const greet_a_bond = command.greet_a_bond

/**
 * The input of `greet_a_bond`, declared inline.
 *
 * @see {@link command.greet_a_bond}
 */
export const greet_a_bond_input = command.greet_a_bond.input
export type greet_a_bond_input = z.output<typeof greet_a_bond_input>

/**
 * What came back of Anna's greeting closes it (EXT-12, DOM-13): Bruno's
 * greeting back, with its words; no response within its 60 seconds; or a
 * peer that cannot answer it. The return of `ask_for_a_greeting_back`, its
 * input the business's closed set, which the fact keeps as it is, as a
 * returned loan keeps its condition. A greeting that waits no more (closed,
 * or never sent) is refused: a dead letter of the executor, shown.
 *
 * @see {@link command.close_a_greeting}
 */
export const close_a_greeting = command.close_a_greeting

/**
 * The input of `close_a_greeting`, declared inline.
 *
 * @see {@link command.close_a_greeting}
 */
export const close_a_greeting_input = command.close_a_greeting.input
export type close_a_greeting_input = z.output<typeof close_a_greeting_input>

/**
 * No greeting back has this identity: the node has not answered this request.
 *
 * @see {@link command.the_greeting_back_is_new}
 */
export const the_greeting_back_is_new = command.the_greeting_back_is_new
export type the_greeting_back_is_new = z.output<typeof the_greeting_back_is_new>

/**
 * Bruno's node greets Anna back (EXT-12, F7): her greeting came on their
 * bond, and the office answers it with its own words, named by the
 * operation of her request. Her request sent again is the same operation:
 * the recorded fact, the same greeting back (DOM-11).
 *
 * @see {@link command.greet_a_bond_back}
 */
export const greet_a_bond_back = command.greet_a_bond_back

/**
 * The input of `greet_a_bond_back`, declared inline.
 *
 * @see {@link command.greet_a_bond_back}
 */
export const greet_a_bond_back_input = command.greet_a_bond_back.input
export type greet_a_bond_back_input = z.output<typeof greet_a_bond_back_input>
