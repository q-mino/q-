// generated

// The path registry of `persona/member` 1.x, a past major (DOM-22, DOM-24,
// PER-17): its whole map, every path of the major with its component, written
// whole or delegated to the next major's, and the input of every leaf, its own
// or delegated; the same paths as the current's, the version apart. The majors
// of the domain list it (`../_majors.ts`).

import type * as wlib from '../../../wlib.ts'
import * as usecase from './_usecase.ts'

export const registry = {
  'persona/member/usecase/borrow_a_tool': usecase.borrow_a_tool,
  'persona/member/usecase/borrow_a_tool_input': usecase.borrow_a_tool_input,
  'persona/member/usecase/return_a_tool': usecase.return_a_tool,
  'persona/member/usecase/return_a_tool_input': usecase.return_a_tool_input,
  'persona/member/usecase/my_loans': usecase.my_loans,
  'persona/member/usecase/my_loans_input': usecase.my_loans_input,
  'persona/member/usecase/my_reservations': usecase.my_reservations,
  'persona/member/usecase/my_reservations_input': usecase.my_reservations_input,
} satisfies wlib.Registry
