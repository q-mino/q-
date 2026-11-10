// The state of `tools` in the in-memory oracle (TST-2): its values, its
// predicates as functions of its state, its writes. The meaning comes from the
// domain's `dsl`.

import type * as wlib from '../../wlib.ts'
import type * as tools_fact from '../../tools/-domain/$fact.ts'
import type * as tools_predicate from '../../tools/-domain/$predicate.ts'
import type { $tool, $tool_id } from '../../tools/-domain/$value.ts'
import {
  the_tool_is_in_service,
  the_tool_is_in_the_catalogue,
  the_tool_is_retired,
} from '../../tools/-domain/dsl.ts'

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
