// generated

// The path registry of `tools` (DOM-24): every path with its component, in
// the order of the modules. The configurator gives it to the library, which
// reads it in reverse, from a component to its path, by object identity.

import type * as wlib from '../../wlib.ts'
import * as command from './command.ts'
import * as fact from './fact.ts'
import * as id from './id.ts'
import * as predicate from './predicate.ts'
import * as query from './query.ts'
import * as selection from './selection/index.ts'
import * as usecase from './usecase.ts'
import * as value from './value.ts'

export const registry = {
  'tools/id/tool_id': id.tool_id,
  'tools/value/tool_name': value.tool_name,
  'tools/value/category': value.category,
  'tools/value/notes': value.notes,
  'tools/value/tool_status': value.tool_status,
  'tools/value/retire_reason': value.retire_reason,
  'tools/value/retirement': value.retirement,
  'tools/value/tool_in_service': value.tool_in_service,
  'tools/value/retired_tool': value.retired_tool,
  'tools/value/tool': value.tool,
  'tools/value/catalogue_entry': value.catalogue_entry,
  'tools/fact/a_tool_has_been_added': fact.a_tool_has_been_added,
  'tools/fact/a_tool_has_been_retired': fact.a_tool_has_been_retired,
  'tools/fact/the_tool_was_already_retired': fact.the_tool_was_already_retired,
  'tools/predicate/a_tool_has_this_id': predicate.a_tool_has_this_id,
  'tools/predicate/the_tool_is_in_service': predicate.the_tool_is_in_service,
  'tools/predicate/the_tool_is_retired': predicate.the_tool_is_retired,
  'tools/command/the_tool_is_new': command.the_tool_is_new,
  'tools/command/add_a_tool': command.add_a_tool,
  'tools/command/add_a_tool_input': command.add_a_tool_input,
  'tools/command/the_tool_can_be_retired': command.the_tool_can_be_retired,
  'tools/command/the_tool_is_already_retired': command.the_tool_is_already_retired,
  'tools/command/retire_a_tool': command.retire_a_tool,
  'tools/command/retire_a_tool_input': command.retire_a_tool_input,
  'tools/selection/tool/the_tool_is_in_service': selection.tool.the_tool_is_in_service,
  'tools/selection/tool/the_tool_is_in_one_of_these_categories':
    selection.tool.the_tool_is_in_one_of_these_categories,
  'tools/query/the_tool_is_shown_in_the_catalogue': query.the_tool_is_shown_in_the_catalogue,
  'tools/query/the_catalogue': query.the_catalogue,
  'tools/query/the_catalogue_input': query.the_catalogue_input,
  'tools/usecase/add_a_tool': usecase.add_a_tool,
  'tools/usecase/retire_a_tool': usecase.retire_a_tool,
  'tools/usecase/the_catalogue': usecase.the_catalogue,
} satisfies wlib.Registry
