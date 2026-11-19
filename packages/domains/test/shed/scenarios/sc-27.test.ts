import { describe, expect, test } from 'vitest'
import { accounts, all, first, oracle, pull, settled, type Who } from './oracle.ts'

// SC-27 (part 6.3, the persona's side; the reaction that records the
// workshop's fact, with part 7.3): a command leaf may stay open after its
// outcome until a final event (DOM-3, D58.2). Marta returns the drill
// damaged; `return_a_tool` keeps her flow open, reads the fact log from her
// return's fact on, keeps the facts of its chain, by correlation (DOM-10),
// whose path it follows, of `tools` here, projects them, and stops at the
// first of its `ends`; at most a minute, then `the_wait_is_over` at her
// return's position, which records nothing. Whole, her return ends at once.
// Until the reactions run (7.3), the scenario records the workshop's fact
// as `reaction/damage/` will, with her return's correlation.

const marta: Who = { identified_by: 'account', id: 'A-MARTA' }

const friday = '2026-11-20T10:00:00-05:00'

/** The drill (1) and the sander (2) in the shed; Marta borrows the drill on Thursday (L7, 3). */
const the_shed = async () => {
  const shed = await oracle({
    accounts: accounts({
      hats: { 'A-MARTA': ['member'] },
      member_cards: { 'A-MARTA': { id: 'M-12', valid_until: '2027-03-31' } },
    }),
  })
  for (const [id, name] of [
    ['drill', 'Cordless drill'],
    ['sander', 'Belt sander'],
  ] as const) {
    await first(
      shed.tools.add_a_tool(shed.at('2026-11-16T09:00:00-05:00'), { id, name, category: 'power' }),
    )
  }
  await first(
    shed.member.borrow_a_tool(shed.as(marta, '2.0.0').at('2026-11-19T10:00:00-05:00'), {
      loan_id: 'L7',
      tool_id: 'drill',
    }),
  )
  /** Marta's return of the drill on Friday, under operation R-1 (4), its chain C-RETURN unless a retry sends another. */
  const her_return = (condition: 'good' | 'damaged', correlation = 'C-RETURN') =>
    shed.member.return_a_tool(
      shed.as(marta, '2.0.0').at(friday, {
        operation: 'R-1',
        scope: 'member/A-MARTA',
        correlation,
      }),
      { loan_id: 'L7', tool_id: 'drill', condition },
    )
  /** The workshop takes the drill in, recorded with her return's correlation, as `reaction/damage/` will (7.3). */
  const taken_in = () =>
    first(
      shed.tools.send_a_tool_to_repair(
        shed.at('2026-11-20T10:01:00-05:00', { correlation: 'C-RETURN' }),
        { tool_id: 'drill' },
      ),
    )
  return { shed, her_return, taken_in }
}

/** What is left of a flow, until it ends. */
const rest = async <event>(flow: AsyncIterator<event>): Promise<readonly event[]> => {
  const left: event[] = []
  for (let next = await flow.next(); next.done !== true; next = await flow.next()) {
    left.push(next.value)
  }
  return left
}

describe('SC-27: Marta’s screen follows her damaged return to the workshop', () => {
  test('whole, her return ends at once: no wait', async () => {
    const { shed, her_return } = await the_shed()
    expect(await all(her_return('good'))).toEqual([
      { event: 'you_returned_the_tool', payload: { tool_id: 'drill' } },
    ])
    expect(shed.waits()).toEqual([])
  })

  test('damaged, her flow stays open; a repair of another chain is not hers; the workshop takes the drill in, and it ends', async () => {
    const { shed, her_return, taken_in } = await the_shed()
    const flow = her_return('damaged')[Symbol.asyncIterator]()
    expect(await pull(flow, 1)).toEqual([
      { event: 'you_returned_the_tool_damaged', payload: { tool_id: 'drill' } },
    ])
    // Luca sends the sander to the workshop, his own request (5).
    await first(shed.tools.send_a_tool_to_repair(shed.at(friday), { tool_id: 'sander' }))
    await taken_in()
    expect(await rest(flow)).toEqual([
      { event: 'the_tool_is_in_the_workshop', payload: { tool_id: 'drill' } },
    ])
    expect(shed.waits()).toEqual([60_000])
    expect(shed.traced()).toEqual([])
  })

  test('nothing comes within a minute: `the_wait_is_over`, at her return’s position, and the flow closes', async () => {
    const { shed, her_return } = await the_shed()
    const flow = her_return('damaged')[Symbol.asyncIterator]()
    await pull(flow, 1)
    const next = flow.next()
    await settled()
    shed.elapse()
    expect(await next).toEqual({
      done: false,
      value: { event: 'the_wait_is_over', position: '4' },
    })
    expect(await rest(flow)).toEqual([])
  })

  test('her phone retries the return under its operation, with another correlation: the recorded fact, then the chain it began', async () => {
    const { her_return, taken_in } = await the_shed()
    const first_try = her_return('damaged')[Symbol.asyncIterator]()
    await pull(first_try, 1)
    await taken_in()
    await rest(first_try)
    expect(await all(her_return('damaged', 'C-RETRY'))).toEqual([
      { event: 'you_returned_the_tool_damaged', payload: { tool_id: 'drill' } },
      { event: 'the_tool_is_in_the_workshop', payload: { tool_id: 'drill' } },
    ])
  })
})
