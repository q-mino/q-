import { describe, expect, test } from 'vitest'
import { z } from 'zod'
import * as zz from '../../../src/library/index.ts'
import {
  accounts,
  all,
  first,
  oracle,
  quiet,
  time_zone,
  until_caught_up,
  type Shed,
  type Who,
} from './oracle.ts'
import { persona } from '../persona/_node.ts'
import { registry as persona_registry } from '../persona/_registry.ts'
import { registry as member_registry } from '../persona/member/_registry.ts'
import { majors as member_majors } from '../persona/member/_majors.ts'
import { borrow_a_tool } from '../persona/member/_usecase.ts'
import { command_use_case_over } from '../persona/member/_scope.ts'
import { the_card_is_valid_today } from '../persona/member/_dsl.ts'
import { reserve_a_tool } from '../business/loans/_usecase.ts'
import { reservation_id } from '../business/loans/_id.ts'
import { a_tool_has_been_booked } from '../business/loans/_fact.ts'
import { the_day_is_within_the_booking_window, today } from '../business/loans/_dsl.ts'
import { tool_id } from '../business/tools/_id.ts'
import { registry as accounts_registry } from '../auth/accounts/_registry.ts'
import {
  the_hats_of_a_key,
  the_hats_of_an_account,
  the_member_card_of_an_account,
} from '../auth/accounts/_lookup.ts'
import { accounts_lookups, type AccountsState } from '../adapter/memory/accounts.ts'

// A retry after the input's window over `now` moved (PER-5, A, 19 Nov 2026;
// a gap of the paper, 8.4): Gianni books the ladder on Thursday for Friday,
// the answer is lost, and his phone retries on Friday morning with the same
// operation. A command leaf looks its operation up in its scope (the caller
// and the hat) once the hat is claimed, before its schema: recorded with the
// same fingerprint, the fact recorded, projected by the leaf; with another,
// `identity_already_used`; none, on to the schema, whose window ("from
// tomorrow") no longer takes Friday. No leaf of Shed books a tool, so the
// test wires a tree of its own (SC-29), with a leaf over `reserve_a_tool`
// whose input keeps the business's window, and the lookups of `accounts`
// over a state it changes: a card that expires, a hat revoked meanwhile.
// The business's port, and a step's, look the operation up too, before
// their schema (DOM-11, A, 19 Nov 2026): a caller that is not a leaf, the
// harness's entry or a reaction delivered again after the window moved,
// reads its fact. No reaction of Shed books, so the test wires one of its
// own over `reserve_a_tool` (`the_drill_goes_with_the_ladder`).

const thursday = '2026-11-19T15:00:00.000Z'
const friday = '2026-11-20T13:00:00.000Z'
const gianni: Who = { identified_by: 'account', id: 'A-GIANNI' }

/** Gianni's request for the ladder: his operation, in his scope, the hat and his account. */
const booking = { operation: 'B-1', scope: 'member/A-GIANNI' }

/** Gianni books a tool for a day, as the business's window allows it, while his card is valid. */
const book_a_tool = command_use_case_over({
  use_case: reserve_a_tool,
  input: (context) =>
    z
      .strictObject({ reservation_id, tool_id, day: zz.day })
      .refine((input) => the_day_is_within_the_booking_window(input.day, today(context)), {
        path: ['day'],
      }),
  is_refused_unless: {
    the_member_card_is_valid_today: (context) => () =>
      the_card_is_valid_today(context)(context.card),
  },
  creator: (context) => (input) => ({
    reservation_id: input.reservation_id,
    tool_id: input.tool_id,
    member_id: context.card.id,
    day: input.day,
  }),
  events: {
    the_tool_is_yours_that_day: z.strictObject({ reservation_id, day: zz.day }),
    you_already_booked_it: z.strictObject({ day: zz.day }),
    the_tool_is_not_free_that_day: z.strictObject({}),
  },
  projection: {
    the_tool_is_free_that_day_so_it_is_booked: (fact) => ({
      event: 'the_tool_is_yours_that_day',
      payload: { reservation_id: fact.new_reservation.id, day: fact.new_reservation.day },
    }),
    the_member_already_booked_the_tool_so_nothing_changes: (fact) => ({
      event: 'you_already_booked_it',
      payload: { day: fact.day },
    }),
    rejected: () => ({ event: 'the_tool_is_not_free_that_day', payload: {} }),
  },
})

const book_path = 'persona/member/usecase/book_a_tool'

/** Gianni's account: the hat of member, card M-7 valid until the day given. */
const gianni_with = (hats: readonly string[], valid_until: string): AccountsState => {
  const written = accounts({
    hats: { 'A-GIANNI': hats },
    member_cards: { 'A-GIANNI': { id: 'M-7', valid_until } },
  })
  return {
    hats: written.hats ?? new Map(),
    member_cards: written.member_cards ?? new Map(),
    key_hats: written.key_hats ?? new Map(),
  }
}

/**
 * The shed with the ladder, and the member's tree wired by the test: its
 * leaf that books, the shed's `borrow_a_tool` (whose 1.x leaf reads the
 * point's context), the lookups of `accounts` over a state the test sets.
 */
const the_shed = async (account: AccountsState) => {
  const shed = await oracle()
  await first(
    shed.tools.add_a_tool(shed.at('2026-11-05T13:00:00.000Z'), {
      id: 'ladder',
      name: 'Ladder',
      category: 'ladder',
    }),
  )
  await first(
    shed.tools.add_a_tool(shed.at('2026-11-05T13:01:00.000Z'), {
      id: 'drill',
      name: 'Cordless drill',
      category: 'power',
    }),
  )
  const held = { account }
  const accounts_ports = zz.lookup_ports({
    registry: accounts_registry,
    lookups: { the_hats_of_an_account, the_hats_of_a_key, the_member_card_of_an_account },
  })(accounts_lookups(() => held.account))
  const member = zz.tree_ports({
    registry: { ...persona_registry, ...member_registry, [book_path]: book_a_tool },
    versions: shed.versions,
    majors: { 2: { ...member_majors[2], [book_path]: book_a_tool }, 1: member_majors[1] },
    top: persona,
    use_cases: { book_a_tool, borrow_a_tool },
  })({
    invoked: { ...shed.invoked, 'auth/accounts': accounts_ports },
    log: shed.log,
    trace: shed.trace,
  })
  /** Gianni's account changes meanwhile: his card, his hats. */
  const meanwhile = (account: AccountsState) => {
    Object.assign(held, { account })
  }
  /** The facts the shed recorded, in the order of its log. */
  const facts = async (): Promise<readonly unknown[]> =>
    (await until_caught_up(shed.log(undefined)[Symbol.asyncIterator]())).flatMap((event) =>
      event.event === 'fact' ? [event.fact.parts.map((part) => part.path)] : [],
    )
  return { shed, member, meanwhile, facts }
}

const the_ladder_on_friday = { reservation_id: 'R8', tool_id: 'ladder', day: '2026-11-20' }

describe('PER-5, a retry after the input’s window over `now` moved', () => {
  test('Gianni’s phone retries on Friday morning: the booking recorded on Thursday, not `invalid_request`', async () => {
    const { shed, member, facts } = await the_shed(gianni_with(['member'], '2027-03-31'))
    const booked = [
      { event: 'the_tool_is_yours_that_day', payload: { reservation_id: 'R8', day: '2026-11-20' } },
    ]
    // Thursday: booked; the answer is lost on its way to the phone.
    expect(
      await all(
        member.book_a_tool(shed.as(gianni, '2.0.0').at(thursday, booking), the_ladder_on_friday),
      ),
    ).toEqual(booked)
    const recorded = await facts()
    // Friday morning: the same operation, the same input, the booking.
    expect(
      await all(
        member.book_a_tool(shed.as(gianni, '2.0.0').at(friday, booking), the_ladder_on_friday),
      ),
    ).toEqual(booked)
    // No second fact: the retry was read, not executed.
    expect(await facts()).toEqual(recorded)
    // The same request under a new operation meets the window that moved.
    expect(
      await all(
        member.book_a_tool(
          shed.as(gianni, '2.0.0').at(friday, { ...booking, operation: 'B-2' }),
          the_ladder_on_friday,
        ),
      ),
    ).toEqual([{ event: 'invalid_request', reason: 'input_not_in_schema' }])
  })

  test('another fingerprint under the same operation is `identity_already_used`, before the schema', async () => {
    const { shed, member, facts } = await the_shed(gianni_with(['member'], '2027-03-31'))
    await all(
      member.book_a_tool(shed.as(gianni, '2.0.0').at(thursday, booking), the_ladder_on_friday),
    )
    const recorded = await facts()
    // Friday: his phone, rebuilt, sends Saturday under Thursday's operation.
    expect(
      await all(
        member.book_a_tool(shed.as(gianni, '2.0.0').at(friday, booking), {
          ...the_ladder_on_friday,
          day: '2026-11-21',
        }),
      ),
    ).toEqual([{ event: 'identity_already_used' }])
    // So, too, a field that its schema does not take: the lookup comes first.
    const with_a_priority = { ...the_ladder_on_friday, priority: 'high' }
    expect(
      await all(member.book_a_tool(shed.as(gianni, '2.0.0').at(friday, booking), with_a_priority)),
    ).toEqual([{ event: 'identity_already_used' }])
    expect(await facts()).toEqual(recorded)
    expect(
      shed
        .traced()
        .map(({ path, operation, answered, why }) => ({ path, operation, answered, why })),
    ).toEqual(
      Array.from({ length: 2 }, () => ({
        path: book_path,
        operation: { id: 'B-1', scope: 'member/A-GIANNI' },
        answered: { event: 'identity_already_used' },
        why: { closed_by: 'the_business', outcome: { outcome: 'identity_already_used' } },
      })),
    )
  })

  test('the outcome of his own operation is what he already knows: a card expired, a hat revoked meanwhile', async () => {
    const { shed, member, meanwhile } = await the_shed(gianni_with(['member'], '2026-11-19'))
    const booked = [
      { event: 'the_tool_is_yours_that_day', payload: { reservation_id: 'R8', day: '2026-11-20' } },
    ]
    expect(
      await all(
        member.book_a_tool(shed.as(gianni, '2.0.0').at(thursday, booking), the_ladder_on_friday),
      ),
    ).toEqual(booked)
    // Friday: his card expired on Thursday; the leaf's limit, which reads
    // `now`, refuses a new request, not his retry.
    expect(
      await all(
        member.book_a_tool(shed.as(gianni, '2.0.0').at(friday, booking), the_ladder_on_friday),
      ),
    ).toEqual(booked)
    expect(
      await all(
        member.book_a_tool(shed.as(gianni, '2.0.0').at(friday, { ...booking, operation: 'B-3' }), {
          ...the_ladder_on_friday,
          day: '2026-11-21',
        }),
      ),
    ).toEqual([{ event: 'refused', reasons: ['the_member_card_is_valid_today'] }])
    // The keeper takes his hat of member off: a new request is not found,
    // his retry still reads his booking.
    meanwhile(gianni_with([], '2026-11-19'))
    expect(
      await all(
        member.book_a_tool(shed.as(gianni, '2.0.0').at(friday, booking), the_ladder_on_friday),
      ),
    ).toEqual(booked)
    expect(
      await all(
        member.book_a_tool(shed.as(gianni, '2.0.0').at(friday, { ...booking, operation: 'B-4' }), {
          ...the_ladder_on_friday,
          day: '2026-11-21',
        }),
      ),
    ).toEqual([{ event: 'not_found' }])
  })

  test('at a past major the recorded fact comes back in its words, after the nodes, whose point the steps back read', async () => {
    const { shed, member, meanwhile, facts } = await the_shed(gianni_with(['member'], '2026-11-19'))
    const older = zz.semver.parse('1.2.0')
    const borrowing = { operation: 'L-1', scope: 'member/A-GIANNI' }
    const the_drill = { loan_id: 'L5', tool_id: 'drill' }
    const lent = [
      {
        event: 'you_have_the_tool',
        payload: { ...the_drill, due_date: '2026-12-04T04:59:59.999Z' },
      },
    ]
    // Thursday, from his old phone at 1.2.0: the drill, due at an instant.
    expect(
      await all(member.borrow_a_tool(shed.as(gianni, older).at(thursday, borrowing), the_drill)),
    ).toEqual(lent)
    const recorded = await facts()
    // Friday, his card expired: the retry reads the loan in the words of 1.x.
    expect(
      await all(member.borrow_a_tool(shed.as(gianni, older).at(friday, borrowing), the_drill)),
    ).toEqual(lent)
    expect(await facts()).toEqual(recorded)
    // His hat revoked meanwhile: at a past major the nodes close first (with
    // its case), where at the current major the retry reads its fact.
    meanwhile(gianni_with([], '2026-11-19'))
    expect(
      await all(member.borrow_a_tool(shed.as(gianni, older).at(friday, borrowing), the_drill)),
    ).toEqual([{ event: 'not_found' }])
    expect(
      await all(member.borrow_a_tool(shed.as(gianni, '2.0.0').at(friday, borrowing), the_drill)),
    ).toEqual([{ event: 'you_have_the_tool', payload: { ...the_drill, due_day: '2026-12-03' } }])
  })

  test('a caller that is not a leaf: the business’s port looks the operation up before its schema (DOM-11)', async () => {
    const { shed, member, facts } = await the_shed(gianni_with(['member'], '2027-03-31'))
    // Thursday, through the harness's entry, a caller that is not a leaf:
    // the desk books the ladder for Gianni, for Friday.
    const for_gianni = { ...the_ladder_on_friday, member_id: 'M-7' }
    const desk = { operation: 'D-1', scope: 'keeper/luca' }
    const booked = await first(shed.loans.reserve_a_tool(shed.at(thursday, desk), for_gianni))
    expect(booked).toMatchObject({
      outcome: 'applied',
      branch: 'the_tool_is_free_that_day_so_it_is_booked',
    })
    const recorded = await facts()
    // Friday morning: the same operation, the same input, the booking as it
    // was, at its position; no second fact.
    expect(await first(shed.loans.reserve_a_tool(shed.at(friday, desk), for_gianni))).toEqual(
      booked,
    )
    expect(await facts()).toEqual(recorded)
    // Another input under the operation, an undeclared field included:
    // `identity_already_used`, before the schema.
    for (const another of [
      { ...for_gianni, day: '2026-11-21' },
      { ...for_gianni, priority: 'high' },
    ]) {
      expect(await first(shed.loans.reserve_a_tool(shed.at(friday, desk), another))).toEqual({
        outcome: 'identity_already_used',
      })
    }
    // The same request under a new operation meets the window that moved.
    expect(
      await first(
        shed.loans.reserve_a_tool(shed.at(friday, { ...desk, operation: 'D-2' }), for_gianni),
      ),
    ).toEqual({ outcome: 'invalid_request' })
    // A leaf's operation met at the business's port is another request: its
    // fingerprint is over the leaf's path and input (LIB-11).
    await all(
      member.book_a_tool(shed.as(gianni, '2.0.0').at(thursday, booking), {
        ...the_ladder_on_friday,
        reservation_id: 'R9',
        tool_id: 'drill',
      }),
    )
    expect(
      await first(
        shed.loans.reserve_a_tool(shed.at(friday, booking), {
          ...for_gianni,
          reservation_id: 'R9',
          tool_id: 'drill',
        }),
      ),
    ).toEqual({ outcome: 'identity_already_used' })
  })

  test('a step’s port looks its operation up before its schema too (DOM-11, DOM-20)', async () => {
    const { shed } = await the_shed(gianni_with(['member'], '2027-03-31'))
    await first(
      shed.loans.reserve_a_tool(shed.at(thursday), { ...the_ladder_on_friday, member_id: 'M-7' }),
    )
    await first(
      shed.loans.cancel_the_reservations_of_a_tool(shed.at(thursday), { tool_id: 'ladder' }),
    )
    const step = (instant: string, input: { readonly tool_id: string }) =>
      first(
        shed.loans.continue_the_cancellation_of_reservations(
          shed.at(instant, { operation: 'S-1' }),
          input,
        ),
      )
    const one = await step(thursday, { tool_id: 'ladder' })
    expect(one).toMatchObject({ outcome: 'applied', branch: 'advances' })
    // Friday, the same step under its operation: its fact; with a field its
    // schema does not take, `identity_already_used`, before the schema.
    expect(await step(friday, { tool_id: 'ladder' })).toEqual(one)
    const with_a_priority = { tool_id: 'ladder', priority: 'high' }
    expect(await step(friday, with_a_priority)).toEqual({
      outcome: 'identity_already_used',
    })
  })

  test('a reaction delivered again after the window moved reads its fact, not a dead letter (DOM-16)', async () => {
    const { shed, member, facts } = await the_shed(gianni_with(['member'], '2027-03-31'))
    const consumers = companion_consumers(shed)
    // Thursday: Gianni books the ladder for Friday; the standing order books
    // the drill for him too; the consumer falls before saving its position.
    const thursdays = consumers.started(thursday)
    await all(
      member.book_a_tool(shed.as(gianni, '2.0.0').at(thursday, booking), the_ladder_on_friday),
    )
    await quiet()
    await thursdays.stop()
    const recorded = await facts()
    expect(recorded.slice(-2)).toEqual([
      ['business/loans/fact/a_tool_has_been_booked'],
      ['business/loans/fact/a_tool_has_been_booked'],
    ])
    // Friday morning the consumer starts again: the ladder's booking comes
    // again, the drill's under the same operation, the same input, which
    // the window no longer takes; it reads the drill's booking.
    const fridays = consumers.started(friday)
    await quiet()
    await fridays.stop()
    expect(consumers.held()).toEqual([])
    expect(await facts()).toEqual(recorded)
  })
})

/** The path of the harness's standing order (`the_drill_goes_with_the_ladder`): of the test, never Shed's. */
const companion_path = 'reaction/companion/reaction/the_drill_goes_with_the_ladder'

/**
 * A standing order of the test's (Shed has none that books, SC-29): who books
 * the ladder gets the drill for its anchors, the same day. Its reaction
 * invokes `reserve_a_tool`, whose input keeps the business's window over
 * `now`, so a delivery that comes again after the window moved meets it.
 */
const the_drill_goes_with_the_ladder = zz.builders_at<zz.RootContext>().reaction({
  when: a_tool_has_been_booked,
  invokes: reserve_a_tool,
  translation: (fact) =>
    fact.new_reservation.tool_id === 'ladder'
      ? {
          reservation_id: `${fact.new_reservation.id}-drill`,
          tool_id: 'drill',
          member_id: fact.new_reservation.member_id,
          day: fact.new_reservation.day,
        }
      : zz.nothing,
})

/**
 * The consumer of the standing order, over the shed's log and the port of
 * `reserve_a_tool`, with a durable state of its own that saves no position
 * (it falls before each advance, TST-4), started at an instant.
 */
const companion_consumers = (shed: Shed) => {
  const held: zz.HeldPart[] = []
  const state: zz.ReactionState = {
    position: () => Promise.resolve(undefined),
    advance: () => () => Promise.resolve(),
    held: () => Promise.resolve([...held]),
    hold: (part) => {
      held.push(part)
      return Promise.resolve()
    },
    release: () => Promise.resolve(),
    discarded: () => Promise.resolve(),
  }
  const wired = zz.reaction_consumers({
    registry: { [companion_path]: the_drill_goes_with_the_ladder },
    versions: shed.versions,
  })({
    [companion_path]: { log: shed.log, invokes: shed.wired_by_a_test.reserve_a_tool },
  })
  return {
    started: (instant: string) =>
      wired({
        state,
        clock: { now: () => zz.date_time.parse(instant), time_zone },
      }),
    /** The parts it holds, by why. */
    held: () => held.map((part) => (part.held === 'dead_letter' ? part.cause : part.held)),
  }
}
