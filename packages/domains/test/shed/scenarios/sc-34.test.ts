import { describe, expect, test } from 'vitest'
import * as zz from '../../../src/library/index.ts'
import { repair_id } from '../business/tools/_id.ts'
import { accounts, all, first, oracle, type Who } from './oracle.ts'

// SC-34 (part 6.2): Rossi's workshop, an actor from outside (PER-4, PER-12,
// D88.1, D91): its system calls the shed with a key the shed gave it, a
// `Caller` that is neither a person nor an internal entry. Its node verifies
// its hat from the hats of the key (PER-7); a person's node finds no account
// for a key, and the workshop's no key for a person: `not_found`. The system
// names its requests in what it sends (D91.2): the leaf names the field of
// its input that holds the operation's id, which the library reads after
// the schema, and the entry gives the scope alone (`OperationScopeContext`).
// The business names the stay it closes, so that a late notice is safe by
// the business too.

const rossi: Who = { identified_by: 'key', id: 'K-ROSSI' }
const another_key: Who = { identified_by: 'key', id: 'K-SPARE' }
const marta: Who = { identified_by: 'account', id: 'A-MARTA' }

const the_scope = { scope: 'workshop/K-ROSSI' }

/** On Tuesday 17 November Luca sends the drill to the workshop (RP1); Gianni booked it for Monday 23. */
const the_shed = async () => {
  const shed = await oracle({
    accounts: accounts({
      hats: { 'A-MARTA': ['member'] },
      member_cards: { 'A-MARTA': { id: 'M-12', valid_until: '2027-03-31' } },
      key_hats: { 'K-ROSSI': ['workshop'], 'K-SPARE': [] },
    }),
  })
  await first(
    shed.tools.add_a_tool(shed.at('2026-11-16T09:00:00-05:00'), {
      id: 'drill',
      name: 'Cordless drill',
      category: 'power',
    }),
  )
  await first(
    shed.loans.reserve_a_tool(shed.at('2026-11-16T12:00:00-05:00', { scope: 'member/M-7' }), {
      reservation_id: 'R8',
      tool_id: 'drill',
      member_id: 'M-7',
      day: '2026-11-23',
    }),
  )
  const tuesday = shed.at('2026-11-17T08:00:00-05:00', { scope: 'keeper/luca' })
  await first(shed.tools.send_a_tool_to_repair(tuesday, { tool_id: 'drill' }))
  return { shed, rp1: zz.identity_of(repair_id)(tuesday.operation) }
}

describe("SC-34, Rossi's workshop closes a job", () => {
  test('N-88 for RP1: the drill back in service, R8 out of "in the workshop", the operation N-88 in its scope', async () => {
    const { shed, rp1 } = await the_shed()
    const in_the_workshop = async (instant: string) =>
      first(
        shed.loans.the_reservations_of_a_member_in_the_workshop(shed.when(instant), {
          member_id: 'M-7',
        }),
      )
    expect(await in_the_workshop('2026-11-20T09:00:00-05:00')).toMatchObject({
      entries: [{ id: 'R8' }],
    })
    expect(
      await all(
        shed.workshop.close_a_job(
          shed.as(rossi, '1.0.0').named('2026-11-20T10:00:00-05:00', the_scope),
          { notification_id: 'N-88', job: { tool: 'drill', reference: rp1 } },
        ),
      ),
    ).toEqual([{ event: 'the_job_is_closed', payload: { tool: 'drill' } }])
    expect(await in_the_workshop('2026-11-20T10:01:00-05:00')).toMatchObject({ entries: [] })
    const log = shed.log(zz.position.parse('4'))[Symbol.asyncIterator]()
    expect((await log.next()).value).toMatchObject({
      event: 'fact',
      position: '4',
      fact: {
        operation: { id: 'N-88', scope: 'workshop/K-ROSSI' },
        parts: [{ path: 'business/tools/fact/a_tool_has_been_repaired' }],
      },
    })
    expect(shed.traced()).toEqual([])
  })

  test('N-88 again, the same: the same fact; N-88 with another job: identity_already_used, in the trace', async () => {
    const { shed, rp1 } = await the_shed()
    const close = (instant: string, job: { readonly tool: string; readonly reference: string }) =>
      all(
        shed.workshop.close_a_job(shed.as(rossi, '1.0.0').named(instant, the_scope), {
          notification_id: 'N-88',
          job,
        }),
      )
    await close('2026-11-20T10:00:00-05:00', { tool: 'drill', reference: rp1 })
    // The answer is lost, and the system sends N-88 again.
    expect(await close('2026-11-20T10:05:00-05:00', { tool: 'drill', reference: rp1 })).toEqual([
      { event: 'the_job_is_closed', payload: { tool: 'drill' } },
    ])
    expect(
      await close('2026-11-20T10:10:00-05:00', { tool: 'drill', reference: 'RP-OTHER' }),
    ).toEqual([{ event: 'identity_already_used' }])
    expect(
      await first(shed.tools.the_catalogue(shed.when('2026-11-20T10:11:00-05:00'), {})),
    ).toMatchObject({ position: '4' })
    expect(shed.traced()).toMatchObject([
      {
        path: 'persona/workshop/usecase/close_a_job',
        given: { caller: rossi },
        version: '1.0.0',
        operation: { id: 'N-88', scope: 'workshop/K-ROSSI' },
        sent: { notification_id: 'N-88', job: { tool: 'drill', reference: 'RP-OTHER' } },
        answered: { event: 'identity_already_used' },
        why: { closed_by: 'the_business', outcome: { outcome: 'identity_already_used' } },
      },
    ])
  })

  test('a late notice: the drill back by hand and broken again (RP2), N-88 for RP1 finds no such open job', async () => {
    const { shed, rp1 } = await the_shed()
    await first(
      shed.tools.put_a_repaired_tool_back_in_service(shed.at('2026-11-20T09:00:00-05:00'), {
        tool_id: 'drill',
      }),
    )
    await first(
      shed.tools.send_a_tool_to_repair(shed.at('2026-11-21T08:00:00-05:00'), { tool_id: 'drill' }),
    )
    expect(
      await all(
        shed.workshop.close_a_job(
          shed.as(rossi, '1.0.0').named('2026-11-23T09:00:00-05:00', the_scope),
          { notification_id: 'N-88', job: { tool: 'drill', reference: rp1 } },
        ),
      ),
    ).toEqual([{ event: 'there_is_no_such_open_job', payload: {} }])
    // The system is told no more; the trace keeps which predicate failed.
    expect(shed.traced()).toMatchObject([
      {
        answered: { event: 'there_is_no_such_open_job' },
        why: {
          closed_by: 'the_business',
          outcome: {
            outcome: 'rejected',
            failures: [
              {
                branch: 'the_tool_is_under_this_repair_so_it_is_back_in_service',
                predicate: 'business/tools/predicate/the_tool_is_under_this_repair',
              },
            ],
          },
        },
      },
    ])
  })

  test('a person on the workshop, Rossi on a member, a key without the hat: not found; the trace keeps why', async () => {
    const { shed, rp1 } = await the_shed()
    const job = { notification_id: 'N-90', job: { tool: 'drill', reference: rp1 } }
    expect(
      await all(
        shed.workshop.close_a_job(
          shed.as(marta, '1.0.0').named('2026-11-20T10:00:00-05:00', { scope: 'workshop/A-MARTA' }),
          job,
        ),
      ),
    ).toEqual([{ event: 'not_found' }])
    expect(
      await all(
        shed.workshop.close_a_job(
          shed.as(another_key, '1.0.0').named('2026-11-20T10:00:00-05:00', {
            scope: 'workshop/K-SPARE',
          }),
          job,
        ),
      ),
    ).toEqual([{ event: 'not_found' }])
    expect(
      await all(
        shed.member.borrow_a_tool(
          shed.as(rossi, '2.0.0').at('2026-11-20T10:00:00-05:00', { scope: 'member/K-ROSSI' }),
          { loan_id: 'L9', tool_id: 'drill' },
        ),
      ),
    ).toEqual([{ event: 'not_found' }])
    expect(shed.traced().map((each) => each.why)).toEqual([
      {
        closed_by: 'a_lookup',
        node: 'persona/workshop/node/workshop',
        lookups: [{ lookup: 'the_hats_of_the_caller', not_known: 'key' }],
      },
      {
        closed_by: 'a_perimeter',
        node: 'persona/workshop/node/workshop',
        perimeter: 'the_caller_wears_the_hat_of_workshop',
      },
      {
        closed_by: 'a_lookup',
        node: 'persona/member/node/member',
        lookups: [
          { lookup: 'the_hats_of_the_caller', not_known: 'key' },
          { lookup: 'the_member_card_of_the_caller', not_known: 'key' },
        ],
      },
    ])
  })

  test('its operation read from the input after the schema; an input not in it, invalid_request with its scope alone', async () => {
    const { shed, rp1 } = await the_shed()
    expect(
      await all(
        shed.workshop.close_a_job(
          shed.as(rossi, '1.0.0').named('2026-11-20T10:00:00-05:00', the_scope),
          // A notification whose id is empty, as a faulty system might send it.
          { notification_id: '', job: { tool: 'drill', reference: rp1 } },
        ),
      ),
    ).toEqual([{ event: 'invalid_request', reason: 'input_not_in_schema' }])
    expect(shed.traced()).toMatchObject([
      {
        operation: { scope: 'workshop/K-ROSSI' },
        why: {
          closed_by: 'the_input',
          issues: [{ field: ['notification_id'], rule: 'too_small' }],
        },
      },
    ])
    expect(shed.traced()[0]?.operation).toEqual({ scope: 'workshop/K-ROSSI' })
  })

  test('an entry that gives an id beside the one the input names: its fault, thrown', async () => {
    const { shed, rp1 } = await the_shed()
    await expect(
      all(
        shed.workshop.close_a_job(
          shed.as(rossi, '1.0.0').at('2026-11-20T10:00:00-05:00', the_scope),
          { notification_id: 'N-88', job: { tool: 'drill', reference: rp1 } },
        ),
      ),
    ).rejects.toThrow('its input names its id (SC-34)')
  })
})
