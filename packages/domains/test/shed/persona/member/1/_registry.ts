// generated

// The path registry of `member` 1.x (DOM-24, A, 16 Nov 2026 (7)): every leaf
// of the major with its component, over the next major's or delegated, and
// the input of every leaf, its own or, for a delegated leaf, the next major's
// delegated (C, 18 Nov 2026 (7)); the same paths as the current's, the
// version apart: the map of 1.x, which the JSON Schema export for its clients
// and CI's comparison by path and version read. The persona's majors list it
// (`../_majors.ts`), where the library finds a leaf at the version a message
// carries (A, 17 Nov 2026).

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
