import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import { command_use_case_over, read_use_case_over, value, tools, loans } from './_scope_usecase.ts'

// The use cases of `keeper`, the leaves of its tree (PER-6): who keeps the
// shed. Each invokes a use case of a business domain and speaks to the keeper
// in the keeper's words: its own input and events, the business's outcome
// projected (D45).

/** The keeper retires a tool: the ladder is broken. */
export const retire_a_tool = command_use_case_over({
  use_case: tools.usecase.retire_a_tool,
  input: z.strictObject({
    tool_id: tools.id.tool_id,
    reason: value.retirement_reason,
    notes: value.notes.optional(),
  }),
  creator: () => (input) => ({ id: input.tool_id, reason: input.reason, notes: input.notes }),
  events: {
    the_tool_is_retired: z.strictObject({ tool_id: tools.id.tool_id, date: wlib.date_time }),
    the_tool_was_already_retired: z.strictObject({ tool_id: tools.id.tool_id }),
    /** The keeper knows which tool they asked for: no need to say it back. */
    there_is_no_such_tool: z.strictObject({}),
  },
  projection: {
    the_tool_is_in_service_so_it_is_retired: (fact) => ({
      event: 'the_tool_is_retired',
      payload: { tool_id: fact.retired_tool.id, date: fact.retired_tool.retirement.date },
    }),
    the_tool_is_beyond_repair_so_it_is_retired: (fact) => ({
      event: 'the_tool_is_retired',
      payload: { tool_id: fact.retired_tool.id, date: fact.retired_tool.retirement.date },
    }),
    the_tool_is_already_retired_so_nothing_changes: (fact) => ({
      event: 'the_tool_was_already_retired',
      payload: { tool_id: fact.tool_id },
    }),
    rejected: () => ({ event: 'there_is_no_such_tool', payload: {} }),
  },
})

/** The keeper sends a tool to the workshop: the drill is broken on the shelf. */
export const send_a_tool_to_repair = command_use_case_over({
  use_case: tools.usecase.send_a_tool_to_repair,
  input: z.strictObject({
    tool_id: tools.id.tool_id,
  }),
  creator: () => (input) => ({ tool_id: input.tool_id }),
  events: {
    the_tool_is_in_the_workshop: z.strictObject({
      tool_id: tools.id.tool_id,
      since: wlib.date_time,
    }),
    the_tool_was_already_in_the_workshop: z.strictObject({ tool_id: tools.id.tool_id }),
    the_tool_is_retired: z.strictObject({ tool_id: tools.id.tool_id }),
    there_is_no_such_tool: z.strictObject({}),
  },
  projection: {
    the_tool_is_in_service_so_it_goes_to_repair: (fact) => ({
      event: 'the_tool_is_in_the_workshop',
      payload: { tool_id: fact.tool_under_repair.id, since: fact.tool_under_repair.repair.since },
    }),
    the_tool_is_already_in_the_workshop_so_nothing_changes: (fact) => ({
      event: 'the_tool_was_already_in_the_workshop',
      payload: { tool_id: fact.tool_id },
    }),
    the_tool_is_retired_so_nothing_changes: (fact) => ({
      event: 'the_tool_is_retired',
      payload: { tool_id: fact.tool_id },
    }),
    rejected: () => ({ event: 'there_is_no_such_tool', payload: {} }),
  },
})

/** The keeper puts the repaired drill back on the shelf. */
export const put_a_repaired_tool_back_in_service = command_use_case_over({
  use_case: tools.usecase.put_a_repaired_tool_back_in_service,
  input: z.strictObject({
    tool_id: tools.id.tool_id,
  }),
  creator: () => (input) => ({ tool_id: input.tool_id }),
  events: {
    the_tool_is_back_in_service: z.strictObject({ tool_id: tools.id.tool_id }),
    /** No such tool, or not in the workshop: the keeper knows which tool they asked for. */
    the_tool_is_not_in_the_workshop: z.strictObject({}),
  },
  projection: {
    the_tool_is_in_the_workshop_so_it_is_back_in_service: (fact) => ({
      event: 'the_tool_is_back_in_service',
      payload: { tool_id: fact.repaired_tool.id },
    }),
    rejected: () => ({ event: 'the_tool_is_not_in_the_workshop', payload: {} }),
  },
})

/**
 * Luca reads how many times each tool of the shed went out this month, the
 * idle ones at zero, once (SC-21): the snapshot alone, as the visitor's
 * catalogue.
 */
export const the_loans_of_the_month = read_use_case_over({
  use_case: loans.usecase.the_loans_of_each_tool_this_month,
  input: z.strictObject({}),
  creator: () => () => ({ query: {} }),
  entry: z.strictObject({
    tool_id: tools.id.tool_id,
    name: value.tool_name,
    loans: value.number_of_loans,
  }),
  projection: (entry) => ({ tool_id: entry.tool_id, name: entry.tool_name, loans: entry.loans }),
})

/**
 * Luca loads a sheet of tools into the catalogue (SC-44): the town library
 * gives the shed its 200 tools in one spreadsheet, a line a tool, which his
 * screen sends as it is. The desk goes down the lines one at a time, and his
 * screen follows it (D58.2): a tool in the catalogue, a line left because
 * its id is taken, until the sheet is loaded; or its wait is over, and he
 * follows it again from where it was (D72.8). A line the schema refuses
 * refuses the sheet, before any line goes in.
 */
export const load_tools_from_a_sheet = command_use_case_over({
  use_case: tools.usecase.load_the_tools_of_a_sheet,
  input: z.strictObject({
    lines: z
      .array(
        z.strictObject({
          tool_id: tools.id.tool_id,
          name: value.tool_name,
          category: value.category,
          notes: value.notes.optional(),
        }),
      )
      .min(1)
      .max(5000),
  }),
  creator: () => (input) => ({
    lines: input.lines.map((line) => ({
      id: line.tool_id,
      name: line.name,
      category: line.category,
      notes: line.notes,
    })),
  }),
  events: {
    the_sheet_is_being_loaded: z.strictObject({ lines: z.number().int().min(1) }),
    the_tool_is_in_the_catalogue: z.strictObject({ tool_id: tools.id.tool_id }),
    the_id_of_the_line_is_taken: z.strictObject({
      line: z.number().int().min(1),
      tool_id: tools.id.tool_id,
    }),
    the_sheet_is_loaded: z.strictObject({}),
    /** No branch but the opening: the sheet's id is new to every operation. */
    the_sheet_cannot_be_loaded: z.strictObject({}),
  },
  ends: ['the_sheet_is_loaded', 'the_sheet_cannot_be_loaded'],
  projection: {
    the_sheet_is_new_so_its_loading_begins: (fact) => ({
      event: 'the_sheet_is_being_loaded',
      payload: { lines: fact.lines.length },
    }),
    rejected: () => ({ event: 'the_sheet_cannot_be_loaded', payload: {} }),
  },
  follows: {
    facts: [
      tools.fact.a_tool_has_been_added,
      tools.fact.the_tool_of_the_line_was_already_in_the_catalogue,
      tools.fact.the_sheet_has_been_loaded,
    ],
    projection: {
      a_tool_has_been_added: (fact) => ({
        event: 'the_tool_is_in_the_catalogue',
        payload: { tool_id: fact.added_tool.id },
      }),
      the_tool_of_the_line_was_already_in_the_catalogue: (fact) => ({
        event: 'the_id_of_the_line_is_taken',
        payload: { line: fact.number, tool_id: fact.tool_id },
      }),
      the_sheet_has_been_loaded: () => ({ event: 'the_sheet_is_loaded', payload: {} }),
    },
    at_most: 600_000,
  },
})

/**
 * Luca loads a short sheet in one go (SC-54): Paolo gives the shed the
 * twelve tools of his garage, on a sheet his screen sends as it is, and
 * reads at once what went in and what was left, from the parts of the one
 * fact (D113): every line its own, the tool added, or the line left because
 * its id is taken (D95). A sheet with two lines of one tool is refused
 * before the desk reads anything, and he corrects it; a longer sheet goes
 * line by line (`load_tools_from_a_sheet`).
 */
export const load_tools_from_a_short_sheet = command_use_case_over({
  use_case: tools.usecase.load_the_tools_of_a_short_sheet,
  input: z.strictObject({
    lines: z
      .array(
        z.strictObject({
          tool_id: tools.id.tool_id,
          name: value.tool_name,
          category: value.category,
          notes: value.notes.optional(),
        }),
      )
      .min(1)
      .max(50),
  }),
  creator: () => (input) => ({
    lines: input.lines.map((line) => ({
      id: line.tool_id,
      name: line.name,
      category: line.category,
      notes: line.notes,
    })),
  }),
  events: {
    the_sheet_is_loaded: z.strictObject({
      added: z.array(tools.id.tool_id),
      left: z.array(z.strictObject({ line: z.number().int().min(1), tool_id: tools.id.tool_id })),
    }),
    /** No branch but the loading: the sheet's id is new to every operation. */
    the_sheet_cannot_be_loaded: z.strictObject({}),
  },
  projection: {
    the_sheet_is_new_so_it_is_loaded_at_once: (_, { its_lines_are_loaded }) => ({
      event: 'the_sheet_is_loaded',
      payload: {
        added: its_lines_are_loaded.flatMap((line) =>
          line.branch === 'the_tool_is_new_so_it_is_added' ? [line.fact.added_tool.id] : [],
        ),
        left: its_lines_are_loaded.flatMap((line) =>
          line.branch === 'the_tool_is_in_the_catalogue_so_the_line_is_left'
            ? [{ line: line.fact.number, tool_id: line.fact.tool_id }]
            : [],
        ),
      },
    }),
    rejected: () => ({ event: 'the_sheet_cannot_be_loaded', payload: {} }),
  },
})
