// generated

// The commands of `tools` under their names, each schema with its output type
// under the same name: one import gives both.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * No tool of the catalogue has the requested id.
 *
 * @see {@link command.the_tool_is_new}
 */
export const the_tool_is_new = command.the_tool_is_new
export type the_tool_is_new = z.output<typeof the_tool_is_new>

/**
 * @see {@link command.add_a_tool}
 */
export const add_a_tool = command.add_a_tool

/**
 * The input of `add_a_tool`, declared inline.
 *
 * @see {@link command.add_a_tool}
 */
export const add_a_tool_input = command.add_a_tool.input
export type add_a_tool_input = z.output<typeof add_a_tool_input>

/**
 * The requested tool is in the catalogue and in service.
 *
 * @see {@link command.the_tool_can_be_retired}
 */
export const the_tool_can_be_retired = command.the_tool_can_be_retired
export type the_tool_can_be_retired = z.output<typeof the_tool_can_be_retired>

/**
 * The requested tool is in the catalogue and in the workshop: beyond repair, it can be retired.
 *
 * @see {@link command.the_tool_is_in_the_workshop}
 */
export const the_tool_is_in_the_workshop = command.the_tool_is_in_the_workshop
export type the_tool_is_in_the_workshop = z.output<typeof the_tool_is_in_the_workshop>

/**
 * The requested tool is in the catalogue and already retired.
 *
 * @see {@link command.the_tool_is_already_retired}
 */
export const the_tool_is_already_retired = command.the_tool_is_already_retired
export type the_tool_is_already_retired = z.output<typeof the_tool_is_already_retired>

/**
 * @see {@link command.retire_a_tool}
 */
export const retire_a_tool = command.retire_a_tool

/**
 * The input of `retire_a_tool`, declared inline.
 *
 * @see {@link command.retire_a_tool}
 */
export const retire_a_tool_input = command.retire_a_tool.input
export type retire_a_tool_input = z.output<typeof retire_a_tool_input>

/**
 * The tool goes to the workshop, from a damaged return or the shelf; its
 * stay in repair named by the operation (D75.8).
 *
 * @see {@link command.send_a_tool_to_repair}
 */
export const send_a_tool_to_repair = command.send_a_tool_to_repair

/**
 * The input of `send_a_tool_to_repair`, declared inline.
 *
 * @see {@link command.send_a_tool_to_repair}
 */
export const send_a_tool_to_repair_input = command.send_a_tool_to_repair.input
export type send_a_tool_to_repair_input = z.output<typeof send_a_tool_to_repair_input>

/**
 * Luca puts the repaired drill back on the shelf: it can be lent and booked again.
 *
 * @see {@link command.put_a_repaired_tool_back_in_service}
 */
export const put_a_repaired_tool_back_in_service = command.put_a_repaired_tool_back_in_service

/**
 * The input of `put_a_repaired_tool_back_in_service`, declared inline.
 *
 * @see {@link command.put_a_repaired_tool_back_in_service}
 */
export const put_a_repaired_tool_back_in_service_input =
  command.put_a_repaired_tool_back_in_service.input
export type put_a_repaired_tool_back_in_service_input = z.output<
  typeof put_a_repaired_tool_back_in_service_input
>

/**
 * The requested tool is in the catalogue and in the workshop for the requested stay (SC-34).
 *
 * @see {@link command.the_tool_is_in_the_workshop_for_this_repair}
 */
export const the_tool_is_in_the_workshop_for_this_repair =
  command.the_tool_is_in_the_workshop_for_this_repair
export type the_tool_is_in_the_workshop_for_this_repair = z.output<
  typeof the_tool_is_in_the_workshop_for_this_repair
>

/**
 * The workshop closes a stay in repair (SC-34): Rossi's van brought the
 * drill back on the shelf, and his system says so, naming the stay it closes
 * (RP1, from the job ticket Luca handed over with the drill). The stay, not
 * the tool alone: a notice that comes late, after Luca put the drill back by
 * hand and Marta broke it again (RP2), finds the drill in another stay and
 * changes nothing, so a retry from outside is safe by the business, not only
 * by the operation's identity (D91.2). Luca, who holds the drill, puts it
 * back by the tool alone.
 *
 * @see {@link command.close_a_repair}
 */
export const close_a_repair = command.close_a_repair

/**
 * The input of `close_a_repair`, declared inline.
 *
 * @see {@link command.close_a_repair}
 */
export const close_a_repair_input = command.close_a_repair.input
export type close_a_repair_input = z.output<typeof close_a_repair_input>

/**
 * Luca gives the drill a name the members recognise on the shelf: any tool
 * of the catalogue, retired ones too, since their name stays in the history
 * of the loans (SC-19).
 *
 * @see {@link command.rename_a_tool}
 */
export const rename_a_tool = command.rename_a_tool

/**
 * The input of `rename_a_tool`, declared inline.
 *
 * @see {@link command.rename_a_tool}
 */
export const rename_a_tool_input = command.rename_a_tool.input
export type rename_a_tool_input = z.output<typeof rename_a_tool_input>
