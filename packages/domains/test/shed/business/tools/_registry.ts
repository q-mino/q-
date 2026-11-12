// generated

// The path registry of `tools` (DOM-24): every path with its component, in
// the order of the modules. The configurator gives it to the library, which
// reads it in reverse, from a component to its path, by object identity.

import type * as wlib from '../../wlib.ts'
import * as command from './_command.ts'
import * as fact from './_fact.ts'
import * as id from './_id.ts'
import * as predicate from './_predicate.ts'
import * as query from './_query.ts'
import * as tool_selection from './_tool_selection.ts'
import * as usecase from './_usecase.ts'
import * as value from './_value.ts'

export const registry = {
  'business/tools/id/tool_id': id.tool_id,
  'business/tools/value/tool_name': value.tool_name,
  'business/tools/value/category': value.category,
  'business/tools/value/notes': value.notes,
  'business/tools/value/tool_status': value.tool_status,
  'business/tools/value/retire_reason': value.retire_reason,
  'business/tools/value/retirement': value.retirement,
  'business/tools/value/tool_in_service': value.tool_in_service,
  'business/tools/value/retired_tool': value.retired_tool,
  'business/tools/value/tool': value.tool,
  'business/tools/value/catalogue_entry': value.catalogue_entry,
  'business/tools/fact/a_tool_has_been_added': fact.a_tool_has_been_added,
  'business/tools/fact/a_tool_has_been_retired': fact.a_tool_has_been_retired,
  'business/tools/fact/the_tool_was_already_retired': fact.the_tool_was_already_retired,
  'business/tools/predicate/a_tool_has_this_id': predicate.a_tool_has_this_id,
  'business/tools/predicate/the_tool_is_in_service': predicate.the_tool_is_in_service,
  'business/tools/predicate/the_tool_is_retired': predicate.the_tool_is_retired,
  'business/tools/command/the_tool_is_new': command.the_tool_is_new,
  'business/tools/command/add_a_tool': command.add_a_tool,
  'business/tools/command/add_a_tool_input': command.add_a_tool_input,
  'business/tools/command/the_tool_can_be_retired': command.the_tool_can_be_retired,
  'business/tools/command/the_tool_is_already_retired': command.the_tool_is_already_retired,
  'business/tools/command/retire_a_tool': command.retire_a_tool,
  'business/tools/command/retire_a_tool_input': command.retire_a_tool_input,
  'business/tools/selection/tool/the_tool_is_in_service': tool_selection.the_tool_is_in_service,
  'business/tools/selection/tool/the_tool_is_in_one_of_these_categories':
    tool_selection.the_tool_is_in_one_of_these_categories,
  'business/tools/query/the_tool_is_shown_in_the_catalogue':
    query.the_tool_is_shown_in_the_catalogue,
  'business/tools/query/the_catalogue': query.the_catalogue,
  'business/tools/query/the_catalogue_input': query.the_catalogue_input,
  'business/tools/usecase/add_a_tool': usecase.add_a_tool,
  'business/tools/usecase/retire_a_tool': usecase.retire_a_tool,
  'business/tools/usecase/the_catalogue': usecase.the_catalogue,
} satisfies wlib.Registry
