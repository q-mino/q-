// generated

// The path registry of `persona/keeper` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity.

import type * as wlib from '../../../../src/library/index.ts'
import * as value from './_value.ts'
import * as node from './_node.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'persona/keeper/value/retirement_reason': value.retirement_reason,
  'persona/keeper/value/notes': value.notes,
  'persona/keeper/value/tool_name': value.tool_name,
  'persona/keeper/value/category': value.category,
  'persona/keeper/value/number_of_loans': value.number_of_loans,
  'persona/keeper/node/keeper': node.keeper,
  'persona/keeper/usecase/retire_a_tool': usecase.retire_a_tool,
  'persona/keeper/usecase/retire_a_tool_input': usecase.retire_a_tool_input,
  'persona/keeper/usecase/send_a_tool_to_repair': usecase.send_a_tool_to_repair,
  'persona/keeper/usecase/send_a_tool_to_repair_input': usecase.send_a_tool_to_repair_input,
  'persona/keeper/usecase/put_a_repaired_tool_back_in_service':
    usecase.put_a_repaired_tool_back_in_service,
  'persona/keeper/usecase/put_a_repaired_tool_back_in_service_input':
    usecase.put_a_repaired_tool_back_in_service_input,
  'persona/keeper/usecase/the_loans_of_the_month': usecase.the_loans_of_the_month,
  'persona/keeper/usecase/the_loans_of_the_month_input': usecase.the_loans_of_the_month_input,
  'persona/keeper/usecase/load_tools_from_a_sheet': usecase.load_tools_from_a_sheet,
  'persona/keeper/usecase/load_tools_from_a_sheet_input': usecase.load_tools_from_a_sheet_input,
  'persona/keeper/usecase/load_tools_from_a_short_sheet': usecase.load_tools_from_a_short_sheet,
  'persona/keeper/usecase/load_tools_from_a_short_sheet_input':
    usecase.load_tools_from_a_short_sheet_input,
  'persona/keeper/version/keeper': version.keeper,
} satisfies wlib.Registry
