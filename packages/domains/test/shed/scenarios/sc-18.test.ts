import { describe, expect, test } from 'vitest'
import { first, followed, oracle, told, view, type Start } from './oracle.ts'

// SC-18, the business's side (part 5.2): a query's stream sees its domain's
// facts only, as if each domain had a log of its own (DOM-17, DOM-8, D64.3).
// Marta borrows the drill: `a_tool_has_been_lent`, a fact of `loans`, holds
// the drill's id, and the catalogue of `tools` sees nothing of it; Luca
// renames the drill, a fact of `tools` that touches it: `fact`. The native
// stream of the oracle skips the facts of `loans`; the composed one reads
// again after each fact of the log and finds the catalogue the same. The
// visitor's leaf, the snapshot alone, is part 6.1.

const strategies = ['native', 'composed'] as const

/** The drill and the ladder in the catalogue (1, 2); Marta borrows the drill (3); Luca renames it (4). */
const the_shed = async (start: Start) => {
  const shed = await oracle(start)
  for (const [id, name, category] of [
    ['drill', 'Cordless drill', 'power'],
    ['ladder', 'Ladder', 'ladder'],
  ] as const) {
    await first(shed.tools.add_a_tool(shed.at('2026-11-02T13:00:00.000Z'), { id, name, category }))
  }
  const story = async () => {
    await first(
      shed.loans.borrow_a_tool(shed.at('2026-11-02T15:00:00.000Z'), {
        loan_id: 'L7',
        tool_id: 'drill',
        member_id: 'M-12',
      }),
    )
    await first(
      shed.tools.rename_a_tool(shed.at('2026-11-02T16:00:00.000Z'), {
        tool_id: 'drill',
        name: 'Drill, cordless',
      }),
    )
  }
  const the_catalogue = () =>
    shed.tools.the_catalogue(shed.when('2026-11-02T14:00:00.000Z'), {})[Symbol.asyncIterator]()
  return { story, the_catalogue }
}

describe('SC-18: a fact of `loans` does not reach the catalogue of `tools`', () => {
  test('native: the loan, nothing; the rename, `fact` on the drill', async () => {
    const { story, the_catalogue } = await the_shed({})
    const { events } = await followed(the_catalogue, story)
    expect(told(events)).toEqual([
      ['fact', '4'],
      ['caught_up', '4'],
    ])
    expect(events[0]).toMatchObject({
      identity: 'drill',
      entry: { id: 'drill', name: 'Drill, cordless' },
      fact: { parts: [{ path: 'business/tools/fact/a_tool_has_been_renamed' }] },
    })
  })

  test.each(strategies)(
    '%s: the snapshot at P with the events from P is the snapshot at the end (D69.3)',
    async (streams) => {
      const { story, the_catalogue } = await the_shed({ streams })
      const { snapshot, events, at_the_end } = await followed(the_catalogue, story)
      expect(events.some((event) => event.event === 'fact' && event.position === '3')).toBe(false)
      expect(view('id')([...snapshot, ...events])).toEqual(view('id')(at_the_end))
    },
  )
})
