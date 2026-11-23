import { describe, expect, test } from 'vitest'
import type * as zz from '@q-mino/domains/library'
import {
  all,
  nobody,
  pull,
  showing,
  until_caught_up,
  type RelayUnderTest,
  type Start,
} from './harness.ts'

// The relay's stories (`packages/domains/src/mailbox/README.md`, § Stories to
// prove; MBX-1..MBX-3, PER-19, F5, DOM-17, V5), one test each, named as the
// README names it, through the desk's trees as the desk's interface enters them
// (MBX-6). A suite parametrized by the relay's factory (TST-1): the oracle's
// (`relay.test.ts`), and an adapter's of `mailbox` with the same harness, its
// conformance suite. Positions are compared only by order and equality, as
// the stream gives them, never read nor built (DOM-17, TST-3).
//
// Anna's phone deposits on Bruno's mailbox (D_b, his R_b) and Carla's (D_c,
// R_c); E1, E2, E3 are sealed envelopes, opaque to the relay.

const R_b = 'bruno-collect-secret'
const D_b = 'hash-of-bruno-collect-secret'
const R_c = 'carla-collect-secret'
const D_c = 'hash-of-carla-collect-secret'
const E1 = 'c2VhbGVkLWZvci1icnVuby0x'
const E2 = 'c2VhbGVkLWZvci1icnVuby0y'
const E3 = 'c2VhbGVkLWZvci1icnVuby0z'

/** Monday 16 November 2026 by the relay's clock, and the next Monday, as its clock writes them (UTC). */
const monday = (time: string) => `2026-11-16T${time}:00.000Z`
const next_monday = (time: string) => `2026-11-23T${time}:00.000Z`

/** The largest envelope the relay keeps: 64 KiB once decoded, in base64url (MBX-1). */
const the_largest = 'A'.repeat(87_382)

/** What the stories send and read, over a relay. */
const at_the_desk = (relay: RelayUnderTest) => ({
  /** Anna's phone deposits an envelope on a D, showing nothing, under an operation if the story names one. */
  deposits: async (at: string, deposit_address: string, envelope: string, operation?: string) => {
    const anna = await relay.as(nobody, '1.0.0')
    return all(
      relay.depositor.deposit_an_envelope(
        anna.at(at, operation === undefined ? {} : { operation }),
        { deposit_address, envelope },
      ),
    )
  },
  /** A phone that shows a collect secret, or nothing, collects a D, from a position if it has one. */
  collects: async (secret: string | undefined, deposit_address: string, from?: zz.position) => {
    const holder = await relay.as(secret === undefined ? nobody : showing(secret), '1.0.0')
    const when = holder.when(monday('12:00'))
    return from === undefined
      ? relay.holder.collect_the_envelopes(when, { deposit_address })
      : relay.holder.collect_the_envelopes(when, { deposit_address }, from)
  },
})

/** A collect, as its stream is opened. */
type Collect = Awaited<ReturnType<ReturnType<typeof at_the_desk>['collects']>>

/** A collect's stream, open: the consumer pulls its events. */
const opened = (collect: Collect) => collect[Symbol.asyncIterator]()

/** The first event of a collect with no position, its snapshot. */
const snapshot_of = async (collect: ReturnType<typeof opened>) => {
  const [first] = await pull(collect, 1)
  if (first?.event !== 'snapshot')
    throw new Error('a collect with no position begins with no snapshot')
  return first
}

/** The envelopes of a collect's snapshot, in its order. */
const envelopes_of = async (collect: Collect): Promise<readonly string[]> =>
  (await snapshot_of(opened(collect))).entries.map((entry) => entry.envelope)

/**
 * How the relay's adapter answers a collect from a position (DOM-17, DOM-18,
 * LIB-8): a stream of its own resumes from it; one the library composes over
 * its log cannot (the state before the position is gone), and answers
 * `position_unavailable`, so that the phone reads again (story 9's path).
 */
export type Resume = 'from_the_position' | 'by_reading_again'

export const stories_of_the_relay = (
  name: string,
  a_relay: (start?: Start) => Promise<RelayUnderTest>,
  resume: Resume,
): void => {
  describe(`the relay, ${name}`, () => {
    describe('1. a deposit is kept, and collected', () => {
      test('a deposit is kept and its holder collects it', async () => {
        const relay = await a_relay()
        const desk = at_the_desk(relay)
        expect(await desk.deposits(monday('09:02'), D_b, E1)).toEqual([
          { event: 'the_envelope_is_kept', payload: { deposited_at: monday('09:02') } },
        ])
        const bruno = opened(await desk.collects(R_b, D_b))
        const [snapshot, caught_up] = await pull(bruno, 2)
        expect(snapshot).toMatchObject({
          event: 'snapshot',
          entries: [{ deposited_at: monday('09:02'), envelope: E1 }],
          total: 1,
        })
        // The deposit's id, and the position the snapshot is at, as the relay gives them.
        expect(snapshot?.event === 'snapshot' && typeof snapshot.entries[0]?.deposit_id).toBe(
          'string',
        )
        expect(caught_up).toEqual({
          event: 'caught_up',
          position: snapshot?.event === 'snapshot' ? snapshot.position : undefined,
        })
      })
    })

    describe('2. a retry is the same deposit', () => {
      test('a deposit sent again is kept once', async () => {
        const relay = await a_relay()
        const desk = at_the_desk(relay)
        await desk.deposits(monday('09:02'), D_b, E1, 'anna-deposit-1')
        // No answer reached Anna's phone: it sends the same deposit again,
        // under the same operation, and reads the recorded fact (DOM-11).
        expect(await desk.deposits(monday('09:07'), D_b, E1, 'anna-deposit-1')).toEqual([
          { event: 'the_envelope_is_kept', payload: { deposited_at: monday('09:02') } },
        ])
        expect(await envelopes_of(await desk.collects(R_b, D_b))).toEqual([E1])
        expect(await relay.recorded()).toHaveLength(1)
        // Under another operation the same envelope is a second deposit: the
        // relay compares no envelopes (MBX-1).
        expect(await desk.deposits(monday('09:10'), D_b, E1, 'anna-deposit-2')).toEqual([
          { event: 'the_envelope_is_kept', payload: { deposited_at: monday('09:10') } },
        ])
        expect(await envelopes_of(await desk.collects(R_b, D_b))).toEqual([E1, E1])
      })
    })

    describe('3. a collect takes nothing away', () => {
      test('a collect leaves the envelopes in the mailbox', async () => {
        const relay = await a_relay()
        const desk = at_the_desk(relay)
        await desk.deposits(monday('09:02'), D_b, E1)
        expect(await envelopes_of(await desk.collects(R_b, D_b))).toEqual([E1])
        expect(await envelopes_of(await desk.collects(R_b, D_b))).toEqual([E1])
        expect(
          (await relay.recorded()).flatMap((fact) => fact.parts.map((part) => part.path)),
        ).toEqual(['mailbox/deposits/fact/an_envelope_has_been_deposited'])
      })
    })

    describe('4. a collect resumes from a position', () => {
      test('a collect resumes from the position it left off', async () => {
        const relay = await a_relay()
        const desk = at_the_desk(relay)
        await desk.deposits(monday('09:02'), D_b, E1)
        const collected = await snapshot_of(opened(await desk.collects(R_b, D_b)))
        const e1 = collected.entries[0]
        await desk.deposits(monday('09:20'), D_b, E2)
        await desk.deposits(monday('09:30'), D_b, E3)
        const resumed = await until_caught_up(
          opened(await desk.collects(R_b, D_b, collected.position)),
        )
        if (resume === 'by_reading_again') {
          // A stream the library composes cannot resume: Bruno's phone reads
          // again, and drops E1 by its identity.
          expect(resumed).toEqual([{ event: 'position_unavailable' }])
          const again = await snapshot_of(opened(await desk.collects(R_b, D_b)))
          expect(again.entries[0]).toEqual(e1)
          expect(again.entries).toMatchObject([
            { envelope: E1 },
            { deposited_at: monday('09:20'), envelope: E2 },
            { deposited_at: monday('09:30'), envelope: E3 },
          ])
          return
        }
        // Inclusive (DOM-17): E1 again at the position Bruno left off, which
        // his phone drops by its position and identity; then E2 and E3, in
        // the order of their deposits.
        expect(resumed[0]).toEqual({
          event: 'fact',
          position: collected.position,
          identity: e1?.deposit_id,
          entry: e1,
        })
        expect(resumed).toMatchObject([
          { event: 'fact' },
          { event: 'fact', entry: { deposited_at: monday('09:20'), envelope: E2 } },
          { event: 'fact', entry: { deposited_at: monday('09:30'), envelope: E3 } },
          { event: 'caught_up' },
        ])
        // Each event names its entry by the deposit's id (`stream.identity`).
        for (const event of resumed) {
          if (event.event === 'fact') expect(event.identity).toBe(event.entry.deposit_id)
        }
        const positions = resumed.map((event) => ('position' in event ? event.position : undefined))
        // Every fact at a position of its own; his phone keeps the last, P3.
        expect(new Set(positions.slice(0, 3)).size).toBe(3)
        expect(positions[3]).toBe(positions[2])
      })
    })

    describe('5. a collect is live', () => {
      test('a live collect gets each new envelope', async () => {
        const relay = await a_relay()
        const desk = at_the_desk(relay)
        await desk.deposits(monday('09:02'), D_b, E1)
        const live = opened(await desk.collects(R_b, D_b))
        expect((await pull(live, 2)).map((event) => event.event)).toEqual(['snapshot', 'caught_up'])
        const next = live.next()
        await desk.deposits(monday('09:20'), D_b, E2)
        expect((await next).value).toMatchObject({
          event: 'fact',
          entry: { deposited_at: monday('09:20'), envelope: E2 },
        })
      })
    })

    describe('6. seven days, then discarded', () => {
      test('an envelope is discarded seven days after its deposit', async () => {
        const relay = await a_relay()
        const desk = at_the_desk(relay)
        await desk.deposits(monday('09:02'), D_b, E1)
        const live = opened(await desk.collects(R_b, D_b))
        const snapshot = await snapshot_of(live)
        await pull(live, 1)
        const executor = relay.waits(monday('09:05'))
        // The next Monday at 9:01 it is still in the mailbox.
        await relay.pass(next_monday('09:01'))
        expect(await envelopes_of(await desk.collects(R_b, D_b))).toEqual([E1])
        // At 9:02, by the relay's clock, the wait's return discards it.
        const next = live.next()
        await relay.pass(next_monday('09:02'))
        expect((await next).value).toMatchObject({
          event: 'left',
          identity: snapshot.entries[0]?.deposit_id,
        })
        expect(await envelopes_of(await desk.collects(R_b, D_b))).toEqual([])
        const discarded = (await relay.recorded()).at(-1)?.parts[0]
        expect(discarded).toMatchObject({
          path: 'mailbox/deposits/fact/an_envelope_has_been_discarded',
          payload: {
            discarded_deposit: { status: 'discarded', discarded_at: '2026-11-23T09:02:00.000Z' },
          },
        })
        await executor.stop()
      })

      test('an envelope never collected is discarded too', async () => {
        const relay = await a_relay()
        const desk = at_the_desk(relay)
        await desk.deposits(monday('09:02'), D_b, E1)
        await desk.deposits(monday('09:10'), D_b, E2)
        const executor = relay.waits(monday('09:15'))
        await relay.pass(next_monday('09:05'))
        expect(await envelopes_of(await desk.collects(R_b, D_b))).toEqual([E2])
        await relay.pass(next_monday('09:10'))
        expect(await envelopes_of(await desk.collects(R_b, D_b))).toEqual([])
        await executor.stop()
      })

      test('the wait delivered again discards once', async () => {
        const relay = await a_relay({ redelivered: true })
        const desk = at_the_desk(relay)
        await desk.deposits(monday('09:02'), D_b, E1)
        const executor = relay.waits(monday('09:05'))
        await relay.pass(next_monday('09:02'))
        expect(
          (await relay.recorded()).flatMap((fact) => fact.parts.map((part) => part.path)),
        ).toEqual([
          'mailbox/deposits/fact/an_envelope_has_been_deposited',
          'mailbox/deposits/fact/an_envelope_has_been_discarded',
        ])
        await executor.stop()
      })
    })

    describe('7. only with R', () => {
      test('a mailbox is collected only with its collect secret', async () => {
        const relay = await a_relay()
        const desk = at_the_desk(relay)
        await desk.deposits(monday('09:02'), D_b, E1)
        expect(await all(await desk.collects(R_c, D_b))).toEqual([
          { event: 'refused', reasons: ['the_collect_secret_is_the_mailboxs'] },
        ])
      })

      test('no collect secret, no holder', async () => {
        const relay = await a_relay()
        const desk = at_the_desk(relay)
        await desk.deposits(monday('09:02'), D_b, E1)
        expect(await all(await desk.collects(undefined, D_b))).toEqual([{ event: 'not_found' }])
      })

      test('anyone deposits, with no secret', async () => {
        const relay = await a_relay()
        const desk = at_the_desk(relay)
        expect(await desk.deposits(monday('09:02'), D_c, E2)).toEqual([
          { event: 'the_envelope_is_kept', payload: { deposited_at: monday('09:02') } },
        ])
      })
    })

    describe('8. each mailbox its own', () => {
      test('each mailbox holds only its deposits', async () => {
        const relay = await a_relay()
        const desk = at_the_desk(relay)
        await desk.deposits(monday('09:02'), D_b, E1)
        await desk.deposits(monday('09:03'), D_c, E2)
        expect(await envelopes_of(await desk.collects(R_b, D_b))).toEqual([E1])
        expect(await envelopes_of(await desk.collects(R_c, D_c))).toEqual([E2])
      })
    })

    describe('9. a position no longer kept', () => {
      test('a collect from a position no longer kept reads again', async () => {
        const relay = await a_relay()
        const desk = at_the_desk(relay)
        await desk.deposits(monday('09:02'), D_b, E1)
        const collected = await snapshot_of(opened(await desk.collects(R_b, D_b)))
        await desk.deposits(monday('09:20'), D_b, E2)
        const kept_from = await snapshot_of(opened(await desk.collects(R_b, D_b)))
        relay.forget(kept_from.position)
        expect(
          await until_caught_up(opened(await desk.collects(R_b, D_b, collected.position))),
        ).toEqual([{ event: 'position_unavailable' }])
        // Bruno's phone collects again with no position: the snapshot, then the stream.
        const again = opened(await desk.collects(R_b, D_b))
        expect((await snapshot_of(again)).entries.map((entry) => entry.envelope)).toEqual([E1, E2])
        expect((await pull(again, 1)).map((event) => event.event)).toEqual(['caught_up'])
      })
    })

    describe('10. what the relay does not take', () => {
      test('an envelope too large or not base64url is not deposited', async () => {
        const relay = await a_relay()
        const desk = at_the_desk(relay)
        for (const [deposit_address, envelope] of [
          [D_b, `${the_largest}A`],
          [D_b, 'c2VhbGVk+Zm9y/YnJ1bm8='],
          ['not/a/deposit/address', E1],
          ['D'.repeat(129), E1],
        ] as const) {
          expect(await desk.deposits(monday('09:02'), deposit_address, envelope)).toMatchObject([
            { event: 'invalid_request' },
          ])
        }
        expect(await relay.recorded()).toEqual([])
        // The largest envelope it keeps, at its limit.
        expect(await desk.deposits(monday('09:03'), D_b, the_largest)).toEqual([
          { event: 'the_envelope_is_kept', payload: { deposited_at: monday('09:03') } },
        ])
      })
    })
  })
}
