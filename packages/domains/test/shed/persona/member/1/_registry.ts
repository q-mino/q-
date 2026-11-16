// generated

// The path registry of `member` 1.x (DOM-24, A, 16 Nov 2026 (7)): every leaf
// of the major with its component, over the next major's or delegated, and
// the inputs of its own; the same paths as the current's, the version apart.
// The configurator gives it to the library beside the current's, by major.

import type * as wlib from '../../../wlib.ts'
import * as usecase from './_usecase.ts'

export const registry = {
  'persona/member/usecase/borrow_a_tool': usecase.borrow_a_tool,
  'persona/member/usecase/borrow_a_tool_input': usecase.borrow_a_tool_input,
  'persona/member/usecase/return_a_tool': usecase.return_a_tool,
  'persona/member/usecase/my_loans': usecase.my_loans,
  'persona/member/usecase/my_loans_input': usecase.my_loans_input,
  'persona/member/usecase/my_reservations': usecase.my_reservations,
} satisfies wlib.Registry
