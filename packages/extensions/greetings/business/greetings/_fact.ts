// generated

// The facts of `business/greetings` from `fact.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `fact.ts`.

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * A bond has been greeted (EXT-12): the greeting sent, waiting for what comes back.
 *
 * @see {@link fact.a_bond_has_been_greeted}
 */
export const a_bond_has_been_greeted =
  fact.a_bond_has_been_greeted.brand<'business/greetings/fact/a_bond_has_been_greeted'>()
export type a_bond_has_been_greeted = z.output<typeof a_bond_has_been_greeted>

/**
 * A greeting has been closed with what came back (EXT-12, D108): its greeting back, no response, or a peer that cannot answer.
 *
 * @see {@link fact.a_greeting_has_been_closed}
 */
export const a_greeting_has_been_closed =
  fact.a_greeting_has_been_closed.brand<'business/greetings/fact/a_greeting_has_been_closed'>()
export type a_greeting_has_been_closed = z.output<typeof a_greeting_has_been_closed>

/**
 * A bond that greeted the node has been greeted back: their words and the node's.
 *
 * @see {@link fact.a_bond_has_been_greeted_back}
 */
export const a_bond_has_been_greeted_back =
  fact.a_bond_has_been_greeted_back.brand<'business/greetings/fact/a_bond_has_been_greeted_back'>()
export type a_bond_has_been_greeted_back = z.output<typeof a_bond_has_been_greeted_back>
