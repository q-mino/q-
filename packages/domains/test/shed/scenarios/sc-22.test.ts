import { describe, expect, test } from 'vitest'
import * as zz from '../../../src/library/index.ts'
import { all, first, oracle } from './oracle.ts'

// SC-22, the business's side (part 5.3): the catalogue of 2,000 tools read
// in pages (DOM-18, D50.1, D72.8), a stream of snapshots, each read when the
// consumer asks for the next (pull), at its own position, with the total
// read in the same snapshot and, if another page follows, the cursor of the
// next: the order key of the page's last entry, closed by the identity
// (LIB-9, D109), encoded by the library, opaque. The pages are not one
// snapshot: a tool added before the cursor is not met going on, one renamed
// past it comes again; each page says where it was read and how many there
// were. Paolo's leaf, the visitor's `page_size` (50 by default, at most 100),
// is part 6.1.

/** A tool as Luca adds it. */
interface Added {
  readonly id: string
  readonly name: string
  readonly category: 'garden' | 'power' | 'hand' | 'ladder'
}

/** So many tools of a shelf, numbered from 1 by three digits: `Hoe 001`, `hoe-001`. */
const numbered = (count: number, name: string, category: Added['category']): readonly Added[] =>
  Array.from({ length: count }, (_, i) => {
    const number = String(i + 1).padStart(3, '0')
    return { id: `${name.toLowerCase()}-${number}`, name: `${name} ${number}`, category }
  })

/**
 * The catalogue's 2,000 tools, in its order (by shelf, then by name by code
 * point, then by id): the garden shelf's 49 hoes, two rakes, 549 spades;
 * 600 chisels on the hand shelf, 200 ladders, 600 drills. The two rakes are
 * the 50th and the 51st: they fall across the first page's boundary.
 */
const the_catalogue: readonly Added[] = [
  ...numbered(49, 'Hoe', 'garden'),
  { id: 'rake-1', name: 'Rake', category: 'garden' },
  { id: 'rake-2', name: 'Rake', category: 'garden' },
  ...numbered(549, 'Spade', 'garden'),
  ...numbered(600, 'Chisel', 'hand'),
  ...numbered(200, 'Ladder', 'ladder'),
  ...numbered(600, 'Drill', 'power'),
]

/** The shed on Monday 16 November: Luca has added the 2,000 tools, the last first. */
const the_shed = async () => {
  const shed = await oracle()
  for (const tool of the_catalogue.toReversed()) {
    await first(shed.tools.add_a_tool(shed.at('2026-11-16T14:00:00.000Z'), tool))
  }
  return shed
}

/** The ids of a page's entries. */
const ids = (event: { readonly event: string }): readonly unknown[] =>
  'entries' in event && Array.isArray(event.entries)
    ? event.entries.map((entry: unknown) =>
        typeof entry === 'object' && entry !== null && 'id' in entry ? entry.id : undefined,
      )
    : []

/** The pages a stream of snapshots has left, pulled to its end. */
const the_rest = async <event>(pages: AsyncIterator<event>): Promise<readonly event[]> => {
  const pulled: event[] = []
  for (;;) {
    const next = await pages.next()
    if (next.done === true) return pulled
    pulled.push(next.value)
  }
}

/** The next page of a stream of snapshots, which must come. */
const page = async <event>(pages: AsyncIterator<event>): Promise<event> => {
  const next = await pages.next()
  if (next.done === true) throw new Error('no page came')
  return next.value
}

const tuesday = '2026-11-17T23:00:00.000Z'

/**
 * The time of the 2,000 tools' story: forty pages and two rakes. Alone
 * about 0.7 s (24 Nov 2026); in the CI's whole check, on a runner slower by
 * half, it reached vitest's 5 s (#55's first run). Twenty times the time
 * alone, as SC-44's and the serial orders'.
 */
const the_time_of_the_2000_tools = 20_000

describe('SC-22, the catalogue in pages (the business)', () => {
  test(
    '2,000 tools, 50 at a time: each page pulled with its position, the total and the cursor of the next; two rakes across a boundary, neither repeated nor skipped',
    async () => {
      const shed = await the_shed()
      const pages = shed.tools.the_catalogue
        .pages(shed.when(tuesday), {}, { size: 50 })
        [Symbol.asyncIterator]()
      const first_page = await page(pages)
      expect(first_page).toMatchObject({ event: 'snapshot', position: '2000', total: 2000 })
      expect(first_page).toHaveProperty('next')
      // The garden shelf's first 50: the 49 hoes, then the first rake by id.
      expect(ids(first_page)).toEqual(the_catalogue.slice(0, 50).map((tool) => tool.id))
      expect(ids(first_page).at(-1)).toBe('rake-1')
      const second_page = await page(pages)
      expect(ids(second_page)[0]).toBe('rake-2')
      const rest = await the_rest(pages)
      // 40 pages of 50; the last says no next.
      expect(rest).toHaveLength(38)
      expect(rest.at(-1)).not.toHaveProperty('next')
      expect([first_page, second_page, ...rest].flatMap(ids)).toEqual(
        the_catalogue.map((tool) => tool.id),
      )
    },
    the_time_of_the_2000_tools,
  )

  test('a tool added before the cursor between two pages is not met going on; the next page counts it, read where it says', async () => {
    const shed = await the_shed()
    const pages = shed.tools.the_catalogue
      .pages(shed.when(tuesday), {}, { size: 50 })
      [Symbol.asyncIterator]()
    expect(await page(pages)).toMatchObject({ position: '2000', total: 2000 })
    // Luca adds a bow saw to the garden shelf: `B` before every hoe.
    await first(
      shed.tools.add_a_tool(shed.at('2026-11-17T23:01:00.000Z'), {
        id: 'bow-saw',
        name: 'Bow saw',
        category: 'garden',
      }),
    )
    const second_page = await page(pages)
    expect(second_page).toMatchObject({ position: '2001', total: 2001 })
    expect(ids(second_page)[0]).toBe('rake-2')
    const rest = await the_rest(pages)
    expect([second_page, ...rest].flatMap(ids)).not.toContain('bow-saw')
    // Read whole now, the bow saw is the first tool of the catalogue.
    expect(ids(await first(shed.tools.the_catalogue(shed.when(tuesday), {})))[0]).toBe('bow-saw')
  })

  test('a tool renamed past the cursor between two pages comes again', async () => {
    const shed = await the_shed()
    const pages = shed.tools.the_catalogue
      .pages(shed.when(tuesday), {}, { size: 50 })
      [Symbol.asyncIterator]()
    const first_page = await page(pages)
    expect(ids(first_page)[0]).toBe('hoe-001')
    // The first hoe becomes a weeder: `W` after every spade.
    await first(
      shed.tools.rename_a_tool(shed.at('2026-11-17T23:01:00.000Z'), {
        tool_id: 'hoe-001',
        name: 'Weeder',
      }),
    )
    const rest = await the_rest(pages)
    const read = [first_page, ...rest].flatMap(ids)
    expect(read).toHaveLength(2001)
    expect(read.filter((id) => id === 'hoe-001')).toHaveLength(2)
    // After the last spade, the end of the garden shelf.
    expect(read.indexOf('hoe-001', 1)).toBe(read.indexOf('spade-549') + 1)
    expect(rest.every((each) => 'total' in each && each.total === 2000)).toBe(true)
  })

  test("a dropped connection resumes from a page's cursor: the pages after it, as pulled", async () => {
    const shed = await the_shed()
    const pulled = shed.tools.the_catalogue
      .pages(shed.when(tuesday), {}, { size: 50 })
      [Symbol.asyncIterator]()
    const first_page = await page(pulled)
    const second_page = await page(pulled)
    const after = 'next' in first_page ? first_page.next : undefined
    if (after === undefined) throw new Error('the first page gives the next cursor')
    const resumed = shed.tools.the_catalogue
      .pages(shed.when(tuesday), {}, { size: 50, after })
      [Symbol.asyncIterator]()
    expect(await page(resumed)).toEqual(second_page)
  })

  test('with no size, one page: every entry, its count, no cursor, as the read whole', async () => {
    const shed = await the_shed()
    const whole = await first(shed.tools.the_catalogue(shed.when(tuesday), {}))
    expect(await all(shed.tools.the_catalogue.pages(shed.when(tuesday), {}, {}))).toEqual([whole])
    expect(whole).toMatchObject({ total: 2000 })
    expect(whole).not.toHaveProperty('next')
  })

  test('a cursor that does not decode to the order key reads no page; one forged that decodes starts elsewhere, and the selection holds', async () => {
    const shed = await the_shed()
    await first(
      shed.tools.retire_a_tool(shed.at('2026-11-17T22:00:00.000Z'), {
        id: 'spade-001',
        reason: 'worn_out',
      }),
    )
    const pages = (after: string) =>
      all(
        shed.tools.the_catalogue.pages(
          shed.when(tuesday),
          { categories: ['garden'] },
          { size: 50, after: zz.cursor.parse(after) },
        ),
      )
    const not_in_schema = [{ event: 'invalid_request', reason: 'cursor_not_in_schema' }]
    // Not as the library writes a cursor.
    expect(await pages('a page further on')).toEqual(not_in_schema)
    // A shelf the catalogue has not: `kitchen`.
    expect(
      await pages('W1siY2F0ZWdvcnkiLCJraXRjaGVuIl0sWyJuYW1lIiwiUmFrZSJdLFsiaWQiLCJyYWtlLTEiXV0'),
    ).toEqual(not_in_schema)
    // Its fields in another order: name, then shelf.
    expect(
      await pages('W1sibmFtZSIsIlJha2UiXSxbImNhdGVnb3J5IiwiZ2FyZGVuIl0sWyJpZCIsInJha2UtMSJdXQ'),
    ).toEqual(not_in_schema)
    // After a rake no one has (`rake-9`, after both): the first spade is
    // retired, so the page starts at the second.
    const [forged] = await pages(
      'W1siY2F0ZWdvcnkiLCJnYXJkZW4iXSxbIm5hbWUiLCJSYWtlIl0sWyJpZCIsInJha2UtOSJdXQ',
    )
    if (forged === undefined) throw new Error('a page comes')
    expect(ids(forged)[0]).toBe('spade-002')
    expect(forged).toMatchObject({ total: 599 })
  })
})
