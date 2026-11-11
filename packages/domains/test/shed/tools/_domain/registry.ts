// generated

// The path registry of `tools` (DOM-24): each path with its component. The
// configurator gives it to the library, which reads it in reverse, from a
// component to its path, by object identity. Here the components the library
// meets at runtime so far; the generator lists every component.

import type * as wlib from '../../wlib.ts'
import * as fact from './fact.ts'
import * as id from './id.ts'
import * as predicate from './predicate.ts'
import * as selection from './selection/index.ts'

export const registry = {
  'tools/id/tool_id': id.tool_id,
  'tools/fact/a_tool_has_been_added': fact.a_tool_has_been_added,
  'tools/fact/a_tool_has_been_retired': fact.a_tool_has_been_retired,
  'tools/fact/the_tool_was_already_retired': fact.the_tool_was_already_retired,
  'tools/predicate/a_tool_has_this_id': predicate.a_tool_has_this_id,
  'tools/predicate/the_tool_is_in_service': predicate.the_tool_is_in_service,
  'tools/predicate/the_tool_is_retired': predicate.the_tool_is_retired,
  'tools/selection/tool/the_tool_is_in_service': selection.tool.the_tool_is_in_service,
  'tools/selection/tool/the_tool_is_in_one_of_these_categories':
    selection.tool.the_tool_is_in_one_of_these_categories,
} satisfies wlib.Registry
