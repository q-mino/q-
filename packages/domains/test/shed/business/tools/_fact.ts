// generated

// The facts of `tools`, branded with their path (DOM-24): the same objects as
// in `fact.ts`, nominal in the types. Only this module imports `fact.ts`.

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * Carries the change of state (DOM-5, V9): every value it writes. The
 * adapters of the domain materialize it.
 *
 * @see {@link fact.a_tool_has_been_added}
 */
export const a_tool_has_been_added =
  fact.a_tool_has_been_added.brand<'business/tools/fact/a_tool_has_been_added'>()
export type a_tool_has_been_added = z.output<typeof a_tool_has_been_added>

/**
 * A partial value: the tool's id and the fields the retirement changes. Name,
 * category and add date stay as they were.
 *
 * @see {@link fact.a_tool_has_been_retired}
 */
export const a_tool_has_been_retired =
  fact.a_tool_has_been_retired.brand<'business/tools/fact/a_tool_has_been_retired'>()
export type a_tool_has_been_retired = z.output<typeof a_tool_has_been_retired>

/**
 * Nothing to do (DOM-6): the first retirement stands, the state does not change.
 *
 * @see {@link fact.the_tool_was_already_retired}
 */
export const the_tool_was_already_retired =
  fact.the_tool_was_already_retired.brand<'business/tools/fact/the_tool_was_already_retired'>()
export type the_tool_was_already_retired = z.output<typeof the_tool_was_already_retired>

/**
 * The tool went to the workshop: a partial value, its id, its new status and
 * the stay in repair, whose id `tools` chose from the operation (D75.8). The
 * drill Marta returned damaged, or one Luca found broken on the shelf.
 *
 * @see {@link fact.a_tool_has_been_sent_to_repair}
 */
export const a_tool_has_been_sent_to_repair =
  fact.a_tool_has_been_sent_to_repair.brand<'business/tools/fact/a_tool_has_been_sent_to_repair'>()
export type a_tool_has_been_sent_to_repair = z.output<typeof a_tool_has_been_sent_to_repair>

/**
 * Nothing to do (DOM-6, D93): the tool is in the workshop already, its stay in repair stands.
 *
 * @see {@link fact.the_tool_was_already_under_repair}
 */
export const the_tool_was_already_under_repair =
  fact.the_tool_was_already_under_repair.brand<'business/tools/fact/the_tool_was_already_under_repair'>()
export type the_tool_was_already_under_repair = z.output<typeof the_tool_was_already_under_repair>

/**
 * Nothing to do (DOM-6, D93): the tool was retired before it could go to the workshop.
 *
 * @see {@link fact.the_tool_was_retired_before_the_repair}
 */
export const the_tool_was_retired_before_the_repair =
  fact.the_tool_was_retired_before_the_repair.brand<'business/tools/fact/the_tool_was_retired_before_the_repair'>()
export type the_tool_was_retired_before_the_repair = z.output<
  typeof the_tool_was_retired_before_the_repair
>

/**
 * The tool is back from the workshop, in service: its id and status; the stay in repair is over.
 *
 * @see {@link fact.a_tool_has_been_repaired}
 */
export const a_tool_has_been_repaired =
  fact.a_tool_has_been_repaired.brand<'business/tools/fact/a_tool_has_been_repaired'>()
export type a_tool_has_been_repaired = z.output<typeof a_tool_has_been_repaired>

/**
 * The keeper gave the tool another name (SC-19): a partial value, its id and
 * its new name. Whoever shows the tool by name reads the new one: the
 * catalogue, and the rows of the members' loans and reservations, whose
 * view of the tools `loans` reads from the catalogue (GR-3).
 *
 * @see {@link fact.a_tool_has_been_renamed}
 */
export const a_tool_has_been_renamed =
  fact.a_tool_has_been_renamed.brand<'business/tools/fact/a_tool_has_been_renamed'>()
export type a_tool_has_been_renamed = z.output<typeof a_tool_has_been_renamed>
