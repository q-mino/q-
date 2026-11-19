import { z } from 'zod'
import * as wlib from '../../../../../src/library/index.ts'
import { command, AND, NOT, pick, _loans, tools } from './_scope_command.ts'

// The commands on an ongoing loan (D105, SC-31): the loan is the node's,
// bound once in the context (`context.loan_id`), and the node adds to every
// branch below that it exists and is ongoing; a command here states only
// what it adds.

/**
 * The member may keep the tool longer: the loan is theirs, of the tool they
 * hold, due on the day they read on it, that day not yet over, and no one
 * booked the tool up to the new due day, which would take a booked day from
 * someone.
 */
export const the_loan_can_be_extended = AND({
  it_is_a_loan_of_the_member: _loans.predicate.the_loan_is_of_this_member,
  it_is_of_the_tool_they_hold: _loans.predicate.the_loan_is_of_this_tool,
  it_is_due_on_the_day_they_read: _loans.predicate.the_loan_is_due_on_this_day,
  its_due_date_is_still_ahead: _loans.predicate.the_due_date_of_the_loan_is_still_ahead,
  no_one_booked_the_tool_up_to_the_new_due_day: NOT(
    _loans.predicate.the_tool_is_booked_on_a_day_up_to,
  ),
})

/**
 * The member keeps the tool one loan period more (SC-31): on Friday 13
 * November Marta extends L7, the drill due on Monday 16, to the 30th. A
 * creator reads no state: her phone read the due day on the row of "my
 * loans", and the command checks it. The eve of the 16th, in flight, will
 * remind of nothing; the extension queues the eve of the 30th, under a key
 * of its own. The wait for the overdue stands: on the 17th it finds the due
 * day not over, and the desk looks again the next day.
 */
export const extend_the_loan = command({
  input: z.strictObject({
    tool_id: tools.id.tool_id,
    member_id: _loans.id.member_id,
    due_day: wlib.day,
  }),
  outcomes: {
    the_loan_can_be_extended_so_its_due_day_moves_on: [
      the_loan_can_be_extended,
      _loans.fact.a_loan_has_been_extended,
      pick(_loans.effect, 'wait_until_the_eve_of_the_due_date'),
    ],
  },
  creator: (context) => (input) => ({
    the_loan_can_be_extended_so_its_due_day_moves_on: [
      {
        it_is_a_loan_of_the_member: { loan_id: context.loan_id, member_id: input.member_id },
        it_is_of_the_tool_they_hold: { loan_id: context.loan_id, tool_id: input.tool_id },
        it_is_due_on_the_day_they_read: { loan_id: context.loan_id, due_day: input.due_day },
        its_due_date_is_still_ahead: { loan_id: context.loan_id, now: context.now },
        no_one_booked_the_tool_up_to_the_new_due_day: {
          tool_id: input.tool_id,
          day: _loans.dsl.the_due_day_after_an_extension_of(input.due_day),
        },
      },
      {
        extended_loan: {
          id: context.loan_id,
          due_day: _loans.dsl.the_due_day_after_an_extension_of(input.due_day),
        },
      },
      {
        wait_until_the_eve_of_the_due_date: {
          id: _loans.dsl.the_eve_of_the_loan_extended_to_the_day({
            loan_id: context.loan_id,
            due_day: _loans.dsl.the_due_day_after_an_extension_of(input.due_day),
          }),
          payload: {
            loan_id: context.loan_id,
            tool_id: input.tool_id,
            member_id: input.member_id,
            due_day: _loans.dsl.the_due_day_after_an_extension_of(input.due_day),
          },
          not_before: wlib.start_of(context.time_zone)(
            _loans.dsl.the_eve_of(_loans.dsl.the_due_day_after_an_extension_of(input.due_day)),
          ),
        },
      },
    ],
  }),
})

/**
 * The card of the loan says what the keeper read on it: the tool
 * written, the member, the due day. The tool the member has can go out: in
 * the shed, in service, and on no loan, since the card named another.
 */
export const the_tool_of_the_loan_can_be_corrected = AND({
  its_card_names_the_tool_written: _loans.predicate.the_loan_is_of_this_tool,
  its_card_names_the_member: _loans.predicate.the_loan_is_of_this_member,
  its_card_names_the_due_day: _loans.predicate.the_loan_is_due_on_this_day,
  a_tool_has_the_id_of_the_tool_handed: _loans.predicate.a_tool_has_this_id,
  the_tool_handed_is_in_service: _loans.predicate.the_tool_is_in_service,
  the_tool_handed_is_not_on_loan: NOT(_loans.predicate.the_tool_is_on_loan),
})

/**
 * The keeper corrects the tool on a loan's card (SC-13): Luca wrote the
 * drill on Marta's loan, and handed her the sander. The loan stays, with its
 * dates; its fact stays in the log as recorded, and a new fact corrects it
 * (DOM-22, D101). The eve's wait in flight names the drill, and its return
 * will remind of nothing: the correction queues the eve of the sander,
 * under a key of its own. A creator reads no state: Luca's screen read the
 * card, and the command checks what it says (the member and the due day
 * the new eve carries). Under the node since SC-31: that the loan exists
 * and is ongoing is the node's, and the loan its target. Once the loan is
 * back, a second correction is rejected, where it read "already corrected":
 * the duplicate branch still answers a retry.
 */
export const correct_the_tool_of_a_loan = command({
  input: z.strictObject({
    tool_written: tools.id.tool_id,
    tool_handed: tools.id.tool_id,
    member_id: _loans.id.member_id,
    due_day: wlib.day,
  }),
  outcomes: {
    the_card_named_another_tool_so_it_is_corrected: [
      the_tool_of_the_loan_can_be_corrected,
      _loans.fact.the_tool_of_a_loan_has_been_corrected,
      pick(_loans.effect, 'wait_until_the_eve_of_the_due_date'),
    ],
    the_card_already_names_the_tool_handed_so_nothing_changes: [
      _loans.predicate.the_loan_is_of_this_tool,
      _loans.fact.the_tool_of_a_loan_has_been_corrected_again,
    ],
  },
  creator: (context) => (input) => ({
    the_card_named_another_tool_so_it_is_corrected: [
      {
        its_card_names_the_tool_written: { loan_id: context.loan_id, tool_id: input.tool_written },
        its_card_names_the_member: { loan_id: context.loan_id, member_id: input.member_id },
        its_card_names_the_due_day: { loan_id: context.loan_id, due_day: input.due_day },
        a_tool_has_the_id_of_the_tool_handed: { tool_id: input.tool_handed },
        the_tool_handed_is_in_service: { tool_id: input.tool_handed },
        the_tool_handed_is_not_on_loan: { tool_id: input.tool_handed },
      },
      {
        corrected_loan: { id: context.loan_id, tool_id: input.tool_handed },
        tool_named_before: input.tool_written,
      },
      {
        wait_until_the_eve_of_the_due_date: {
          id: _loans.dsl.the_eve_of_the_loan_corrected_to_the_tool({
            loan_id: context.loan_id,
            tool_id: input.tool_handed,
          }),
          payload: {
            loan_id: context.loan_id,
            tool_id: input.tool_handed,
            member_id: input.member_id,
            due_day: input.due_day,
          },
          not_before: wlib.start_of(context.time_zone)(_loans.dsl.the_eve_of(input.due_day)),
        },
      },
    ],
    the_card_already_names_the_tool_handed_so_nothing_changes: [
      { loan_id: context.loan_id, tool_id: input.tool_handed },
      { loan_id: context.loan_id, tool_id: input.tool_handed },
    ],
  }),
})
