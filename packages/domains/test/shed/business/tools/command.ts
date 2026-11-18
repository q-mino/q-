import { z } from 'zod'
import {
  command,
  cursor_step,
  identity_of,
  AND,
  NOT,
  dsl,
  fact,
  id,
  line_selection,
  predicate,
  value,
} from './_scope_command.ts'

/** No tool of the catalogue has the requested id. */
export const the_tool_is_new = NOT(predicate.a_tool_has_this_id)

export const add_a_tool = command({
  input: z.strictObject({
    id: id.tool_id,
    name: value.tool_name,
    category: value.category,
    notes: value.notes.optional(),
  }),
  outcomes: {
    the_tool_is_new_so_it_is_added: [the_tool_is_new, fact.a_tool_has_been_added],
  },
  creator: (context) => (input) => ({
    the_tool_is_new_so_it_is_added: [
      { tool_id: input.id },
      { added_tool: { ...input, status: 'inService', addDate: context.now } },
    ],
  }),
})

/** The requested tool is in the catalogue and in service. */
export const the_tool_can_be_retired = AND({
  a_tool_has_the_requested_id: predicate.a_tool_has_this_id,
  the_requested_tool_is_in_service: predicate.the_tool_is_in_service,
})

/** The requested tool is in the catalogue and in the workshop: beyond repair, it can be retired. */
export const the_tool_is_in_the_workshop = AND({
  a_tool_has_the_requested_id: predicate.a_tool_has_this_id,
  the_requested_tool_is_under_repair: predicate.the_tool_is_under_repair,
})

/** The requested tool is in the catalogue and already retired. */
export const the_tool_is_already_retired = AND({
  a_tool_has_the_requested_id: predicate.a_tool_has_this_id,
  the_requested_tool_is_retired: predicate.the_tool_is_retired,
})

export const retire_a_tool = command({
  input: z.strictObject({
    id: id.tool_id,
    reason: value.retire_reason,
    notes: value.notes.optional(),
  }),
  outcomes: {
    the_tool_is_in_service_so_it_is_retired: [
      the_tool_can_be_retired,
      fact.a_tool_has_been_retired,
    ],
    the_tool_is_beyond_repair_so_it_is_retired: [
      the_tool_is_in_the_workshop,
      fact.a_tool_has_been_retired,
    ],
    the_tool_is_already_retired_so_nothing_changes: [
      the_tool_is_already_retired,
      fact.the_tool_was_already_retired,
    ],
  },
  creator: (context) => (input) => ({
    the_tool_is_in_service_so_it_is_retired: [
      {
        a_tool_has_the_requested_id: { tool_id: input.id },
        the_requested_tool_is_in_service: { tool_id: input.id },
      },
      {
        retired_tool: {
          id: input.id,
          status: 'retired',
          retirement: { date: context.now, reason: input.reason, notes: input.notes },
        },
      },
    ],
    the_tool_is_beyond_repair_so_it_is_retired: [
      {
        a_tool_has_the_requested_id: { tool_id: input.id },
        the_requested_tool_is_under_repair: { tool_id: input.id },
      },
      {
        retired_tool: {
          id: input.id,
          status: 'retired',
          retirement: { date: context.now, reason: input.reason, notes: input.notes },
        },
      },
    ],
    the_tool_is_already_retired_so_nothing_changes: [
      {
        a_tool_has_the_requested_id: { tool_id: input.id },
        the_requested_tool_is_retired: { tool_id: input.id },
      },
      { tool_id: input.id },
    ],
  }),
})

/**
 * The tool goes to the workshop: Marta returned the drill damaged, and a
 * standing order brings the news (`reaction/damage`); or Luca found it broken
 * on the shelf. Neither can name the stay in repair, so `tools` derives its
 * id from the operation (D75.8): a redelivery is the duplicate branch, the
 * same stay. Invoked by a reaction, it rejects no expected occurrence (D93):
 * a tool already in the workshop, or retired, records a fact and changes
 * nothing.
 */
export const send_a_tool_to_repair = command({
  input: z.strictObject({
    tool_id: id.tool_id,
  }),
  outcomes: {
    the_tool_is_in_service_so_it_goes_to_repair: [
      the_tool_can_be_retired,
      fact.a_tool_has_been_sent_to_repair,
    ],
    the_tool_is_already_in_the_workshop_so_nothing_changes: [
      the_tool_is_in_the_workshop,
      fact.the_tool_was_already_under_repair,
    ],
    the_tool_is_retired_so_nothing_changes: [
      the_tool_is_already_retired,
      fact.the_tool_was_retired_before_the_repair,
    ],
  },
  creator: (context) => (input) => ({
    the_tool_is_in_service_so_it_goes_to_repair: [
      {
        a_tool_has_the_requested_id: { tool_id: input.tool_id },
        the_requested_tool_is_in_service: { tool_id: input.tool_id },
      },
      {
        tool_under_repair: {
          id: input.tool_id,
          status: 'underRepair',
          repair: { id: identity_of(id.repair_id)(context.operation), since: context.now },
        },
      },
    ],
    the_tool_is_already_in_the_workshop_so_nothing_changes: [
      {
        a_tool_has_the_requested_id: { tool_id: input.tool_id },
        the_requested_tool_is_under_repair: { tool_id: input.tool_id },
      },
      { tool_id: input.tool_id },
    ],
    the_tool_is_retired_so_nothing_changes: [
      {
        a_tool_has_the_requested_id: { tool_id: input.tool_id },
        the_requested_tool_is_retired: { tool_id: input.tool_id },
      },
      { tool_id: input.tool_id },
    ],
  }),
})

/** Luca puts the repaired drill back on the shelf: it can be lent and booked again. */
export const put_a_repaired_tool_back_in_service = command({
  input: z.strictObject({
    tool_id: id.tool_id,
  }),
  outcomes: {
    the_tool_is_in_the_workshop_so_it_is_back_in_service: [
      the_tool_is_in_the_workshop,
      fact.a_tool_has_been_repaired,
    ],
  },
  creator: () => (input) => ({
    the_tool_is_in_the_workshop_so_it_is_back_in_service: [
      {
        a_tool_has_the_requested_id: { tool_id: input.tool_id },
        the_requested_tool_is_under_repair: { tool_id: input.tool_id },
      },
      { repaired_tool: { id: input.tool_id, status: 'inService' } },
    ],
  }),
})

/** The requested tool is in the catalogue and in the workshop for the requested stay (SC-34). */
export const the_tool_is_in_the_workshop_for_this_repair = AND({
  a_tool_has_the_requested_id: predicate.a_tool_has_this_id,
  the_requested_tool_is_under_the_requested_repair: predicate.the_tool_is_under_this_repair,
})

/**
 * The workshop closes a stay in repair (SC-34): Rossi's van brought the
 * drill back on the shelf, and his system says so, naming the stay it closes
 * (RP1, from the job ticket Luca handed over with the drill). The stay, not
 * the tool alone: a notice that comes late, after Luca put the drill back by
 * hand and Marta broke it again (RP2), finds the drill in another stay and
 * changes nothing, so a retry from outside is safe by the business, not only
 * by the operation's identity (D91.2). Luca, who holds the drill, puts it
 * back by the tool alone.
 */
export const close_a_repair = command({
  input: z.strictObject({
    tool_id: id.tool_id,
    repair_id: id.repair_id,
  }),
  outcomes: {
    the_tool_is_under_this_repair_so_it_is_back_in_service: [
      the_tool_is_in_the_workshop_for_this_repair,
      fact.a_tool_has_been_repaired,
    ],
  },
  creator: () => (input) => ({
    the_tool_is_under_this_repair_so_it_is_back_in_service: [
      {
        a_tool_has_the_requested_id: { tool_id: input.tool_id },
        the_requested_tool_is_under_the_requested_repair: {
          tool_id: input.tool_id,
          repair_id: input.repair_id,
        },
      },
      { repaired_tool: { id: input.tool_id, status: 'inService' } },
    ],
  }),
})

/**
 * Luca gives the drill a name the members recognise on the shelf: any tool
 * of the catalogue, retired ones too, since their name stays in the history
 * of the loans (SC-19).
 */
export const rename_a_tool = command({
  input: z.strictObject({
    tool_id: id.tool_id,
    name: value.tool_name,
  }),
  outcomes: {
    the_tool_is_in_the_catalogue_so_it_is_renamed: [
      predicate.a_tool_has_this_id,
      fact.a_tool_has_been_renamed,
    ],
  },
  creator: () => (input) => ({
    the_tool_is_in_the_catalogue_so_it_is_renamed: [
      { tool_id: input.tool_id },
      { renamed_tool: { id: input.tool_id, name: input.name } },
    ],
  }),
})

/** No sheet in the desk's hands has the id the desk gives this one. */
export const the_sheet_is_new = NOT(predicate.a_sheet_has_this_id)

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
 */
export const load_the_tools_of_a_sheet = command({
  input: z.strictObject({
    lines: z.array(value.tool_on_a_line).min(1).max(5000),
  }),
  outcomes: {
    the_sheet_is_new_so_its_loading_begins: [
      the_sheet_is_new,
      fact.the_loading_of_a_sheet_has_begun,
    ],
  },
  creator: (context) => (input) => ({
    the_sheet_is_new_so_its_loading_begins: [
      { sheet_id: identity_of(id.sheet_id)(context.operation) },
      {
        new_sheet: {
          id: identity_of(id.sheet_id)(context.operation),
          start_date: context.now,
          progress: { stage: 'loading' },
        },
        lines: input.lines.map((tool, index) => ({
          id: dsl.the_line_of_the_sheet({
            sheet_id: identity_of(id.sheet_id)(context.operation),
            number: index + 1,
          }),
          sheet_id: identity_of(id.sheet_id)(context.operation),
          number: index + 1,
          tool,
        })),
      },
    ],
  }),
})

/**
 * The desk adds the tool a line of a sheet writes, or, if its id is in the
 * catalogue already, leaves the line (D95), which a fact says: never a line
 * passed over in silence (D112.2), nor one that stops the sheet. A
 * transition of the tool's life cycle (DOM-19) with no use case of its own:
 * the loading's step composes it (D111). Luca's own `add_a_tool` keeps its
 * one branch: on his form a taken id is refused, and he picks another.
 */
export const add_a_tool_from_a_line = command({
  input: z.strictObject({
    sheet_id: id.sheet_id,
    line_id: id.line_id,
    number: value.sheet_line.shape.number,
    tool: value.tool_on_a_line,
  }),
  outcomes: {
    the_tool_is_new_so_it_is_added: [the_tool_is_new, fact.a_tool_has_been_added],
    the_tool_is_in_the_catalogue_so_the_line_is_left: [
      predicate.a_tool_has_this_id,
      fact.the_tool_of_the_line_was_already_in_the_catalogue,
    ],
  },
  creator: (context) => (input) => ({
    the_tool_is_new_so_it_is_added: [
      { tool_id: input.tool.id },
      { added_tool: { ...input.tool, status: 'inService', addDate: context.now } },
    ],
    the_tool_is_in_the_catalogue_so_the_line_is_left: [
      { tool_id: input.tool.id },
      {
        sheet_id: input.sheet_id,
        line_id: input.line_id,
        number: input.number,
        tool_id: input.tool.id,
      },
    ],
  }),
})

/**
 * The desk takes the next line of the sheet and adds its tool, or leaves the
 * line, or, none left, closes the sheet (DOM-20, D112.2): line 1, the
 * library's rake, goes in; line 37, `drill-7`, the label of the shed's own
 * drill, is left; after line 200 the sheet is loaded. The lines in their
 * order on the sheet, then by id (D109); the cursor the library keeps on the
 * sheet marks where the desk stands, so that a step delivered again is the
 * same step (DOM-11), and one line adds one tool, once.
 */
export const continue_the_loading_of_a_sheet = cursor_step({
  input: z.strictObject({
    sheet_id: id.sheet_id,
  }),
  reads: value.sheet_being_loaded,
  fields: value.sheet_line,
  identity: 'id',
  selection: line_selection.the_line_is_on_the_sheet,
  order: { number: 'ascending' },
  composes: add_a_tool_from_a_line,
  outcomes: {
    advances: fact.the_loading_of_the_sheet_has_advanced,
    completes: fact.the_sheet_has_been_loaded,
  },
  creator: (context) => () => (sheet) => ({
    selection: { sheet_id: sheet.id },
    composes: (line) => ({
      sheet_id: line.sheet_id,
      line_id: line.id,
      number: line.number,
      tool: line.tool,
    }),
    advances: { sheet_id: sheet.id },
    completes: {
      loaded_sheet: { id: sheet.id, progress: { stage: 'complete', end_date: context.now } },
    },
  }),
})
