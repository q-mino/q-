// generated

// The commands of `business/tools` from `command.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `command.ts`.

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
 * The tool goes to the workshop: Marta returned the drill damaged, and a
 * standing order brings the news (`reaction/damage`); or Luca found it broken
 * on the shelf. Neither can name the stay in repair, so `tools` derives its
 * id from the operation (D75.8): a redelivery is the duplicate branch, the
 * same stay. Invoked by a reaction, it rejects no expected occurrence (D93):
 * a tool already in the workshop, or retired, records a fact and changes
 * nothing.
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

/**
 * No sheet in the desk's hands has the id the desk gives this one.
 *
 * @see {@link command.the_sheet_is_new}
 */
export const the_sheet_is_new = command.the_sheet_is_new
export type the_sheet_is_new = z.output<typeof the_sheet_is_new>

/**
 * Luca hands the desk a sheet of tools to load into the catalogue: the town
 * library gives the shed its 200 tools in one spreadsheet (SC-44). Each line
 * stands on its own: a line whose id is in the catalogue already is left and
 * said, the others go in. So the sheet is a process with a cursor, one line
 * a step (DOM-20, D97, D112): `continue_the_loading_of_a_sheet`, its lines
 * the sheet's parts (D94.1), numbered in the order Luca gives them. A sheet
 * has no name of its own, so `tools` derives its id from the operation
 * (D75.8): a retry of Luca's request is the duplicate branch, the same
 * sheet. Its opening fact carries every line, so the sheet is bounded (D97),
 * wider than the shed's catalogue; a line the schema refuses refuses the
 * sheet, `invalid_request`, before any line goes in (DOM-21).
 *
 * @see {@link command.load_the_tools_of_a_sheet}
 */
export const load_the_tools_of_a_sheet = command.load_the_tools_of_a_sheet

/**
 * The input of `load_the_tools_of_a_sheet`, declared inline.
 *
 * @see {@link command.load_the_tools_of_a_sheet}
 */
export const load_the_tools_of_a_sheet_input = command.load_the_tools_of_a_sheet.input
export type load_the_tools_of_a_sheet_input = z.output<typeof load_the_tools_of_a_sheet_input>

/**
 * The desk adds the tool a line of a sheet writes, or, if its id is in the
 * catalogue already, leaves the line (D95), which a fact says: never a line
 * passed over in silence (D112.2), nor one that stops the sheet. A
 * transition of the tool's life cycle (DOM-19) with no use case of its own:
 * the loading's step composes it (D111). Luca's own `add_a_tool` keeps its
 * one branch: on his form a taken id is refused, and he picks another.
 *
 * @see {@link command.add_a_tool_from_a_line}
 */
export const add_a_tool_from_a_line = command.add_a_tool_from_a_line

/**
 * The input of `add_a_tool_from_a_line`, declared inline.
 *
 * @see {@link command.add_a_tool_from_a_line}
 */
export const add_a_tool_from_a_line_input = command.add_a_tool_from_a_line.input
export type add_a_tool_from_a_line_input = z.output<typeof add_a_tool_from_a_line_input>

/**
 * The desk takes the next line of the sheet and adds its tool, or leaves the
 * line, or, none left, closes the sheet (DOM-20, D112.2): line 1, the
 * library's rake, goes in; line 37, `drill-7`, the label of the shed's own
 * drill, is left; after line 200 the sheet is loaded. The lines in their
 * order on the sheet, then by id (D109); the cursor the library keeps on the
 * sheet marks where the desk stands, so that a step delivered again is the
 * same step (DOM-11), and one line adds one tool, once.
 *
 * @see {@link command.continue_the_loading_of_a_sheet}
 */
export const continue_the_loading_of_a_sheet = command.continue_the_loading_of_a_sheet

/**
 * The input of `continue_the_loading_of_a_sheet`, declared inline.
 *
 * @see {@link command.continue_the_loading_of_a_sheet}
 */
export const continue_the_loading_of_a_sheet_input = command.continue_the_loading_of_a_sheet.input
export type continue_the_loading_of_a_sheet_input = z.output<
  typeof continue_the_loading_of_a_sheet_input
>

/**
 * Luca hands the desk a short sheet, and the desk loads it in one go (SC-54):
 * Paolo gives the shed the twelve tools of his garage, and Luca's screen
 * reads at once what went in and what was left. The second definition of a
 * list of named instances (DOM-20): atomic, one fact, a part per line (D113),
 * beside the sheet walked line by line (`load_the_tools_of_a_sheet`), the
 * author's choice. Each line applies its own branch of
 * `add_a_tool_from_a_line`, on the catalogue as it was before the sheet: a
 * line whose id is taken is left (D95), and never stops the others. So no
 * two lines may name one tool, which the schema refuses (`invalid_request`,
 * DOM-21) before the desk reads anything: on Luca's sheet line 9 repeats the
 * id of line 3, and he corrects it. A short sheet, so that one transaction
 * and one fact hold it, and the catalogue is held for a moment only: fifty
 * lines at most; a longer one goes line by line.
 *
 * @see {@link command.load_the_tools_of_a_short_sheet}
 */
export const load_the_tools_of_a_short_sheet = command.load_the_tools_of_a_short_sheet

/**
 * The input of `load_the_tools_of_a_short_sheet`, declared inline.
 *
 * @see {@link command.load_the_tools_of_a_short_sheet}
 */
export const load_the_tools_of_a_short_sheet_input = command.load_the_tools_of_a_short_sheet.input
export type load_the_tools_of_a_short_sheet_input = z.output<
  typeof load_the_tools_of_a_short_sheet_input
>
