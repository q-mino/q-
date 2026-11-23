import * as zz from '@q-mino/domains/library'
import { describe, expect, test } from 'vitest'
import { the_collector, type ADeposit, type AnEnvelopeCollected } from '../../src/index.ts'

// The collector (DOM-17, BND-11, SEA-4; step 17), its reads, its collect
// port and the entry played: each deposit not seen yet handed once; one
// the entry throws on left unseen, the rest of its mailbox behind it; a
// collect that throws leaves its mailbox for the next pass; the others go
// on, and the first fault is thrown once the pass is over. On the oracle
// it runs under every story of the node (`memory/test/node/harness.ts`).

const clock = {
  now: () => zz.date_time.parse('2026-11-20T10:00:00.000Z'),
  time_zone: zz.time_zone.parse('UTC'),
}

/** A read's one snapshot, as a read port gives it. */
async function* a_snapshot<entry>(entries: readonly entry[]) {
  yield await Promise.resolve({ event: 'snapshot' as const, entries })
}

/** The relay of the story. */
const relays = ['https://relay.q-mino.test']

/**
 * Anna's phone collecting her mailboxes of L_b (D_mb) and L_c (D_mc), with
 * the R the safe keeps for each, unless the story says one has none; the
 * relay played, its deposits as the story puts them and its faults; the
 * entry played, throwing on the envelopes the story says, once each.
 */
const annas_collector = (story: {
  readonly deposits: ReadonlyMap<string, readonly ADeposit[]>
  readonly the_entry_throws_on?: readonly string[]
  readonly the_collect_throws_at?: readonly string[]
  readonly no_key_for?: string
}) => {
  const handed: AnEnvelopeCollected[] = []
  const throws = new Set(story.the_entry_throws_on ?? [])
  const down = new Set(story.the_collect_throws_at ?? [])
  const collects = the_collector({
    clock,
    address_book: {
      the_mailboxes_i_collect: () =>
        a_snapshot([
          { id: 'L_b', my_mailbox: { deposit_address: 'D_mb', relays } },
          { id: 'L_c', my_mailbox: { deposit_address: 'D_mc', relays } },
        ]),
    },
    safe: {
      the_key_of_a_mailbox: (_, input) =>
        a_snapshot(
          input.mailbox_key_id === story.no_key_for
            ? []
            : [{ collect_secret: `R of ${input.mailbox_key_id}` }],
        ),
    },
    collect: (mailbox) => {
      if (down.delete(mailbox.deposit_address))
        return Promise.reject(new Error(`the relay is down for ${mailbox.deposit_address}`))
      return Promise.resolve(story.deposits.get(mailbox.collect_secret) ?? [])
    },
    entry: (collected) => {
      if (throws.delete(collected.envelope))
        return Promise.reject(new Error(`the entry fell on ${collected.envelope}`))
      handed.push(collected)
      return Promise.resolve()
    },
  })
  return { collects, handed: () => handed.map((each) => `${each.came_to}:${each.envelope}`) }
}

/** Deposits at a mailbox, by their envelopes, their ids the relay's order. */
const at = (...envelopes: readonly string[]): readonly ADeposit[] =>
  envelopes.map((envelope, index) => ({ deposit_id: String(index + 1), envelope }))

describe('the collector (DOM-17)', () => {
  test('each deposit not seen yet handed once, by the mailbox it came to', async () => {
    const deposits = new Map([
      ['R of L_b', at('b1', 'b2')],
      ['R of L_c', at('c1')],
    ])
    const anna = annas_collector({ deposits })
    await anna.collects()
    await anna.collects()
    expect(anna.handed()).toEqual(['D_mb:b1', 'D_mb:b2', 'D_mc:c1'])
  })

  test('a deposit the entry throws on stays unseen, its mailbox’s next ones behind it; the others go on; thrown once the pass is over', async () => {
    const deposits = new Map([
      ['R of L_b', at('b1', 'b2', 'b3')],
      ['R of L_c', at('c1')],
    ])
    const anna = annas_collector({ deposits, the_entry_throws_on: ['b2'] })
    await expect(anna.collects()).rejects.toThrow('the entry fell on b2')
    expect(anna.handed()).toEqual(['D_mb:b1', 'D_mc:c1'])
    await anna.collects()
    expect(anna.handed()).toEqual(['D_mb:b1', 'D_mc:c1', 'D_mb:b2', 'D_mb:b3'])
  })

  test('a collect that throws leaves its mailbox for the next pass; a mailbox with no key in the safe is a fault; the others go on', async () => {
    const deposits = new Map([
      ['R of L_b', at('b1')],
      ['R of L_c', at('c1')],
    ])
    const down = annas_collector({ deposits, the_collect_throws_at: ['D_mb'] })
    await expect(down.collects()).rejects.toThrow('the relay is down for D_mb')
    expect(down.handed()).toEqual(['D_mc:c1'])
    await down.collects()
    expect(down.handed()).toEqual(['D_mc:c1', 'D_mb:b1'])
    const no_key = annas_collector({ deposits, no_key_for: 'L_b' })
    await expect(no_key.collects()).rejects.toThrow('no key of the mailbox of L_b')
    expect(no_key.handed()).toEqual(['D_mc:c1'])
  })
})
