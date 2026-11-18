import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import {
  command_use_case_over,
  read_use_case_over,
  dsl,
  value,
  tools,
  loans,
} from './_scope_usecase.ts'

// The use cases of `member`, the leaves of its tree (PER-6): who borrows from
// the shed. The member is the number of the card the node found
// (`context.card`), given to the business as its input (D33), never from the
// client (PER-8); the outcome and the entries are projected in the member's
// words (D45). A node that closes the request answers for them
// (`not_found`), with no event of theirs; a leaf's own limit closes it with
// `refused`.

/** Marta takes the drill home, while her card is valid. */
export const borrow_a_tool = command_use_case_over({
  use_case: loans.usecase.borrow_a_tool,
  input: z.strictObject({ loan_id: loans.id.loan_id, tool_id: tools.id.tool_id }),
  is_refused_unless: {
    /** Card M-12 is valid until 31 March 2027: on 1 April Marta borrows no more. */
    the_member_card_is_valid_today: (context) => () =>
      dsl.the_card_is_valid_on(context.now)(context.card),
  },
  creator: (context) => (input) => ({
    loan_id: input.loan_id,
    tool_id: input.tool_id,
    member_id: context.card.id,
  }),
  events: {
    you_have_the_tool: z.strictObject({
      loan_id: loans.id.loan_id,
      tool_id: tools.id.tool_id,
      due_day: wlib.day,
    }),
    you_already_have_the_tool: z.strictObject({ tool_id: tools.id.tool_id }),
    /**
     * Not in the shed, retired, or lent to someone else: the member need not
     * know which, and knows which tool they asked for.
     */
    the_tool_is_not_available: z.strictObject({}),
  },
  projection: {
    the_tool_is_available_so_it_is_lent: (fact) => ({
      event: 'you_have_the_tool',
      payload: {
        loan_id: fact.new_loan.id,
        tool_id: fact.new_loan.tool_id,
        due_day: fact.new_loan.due_day,
      },
    }),
    the_member_already_has_the_tool_so_nothing_changes: (fact) => ({
      event: 'you_already_have_the_tool',
      payload: { tool_id: fact.tool_id },
    }),
    rejected: () => ({ event: 'the_tool_is_not_available', payload: {} }),
  },
})

/**
 * Gianni takes the drill he booked for Thursday, from the row of his
 * reservation (R8) in "my reservations", while his card is valid: the desk
 * lends it and takes the reservation up, one fact in two parts (SC-10). The
 * leaf answers from the loan, the branch's own part; R8 leaves his "my
 * reservations" by its stream, from the reservation's part.
 */
export const take_the_tool_you_booked = command_use_case_over({
  use_case: loans.usecase.lend_a_booked_tool,
  input: z.strictObject({
    loan_id: loans.id.loan_id,
    reservation_id: loans.id.reservation_id,
    tool_id: tools.id.tool_id,
  }),
  is_refused_unless: {
    the_member_card_is_valid_today: (context) => () =>
      dsl.the_card_is_valid_on(context.now)(context.card),
  },
  creator: (context) => (input) => ({
    loan_id: input.loan_id,
    reservation_id: input.reservation_id,
    tool_id: input.tool_id,
    member_id: context.card.id,
  }),
  events: {
    you_have_the_tool: z.strictObject({
      loan_id: loans.id.loan_id,
      tool_id: tools.id.tool_id,
      due_day: wlib.day,
    }),
    you_already_took_the_tool: z.strictObject({ reservation_id: loans.id.reservation_id }),
    /**
     * Not booked by the member for today, in the workshop, or still out with
     * someone else: the member need not know which.
     */
    the_tool_is_not_available: z.strictObject({}),
  },
  projection: {
    the_member_booked_the_tool_for_today_so_it_is_lent: (fact) => ({
      event: 'you_have_the_tool',
      payload: {
        loan_id: fact.new_loan.id,
        tool_id: fact.new_loan.tool_id,
        due_day: fact.new_loan.due_day,
      },
    }),
    the_member_already_took_the_tool_so_nothing_changes: (fact) => ({
      event: 'you_already_took_the_tool',
      payload: { reservation_id: fact.reservation_id },
    }),
    rejected: () => ({ event: 'the_tool_is_not_available', payload: {} }),
  },
})

/**
 * Marta brings the drill back, and her screen follows what her return sets
 * going (D58.2, A, 16 Nov 2026 (5)): whole, it ends there; damaged, it stays
 * open until the workshop takes the drill in, a fact of `tools` that a
 * standing order records with the correlation of her return, or until its
 * wait is over. The workshop's own end (the drill back in service on
 * Friday) is not her flow.
 */
export const return_a_tool = command_use_case_over({
  use_case: loans.usecase.return_a_tool,
  input: z.strictObject({
    loan_id: loans.id.loan_id,
    tool_id: tools.id.tool_id,
    condition: z.enum(['good', 'damaged']),
  }),
  creator: () => (input) => ({
    loan_id: input.loan_id,
    tool_id: input.tool_id,
    condition: input.condition,
  }),
  events: {
    you_returned_the_tool: z.strictObject({ tool_id: tools.id.tool_id }),
    you_returned_the_tool_damaged: z.strictObject({ tool_id: tools.id.tool_id }),
    you_had_already_returned_it: z.strictObject({ loan_id: loans.id.loan_id }),
    /** No such loan, or not of this tool: the member knows which they meant. */
    the_return_is_not_possible: z.strictObject({}),
    the_tool_is_in_the_workshop: z.strictObject({ tool_id: tools.id.tool_id }),
    the_tool_was_already_in_the_workshop: z.strictObject({ tool_id: tools.id.tool_id }),
    the_tool_had_been_retired: z.strictObject({ tool_id: tools.id.tool_id }),
  },
  ends: [
    'you_returned_the_tool',
    'you_had_already_returned_it',
    'the_return_is_not_possible',
    'the_tool_is_in_the_workshop',
    'the_tool_was_already_in_the_workshop',
    'the_tool_had_been_retired',
  ],
  projection: {
    the_loan_is_ongoing_so_it_is_closed: (fact) =>
      dsl.the_tool_came_back_damaged(fact)
        ? {
            event: 'you_returned_the_tool_damaged',
            payload: { tool_id: fact.returned_loan.tool_id },
          }
        : { event: 'you_returned_the_tool', payload: { tool_id: fact.returned_loan.tool_id } },
    the_loan_was_already_returned_so_nothing_changes: (fact) => ({
      event: 'you_had_already_returned_it',
      payload: { loan_id: fact.loan_id },
    }),
    rejected: () => ({ event: 'the_return_is_not_possible', payload: {} }),
  },
  follows: {
    facts: [
      tools.fact.a_tool_has_been_sent_to_repair,
      tools.fact.the_tool_was_already_under_repair,
      tools.fact.the_tool_was_retired_before_the_repair,
    ],
    projection: {
      a_tool_has_been_sent_to_repair: (fact) => ({
        event: 'the_tool_is_in_the_workshop',
        payload: { tool_id: fact.tool_under_repair.id },
      }),
      the_tool_was_already_under_repair: (fact) => ({
        event: 'the_tool_was_already_in_the_workshop',
        payload: { tool_id: fact.tool_id },
      }),
      the_tool_was_retired_before_the_repair: (fact) => ({
        event: 'the_tool_had_been_retired',
        payload: { tool_id: fact.tool_id },
      }),
    },
    at_most: 60_000,
  },
})
/**
 * Marta keeps the drill two more weeks, from the row of L7 in "my loans",
 * while her card is valid (SC-31): she sends the loan, the tool and the due
 * day the row shows, and the desk moves the due day on, unless someone
 * booked the drill up to then; the row follows by its stream. The loan is
 * the target of the node above the business's leaf (`an_ongoing_loan`),
 * given beside the rest of the input, flat. Told apart, a booking by someone
 * else; any other failure, the loan's or the node's, the member need not
 * know which.
 */
export const extend_your_loan = command_use_case_over({
  use_case: loans.an_ongoing_loan.usecase.extend_the_loan,
  input: z.strictObject({
    loan_id: loans.id.loan_id,
    tool_id: tools.id.tool_id,
    due_day: wlib.day,
  }),
  is_refused_unless: {
    the_member_card_is_valid_today: (context) => () =>
      dsl.the_card_is_valid_on(context.now)(context.card),
  },
  creator: (context) => (input) => ({
    loan_id: input.loan_id,
    tool_id: input.tool_id,
    due_day: input.due_day,
    member_id: context.card.id,
  }),
  events: {
    your_loan_is_extended: z.strictObject({ loan_id: loans.id.loan_id, due_day: wlib.day }),
    /** Gianni booked the drill for Thursday: Marta brings it back on its due day. */
    someone_booked_the_tool: z.strictObject({}),
    /** Not hers, not of that tool, not due on that day, past its due date, or back in the shed. */
    the_loan_cannot_be_extended: z.strictObject({}),
  },
  projection: {
    the_loan_can_be_extended_so_its_due_day_moves_on: (fact) => ({
      event: 'your_loan_is_extended',
      payload: { loan_id: fact.extended_loan.id, due_day: fact.extended_loan.due_day },
    }),
    rejected: (failures) =>
      dsl.only_a_booking_stands_in_the_way(failures)
        ? { event: 'someone_booked_the_tool', payload: {} }
        : { event: 'the_loan_cannot_be_extended', payload: {} },
  },
})

/**
 * Marta opens "my loans": the tools she has at home, when each is due and
 * whether it is overdue, then follows them live; a loan appears, the due
 * date passes on one, a return takes it away, a tool renamed by the keeper
 * shows its new name (SC-19). When the due date passes she
 * reads "your loan is overdue", with the row. Her card may have expired: she
 * still sees what she must bring back.
 *
 * Each row tells which of its buttons is active (SC-33): bring it back,
 * always, scanning at the desk the tool she brings, which the row cannot
 * know; keep it longer, from the row as she would send it, unless someone
 * booked the tool (the ladder, booked by Gianni for Thursday), the loan is
 * past its due date (the sander), or her card is not valid today. Gianni
 * books the drill while she reads: its row changes.
 */
export const my_loans = read_use_case_over({
  use_case: loans.usecase.the_ongoing_loans_of_a_member,
  input: z.strictObject({}),
  actions: {
    bring_it_back: return_a_tool,
    keep_it_longer: extend_your_loan,
  },
  creator: (context) => () => ({
    query: { member_id: context.card.id },
    actions: {
      bring_it_back: (loan) => ({
        loan_id: loan.id,
        tool_id: wlib.given_by_the_caller,
        condition: wlib.given_by_the_caller,
      }),
      keep_it_longer: (loan) => ({
        loan_id: loan.id,
        tool_id: loan.tool_id,
        due_day: loan.due_day,
      }),
    },
  }),
  entry: z.strictObject({
    loan_id: loans.id.loan_id,
    tool_id: tools.id.tool_id,
    tool_name: value.tool_name,
    start_date: wlib.date_time,
    due_day: wlib.day,
    term: value.loan_term,
    bring_it_back: value.return_on_the_row,
    keep_it_longer: value.extension_on_the_row,
  }),
  projection: (entry) => ({
    loan_id: entry.id,
    tool_id: entry.tool_id,
    tool_name: entry.tool_name,
    start_date: entry.start_date,
    due_day: entry.due_day,
    term: entry.term,
    bring_it_back: dsl.the_return_on_the_row(entry.bring_it_back),
    keep_it_longer: dsl.the_extension_on_the_row(entry.keep_it_longer),
  }),
  stream: {
    identity: 'loan_id',
    events: {
      /** The drill was due yesterday and Marta still has it: the row says when, and which. */
      your_loan_is_overdue: z.strictObject({}),
    },
    facts: {
      a_loan_has_become_overdue: () => ({ event: 'your_loan_is_overdue', payload: {} }),
    },
  },
})

/**
 * Gianni opens "my reservations": the tools he booked, from today on, the
 * closest day first, then follows them live; a booking appears, a
 * cancellation takes one away. When a tool he booked goes to the workshop
 * he reads "the tool you booked is in repair", with the row: the notice the
 * desk recorded for his reservation, a part of a step of its round, which
 * the stream projects as the part that touches the row (A, 16 Nov 2026 (6)).
 */
export const my_reservations = read_use_case_over({
  use_case: loans.usecase.the_reservations_of_a_member,
  input: z.strictObject({}),
  creator: (context) => () => ({ query: { member_id: context.card.id } }),
  entry: z.strictObject({
    reservation_id: loans.id.reservation_id,
    tool_id: tools.id.tool_id,
    tool_name: value.tool_name,
    day: wlib.day,
  }),
  projection: (entry) => ({
    reservation_id: entry.id,
    tool_id: entry.tool_id,
    tool_name: entry.tool_name,
    day: entry.day,
  }),
  stream: {
    identity: 'reservation_id',
    events: {
      /** The drill Gianni booked for Thursday went to the workshop on Tuesday: the row says which, and when. */
      the_tool_you_booked_is_in_repair: z.strictObject({}),
    },
    facts: {
      a_member_has_been_notified_of_the_repair: () => ({
        event: 'the_tool_you_booked_is_in_repair',
        payload: {},
      }),
    },
  },
})

/**
 * Gianni opens "in the workshop", among his reservations: those whose tool
 * is in repair, which may not be ready on their day. On Tuesday the drill
 * he booked for Thursday goes to the workshop and its row comes in; on
 * Friday it is back in service and the row goes: facts of `tools`, which
 * touch no reservation, by what they change of the selection (SC-20).
 */
export const my_reservations_in_the_workshop = read_use_case_over({
  use_case: loans.usecase.the_reservations_of_a_member_in_the_workshop,
  input: z.strictObject({}),
  creator: (context) => () => ({ query: { member_id: context.card.id } }),
  entry: z.strictObject({
    reservation_id: loans.id.reservation_id,
    tool_id: tools.id.tool_id,
    tool_name: value.tool_name,
    day: wlib.day,
  }),
  projection: (entry) => ({
    reservation_id: entry.id,
    tool_id: entry.tool_id,
    tool_name: entry.tool_name,
    day: entry.day,
  }),
  stream: { identity: 'reservation_id' },
})
