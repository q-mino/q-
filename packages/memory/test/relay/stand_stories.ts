import { describe, expect, test } from 'vitest'
import { the_scope_of_a_leave, the_scope_of_a_take } from '../../src/index.ts'
import { all, nobody, signing_for, type RelayUnderTest, type Start } from './harness.ts'

// The stand's stories (INV-10; INV-1..INV-5, TST-1, TST-5), one test each,
// through the desk's trees as the desk's interface enters them: the inviter
// with the signature of the stand's key, which the interface verified
// (`signing_for`), the passer-by with nothing. A suite parametrized by the
// relay's factory (TST-1): the oracle's (`relay.test.ts`) and SQLite's
// (`on_sqlite.test.ts`), its conformance suite. A story observes only what
// the ports give (TST-3).
//
// The assistant leaves tickets T1..T6 on the stand `assistente`; Bea and
// Carla are passers-by, on Thursday 28 November 2026 by the relay's clock.

const assistente = 'assistente'
const T = (n: number) => `dGlja2V0LW9mLXRoZS1hc3Npc3RhbnQt${String(n)}`

/** Thursday 28 November 2026, and the days after, by the relay's clock (UTC). */
const thursday = (time: string) => `2026-11-28T${time}:00.000Z`
const friday = (time: string) => `2026-11-29T${time}:00.000Z`
const saturday = (time: string) => `2026-11-30T${time}:00.000Z`

/** What the stories send and read, over a relay. */
const at_the_stand = (relay: RelayUnderTest) => ({
  /** The inviter of a stand leaves a ticket on one, under an operation if the story names one. */
  leaves: async (
    at: string,
    ticket: string,
    takeable_until: string,
    sent: { readonly operation?: string; readonly signs_for?: string; readonly on?: string } = {},
  ) => {
    const signs_for = sent.signs_for ?? assistente
    const the_inviter = await relay.as(signing_for(signs_for), '1.0.0')
    return all(
      relay.inviter.leave_an_invitation(
        the_inviter.at(at, {
          scope: the_scope_of_a_leave(signs_for),
          ...(sent.operation === undefined ? {} : { operation: sent.operation }),
        }),
        { stand: sent.on ?? assistente, ticket, takeable_until },
      ),
    )
  },
  /** Anyone leaves, with no signature. */
  leaves_unsigned: async (at: string, ticket: string, takeable_until: string) => {
    const anyone = await relay.as(nobody, '1.0.0')
    return all(
      relay.inviter.leave_an_invitation(anyone.at(at, { scope: 'inviter' }), {
        stand: assistente,
        ticket,
        takeable_until,
      }),
    )
  },
  /** A passer-by reads the stand: the snapshot's entries. */
  reads: async (at: string, stand: string = assistente) => {
    const anyone = await relay.as(nobody, '1.0.0')
    const [snapshot] = await all(
      relay.passer_by.the_invitations_on_a_stand(anyone.when(at), { stand }),
    )
    if (snapshot?.event !== 'snapshot') throw new Error('a read with no snapshot')
    return snapshot.entries
  },
  /** A passer-by takes an invitation by its id. */
  takes: async (at: string, invitation_id: string) => {
    const anyone = await relay.as(nobody, '1.0.0')
    return all(
      relay.passer_by.take_an_invitation(anyone.at(at, { scope: the_scope_of_a_take }), {
        stand: assistente,
        invitation_id,
      }),
    )
  },
  /** The one who took an invitation reads it by its take. */
  reads_the_taken: async (at: string, take_id: string) => {
    const anyone = await relay.as(nobody, '1.0.0')
    const [snapshot] = await all(
      relay.passer_by.the_invitation_taken(anyone.when(at), { take_id }),
    )
    if (snapshot?.event !== 'snapshot') throw new Error('a read with no snapshot')
    return snapshot.entries
  },
})

/** The id an invitation left has, from the leave's events. */
const the_id_left = (events: readonly { readonly event: string; readonly payload?: unknown }[]) => {
  const [left] = events
  if (left?.event !== 'the_invitation_is_on_the_stand') throw new Error('not left')
  const payload = left.payload
  if (typeof payload !== 'object' || payload === null || !('invitation_id' in payload))
    throw new Error('no invitation id')
  return String(payload.invitation_id)
}

/** The take an invitation taken has, from the take's events. */
const the_take_of = (events: readonly { readonly event: string; readonly payload?: unknown }[]) => {
  const [taken] = events
  if (taken?.event !== 'the_invitation_is_yours') throw new Error('not taken')
  const payload = taken.payload
  if (typeof payload !== 'object' || payload === null || !('take_id' in payload))
    throw new Error('no take id')
  return String(payload.take_id)
}

export const stories_of_the_stand = (
  name: string,
  a_relay: (start?: Start) => Promise<RelayUnderTest>,
): void => {
  describe(`the stand, ${name}`, () => {
    test('left and taken: Bea takes the ticket, and reads it by her take', async () => {
      const relay = await a_relay()
      const stand = at_the_stand(relay)
      const left = await stand.leaves(thursday('09:00'), T(1), friday('09:00'))
      expect(left).toEqual([
        {
          event: 'the_invitation_is_on_the_stand',
          payload: { invitation_id: expect.any(String), left_at: thursday('09:00') },
        },
      ])
      const invitation_id = the_id_left(left)
      expect(await stand.reads(thursday('10:00'))).toEqual([
        { invitation_id, takeable_until: friday('09:00') },
      ])
      const take_id = the_take_of(await stand.takes(thursday('10:12'), invitation_id))
      expect(await stand.reads_the_taken(thursday('10:12'), take_id)).toEqual([
        { invitation_id, ticket: T(1), takeable_until: friday('09:00') },
      ])
      expect(await stand.reads(thursday('10:13'))).toEqual([])
    })

    test('the oldest first', async () => {
      const relay = await a_relay()
      const stand = at_the_stand(relay)
      const first = the_id_left(await stand.leaves(thursday('09:05'), T(1), friday('09:05')))
      const second = the_id_left(await stand.leaves(thursday('09:10'), T(2), friday('09:00')))
      expect((await stand.reads(thursday('10:00'))).map((each) => each.invitation_id)).toEqual([
        first,
        second,
      ])
    })

    test('the stand full: five on it, the sixth refused', async () => {
      const relay = await a_relay()
      const stand = at_the_stand(relay)
      for (const n of [1, 2, 3, 4, 5]) {
        const left = await stand.leaves(thursday(`09:0${String(n)}`), T(n), friday('09:00'))
        expect(left[0]?.event).toBe('the_invitation_is_on_the_stand')
      }
      expect(await stand.leaves(thursday('09:06'), T(6), friday('09:00'))).toEqual([
        { event: 'the_stand_is_full', payload: {} },
      ])
      expect(await stand.reads(thursday('09:07'))).toHaveLength(5)
      // One taken, there is room again.
      const [oldest] = await stand.reads(thursday('09:08'))
      await stand.takes(thursday('09:08'), oldest?.invitation_id ?? '')
      expect(
        (await stand.leaves(thursday('09:09'), T(6), friday('09:00')))[0]?.event,
      ).toBe('the_invitation_is_on_the_stand')
    })

    test('not takeable then: before now, or past 48 hours', async () => {
      const relay = await a_relay()
      const stand = at_the_stand(relay)
      expect(await stand.leaves(thursday('09:00'), T(1), thursday('09:00'))).toEqual([
        { event: 'not_takeable_then', payload: {} },
      ])
      expect(await stand.leaves(thursday('09:00'), T(1), thursday('08:00'))).toEqual([
        { event: 'not_takeable_then', payload: {} },
      ])
      expect(await stand.leaves(thursday('09:00'), T(1), saturday('09:01'))).toEqual([
        { event: 'not_takeable_then', payload: {} },
      ])
      expect((await stand.leaves(thursday('09:00'), T(1), saturday('09:00')))[0]?.event).toBe(
        'the_invitation_is_on_the_stand',
      )
    })

    test('taken away at its time, if nobody took it', async () => {
      const relay = await a_relay()
      const stand = at_the_stand(relay)
      const invitation_id = the_id_left(
        await stand.leaves(thursday('09:00'), T(1), thursday('10:00')),
      )
      const executor = relay.waits(thursday('09:01'))
      await relay.pass(thursday('09:59'))
      expect(await stand.reads(thursday('09:59'))).toHaveLength(1)
      await relay.pass(thursday('10:00'))
      expect(await stand.reads(thursday('10:01'))).toEqual([])
      expect(await stand.takes(thursday('10:01'), invitation_id)).toEqual([
        { event: 'the_invitation_is_no_longer_on_the_stand', payload: {} },
      ])
      expect((await relay.recorded()).at(-1)?.parts[0]).toMatchObject({
        path: 'stand/invitations/fact/an_invitation_has_been_taken_away',
        payload: {
          invitation_taken_away: {
            id: invitation_id,
            status: 'taken_away',
            taken_away_at: thursday('10:00'),
          },
        },
      })
      await executor.stop()
    })

    test('taken before its time: nothing changes when its time is over', async () => {
      const relay = await a_relay()
      const stand = at_the_stand(relay)
      const invitation_id = the_id_left(
        await stand.leaves(thursday('09:00'), T(1), thursday('10:00')),
      )
      const take_id = the_take_of(await stand.takes(thursday('09:30'), invitation_id))
      const executor = relay.waits(thursday('09:31'))
      await relay.pass(thursday('10:00'))
      expect((await relay.recorded()).at(-1)?.parts[0]).toMatchObject({
        path: 'stand/invitations/fact/the_invitation_was_taken_before_its_time',
        payload: { invitation_id },
      })
      expect(await stand.reads_the_taken(thursday('10:01'), take_id)).toEqual([
        { invitation_id, ticket: T(1), takeable_until: thursday('10:00') },
      ])
      await executor.stop()
    })

    test('two takes at once: two invitations, never one twice', async () => {
      const relay = await a_relay()
      const stand = at_the_stand(relay)
      const first = the_id_left(await stand.leaves(thursday('09:00'), T(1), friday('09:00')))
      const second = the_id_left(await stand.leaves(thursday('09:01'), T(2), friday('09:00')))
      // Bea and Carla both read the stand and take its oldest at once: in
      // whatever order the writer takes them, one of them has it.
      const [bea, carla] = await Promise.all([
        stand.takes(thursday('10:00'), first),
        stand.takes(thursday('10:00'), first),
      ])
      const outcomes = [bea[0]?.event, carla[0]?.event].toSorted()
      expect(outcomes).toEqual(['the_invitation_is_no_longer_on_the_stand', 'the_invitation_is_yours'])
      // Who lost tries the next, and has it.
      expect((await stand.takes(thursday('10:00'), second))[0]?.event).toBe(
        'the_invitation_is_yours',
      )
      expect(await stand.reads(thursday('10:01'))).toEqual([])
    })

    test('the stand empty: a passer-by reads nothing', async () => {
      const relay = await a_relay()
      const stand = at_the_stand(relay)
      expect(await stand.reads(thursday('10:00'))).toEqual([])
      expect(await stand.reads(thursday('10:00'), 'another_stand')).toEqual([])
    })

    test('a leave sent again: one invitation', async () => {
      const relay = await a_relay()
      const stand = at_the_stand(relay)
      const once = await stand.leaves(thursday('09:00'), T(1), friday('09:00'), {
        operation: 'leave-1',
      })
      const again = await stand.leaves(thursday('09:00'), T(1), friday('09:00'), {
        operation: 'leave-1',
      })
      expect(again).toEqual(once)
      expect(await stand.reads(thursday('09:01'))).toHaveLength(1)
    })

    test('a leave by a caller that is not the stand’s inviter: not found, or refused', async () => {
      const relay = await a_relay()
      const stand = at_the_stand(relay)
      expect(await stand.leaves_unsigned(thursday('09:00'), T(1), friday('09:00'))).toEqual([
        { event: 'not_found' },
      ])
      expect(
        await stand.leaves(thursday('09:00'), T(1), friday('09:00'), { signs_for: 'another' }),
      ).toEqual([{ event: 'refused', reasons: ['the_stand_is_the_inviter_s'] }])
      expect(await stand.reads(thursday('09:01'))).toEqual([])
    })

    test('a passer-by’s reading, with no ticket in it', async () => {
      const relay = await a_relay()
      const stand = at_the_stand(relay)
      await stand.leaves(thursday('09:00'), T(1), friday('09:00'))
      const [entry] = await stand.reads(thursday('09:01'))
      expect(Object.keys(entry ?? {}).toSorted()).toEqual(['invitation_id', 'takeable_until'])
      expect(JSON.stringify(entry)).not.toContain(T(1))
    })
  })
}
