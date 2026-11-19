// generated

// The path registry of `business/loans/an_ongoing_loan` (DOM-24): every path
// with its component, in the order of the twins. The configurator gives it to
// the library, which reads it in reverse, from a component to its path, by
// object identity. The registry of `business/loans` carries it: a folder of a
// domain is its subtree (D105).

import type * as wlib from '../../../../../src/library/index.ts'
import * as node from './_node.ts'
import * as command from './_command.ts'
import * as usecase from './_usecase.ts'

export const registry = {
  'business/loans/an_ongoing_loan/node/an_ongoing_loan': node.an_ongoing_loan,
  'business/loans/an_ongoing_loan/command/the_loan_can_be_extended':
    command.the_loan_can_be_extended,
  'business/loans/an_ongoing_loan/command/extend_the_loan': command.extend_the_loan,
  'business/loans/an_ongoing_loan/command/extend_the_loan_input': command.extend_the_loan_input,
  'business/loans/an_ongoing_loan/command/the_tool_of_the_loan_can_be_corrected':
    command.the_tool_of_the_loan_can_be_corrected,
  'business/loans/an_ongoing_loan/command/correct_the_tool_of_a_loan':
    command.correct_the_tool_of_a_loan,
  'business/loans/an_ongoing_loan/command/correct_the_tool_of_a_loan_input':
    command.correct_the_tool_of_a_loan_input,
  'business/loans/an_ongoing_loan/usecase/extend_the_loan': usecase.extend_the_loan,
  'business/loans/an_ongoing_loan/usecase/correct_the_tool_of_a_loan':
    usecase.correct_the_tool_of_a_loan,
} satisfies wlib.Registry
