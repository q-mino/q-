import { z } from 'zod'
import { node, AND, _loans } from './_scope_node.ts'

// The node of `an_ongoing_loan` (D105, SC-31): the loan the member still
// has, and what the desk does to it while it is out. It binds the loan,
// given down in the context, so that no command below names it again; it
// adds to every command below that the loan exists and is ongoing, in the
// words of `loans`, evaluated with the write. A rule true for whoever asks
// (D105.1): who may extend or correct is the persona's.

/** L7, the drill Marta took home on 2 November, due on the 16th. */
export const an_ongoing_loan = node({
  binds: z.strictObject({ loan_id: _loans.id.loan_id }),
  requires: AND({
    a_loan_has_the_requested_id: _loans.predicate.a_loan_has_this_id,
    the_requested_loan_is_ongoing: _loans.predicate.the_loan_is_ongoing,
  }),
  creator: () => (bound) => ({
    a_loan_has_the_requested_id: { loan_id: bound.loan_id },
    the_requested_loan_is_ongoing: { loan_id: bound.loan_id },
  }),
})
