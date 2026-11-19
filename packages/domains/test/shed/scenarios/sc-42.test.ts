import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import * as wlib from '../wlib.ts'
import { first, oracle, quiet, type Start } from './oracle.ts'
import { drill, sander } from './shed.ts'

// SC-42: a dead letter holds its resources (DOM-16, D94.7, D67.3; Shed's
// step 11). For its reaction, a dead letter holds the resources of its
// part, those in its envelope: a later part of the reaction's path that
// touches one of them waits behind it, holding its own in turn; the
// position goes on, the other resources flow. On Tuesday Marta returns the
// drill damaged (F1, L7); a defect of Tuesday's release of the adapter of
// `tools` reads the drill as neither in service, in the workshop nor
// retired, so no branch of `send_a_tool_to_repair` holds, and
// `reaction/damage/` puts F1's part in its dead letter, holding L7 and the
// drill. Wednesday's release fixes the defect; Gianni borrows the drill,
// still in service, and the sander. On Thursday he returns the drill
// damaged (F2, L9): it touches the drill, so it waits behind F1; his
// sander, returned damaged that afternoon (F3, L10), shares nothing with
// them (the return names the loan and the tool, not the member) and goes to
// the workshop. On Friday the operator redelivers F1: the drill goes to the
// workshop, its stay named by F1's reaction, of Marta's chain; then F2,
// `a_tool_has_been_sent_to_repair_again`. Without the hold F2 would have
// opened the stay on Thursday, the record saying the drill broke in
// Gianni's hands.

const damage = 'reaction/damage/reaction/the_damaged_tool_goes_to_repair'
const tuesday = '2026-11-17T09:00:00-05:00'
const wednesday = '2026-11-18T09:00:00-05:00'
const thursday = '2026-11-19T10:00:00-05:00'
const friday = '2026-11-20T09:00:00-05:00'

/** The stay an operation opens, as `tools` names it (SC-7). */
const the_stay_of = (operation: wlib.Operation): string => wlib.identity_of(z.string())(operation)

/** The operation of the reaction to a return, derived from it (LIB-10). */
const reacting_to = (operation: wlib.Operation): wlib.Operation =>
  wlib.reaction_operation(damage)({ operation, part: 0 })

/**
 * The drill and the sander in the shed; Marta (M-12) borrows the drill on
 * Monday 9 November (L7); on Tuesday, with the adapter of `tools` released
 * with its defect, the consumers start and she returns the drill damaged
 * (F1); on Wednesday the release fixes the defect, the consumers start
 * again, and Gianni (M-7) borrows the drill (L9) and the sander (L10); on
 * Thursday he returns the drill damaged (F2), and in the afternoon the
 * sander (F3).
 */
const the_story = async (start: Start = {}, saves_its_position = true) => {
  const shed = await oracle(start)
  for (const tool of [drill, sander]) {
    await first(shed.tools.add_a_tool(shed.at('2026-11-02T08:00:00-05:00'), tool))
  }
  await first(
    shed.loans.borrow_a_tool(shed.at('2026-11-09T10:00:00-05:00', { scope: 'member/M-12' }), {
      loan_id: 'L7',
      tool_id: 'drill',
      member_id: 'M-12',
    }),
  )
  shed.the_adapter_of_tools('with_a_defect')
  const tuesdays = shed.reactions({ at: tuesday, saves_its_position })
  const f1 = shed.at(tuesday, { operation: 'F1', scope: 'member/M-12', correlation: 'C-MARTA' })
  await first(
    shed.loans.return_a_tool(f1, { loan_id: 'L7', tool_id: 'drill', condition: 'damaged' }),
  )
  await quiet()
  await tuesdays.stop()
  shed.the_adapter_of_tools('right')
  const consumers = shed.reactions({ at: wednesday, saves_its_position })
  for (const [loan_id, tool_id] of [
    ['L9', 'drill'],
    ['L10', 'sander'],
  ] as const) {
    await first(
      shed.loans.borrow_a_tool(shed.at(wednesday, { scope: 'member/M-7' }), {
        loan_id,
        tool_id,
        member_id: 'M-7',
      }),
    )
  }
  await shed.pass(thursday)
  const f2 = shed.at(thursday, { operation: 'F2', scope: 'member/M-7', correlation: 'C-GIANNI' })
  await first(
    shed.loans.return_a_tool(f2, { loan_id: 'L9', tool_id: 'drill', condition: 'damaged' }),
  )
  await shed.pass('2026-11-19T15:00:00-05:00')
  const f3 = shed.at('2026-11-19T15:00:00-05:00', { operation: 'F3', scope: 'member/M-7' })
  await first(
    shed.loans.return_a_tool(f3, { loan_id: 'L10', tool_id: 'sander', condition: 'damaged' }),
  )
  await quiet()
  /** What the workshop took in, by the operations of the reaction's facts, as the log keeps them. */
  const taken_in = async () =>
    (await shed.recorded()).flatMap((fact) =>
      fact.operation.scope === damage
        ? [{ operation: fact.operation, correlation: fact.correlation, parts: fact.parts }]
        : [],
    )
  return { shed, consumers, f1, f2, f3, taken_in }
}

/** The letter a reaction holds first, as an operator picks it from the dead letters shown. */
const the_letter = (held: readonly wlib.HeldPart[]): wlib.ReactionDeadLetter => {
  const letter = held.find((each) => each.held === 'dead_letter')
  if (letter?.held !== 'dead_letter') throw new Error('no dead letter is held')
  return letter
}

/** The parts held, as an operator reads them: which return, how held. */
const shown = (held: readonly wlib.HeldPart[]) =>
  held.map((each) => [each.fact.operation.id, each.held, each.part])

describe('SC-42, a dead letter holds its resources', () => {
  test('Marta’s return in a dead letter: Gianni’s drill waits behind it, his sander goes', async () => {
    const { shed, consumers, f3, taken_in } = await the_story()
    expect(shown(shed.held_parts(damage))).toEqual([
      ['F1', 'dead_letter', 0],
      ['F2', 'waiting', 0],
    ])
    expect(the_letter(shed.held_parts(damage))).toMatchObject({
      reaction: damage,
      position: '4',
      part: 0,
      cause: {
        cause: 'rejected',
        failures: [
          {
            branch: 'the_tool_is_in_service_so_it_goes_to_repair',
            components: ['the_requested_tool_is_in_service'],
            predicate: 'business/tools/predicate/the_tool_is_in_service',
          },
          {
            branch: 'the_tool_is_already_in_the_workshop_so_nothing_changes',
            components: ['the_requested_tool_is_under_repair'],
            predicate: 'business/tools/predicate/the_tool_is_under_repair',
          },
          {
            branch: 'the_tool_is_retired_so_nothing_changes',
            components: ['the_requested_tool_is_retired'],
            predicate: 'business/tools/predicate/the_tool_is_retired',
          },
        ],
      },
    })
    expect(the_letter(shed.held_parts(damage)).fact.parts[0]?.resources).toEqual([
      { path: 'business/loans/id/loan_id', value: 'L7' },
      { path: 'business/tools/id/tool_id', value: 'drill' },
    ])
    expect(await taken_in()).toMatchObject([
      {
        operation: reacting_to(f3.operation),
        parts: [
          {
            path: 'business/tools/fact/a_tool_has_been_sent_to_repair',
            payload: { tool_under_repair: { id: 'sander' } },
          },
        ],
      },
    ])
    await consumers.stop()
  })

  test('on Friday the operator redelivers F1: the drill to the workshop, Marta’s stay, then Gianni’s return finds it there', async () => {
    const { shed, consumers, f1, f2, taken_in } = await the_story()
    await shed.pass(friday)
    expect(await consumers.redeliver(the_letter(shed.held_parts(damage)))).toEqual({
      outcome: 'delivered',
    })
    await quiet()
    expect(shed.held_parts(damage)).toEqual([])
    const workshop = await taken_in()
    expect(workshop.slice(1)).toEqual([
      {
        operation: reacting_to(f1.operation),
        correlation: 'C-MARTA',
        parts: [
          expect.objectContaining({
            path: 'business/tools/fact/a_tool_has_been_sent_to_repair',
            payload: {
              tool_under_repair: {
                id: 'drill',
                status: 'underRepair',
                repair: { id: the_stay_of(reacting_to(f1.operation)), since: friday },
              },
            },
          }),
        ],
      },
      {
        operation: reacting_to(f2.operation),
        correlation: 'C-GIANNI',
        parts: [
          expect.objectContaining({
            path: 'business/tools/fact/a_tool_has_been_sent_to_repair_again',
            payload: { tool_id: 'drill' },
          }),
        ],
      },
    ])
    await consumers.stop()
  })

  test('discarded instead: Gianni’s return goes on as after a delivery, the stay his', async () => {
    const { shed, consumers, f2, taken_in } = await the_story()
    await shed.pass(friday)
    const letter = the_letter(shed.held_parts(damage))
    await consumers.discard(letter)({ by: 'luca', reason: 'the drill was checked by hand' })
    await quiet()
    expect(shed.held_parts(damage)).toEqual([])
    expect(shed.discarded_parts()).toEqual([
      { letter, by: 'luca', reason: 'the drill was checked by hand', at: friday },
    ])
    expect((await taken_in()).slice(1)).toMatchObject([
      {
        operation: reacting_to(f2.operation),
        parts: [
          {
            path: 'business/tools/fact/a_tool_has_been_sent_to_repair',
            payload: {
              tool_under_repair: {
                repair: { id: the_stay_of(reacting_to(f2.operation)), since: friday },
              },
            },
          },
        ],
      },
    ])
    expect(await consumers.redeliver(letter)).toEqual({ outcome: 'not_held' })
    await consumers.stop()
  })

  test('redelivered with the defect back: refused again, it holds still, and Gianni’s return still waits', async () => {
    const { shed, consumers, taken_in } = await the_story()
    shed.the_adapter_of_tools('with_a_defect')
    const redelivered = await consumers.redeliver(the_letter(shed.held_parts(damage)))
    expect(redelivered).toMatchObject({
      outcome: 'dead_letter',
      letter: { held: 'dead_letter', cause: { cause: 'rejected' } },
    })
    await quiet()
    expect(shown(shed.held_parts(damage))).toEqual([
      ['F1', 'dead_letter', 0],
      ['F2', 'waiting', 0],
    ])
    expect(await taken_in()).toHaveLength(1)
    await consumers.stop()
  })

  test('the consumers fall before saving their position, and start again from the first fact: what they held, held once (TST-4)', async () => {
    const { shed, consumers, taken_in } = await the_story({}, false)
    await consumers.stop()
    const again = shed.reactions({ at: friday })
    await quiet()
    expect(shown(shed.held_parts(damage))).toEqual([
      ['F1', 'dead_letter', 0],
      ['F2', 'waiting', 0],
    ])
    expect(await taken_in()).toHaveLength(1)
    await again.stop()
  })

  test('every fact the log gives twice: each part held once (TST-4)', async () => {
    const { shed, consumers, taken_in } = await the_story({ redelivered: true })
    expect(shown(shed.held_parts(damage))).toEqual([
      ['F1', 'dead_letter', 0],
      ['F2', 'waiting', 0],
    ])
    expect(await taken_in()).toHaveLength(1)
    await consumers.stop()
  })

  test('fallen after the redelivery, before Gianni’s return: started again, his return goes (TST-4)', async () => {
    const { shed, consumers, f2, taken_in } = await the_story()
    await shed.pass(friday)
    shed.the_adapter_of_tools_falls(1)
    expect(await consumers.redeliver(the_letter(shed.held_parts(damage)))).toEqual({
      outcome: 'delivered',
    })
    await quiet()
    await expect(consumers.stop()).rejects.toThrow(`the delivery of ${damage} fell`)
    expect(shown(shed.held_parts(damage))).toEqual([['F2', 'waiting', 0]])
    const again = shed.reactions({ at: friday })
    await quiet()
    expect(shed.held_parts(damage)).toEqual([])
    expect((await taken_in()).at(-1)).toMatchObject({
      operation: reacting_to(f2.operation),
      parts: [{ path: 'business/tools/fact/a_tool_has_been_sent_to_repair_again' }],
    })
    await again.stop()
  })

  test('stopped consumers serve no operator', async () => {
    const { shed, consumers } = await the_story()
    await consumers.stop()
    await expect(consumers.redeliver(the_letter(shed.held_parts(damage)))).rejects.toThrow(
      'the consumers of the reactions are stopped',
    )
  })
})
