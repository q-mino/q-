import { cpus } from 'node:os'
import { describe, expect, test } from 'vitest'
import {
  anna_s_phone,
  by_mode,
  last_of,
  type ATransaction,
  type TheLeafsLookup,
} from './a_phone_counted.ts'

// The cost of the duplicate branch's two lookups (step 21's checks; DOM-11
// "Where the duplicate branch runs", WEB-9), measured for A's decision on
// whether to keep both: a request through a leaf of `self` reads its
// operation at the leaf and at the port, one `readonly` transaction each,
// before the step reads it again in its `readwrite` one. On Anna's phone
// over IndexedDB, N requests of `rename_a_bond` through the leaf, each under
// a new operation, then each sent again under its own (answered from the
// recorded fact): as built (two lookups; a retry answered at the leaf,
// before its schema), and with the leaf's lookup reading nothing, no
// transaction (a decorator of the lookup the port gives its leaf), so that
// only the port's lookup reads (a retry answered at the port, after the
// leaf's schema and nodes). A warm-up of each variant first. Per variant:
// the median and the 90th percentile of a request's time, and its
// transactions by mode.
// fake-indexeddb in Node is not a phone's browser: the numbers compare the
// variants, they do not tell a phone's times (step 27 measures on one).
// Run by hand, not in CI: `MEASURE=1 pnpm vitest run <this file>`.

/** The requests of a measured run, and of the warm-up before it. */
const requests = 200
const warm_up = 50

/** A request's time, in milliseconds, and the transactions it opened. */
interface ARequestMeasured {
  readonly milliseconds: number
  readonly opened: readonly ATransaction[]
}

/** The value at a fraction of the sorted times (nearest rank). */
const at_rank = (sorted: readonly number[], fraction: number): number =>
  sorted[Math.min(sorted.length - 1, Math.ceil(fraction * sorted.length) - 1)] ?? Number.NaN

/** What a series of requests tells: median, 90th percentile, the transactions per request by mode. */
const summary = (measured: readonly ARequestMeasured[]) => {
  const sorted = measured.map((each) => each.milliseconds).toSorted((a, b) => a - b)
  const counts = new Set(measured.map((each) => JSON.stringify(by_mode(each.opened))))
  return {
    median: at_rank(sorted, 0.5),
    p90: at_rank(sorted, 0.9),
    total: sorted.reduce((sum, each) => sum + each, 0),
    transactions: [...counts].join(' | '),
  }
}

/**
 * N requests of `rename_a_bond` through the leaf on a phone of its own,
 * each under a new operation; then each sent again under its own. Every
 * request renames the bond, and every retry gives its first try's events.
 */
const a_run = async (lookup: TheLeafsLookup, count: number) => {
  const anna = await anna_s_phone(lookup)
  const the_request = async (at: number) => {
    const sent = { bond_id: 'L_b', name: `Bru ${String(at)}` }
    const { result, opened } = await anna.transactions.during(async () => {
      const from = performance.now()
      const events = await anna.the_user(
        'usecase/rename_a_bond',
        sent,
        `anna-renames-L_b-${String(at)}`,
      )
      return { events, milliseconds: performance.now() - from }
    })
    return { events: result.events, measured: { milliseconds: result.milliseconds, opened } }
  }
  const first: Awaited<ReturnType<typeof the_request>>[] = []
  for (let at = 0; at < count; at += 1) first.push(await the_request(at))
  const again: Awaited<ReturnType<typeof the_request>>[] = []
  for (let at = 0; at < count; at += 1) again.push(await the_request(at))
  anna.opened.let_go()
  for (const each of first)
    expect(last_of(each.events)).toMatchObject({ event: 'the_bond_is_renamed' })
  expect(again.map((each) => each.events)).toEqual(first.map((each) => each.events))
  return {
    new: summary(first.map((each) => each.measured)),
    retried: summary(again.map((each) => each.measured)),
  }
}

const the_milliseconds = (value: number): string => value.toFixed(3).padStart(8)

describe.runIf(process.env['MEASURE'] === '1')("the duplicate branch's two lookups", () => {
  test(`${String(requests)} requests through a leaf, and their retries`, async () => {
    await a_run('as_built', warm_up)
    await a_run('reads_nothing', warm_up)
    const as_built = await a_run('as_built', requests)
    const reads_nothing = await a_run('reads_nothing', requests)
    const rows = [
      ['as built (leaf + port)', 'new', as_built.new],
      ['as built (leaf + port)', 'retried', as_built.retried],
      ["leaf's lookup off", 'new', reads_nothing.new],
      ["leaf's lookup off", 'retried', reads_nothing.retried],
    ] as const
    const machine = `${cpus()[0]?.model ?? 'unknown cpu'} ×${String(cpus().length)}, Node ${process.version}, fake-indexeddb 6.2.7`
    const lines = [
      `the two lookups: ${String(requests)} requests of rename_a_bond through self's leaf, each variant on a phone of its own (${machine})`,
      `${'variant'.padEnd(24)}${'request'.padEnd(9)}${'median ms'.padStart(10)}${'p90 ms'.padStart(10)}${'total ms'.padStart(10)}  transactions per request`,
      ...rows.map(
        ([variant, request, measured]) =>
          `${variant.padEnd(24)}${request.padEnd(9)}${the_milliseconds(measured.median).padStart(10)}${the_milliseconds(measured.p90).padStart(10)}${measured.total.toFixed(1).padStart(10)}  ${measured.transactions}`,
      ),
    ]
    process.stdout.write(`${lines.join('\n')}\n`)
    expect(as_built.new.transactions).toBe(JSON.stringify({ readonly: 2, readwrite: 1 }))
    expect(reads_nothing.new.transactions).toBe(JSON.stringify({ readonly: 1, readwrite: 1 }))
    expect(as_built.retried.transactions).toBe(JSON.stringify({ readonly: 1, readwrite: 0 }))
    expect(reads_nothing.retried.transactions).toBe(JSON.stringify({ readonly: 1, readwrite: 0 }))
  }, 240_000)
})
