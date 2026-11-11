// The state of `tools` in the in-memory oracle (TST-2): its values, its
// predicates as functions of its state, its writes. The meaning comes from the
// domain's `dsl`.

import type * as wlib from '../../wlib.ts'
import type * as tools_fact from '../../tools/-domain/$fact.ts'
import type * as tools_predicate from '../../tools/-domain/$predicate.ts'
import type * as tools_selection from '../../tools/-domain/$selection.ts'
import type { $tool_id } from '../../tools/-domain/$id.ts'
import type { $tool } from '../../tools/-domain/$value.ts'
import {
  the_tool_is_in_service,
  the_tool_is_in_the_catalogue,
  the_tool_is_retired,
} from '../../tools/-domain/dsl.ts'
import type { the_catalogue } from '../../tools/-domain/query.ts'
import { selection_operators, type Field, type Selection, type Source } from './fragments.ts'

/** The catalogue, by id. */
export interface ToolsState {
  readonly tools: ReadonlyMap<$tool_id, $tool>
}

export const tools_fragments: wlib.PredicateFragments<
  wlib.PredicatesIn<typeof tools_predicate>,
  (state: ToolsState) => boolean
> = {
  'tools/predicate/a_tool_has_this_id': (p) => (state) =>
    the_tool_is_in_the_catalogue(state.tools.get(p.tool_id)),
  'tools/predicate/the_tool_is_in_service': (p) => (state) =>
    the_tool_is_in_service(state.tools.get(p.tool_id)),
  'tools/predicate/the_tool_is_retired': (p) => (state) =>
    the_tool_is_retired(state.tools.get(p.tool_id)),
}

// The reads of the subject of `tools/selection`: a tool of the catalogue.

export const tool_selection: wlib.Algebra<
  wlib.SelectionsIn<typeof tools_selection>,
  Selection<ToolsState, $tool>
> = {
  ...selection_operators<ToolsState, $tool>(),
  predicate: {
    'tools/selection/the_tool_is_in_service': () => () => (the_tool) =>
      the_tool_is_in_service(the_tool),
    'tools/selection/the_tool_is_in_one_of_these_categories': (p) => () => (the_tool) =>
      p.categories.includes(the_tool.category),
  },
}

const the_tools: Source<ToolsState, $tool> = (state) => [...state.tools.values()]

export const tool_sources: {
  readonly the_catalogue: wlib.QuerySource<
    wlib.FieldsOf<typeof the_catalogue>,
    Source<ToolsState, $tool>,
    Field<ToolsState, $tool>
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
  'tools/fact/a_tool_has_been_added':
    ({ added_tool }) =>
    (state) => ({ tools: new Map(state.tools).set(added_tool.id, added_tool) }),
  'tools/fact/a_tool_has_been_retired':
    ({ retired_tool }) =>
    (state) => {
      const the_tool = state.tools.get(retired_tool.id)
      return the_tool === undefined
        ? state
        : { tools: new Map(state.tools).set(retired_tool.id, { ...the_tool, ...retired_tool }) }
    },
  'tools/fact/the_tool_was_already_retired': () => (state) => state,
}
