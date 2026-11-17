// generated

// The path registry of `keeper` (DOM-24): every path with its component, in
// the order of the files. The hat is the persona's segment, after its kind's
// folder (PER-7, DOM-25).

import type * as wlib from '../../wlib.ts'
import * as node from './_node.ts'
import * as usecase from './_usecase.ts'
import * as value from './_value.ts'
import * as version from './_version.ts'

export const registry = {
  'persona/keeper/version/keeper': version.keeper,
  'persona/keeper/node/keeper': node.keeper,
  'persona/keeper/value/retirement_reason': value.retirement_reason,
  'persona/keeper/value/notes': value.notes,
  'persona/keeper/value/tool_name': value.tool_name,
  'persona/keeper/value/number_of_loans': value.number_of_loans,
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
} satisfies wlib.Registry
