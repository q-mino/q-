import { describe, expect, test } from 'vitest'
import { all, first, oracle } from './oracle.ts'

// SC-14, the business's side (part 5.1): the catalogue of `tools`, a query
// with its selection, order and identity, read in one snapshot at a
// position (DOM-18, D66). The order is the query's, closed by the entry's
// identity (LIB-9, D109), every value in the oracle's order: text by code
// point, no collation. The visitor's leaf, the snapshot alone, projected
// field by field without the keeper's notes, is part 6.1.

/** A tool as Luca adds it. */
interface Added {
  readonly id: string
  readonly name: string
  readonly category: 'garden' | 'power' | 'hand' | 'ladder'
  readonly notes?: string
}

const shovel: Added = { id: 'shovel', name: 'Shovel', category: 'garden' }
const a_rake: Added = { id: 'rake-2', name: 'rake', category: 'garden' }
const another_rake: Added = { id: 'rake-1', name: 'rake', category: 'garden' }
const drill: Added = {
  id: 'drill',
  name: 'Cordless drill',
  category: 'power',
  notes: 'the battery holds an hour',
}
const sander: Added = { id: 'sander', name: 'Orbital sander', category: 'power' }
const ladder: Added = { id: 'ladder', name: 'Ladder', category: 'ladder' }
const saw: Added = { id: 'saw', name: 'Hand saw', category: 'hand' }
const old_ladder: Added = { id: 'old-ladder', name: 'Old ladder', category: 'ladder' }

/**
 * The shed on Monday 16 November: Luca has added eight tools; the saw is
 * in the workshop, the old ladder retired.
 */
const the_shed = async () => {
  const shed = await oracle()
  for (const tool of [sander, a_rake, drill, ladder, saw, shovel, old_ladder, another_rake]) {
    await first(shed.tools.add_a_tool(shed.at('2026-11-16T09:00:00-05:00'), tool))
  }
  await first(
    shed.tools.send_a_tool_to_repair(shed.at('2026-11-16T10:00:00-05:00'), { tool_id: 'saw' }),
  )
  await first(
    shed.tools.retire_a_tool(shed.at('2026-11-16T10:30:00-05:00'), {
      id: 'old-ladder',
      reason: 'worn_out',
    }),
  )
  return shed
}

/** A tool as the catalogue reads it: its id, name, category and the keeper's notes. */
const entry = (tool: Added) => ({
  id: tool.id,
  name: tool.name,
  category: tool.category,
  notes: tool.notes,
})

describe('SC-14, the catalogue of the shed (the business)', () => {
  test('the tools in service, by category and name by code point, two of one name by id; read at a position', async () => {
    const shed = await the_shed()
    const snapshot = await first(
      shed.tools.the_catalogue(shed.when('2026-11-16T11:00:00-05:00'), {}),
    )
    expect(snapshot).toEqual({
      event: 'snapshot',
      // `S` (U+0053) comes before `r` (U+0072): no collation (LIB-9). The
      // two rakes are told apart by their ids, the identity that closes the
      // order. The saw in the workshop and the old ladder retired are not
      // in service.
      entries: [shovel, another_rake, a_rake, ladder, drill, sander].map(entry),
      position: '10',
      total: 6,
    })
  })

  test('the chosen categories, in the order of the catalogue, not of the choice', async () => {
    const shed = await the_shed()
    expect(
      await first(
        shed.tools.the_catalogue(shed.when('2026-11-16T11:00:00-05:00'), {
          categories: ['power', 'garden'],
        }),
      ),
    ).toMatchObject({
      event: 'snapshot',
      entries: [shovel, another_rake, a_rake, drill, sander].map(entry),
      total: 5,
    })
  })

  test('a shed with nothing yet: no entry, at the position before any fact', async () => {
    const shed = await oracle()
    expect(
      await first(shed.tools.the_catalogue(shed.when('2026-11-16T08:00:00-05:00'), {})),
    ).toEqual({ event: 'snapshot', entries: [], position: '0', total: 0 })
  })

  test('an input not in its schema reads nothing: the first event and the last', async () => {
    const shed = await the_shed()
    const at = shed.when('2026-11-16T11:00:00-05:00')
    const invalid = { event: 'invalid_request', reason: 'input_not_in_schema' }
    // No category chosen (at least one, or none for every one).
    expect(await all(shed.tools.the_catalogue(at, { categories: [] }))).toEqual([invalid])
    // A field the query does not declare, as a client may send it.
    const sent = { categories: ['garden' as const], shelf: 'by the door' }
    expect(await all(shed.tools.the_catalogue(at, sent))).toEqual([invalid])
  })

  test('the port streams, as the oracle declares (a member follows the shelf, SC-32): its snapshot is its first event', async () => {
    const shed = await the_shed()
    expect(shed.tools.the_catalogue.streamed).toBe(true)
  })
})
