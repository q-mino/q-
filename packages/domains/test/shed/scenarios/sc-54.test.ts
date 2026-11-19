import { describe, expect, test } from 'vitest'
import * as wlib from '../wlib.ts'
import { sheet_id } from '../business/tools/_id.ts'
import { first, oracle } from './oracle.ts'
import type { Tool } from './shed.ts'

// SC-54: Luca loads a short sheet in one go: a list of named instances,
// atomic (D113), a transition composed on each element (`each`). Each line
// applies its own branch, the first that holds on the catalogue as it was
// before the sheet; one fact, the branch's own part then a part per line,
// in the order of the list; the leaf reads the branch each line applied
// (`composed`).

/** The shed's own drill, labelled `drill-7`, in the catalogue since Monday. */
const the_sheds_drill: Tool = { id: 'drill-7', name: 'Cordless drill', category: 'power' }

/** The twelve tools of Paolo's garage, on a short sheet: line 4 names the shed's own drill. */
const pauls_sheet: Tool[] = [
  { id: 'rake-2', name: 'Rake', category: 'garden' },
  { id: 'hoe-1', name: 'Hoe', category: 'garden' },
  { id: 'saw-3', name: 'Hand saw', category: 'hand' },
  the_sheds_drill,
  { id: 'sander-2', name: 'Belt sander', category: 'power' },
  { id: 'ladder-4', name: 'Step ladder', category: 'ladder' },
  { id: 'shears-1', name: 'Hedge shears', category: 'garden' },
  { id: 'hammer-5', name: 'Claw hammer', category: 'hand' },
  { id: 'planer-1', name: 'Electric planer', category: 'power' },
  { id: 'trowel-2', name: 'Trowel', category: 'garden' },
  { id: 'clamp-6', name: 'Bar clamp', category: 'hand' },
  { id: 'jigsaw-1', name: 'Jigsaw', category: 'power' },
]

/** The shed with its own drill, which Luca added on Monday. */
const the_shed = async () => {
  const shed = await oracle()
  await first(shed.tools.add_a_tool(shed.at('2026-11-16T09:00:00-05:00'), the_sheds_drill))
  return shed
}

/** Thursday 19 November, when Luca loads Paolo's sheet. */
const thursday = '2026-11-19T15:00:00-05:00'

/** The part a line records, and the branch it applied: the tool added, or the line left. */
const the_line = (sheet: string, tool: Tool, number: number) => {
  const line_id = JSON.stringify([sheet, number])
  return tool.id === the_sheds_drill.id
    ? {
        branch: 'the_tool_is_in_the_catalogue_so_the_line_is_left',
        part: {
          path: 'business/tools/fact/a_tool_has_been_added_again',
          payload: { sheet_id: sheet, line_id, number, tool_id: tool.id },
          resources: [
            { path: 'business/tools/id/sheet_id', value: sheet },
            { path: 'business/tools/id/line_id', value: line_id },
            { path: 'business/tools/id/tool_id', value: tool.id },
          ],
        },
      }
    : {
        branch: 'the_tool_is_new_so_it_is_added',
        part: {
          path: 'business/tools/fact/a_tool_has_been_added',
          payload: { added_tool: { ...tool, status: 'inService', addDate: thursday } },
          resources: [{ path: 'business/tools/id/tool_id', value: tool.id }],
        },
      }
}

describe('SC-54, Luca loads a short sheet in one go', () => {
  test('one fact: the sheet filed complete, then a part per line in its order, line 4 left', async () => {
    const shed = await the_shed()
    const at = shed.at(thursday)
    const sheet = wlib.identity_of(sheet_id)(at.operation)
    const lines = pauls_sheet.map((tool, i) => the_line(sheet, tool, i + 1))
    expect(
      await first(shed.tools.load_the_tools_of_a_short_sheet(at, { lines: pauls_sheet })),
    ).toEqual({
      outcome: 'applied',
      branch: 'the_sheet_is_new_so_it_is_loaded_at_once',
      position: '2',
      fact: {
        parts: [
          {
            path: 'business/tools/fact/a_sheet_has_been_loaded_at_once',
            payload: {
              loaded_sheet: {
                id: sheet,
                start_date: thursday,
                progress: { stage: 'complete', end_date: thursday },
              },
            },
            resources: [{ path: 'business/tools/id/sheet_id', value: sheet }],
          },
          ...lines.map((line) => line.part),
        ],
        operation: at.operation,
        correlation: at.correlation,
      },
      composed: {
        its_lines_are_loaded: lines.map((line) => ({
          branch: line.branch,
          fact: line.part.payload,
        })),
      },
    })
  })

  test('the eleven tools are in the catalogue together, the shed’s drill once', async () => {
    const shed = await the_shed()
    await first(
      shed.tools.load_the_tools_of_a_short_sheet(shed.at(thursday), { lines: pauls_sheet }),
    )
    for (const tool of pauls_sheet) {
      expect(
        await first(shed.tools.add_a_tool(shed.at('2026-11-19T16:00:00-05:00'), tool)),
      ).toMatchObject({
        outcome: 'rejected',
        failures: [{ predicate: 'business/tools/predicate/a_tool_has_this_id' }],
      })
    }
  })

  test("a retry of Luca's request reads the same sheet, its lines' branches too", async () => {
    const shed = await the_shed()
    const sent = { operation: 'luca-sheet' }
    const loaded = await first(
      shed.tools.load_the_tools_of_a_short_sheet(shed.at(thursday, sent), { lines: pauls_sheet }),
    )
    expect(
      await first(
        shed.tools.load_the_tools_of_a_short_sheet(shed.at('2026-11-19T15:00:05-05:00', sent), {
          lines: pauls_sheet,
        }),
      ),
    ).toEqual(loaded)
  })

  test('the same sheet in a new request opens another, whose every line is left', async () => {
    const shed = await the_shed()
    await first(
      shed.tools.load_the_tools_of_a_short_sheet(shed.at(thursday), { lines: pauls_sheet }),
    )
    const again = await first(
      shed.tools.load_the_tools_of_a_short_sheet(shed.at('2026-11-19T15:30:00-05:00'), {
        lines: pauls_sheet,
      }),
    )
    expect(again).toMatchObject({ outcome: 'applied', position: '3' })
    expect(
      again.outcome === 'applied'
        ? again.composed.its_lines_are_loaded.map((line) => line.branch)
        : [],
    ).toEqual(pauls_sheet.map(() => 'the_tool_is_in_the_catalogue_so_the_line_is_left'))
  })

  test('line 9 repeats the id of line 3: refused before the desk reads anything, nothing recorded', async () => {
    const shed = await the_shed()
    const repeated = pauls_sheet.map((tool, i) => (i === 8 ? { ...tool, id: 'saw-3' } : tool))
    expect(
      await first(
        shed.tools.load_the_tools_of_a_short_sheet(shed.at(thursday), { lines: repeated }),
      ),
    ).toEqual({ outcome: 'invalid_request' })
    expect(
      await first(
        shed.tools.load_the_tools_of_a_short_sheet(shed.at('2026-11-19T15:10:00-05:00'), {
          lines: pauls_sheet,
        }),
      ),
    ).toMatchObject({ outcome: 'applied', position: '2' })
  })
})
