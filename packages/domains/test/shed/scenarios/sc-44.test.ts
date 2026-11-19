import { describe, expect, test } from 'vitest'
import { accounts, all, first, oracle, quiet, type Who } from './oracle.ts'
import { drill } from './shed.ts'

// SC-44: a sheet of tools loaded line by line, a process with a cursor
// over a list of named instances (DOM-20, D97, D112, D94.1; Shed's step 11,
// part 5). On Wednesday the town library gives the shed its 200 tools, a
// line a tool, and Luca loads them (`keeper/load_tools_from_a_sheet`): the
// sheet opens with its 200 lines (`tools`' `load_the_tools_of_a_sheet`), and
// two reactions of `tools` walk it, one step a line, each composing
// `add_a_tool_from_a_line`: the tool added, or, its id in the catalogue
// already, the line left (D95), never passed over in silence. Line 37 names
// `drill-7`, the shed's own drill; line 120 repeats the id of line 12. After
// line 200, the sheet is loaded. Luca's screen follows the loading by its
// correlation (D58.2): 198 tools in, two lines left.

const luca: Who = { identified_by: 'account', id: 'A-LUCA' }
const wednesday = '2026-11-18T10:00:00-05:00'

/** The 200 lines of the library's sheet: line 37 the shed's drill's id, line 120 line 12's. */
const the_lines = Array.from({ length: 200 }, (_, i) => {
  const number = i + 1
  const tool_id =
    number === 37 ? 'drill-7' : number === 120 ? 'library-12' : `library-${String(number)}`
  return { tool_id, name: `Library tool ${String(number)}`, category: 'hand' as const }
})

/** The shed with its own drill, labelled `drill-7`, and Luca with the hat of keeper. */
const the_shed = async () => {
  const shed = await oracle({ accounts: accounts({ hats: { 'A-LUCA': ['keeper'] } }) })
  await first(
    shed.tools.add_a_tool(shed.at('2026-11-16T08:00:00-05:00'), { ...drill, id: 'drill-7' }),
  )
  return shed
}

describe('SC-44, a sheet of tools loaded line by line', () => {
  test('Luca follows the loading: 198 tools in the catalogue, lines 37 and 120 left, the sheet loaded', async () => {
    const shed = await the_shed()
    const consumers = shed.processes({ at: wednesday })
    const events = await all(
      shed.keeper.load_tools_from_a_sheet(
        shed.as(luca, '1.0.0').at(wednesday, { operation: 'S-1' }),
        {
          lines: the_lines,
        },
      ),
    )
    await consumers.stop()
    expect(events[0]).toEqual({ event: 'the_sheet_is_being_loaded', payload: { lines: 200 } })
    expect(events.at(-1)).toEqual({ event: 'the_sheet_is_loaded', payload: {} })
    const left = events.filter((event) => event.event === 'the_id_of_the_line_is_taken')
    expect(left).toEqual([
      { event: 'the_id_of_the_line_is_taken', payload: { line: 37, tool_id: 'drill-7' } },
      { event: 'the_id_of_the_line_is_taken', payload: { line: 120, tool_id: 'library-12' } },
    ])
    const added = events.filter((event) => event.event === 'the_tool_is_in_the_catalogue')
    expect(added).toHaveLength(198)
    expect(added[0]).toEqual({
      event: 'the_tool_is_in_the_catalogue',
      payload: { tool_id: 'library-1' },
    })
    // One step a line, in the order of the sheet, then the closing: 202 facts
    // after the drill, the opening first.
    const facts = (await shed.recorded()).slice(1)
    expect(facts).toHaveLength(202)
    expect(facts[0]?.parts[0]?.path).toBe('business/tools/fact/the_loading_of_a_sheet_has_begun')
    expect(facts.slice(1, 201).every((fact) => fact.parts.length === 2)).toBe(true)
    expect(facts[201]?.parts[0]?.path).toBe('business/tools/fact/the_sheet_has_been_loaded')
    // The catalogue: the shed's drill, and the 198 tools of the library.
    const catalogue = await first(shed.tools.the_catalogue(shed.when(wednesday), {}))
    expect(catalogue).toMatchObject({ event: 'snapshot', total: 199 })
  })

  test('Luca’s request retried is the duplicate branch: the same sheet, no second one', async () => {
    const shed = await the_shed()
    const consumers = shed.processes({ at: wednesday })
    const request = () =>
      all(
        shed.keeper.load_tools_from_a_sheet(
          shed.as(luca, '1.0.0').at(wednesday, { operation: 'S-1' }),
          { lines: the_lines.slice(0, 3) },
        ),
      )
    const once = await request()
    const again = await request()
    await quiet()
    await consumers.stop()
    expect(once.map((event) => event.event)).toEqual([
      'the_sheet_is_being_loaded',
      'the_tool_is_in_the_catalogue',
      'the_tool_is_in_the_catalogue',
      'the_tool_is_in_the_catalogue',
      'the_sheet_is_loaded',
    ])
    expect(again).toEqual(once)
    expect(await shed.recorded()).toHaveLength(1 + 1 + 3 + 1)
  })

  test('a line its schema refuses (a tool with no name) refuses the sheet before any line goes in', async () => {
    const shed = await the_shed()
    const events = await all(
      shed.keeper.load_tools_from_a_sheet(shed.as(luca, '1.0.0').at(wednesday), {
        lines: [...the_lines.slice(0, 2), { tool_id: 'x', name: '', category: 'hand' }],
      }),
    )
    expect(events).toEqual([{ event: 'invalid_request', reason: 'input_not_in_schema' }])
    expect(await shed.recorded()).toHaveLength(1)
  })
})
