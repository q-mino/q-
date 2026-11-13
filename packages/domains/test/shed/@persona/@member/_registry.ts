// generated

// The path registry of `member` (DOM-24): every path with its component, in
// the order of the files. The hat is the persona's segment, after its kind's
// folder (PER-7, DOM-25).

import type * as wlib from '../../wlib.ts'
import * as node from './_node.ts'
import * as usecase from './_usecase.ts'
import * as value from './_value.ts'

export const registry = {
  'persona/member/node/member': node.member,
  'persona/member/usecase/borrow_a_tool': usecase.borrow_a_tool,
  'persona/member/usecase/borrow_a_tool_input': usecase.borrow_a_tool_input,
  'persona/member/usecase/my_loans': usecase.my_loans,
  'persona/member/usecase/my_loans_input': usecase.my_loans_input,
  'persona/member/value/tool_name': value.tool_name,
  'persona/member/value/loan_term': value.loan_term,
} satisfies wlib.Registry
