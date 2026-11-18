// The state of `tools` in the in-memory oracle (TST-2): its values, its
// predicates as functions of its state, its writes. The meaning comes from the
// domain's `dsl`.

import type * as wlib from '../../wlib.ts'
import type * as tools_fact from '../../business/tools/_fact.ts'
import type * as tools_predicate from '../../business/tools/_predicate.ts'
import type * as tool_selections from '../../business/tools/_tool_selection.ts'
import type * as line_selections from '../../business/tools/_line_selection.ts'
import type { line_id, sheet_id, tool_id } from '../../business/tools/_id.ts'
import type {
  loading_progress,
  loading_sheet,
  sheet_line,
  tool,
} from '../../business/tools/_value.ts'
import type { continue_the_loading_of_a_sheet } from '../../business/tools/_command.ts'
import {
  the_tool_is_in_service,
  the_tool_is_in_the_catalogue,
  the_tool_is_retired,
  the_tool_is_under_repair,
  the_tool_is_under_this_repair,
} from '../../business/tools/_dsl.ts'
import type { the_catalogue } from '../../business/tools/_query.ts'
import {
  selection_operators,
  type Field,
  type ProcessRead,
  type Selection,
  type Source,
} from './fragments.ts'

/**
 * The catalogue, by id; the sheets of tools the desk loads, by id, and
 * their lines, by id, each with its sheet's (SC-44).
 */
export interface ToolsState {
  readonly tools: ReadonlyMap<tool_id, tool>
  readonly sheets: ReadonlyMap<sheet_id, loading_sheet>
  readonly sheet_lines: ReadonlyMap<line_id, sheet_line>
}

export const tools_fragments: wlib.PredicateFragments<
  wlib.PredicatesIn<typeof tools_predicate>,
  (state: ToolsState) => boolean
> = {
  'business/tools/predicate/a_tool_has_this_id': (p) => (state) =>
    the_tool_is_in_the_catalogue(state.tools.get(p.tool_id)),
  'business/tools/predicate/the_tool_is_in_service': (p) => (state) =>
    the_tool_is_in_service(state.tools.get(p.tool_id)),
  'business/tools/predicate/the_tool_is_retired': (p) => (state) =>
    the_tool_is_retired(state.tools.get(p.tool_id)),
  'business/tools/predicate/the_tool_is_under_repair': (p) => (state) =>
    the_tool_is_under_repair(state.tools.get(p.tool_id)),
  'business/tools/predicate/the_tool_is_under_this_repair': (p) => (state) =>
    the_tool_is_under_this_repair(state.tools.get(p.tool_id))(p.repair_id),
  'business/tools/predicate/a_sheet_has_this_id': (p) => (state) => state.sheets.has(p.sheet_id),
}

// The reads of the subject `business/tools/selection/tool`: a tool of the catalogue.

export const tool_selection: wlib.Algebra<
  wlib.SelectionsIn<typeof tool_selections>,
  Selection<ToolsState, tool>
> = {
  ...selection_operators<ToolsState, tool>(),
  predicate: {
    'business/tools/selection/tool/the_tool_is_in_service': () => () => (the_tool) =>
      the_tool_is_in_service(the_tool),
    'business/tools/selection/tool/the_tool_is_in_one_of_these_categories':
      (p) => () => (the_tool) =>
        p.categories.includes(the_tool.category),
  },
}

const the_tools: Source<ToolsState, tool> = (state) => [...state.tools.values()]

export const tool_sources: {
  readonly the_catalogue: wlib.QuerySource<
    wlib.FieldsOf<typeof the_catalogue>,
    Source<ToolsState, tool>,
    Field<ToolsState, tool>
  >
} = {
  the_catalogue: {
    from: the_tools,
    fields: {
      id: () => (the_tool) => the_tool.id,
      name: () => (the_tool) => the_tool.name,
      category: () => (the_tool) => the_tool.category,
      notes: () => (the_tool) => the_tool.notes,
    },
  },
}

// The reads of the step of `tools` (DOM-20): the sheet by its id; the lines
// it walks, of the subject `business/tools/selection/line`.

export const line_selection: wlib.Algebra<
  wlib.SelectionsIn<typeof line_selections>,
  Selection<ToolsState, sheet_line>
> = {
  ...selection_operators<ToolsState, sheet_line>(),
  predicate: {
    'business/tools/selection/line/the_line_is_on_the_sheet': (p) => () => (the_line) =>
      the_line.sheet_id === p.sheet_id,
  },
}

export const line_steps: {
  readonly continue_the_loading_of_a_sheet: wlib.StepSource<
    typeof continue_the_loading_of_a_sheet,
    ProcessRead<ToolsState>,
    Source<ToolsState, sheet_line>,
    Field<ToolsState, sheet_line>
  >
} = {
  continue_the_loading_of_a_sheet: {
    reads: (input) => (state) => state.sheets.get(input.sheet_id),
    from: (state) => [...state.sheet_lines.values()],
    fields: {
      id: () => (the_line) => the_line.id,
      sheet_id: () => (the_line) => the_line.sheet_id,
      number: () => (the_line) => the_line.number,
      tool: () => (the_line) => the_line.tool,
    },
  },
}

/** What every state of a tool keeps; a change of status writes the rest, by subtraction. */
const what_stays = (the_tool: tool) => ({
  id: the_tool.id,
  name: the_tool.name,
  category: the_tool.category,
  notes: the_tool.notes,
  addDate: the_tool.addDate,
})

/** A tool's change of status: what stays, and what the fact writes; a stay in repair it does not write is over. */
const with_the_status =
  (id: tool_id) =>
  (changed: (stays: ReturnType<typeof what_stays>) => tool) =>
  (state: ToolsState): ToolsState => {
    const the_tool = state.tools.get(id)
    return the_tool === undefined
      ? state
      : { ...state, tools: new Map(state.tools).set(id, changed(what_stays(the_tool))) }
  }

/** A sheet's change of stage, by nesting: its start date stays. */
const with_the_sheet_progress =
  (changed: { readonly id: sheet_id; readonly progress: loading_progress }) =>
  (state: ToolsState): ToolsState => {
    const the_sheet = state.sheets.get(changed.id)
    return the_sheet === undefined
      ? state
      : {
          ...state,
          sheets: new Map(state.sheets).set(changed.id, {
            ...the_sheet,
            progress: changed.progress,
          }),
        }
  }

export const tools_writes: wlib.FactWrites<
  wlib.FactsIn<typeof tools_fact>,
  (state: ToolsState) => ToolsState
> = {
  'business/tools/fact/a_tool_has_been_added':
    ({ added_tool }) =>
    (state) => ({ ...state, tools: new Map(state.tools).set(added_tool.id, added_tool) }),
  'business/tools/fact/a_tool_has_been_retired': ({ retired_tool }) =>
    with_the_status(retired_tool.id)((stays) => ({ ...stays, ...retired_tool })),
  'business/tools/fact/the_tool_was_already_retired': () => (state) => state,
  'business/tools/fact/a_tool_has_been_sent_to_repair': ({ tool_under_repair }) =>
    with_the_status(tool_under_repair.id)((stays) => ({ ...stays, ...tool_under_repair })),
  'business/tools/fact/the_tool_was_already_under_repair': () => (state) => state,
  'business/tools/fact/the_tool_was_retired_before_the_repair': () => (state) => state,
  'business/tools/fact/a_tool_has_been_repaired': ({ repaired_tool }) =>
    with_the_status(repaired_tool.id)((stays) => ({ ...stays, ...repaired_tool })),
  'business/tools/fact/a_tool_has_been_renamed':
    ({ renamed_tool }) =>
    (state) => {
      const the_tool = state.tools.get(renamed_tool.id)
      return the_tool === undefined
        ? state
        : {
            ...state,
            tools: new Map(state.tools).set(renamed_tool.id, {
              ...the_tool,
              name: renamed_tool.name,
            }),
          }
    },
  'business/tools/fact/the_loading_of_a_sheet_has_begun':
    ({ new_sheet, lines }) =>
    (state) => ({
      ...state,
      sheets: new Map(state.sheets).set(new_sheet.id, new_sheet),
      sheet_lines: lines.reduce(
        (sheet_lines, line) => sheet_lines.set(line.id, line),
        new Map(state.sheet_lines),
      ),
    }),
  'business/tools/fact/the_loading_of_the_sheet_has_advanced': ({ sheet_id, cursor }) =>
    with_the_sheet_progress({ id: sheet_id, progress: { stage: 'loading', cursor } }),
  'business/tools/fact/the_tool_of_the_line_was_already_in_the_catalogue': () => (state) => state,
  'business/tools/fact/the_sheet_has_been_loaded': ({ loaded_sheet }) =>
    with_the_sheet_progress(loaded_sheet),
  'business/tools/fact/a_sheet_has_been_loaded_at_once':
    ({ loaded_sheet }) =>
    (state) => ({ ...state, sheets: new Map(state.sheets).set(loaded_sheet.id, loaded_sheet) }),
}
