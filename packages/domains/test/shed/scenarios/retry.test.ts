import { describe, expect, test } from 'vitest'
import { z } from 'zod'
import * as zz from '../../../src/library/index.ts'
import { accounts, all, first, oracle, until_caught_up, type Who } from './oracle.ts'
import { persona } from '../persona/_node.ts'
import { registry as persona_registry } from '../persona/_registry.ts'
import { registry as member_registry } from '../persona/member/_registry.ts'
import { majors as member_majors } from '../persona/member/_majors.ts'
import { borrow_a_tool } from '../persona/member/_usecase.ts'
import { command_use_case_over } from '../persona/member/_scope.ts'
import { the_card_is_valid_on } from '../persona/member/_dsl.ts'
import { reserve_a_tool } from '../business/loans/_usecase.ts'
import { reservation_id } from '../business/loans/_id.ts'
import { the_day_is_within_the_booking_window } from '../business/loans/_dsl.ts'
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

const thursday = '2026-11-19T10:00:00-05:00'
const friday = '2026-11-20T08:00:00-05:00'
const gianni: Who = { identified_by: 'account', id: 'A-GIANNI' }

/** Gianni's request for the ladder: his operation, in his scope, the hat and his account. */
const booking = { operation: 'B-1', scope: 'member/A-GIANNI' }

/** Gianni books a tool for a day, as the business's window allows it, while his card is valid. */
const book_a_tool = command_use_case_over({
  use_case: reserve_a_tool,
  input: (context) =>
    z
      .strictObject({ reservation_id, tool_id, day: zz.day })
      .refine((input) => the_day_is_within_the_booking_window(input.day, context.now), {
        path: ['day'],
      }),
  is_refused_unless: {
    the_member_card_is_valid_today: (context) => () =>
      the_card_is_valid_on(context.now)(context.card),
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
    shed.tools.add_a_tool(shed.at('2026-11-05T08:00:00-05:00'), {
      id: 'ladder',
      name: 'Ladder',
      category: 'ladder',
    }),
  )
  await first(
    shed.tools.add_a_tool(shed.at('2026-11-05T08:01:00-05:00'), {
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
        payload: { ...the_drill, due_date: '2026-12-03T23:59:59.999-05:00' },
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

  test('the business’s port, invoked directly, still parses first: the window refuses the retry (open, PER-5)', async () => {
    const { shed, member } = await the_shed(gianni_with(['member'], '2027-03-31'))
    await all(
      member.book_a_tool(shed.as(gianni, '2.0.0').at(thursday, booking), the_ladder_on_friday),
    )
    // A caller that is not a leaf (a reaction, the executor, this harness)
    // meets the business's schema before its duplicate branch.
    expect(
      await first(
        shed.loans.reserve_a_tool(shed.at(friday, booking), {
          ...the_ladder_on_friday,
          member_id: 'M-7',
        }),
      ),
    ).toEqual({ outcome: 'invalid_request' })
  })
})
