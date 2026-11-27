import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import { describe, expect, test } from 'vitest'
import {
  a_hosted_extension,
  compose_an_extension,
  the_kernels_offer,
  type ANotice,
  type Composed,
  type HostingWiring,
  type TheKernelsTraced,
  type Transport,
  the_hold_of_a_request,
  TheExtensionIsNotRunningYet,
} from '../../src/index.ts'
import { the_manifest_of_waves } from './fixtures.ts'

// The kernel hosting an extension (EXT-2, EXT-4, EXT-13, EXT-15; part 12.4),
// on a made-up extension, `waves`, built on the boundary's side of the
// messages as any extension is (`the_extensions_side`), its leaves played
// by each test: loaded only while active, its `ready` compared with its
// manifest; its leaves invoked with the scope and the context the kernel
// composes; on `known` one event, the rest traced; its storage served as
// its manifest declares; a fall, then a second.

/**
 * A leaf of `waves` that follows (K-4): its events, then one more each time
 * the test lets it step, until its flow is ended; whether its iterator was
 * closed (its `finally`).
 */
interface AFollow {
  readonly follows: readonly unknown[]
  readonly steps: () => Promise<void>
  readonly closed: { current: boolean }
}

/** How `waves` plays an invocation in a test: its events, an exception (a fall in its realm), or a follow. */
type Playing = (invocation: boundary.an_invocation) => readonly unknown[] | Error | AFollow

/** `waves` as its package would give it: its side of the messages over a configurator that reads its partition once, then plays its leaves. */
const waves =
  (playing: { current: Playing }, said: { readonly version?: boundary.semver } = {}) =>
  (send: boundary.Send) =>
    boundary.the_extensions_side({
      name: 'waves',
      version: said.version ?? '1.0.0',
      declaration: { touches: ['the_port_of_requests', 'its_storage'] as const },
      send,
      configurator: async (given) => {
        await given.ports.its_storage.read({ read: 'keys', keys: ['meta/facts'] })
        return {
          invoke: async function* (invocation) {
            const played = playing.current(invocation)
            if (played instanceof Error) throw played
            if ('follows' in played) {
              try {
                for (const event of played.follows) yield await Promise.resolve(event)
                for (let step = 1; ; step += 1) {
                  await played.steps()
                  yield { event: 'step', payload: { step } }
                }
              } finally {
                played.closed.current = true
              }
            }
            for (const event of played) yield await Promise.resolve(event)
          },
          start: () => undefined,
          stop: () => Promise.resolve(),
          redeliver: () => Promise.resolve(),
          discard: () => () => Promise.resolve(),
        }
      },
    })

/** Many turns of the microtasks: what the realm does, which answers at once. */
const settled = async (): Promise<void> => {
  for (let turn = 0; turn < 200; turn += 1) await Promise.resolve()
}

/** Every event of a stream, until it ends. */
const all = async (events: AsyncIterable<unknown>): Promise<readonly unknown[]> => {
  const every: unknown[] = []
  for await (const event of events) every.push(event)
  return every
}

const clock: zz.Clock = {
  now: () => zz.date_time.parse('2026-11-20T09:00:00.000Z'),
  time_zone: zz.time_zone.parse('Europe/Rome'),
}

/** A node hosting `waves`: its realm in process, each message copied as JSON; what the kernel sent it, what it traced, its notices. */
const a_node = (
  more: {
    readonly composed?: Composed
    readonly version?: boundary.semver
    readonly playing?: Playing
    readonly storage_answers?: boolean
    /** Whether it is active, as the office answers each time it is asked; by default at once, until `deactivate`. */
    readonly is_active?: () => Promise<boolean>
    readonly now?: { current: string }
  } = {},
) => {
  const to_the_extension: boundary.a_message_to_an_extension[] = []
  const traced: TheKernelsTraced[] = []
  const notices: ANotice[] = []
  const kept = new Map<string, boundary.Json>()
  let loads = 0
  let runs = 0
  let active = true
  /** The pauses the hosting asked of the time that passes, and their ends, let by the test. */
  const paused: number[] = []
  const pauses_end: (() => void)[] = []
  const playing = { current: more.playing ?? ((): readonly unknown[] => []) }
  const copied = (message: unknown): unknown => JSON.parse(JSON.stringify(message))
  const transport: Transport = (to_the_kernel) => {
    loads += 1
    let loaded = true
    const realm = waves(
      playing,
      more.version === undefined ? {} : { version: more.version },
    )((message) => {
      if (loaded) to_the_kernel(copied(message))
    })
    return {
      to_the_extension: (message) => {
        if (!loaded) return
        to_the_extension.push(message)
        realm.receive(copied(message)).catch(() => undefined)
      },
      unload: () => {
        loaded = false
      },
    }
  }
  const composition = compose_an_extension(the_kernels_offer([]))(the_manifest_of_waves())
  if (composition.composition === 'a_fault') throw new Error(composition.message)
  const wiring: HostingWiring = {
    composed: more.composed ?? composition.composed,
    transport,
    is_active: more.is_active ?? (() => Promise.resolve(active)),
    the_port_of_requests: () => Promise.resolve({ answer: 'no_response' }),
    its_storage: {
      read: (read) =>
        more.storage_answers === false
          ? new Promise<never>(() => undefined)
          : Promise.resolve({
              answer: 'read',
              entries:
                read.read === 'keys'
                  ? read.keys.flatMap((key) => {
                      const value = kept.get(key)
                      return value === undefined ? [] : [{ key, value }]
                    })
                  : [],
            }),
      commit: () => Promise.resolve({ answer: 'committed' }),
    },
    the_bond_on_known: (context) => ({
      bond: String(context['bond_id']),
      peer_key: 'KEY-OF-ANNA',
      bond_name: 'Anna',
    }),
    the_declared_time_on_known: (context) => String(context['declared_at']),
    trace: (entry) => {
      traced.push(entry)
    },
    notices: (notice) => {
      notices.push(notice)
    },
    clock:
      more.now === undefined
        ? clock
        : { now: () => zz.date_time.parse(more.now?.current), time_zone: clock.time_zone },
    elapsed: (milliseconds) => {
      paused.push(milliseconds)
      return new Promise((done) => {
        pauses_end.push(done)
      })
    },
    a_while: () => Promise.resolve(),
    when_it_runs: () => {
      runs += 1
    },
  }
  const hosted = a_hosted_extension(wiring)
  return {
    hosted,
    to_the_extension,
    traced,
    notices,
    playing,
    loads: () => loads,
    runs: () => runs,
    paused,
    /** The pauses asked so far ended. */
    time_passes: () => {
      for (const done of pauses_end.splice(0)) done()
    },
    deactivate: () => {
      active = false
    },
  }
}

/** A peer's request to `wave` on `known`, as the library's mounted port invokes it: below the kernel's node, its context the node's. */
const a_peers_wave: zz.MountedInvocation = {
  leaf: 'usecase/wave',
  version: '1.0.0',
  context: {
    bond_id: 'B-ANNA',
    caller: 'KEY-OF-ANNA',
    declared_at: '2026-11-20T08:59:58.000Z',
    now: '2026-11-20T09:00:00.000Z',
  },
  operation: { id: zz.operation_id.parse('P1'), scope: 'known/KEY-OF-ANNA' },
  correlation: zz.correlation.parse('P1'),
  input: { to: 'Anna' },
}

describe('an extension hosted (EXT-15)', () => {
  test('loaded only while active; its storage served while it loads; started once ready is its manifest’s', async () => {
    const node = a_node()
    node.deactivate()
    expect(await node.hosted.load()).toEqual({ loaded: 'not_active' })
    expect(node.loads()).toBe(0)
    const active = a_node()
    expect(await active.hosted.load()).toEqual({ loaded: 'running' })
    expect(active.to_the_extension.map((message) => message.message)).toEqual(['answer', 'start'])
    expect(active.hosted.life()).toEqual({ life: 'running' })
    // The node told it runs, once (MSG-16: its collector forgets what it saw); not for a load that did not run.
    expect(active.runs()).toBe(1)
    expect(await active.hosted.load()).toEqual({ loaded: 'running' })
    expect(active.runs()).toBe(1)
    expect(node.runs()).toBe(0)
  })

  test('a ready that differs from its manifest: a composition fault, it does not run', async () => {
    const node = a_node({ version: '1.1.0' })
    const loaded = await node.hosted.load()
    expect(loaded.loaded === 'a_composition_fault' && loaded.fault.message).toBe(
      'waves: it said ready as waves 1.1.0 with the boundary 1.0.0, not as its manifest (EXT-15)',
    )
    expect(node.hosted.life()).toEqual({ life: 'stopped', why: 'its_ready_differs' })
    expect(node.to_the_extension.map((message) => message.message)).toEqual(['answer'])
    await expect(all(node.hosted.invokes('known')(a_peers_wave))).rejects.toThrow(
      'waves is not running, stopped: it invokes nothing (EXT-15)',
    )
  })
})

describe('a leaf invoked through the boundary (EXT-2, EXT-3)', () => {
  test('on known: the bond alone in its context, the scope from the bond, never the Caller', async () => {
    const node = a_node({
      playing: () => [{ event: 'waved', payload: { to: 'Anna' } }],
    })
    await node.hosted.load()
    expect(await all(node.hosted.invokes('known')(a_peers_wave))).toEqual([
      { event: 'waved', payload: { to: 'Anna' } },
    ])
    const invoked = node.to_the_extension.find((message) => message.message === 'invoke')
    expect(invoked).toEqual({
      message: 'invoke',
      id: 'invocation-1',
      persona: 'known',
      use_case: 'usecase/wave',
      version: '1.0.0',
      context: { bond: 'B-ANNA' },
      operation: { id: 'P1', scope: 'known/B-ANNA' },
      correlation: 'P1',
      input: { to: 'Anna' },
    })
    expect(JSON.stringify(invoked)).not.toContain('KEY-OF-ANNA')
  })

  test('on known, what sees declares: the peer’s key, the bond’s name, the time the request declares', async () => {
    const composition = compose_an_extension(the_kernels_offer([]))(
      the_manifest_of_waves({
        sees: ['the_peer_key', 'the_name_of_the_bond', 'the_declared_time'],
      }),
    )
    if (composition.composition === 'a_fault') throw new Error(composition.message)
    const node = a_node({ composed: composition.composed })
    await node.hosted.load()
    await all(node.hosted.invokes('known')(a_peers_wave))
    expect(node.to_the_extension.find((message) => message.message === 'invoke')).toMatchObject({
      context: {
        bond: 'B-ANNA',
        peer_key: 'KEY-OF-ANNA',
        bond_name: 'Anna',
        declared_at: '2026-11-20T08:59:58.000Z',
      },
    })
  })

  test('on self: the entry’s scope and no context; its events as they come, for the library to parse', async () => {
    const node = a_node({
      playing: () => [{ event: 'the_wave_is_sent', payload: {} }, { event: 'odd' }],
    })
    await node.hosted.load()
    const events = await all(
      node.hosted.invokes('self')({
        leaf: 'usecase/wave_to_a_bond',
        version: '1.0.0',
        context: { caller: 'the_user' },
        operation: { id: zz.operation_id.parse('op-1'), scope: 'self/user' },
        input: { bond: 'B-BRUNO' },
      }),
    )
    expect(events).toEqual([{ event: 'the_wave_is_sent', payload: {} }, { event: 'odd' }])
    expect(node.to_the_extension.find((message) => message.message === 'invoke')).toMatchObject({
      context: {},
      operation: { id: 'op-1', scope: 'self/user' },
    })
    node.hosted.outside_the_surface('self')({
      leaf: 'usecase/wave_to_a_bond',
      version: '1.0.0',
      event: { event: 'odd' },
    })
    expect(node.traced).toEqual([
      {
        why: 'an_event_not_in_the_surface',
        extension: 'waves',
        now: '2026-11-20T09:00:00.000Z',
        persona: 'self',
        leaf: 'usecase/wave_to_a_bond',
        version: '1.0.0',
        event: { event: 'odd' },
        the_event_is: 'not_typed',
      },
    ])
  })

  test('on known one event: the first its surface types is the answer, the rest traced (EXT-15)', async () => {
    const node = a_node({
      playing: () => [
        { event: 'odd', payload: {} },
        { event: 'waved', payload: { to: 'Anna' } },
        { event: 'waved', payload: { to: 'Bruno' } },
      ],
    })
    await node.hosted.load()
    expect(await all(node.hosted.invokes('known')(a_peers_wave))).toEqual([
      { event: 'waved', payload: { to: 'Anna' } },
    ])
    expect(
      node.traced.map((entry) => entry.why === 'an_event_not_in_the_surface' && entry.the_event_is),
    ).toEqual(['not_typed', 'after_the_answer'])
  })
})

describe('an invocation ended by its consumer (EXT-2, K-4)', () => {
  /** A follow of `waves`, and the gate that lets it step once. */
  const a_follow = () => {
    let open = (): void => undefined
    const follow: AFollow = {
      follows: [{ event: 'the_wave_is_sent', payload: {} }],
      steps: () =>
        new Promise((resolve) => {
          open = resolve
        }),
      closed: { current: false },
    }
    return {
      follow,
      steps_once: () => {
        open()
      },
    }
  }
  const on_self = {
    leaf: 'usecase/wave_to_a_bond',
    version: zz.semver.parse('1.0.0'),
    context: { caller: 'the_user' },
    operation: { id: zz.operation_id.parse('op-1'), scope: 'self/user' },
    input: { bond: 'B-BRUNO' },
  }

  test('a follow on self stopped after its first event: end sent, the extension says done, nothing traced', async () => {
    const { follow, steps_once } = a_follow()
    const node = a_node({ playing: () => follow })
    await node.hosted.load()
    for await (const event of node.hosted.invokes('self')(on_self)) {
      expect(event).toEqual({ event: 'the_wave_is_sent', payload: {} })
      break
    }
    const invoked = node.to_the_extension.find((message) => message.message === 'invoke')
    expect(node.to_the_extension.at(-1)).toEqual({
      message: 'end',
      id: invoked?.message === 'invoke' ? invoked.id : '',
    })
    await settled()
    // The leaf's generator, waiting for its next step, finishes it, then is closed.
    expect(follow.closed.current).toBe(false)
    steps_once()
    await settled()
    expect(follow.closed.current).toBe(true)
    expect(node.traced).toEqual([])
  })

  test('a flow to its done, or failed, is not ended: no end sent', async () => {
    const node = a_node({ playing: () => [{ event: 'the_wave_is_sent', payload: {} }] })
    await node.hosted.load()
    expect(await all(node.hosted.invokes('self')(on_self))).toHaveLength(1)
    const failing = a_node({ playing: () => new Error('its realm threw') })
    await failing.hosted.load()
    await expect(all(failing.hosted.invokes('self')(on_self))).rejects.toThrow()
    for (const each of [node, failing]) {
      expect(each.to_the_extension.map((message) => message.message)).not.toContain('end')
    }
  })

  test('on known, the request answered by its first event: the follow ended, what still crosses dropped', async () => {
    const { follow } = a_follow()
    const node = a_node({
      playing: () => ({ ...follow, follows: [{ event: 'waved', payload: { to: 'Anna' } }] }),
    })
    await node.hosted.load()
    for await (const event of node.hosted.invokes('known')(a_peers_wave)) {
      expect(event).toEqual({ event: 'waved', payload: { to: 'Anna' } })
      break
    }
    await settled()
    expect(node.to_the_extension.map((message) => message.message)).toEqual([
      'answer',
      'start',
      'invoke',
      'end',
    ])
    expect(node.traced).toEqual([])
  })
})

describe('a peer’s request before it runs (EXT-15, MSG-9)', () => {
  test('active, not loaded yet at the start or still loading: held, thrown for the collector’s next pass', async () => {
    const node = a_node({ storage_answers: false })
    await expect(all(node.hosted.invokes('known')(a_peers_wave))).rejects.toBeInstanceOf(
      TheExtensionIsNotRunningYet,
    )
    void node.hosted.load()
    await settled()
    expect(node.hosted.life()).toEqual({ life: 'loading' })
    await expect(all(node.hosted.invokes('known')(a_peers_wave))).rejects.toBeInstanceOf(
      TheExtensionIsNotRunningYet,
    )
    expect(node.to_the_extension.some((message) => message.message === 'invoke')).toBe(false)
  })

  test('past the hold, or not active, or on self (where the ask waits, MSG-17): not held, it invokes nothing', async () => {
    const now = { current: '2026-11-20T09:00:00.000Z' }
    const node = a_node({ storage_answers: false, now })
    now.current = new Date(Date.parse(now.current) + the_hold_of_a_request).toISOString()
    const past = await all(node.hosted.invokes('known')(a_peers_wave)).catch(
      (fault: unknown) => fault,
    )
    expect(past).toBeInstanceOf(Error)
    expect(past).not.toBeInstanceOf(TheExtensionIsNotRunningYet)
    const on_self = await all(node.hosted.invokes('self')(a_peers_wave)).catch(
      (fault: unknown) => fault,
    )
    expect(on_self).not.toBeInstanceOf(TheExtensionIsNotRunningYet)
    const another = a_node({ storage_answers: false })
    another.deactivate()
    const not_active = await all(another.hosted.invokes('known')(a_peers_wave)).catch(
      (fault: unknown) => fault,
    )
    expect(not_active).toBeInstanceOf(Error)
    expect(not_active).not.toBeInstanceOf(TheExtensionIsNotRunningYet)
  })
})

describe('the user’s ask on self before it runs (MSG-17)', () => {
  /** The user's ask on `self` (a part's read), as the library's mounted port invokes it. */
  const her_ask: zz.MountedInvocation = {
    leaf: 'usecase/wave_to_a_bond',
    version: '1.0.0',
    context: { caller: 'the_user' },
    input: { bond: 'B-BRUNO' },
  }

  test('active, not loaded yet at the start: it waits for the load, then it is served', async () => {
    const node = a_node({ playing: () => [{ event: 'the_wave_is_sent', payload: {} }] })
    const asked = all(node.hosted.invokes('self')(her_ask))
    await settled()
    expect(node.to_the_extension.some((message) => message.message === 'invoke')).toBe(false)
    // At most the hold of MSG-9, from the hosting's creation.
    expect(node.paused).toEqual([the_hold_of_a_request])
    expect(await node.hosted.load()).toEqual({ loaded: 'running' })
    expect(await asked).toEqual([{ event: 'the_wave_is_sent', payload: {} }])
  })

  test('it comes to run while the office answers whether it is active: woken, served with no wait', async () => {
    const answers: ((active: boolean) => void)[] = []
    const node = a_node({
      playing: () => [{ event: 'the_wave_is_sent', payload: {} }],
      // Her ask's question held; the load's answered at once.
      is_active: () =>
        answers.length === 0
          ? new Promise((answer) => {
              answers.push(answer)
            })
          : Promise.resolve(true),
    })
    const asked = all(node.hosted.invokes('self')(her_ask))
    await settled()
    expect(await node.hosted.load()).toEqual({ loaded: 'running' })
    answers[0]?.(true)
    // No time passes: the change of its life woke it.
    expect(await asked).toEqual([{ event: 'the_wave_is_sent', payload: {} }])
  })

  test('loading past the hold: it waited, then it invokes nothing', async () => {
    const now = { current: '2026-11-20T09:00:00.000Z' }
    const node = a_node({ storage_answers: false, now })
    void node.hosted.load()
    await settled()
    expect(node.hosted.life()).toEqual({ life: 'loading' })
    const asked = all(node.hosted.invokes('self')(her_ask)).catch((fault: unknown) => fault)
    await settled()
    expect(node.paused).toEqual([the_hold_of_a_request])
    now.current = new Date(Date.parse(now.current) + the_hold_of_a_request).toISOString()
    node.time_passes()
    const refused = await asked
    expect(refused).toBeInstanceOf(Error)
    expect(String(refused)).toContain('waves is not running, loading: it invokes nothing')
    expect(node.to_the_extension.some((message) => message.message === 'invoke')).toBe(false)
  })

  test('it stops while waited for (a ready that differs): it invokes nothing', async () => {
    const node = a_node({ version: '1.1.0' })
    const asked = all(node.hosted.invokes('self')(her_ask)).catch((fault: unknown) => fault)
    await settled()
    expect((await node.hosted.load()).loaded).toBe('a_composition_fault')
    expect(String(await asked)).toContain('waves is not running, stopped: it invokes nothing')
  })

  test('not active: it invokes nothing at once, no wait', async () => {
    const node = a_node()
    node.deactivate()
    const refused = await all(node.hosted.invokes('self')(her_ask)).catch((fault: unknown) => fault)
    expect(String(refused)).toContain('waves is not running, unloaded: it invokes nothing')
    expect(node.paused).toEqual([])
  })
})

describe('its calls (EXT-2, EXT-4, EXT-14)', () => {
  test('its storage undeclared: refused, traced; not active: refused', async () => {
    const composition = compose_an_extension(the_kernels_offer([]))(
      the_manifest_of_waves({ touches: ['the_port_of_requests'] }),
    )
    if (composition.composition === 'a_fault') throw new Error(composition.message)
    const node = a_node({ composed: composition.composed })
    await node.hosted.load()
    expect(node.to_the_extension[0]).toEqual({
      message: 'answer',
      id: 'call-1',
      port: 'its_storage',
      answer: { answer: 'refused', why: 'not_declared' },
    })
    expect(node.traced).toMatchObject([
      { why: 'a_call_not_declared', extension: 'waves', call: { port: 'its_storage' } },
    ])
    const inactive = a_node()
    const loading = inactive.hosted.load()
    inactive.deactivate()
    await settled()
    expect(inactive.to_the_extension[0]).toMatchObject({
      answer: { answer: 'refused', why: 'not_active' },
    })
    await loading
  })
})

describe('a fall, then a second (EXT-15)', () => {
  test('traced; the invocation in flight fails; loaded again once; a second fall leaves it stopped', async () => {
    const node = a_node({ playing: () => new Error('a fault in its realm') })
    await node.hosted.load()
    await expect(all(node.hosted.invokes('known')(a_peers_wave))).rejects.toThrow(
      'waves: it has fallen, a fault in its realm (EXT-15)',
    )
    await settled()
    expect(node.loads()).toBe(2)
    expect(node.hosted.life()).toEqual({ life: 'running' })
    await expect(all(node.hosted.invokes('known')(a_peers_wave))).rejects.toThrow('fallen')
    await settled()
    expect(node.loads()).toBe(2)
    expect(node.hosted.life()).toEqual({ life: 'stopped', why: 'it_fell_twice' })
    expect(node.traced).toMatchObject([
      { why: 'the_extension_has_fallen', fall: 'the_first', because: 'a fault in its realm' },
      { why: 'the_extension_has_fallen', fall: 'the_second', because: 'a fault in its realm' },
    ])
  })
})

describe('its deactivation, its notices, the user’s requests (EXT-2, EXT-15)', () => {
  test('unloaded before it was ready: its load ends, nothing started', async () => {
    const node = a_node({ storage_answers: false })
    const loading = node.hosted.load()
    await settled()
    await node.hosted.unload()
    expect(await loading).toEqual({ loaded: 'unloaded' })
    expect(node.hosted.life()).toEqual({ life: 'unloaded' })
    expect(node.to_the_extension).toEqual([])
  })

  test('stopped, unloaded; a dead letter handed while it runs only', async () => {
    const node = a_node()
    await node.hosted.load()
    expect(node.hosted.redeliver('effect/x/E1')).toBe('handed')
    expect(node.hosted.discard('effect/x/E2', { by: 'the_user', reason: 'no longer' })).toBe(
      'handed',
    )
    await node.hosted.unload()
    expect(node.to_the_extension.map((message) => message.message)).toEqual([
      'answer',
      'start',
      'redeliver',
      'discard',
      'stop',
    ])
    expect(node.hosted.life()).toEqual({ life: 'unloaded' })
    expect(node.hosted.redeliver('effect/x/E1')).toBe('not_running')
  })
})
