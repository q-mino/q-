// generated

// The path registry of `keeper` (DOM-24): every path with its component, in
// the order of the modules. The hat is the first segment (PER-7).

import type * as wlib from '../../wlib.ts'
import * as usecase from './usecase.ts'
import * as value from './value.ts'

export const registry = {
  'keeper/value/retirement_reason': value.retirement_reason,
  'keeper/value/notes': value.notes,
  'keeper/usecase/retire_a_tool': usecase.retire_a_tool,
  'keeper/usecase/retire_a_tool_input': usecase.retire_a_tool_input,
} satisfies wlib.Registry
