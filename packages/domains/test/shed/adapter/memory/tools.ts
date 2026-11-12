// The state of `tools` in the in-memory oracle (TST-2): its values, its
// predicates as functions of its state, its writes. The meaning comes from the
// domain's `dsl`.

import type * as wlib from '../../wlib.ts'
import type * as tools_fact from '../../business/tools/_fact.ts'
import type * as tools_predicate from '../../business/tools/_predicate.ts'
import type * as tools_selection from '../../business/tools/@selection/_index.ts'
import type { tool_id } from '../../business/tools/_id.ts'
import type { tool } from '../../business/tools/_value.ts'
import {
  the_tool_is_in_service,
  the_tool_is_in_the_catalogue,
  the_tool_is_retired,
} from '../../business/tools/_dsl.ts'
import type { the_catalogue } from '../../business/tools/_query.ts'
import { selection_operators, type Field, type Selection, type Source } from './fragments.ts'

/** The catalogue, by id. */
export interface ToolsState {
  readonly tools: ReadonlyMap<tool_id, tool>
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
}

// The reads of the subject `business/tools/selection/tool`: a tool of the catalogue.

export const tool_selection: wlib.Algebra<
  wlib.SelectionsIn<typeof tools_selection.tool>,
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

export const tools_writes: wlib.FactWrites<
  wlib.FactsIn<typeof tools_fact>,
  (state: ToolsState) => ToolsState
> = {
  'business/tools/fact/a_tool_has_been_added':
    ({ added_tool }) =>
    (state) => ({ tools: new Map(state.tools).set(added_tool.id, added_tool) }),
  'business/tools/fact/a_tool_has_been_retired':
    ({ retired_tool }) =>
    (state) => {
      const the_tool = state.tools.get(retired_tool.id)
      return the_tool === undefined
        ? state
        : { tools: new Map(state.tools).set(retired_tool.id, { ...the_tool, ...retired_tool }) }
    },
  'business/tools/fact/the_tool_was_already_retired': () => (state) => state,
}
