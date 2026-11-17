// generated

// The path registry of `member` (DOM-24): every path with its component, in
// the order of the files. The hat is the persona's segment, after its kind's
// folder (PER-7, DOM-25).

import type * as wlib from '../../wlib.ts'
import * as node from './_node.ts'
import * as usecase from './_usecase.ts'
import * as value from './_value.ts'
import * as version from './_version.ts'

export const registry = {
  'persona/member/version/member': version.member,
  'persona/member/node/member': node.member,
  'persona/member/usecase/borrow_a_tool': usecase.borrow_a_tool,
  'persona/member/usecase/borrow_a_tool_input': usecase.borrow_a_tool_input,
  'persona/member/usecase/take_the_tool_you_booked': usecase.take_the_tool_you_booked,
  'persona/member/usecase/take_the_tool_you_booked_input': usecase.take_the_tool_you_booked_input,
  'persona/member/usecase/return_a_tool': usecase.return_a_tool,
  'persona/member/usecase/return_a_tool_input': usecase.return_a_tool_input,
  'persona/member/usecase/my_loans': usecase.my_loans,
  'persona/member/usecase/my_loans_input': usecase.my_loans_input,
  'persona/member/usecase/my_reservations': usecase.my_reservations,
  'persona/member/usecase/my_reservations_input': usecase.my_reservations_input,
  'persona/member/usecase/my_reservations_in_the_workshop': usecase.my_reservations_in_the_workshop,
  'persona/member/usecase/my_reservations_in_the_workshop_input':
    usecase.my_reservations_in_the_workshop_input,
  'persona/member/value/tool_name': value.tool_name,
  'persona/member/value/loan_term': value.loan_term,
} satisfies wlib.Registry
