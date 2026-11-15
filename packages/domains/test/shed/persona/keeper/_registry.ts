// generated

// The path registry of `keeper` (DOM-24): every path with its component, in
// the order of the files. The hat is the persona's segment, after its kind's
// folder (PER-7, DOM-25).

import type * as wlib from '../../wlib.ts'
import * as node from './_node.ts'
import * as usecase from './_usecase.ts'
import * as value from './_value.ts'

export const registry = {
  'persona/keeper/node/keeper': node.keeper,
  'persona/keeper/value/retirement_reason': value.retirement_reason,
  'persona/keeper/value/notes': value.notes,
  'persona/keeper/usecase/retire_a_tool': usecase.retire_a_tool,
  'persona/keeper/usecase/retire_a_tool_input': usecase.retire_a_tool_input,
} satisfies wlib.Registry
