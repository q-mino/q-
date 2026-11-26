import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import { messaging } from '../configurator.ts'

// A fake kernel for messaging (part M2), ping pong's (part 14.2): it hosts
// the extension in process through the boundary's messages,
// each copied as JSON (EXT-13); serves its storage from a partition held as
// a map, each commit all or none; answers its port of requests with what
// the story says, at once or when the story lets it; and keeps what the
// extension sent. Its clock is the story's: Thursday 26 November 2026, 10:00
// in Rome, until the story moves it (`the_clock_reads`). The time that
// passes is a real timer (the rule on loops, A, 20 Nov 2026): a wait
// shorter than a minute (the executor's) is a tick; a minute or more lasts
// until the story says the time has passed (`the_time_passes`). A read
// that streams is followed (`follow`): its events so far, until the node
// stops (K-4: no message ends a follow yet).

/** A partition held as a map (EXT-14): its keys in the order of their code units; a commit all or none, refused when full. */
export const a_partition = () => {
  const kept = new Map<string, boundary.Json>()
  let full = false
  const sorted = (): readonly string[] =>
    [...kept.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  const present = (key: string): readonly boundary.an_entry[] => {
    const value = kept.get(key)
    return value === undefined ? [] : [{ key, value }]
  }
  return {
    kept,
    fill: (now_full: boolean) => {
      full = now_full
    },
    read: (read: boundary.a_read): boundary.an_answer_to_a_read => ({
      answer: 'read',
      entries:
        read.read === 'keys'
          ? read.keys.flatMap(present)
          : sorted()
              .filter(
                (key) =>
                  (read.from === undefined || key >= read.from) &&
                  (read.before === undefined || key < read.before),
              )
              .flatMap(present),
    }),
    commit: (writes: boundary.a_commit): boundary.an_answer_to_a_commit => {
      if (full) return { answer: 'refused', why: 'the_partition_is_full' }
      for (const write of writes) {
        if (write.write === 'set') kept.set(write.key, write.value)
        else kept.delete(write.key)
      }
      return { answer: 'committed' }
    },
  }
}

export type Partition = ReturnType<typeof a_partition>

/** How the story answers the port of requests: per request, the port's answer, at once or once the story gives it. */
export type Answering = (
  request: boundary.a_request,
) => boundary.an_answer_to_a_request | Promise<boundary.an_answer_to_a_request>

/** The clock of the stories: Thursday 26 November 2026, 10:00 in Rome, until a story moves it. */
export const a_clock = () => {
  let now = '2026-11-26T09:00:00.000Z'
  const clock: zz.Clock = {
    now: () => zz.date_time.parse(now),
    time_zone: zz.time_zone.parse('Europe/Rome'),
  }
  return {
    clock,
    /** The clock reads this instant from now on, in UTC. */
    the_clock_reads: (instant: string): void => {
      now = instant
    },
  }
}

export type Clock = ReturnType<typeof a_clock>

/** A message as it crosses the boundary: copied as JSON, parsed by the receiver (EXT-2). */
const copied = (message: unknown): unknown => JSON.parse(JSON.stringify(message))

/** Many turns of the event loop's microtasks: what the extension does with its fakes, which answer at once. */
const turns = async (count: number): Promise<void> => {
  for (let turn = 0; turn < count; turn += 1) await Promise.resolve()
}

/** A cell nobody writes, for a wait that only times out. */
const no_one_writes = new Int32Array(new SharedArrayBuffer(4))

/**
 * A turn of the event loop on a real timer, a millisecond (the rule on
 * loops, A, 20 Nov 2026): a wait on a cell nobody writes, which times out.
 * This package compiles with no host's types (`types: []`, no
 * `setTimeout`), and ES2024's `Atomics.waitAsync` is one; its promise
 * settles from the event loop, so that the timers due run first.
 */
const a_tick = async (): Promise<void> => {
  const waited = Atomics.waitAsync(no_one_writes, 0, 0, 1)
  if (waited.async) await waited.value
}

/** A wait the story ends: a minute or more (DOM-3). */
const a_minute = 60_000

/**
 * A node hosting messaging (EXT-15): the extension loaded over a
 * partition, `ready` awaited. `invoke` sends an invocation and gives its
 * events once `done`; `follow` sends one and gives its events so far as
 * they come;
 * `start`, `stop`, `redeliver` send the kernel's messages; `requests` are
 * the requests the port was called with; `sent` every message the
 * extension sent; `until` waits for a condition, `the_time_passes` ends
 * the long waits asked so far.
 */
export const a_node = async (story: {
  readonly partition: Partition
  readonly answering: Answering
  readonly clock?: Clock
}) => {
  const { clock } = story.clock ?? a_clock()
  const sent: boundary.a_message_from_an_extension[] = []
  const requests: boundary.a_request[] = []
  const flows = new Map<string, unknown[]>()
  let invocations = 0
  let long_waits: (() => void)[] = []
  /** What the kernel does with a message of the extension's: a call answered, an event kept. */
  const kernel = (message: boundary.a_message_from_an_extension): void => {
    sent.push(message)
    if (message.message === 'event') flows.get(message.id)?.push(message.event)
    if (message.message !== 'call') return
    const answered =
      message.port === 'the_port_of_requests'
        ? (() => {
            requests.push(message.request)
            return Promise.resolve(story.answering(message.request))
          })()
        : Promise.resolve(
            message.request.call === 'read'
              ? story.partition.read(message.request.read)
              : story.partition.commit(message.request.writes),
          )
    void answered.then((answer) =>
      extension.receive(copied({ message: 'answer', id: message.id, port: message.port, answer })),
    )
  }
  const extension = messaging({
    clock,
    // A real timer, never `Promise.resolve()`: an executor that waits on a
    // promise already settled loops on microtasks, and no timer fires.
    elapsed: (milliseconds) =>
      milliseconds < a_minute
        ? a_tick()
        : new Promise<void>((over) => {
            long_waits.push(over)
          }),
    send: (message) => {
      kernel(boundary.a_message_from_an_extension.parse(copied(message)))
    },
  })
  const until = async (holds: () => boolean): Promise<void> => {
    for (let round = 0; round < 200 && !holds(); round += 1) {
      await turns(50)
      await a_tick()
    }
    if (!holds()) throw new Error('the story did not come to pass')
  }
  await until(() => sent.some((message) => message.message === 'ready'))
  return {
    sent,
    requests,
    until,
    invoke: async (invocation: boundary.an_invocation): Promise<readonly unknown[]> => {
      invocations += 1
      const id = `invocation-${String(invocations)}`
      flows.set(id, [])
      await extension.receive(copied({ message: 'invoke', id, ...invocation }))
      return flows.get(id) ?? []
    },
    /** An invocation followed: its events so far, as they come, never awaited to its end. */
    follow: (invocation: boundary.an_invocation): (() => readonly unknown[]) => {
      invocations += 1
      const id = `invocation-${String(invocations)}`
      const events: unknown[] = []
      flows.set(id, events)
      void extension.receive(copied({ message: 'invoke', id, ...invocation }))
      return () => events
    },
    /** The events an invocation in flight has given so far, by its order (the first is 1). */
    so_far: (invocation: number): readonly unknown[] =>
      flows.get(`invocation-${String(invocation)}`) ?? [],
    start: () => extension.receive({ message: 'start' }),
    stop: () => extension.receive({ message: 'stop' }),
    redeliver: (letter: string) => extension.receive({ message: 'redeliver', letter }),
    discard: (letter: string) =>
      extension.receive({ message: 'discard', letter, by: 'Anna', reason: 'messo da parte' }),
    /** The waits of a minute or more asked so far are over. */
    the_time_passes: (): void => {
      const over = long_waits
      long_waits = []
      for (const each of over) each()
    },
    /** How many waits of a minute or more are asked and not over. */
    long_waits: (): number => long_waits.length,
  }
}

/** Anna writes in her chat on a bond: `write_a_message` on `self`, under an operation of her phone's. */
export const anna_writes = (
  bond: string,
  text: string,
  operation: string,
): boundary.an_invocation => ({
  persona: 'self',
  use_case: 'usecase/write_a_message',
  version: '1.0.0',
  context: {},
  operation: { id: operation, scope: 'self/user' },
  input: { bond, text },
})

/** Her part marks a chat read up to a message: `read_a_chat` on `self`. */
export const she_reads = (
  bond: string,
  up_to: string,
  operation: string,
): boundary.an_invocation => ({
  persona: 'self',
  use_case: 'usecase/read_a_chat',
  version: '1.0.0',
  context: {},
  operation: { id: operation, scope: 'self/user' },
  input: { bond, up_to },
})

/** Her part follows a read of `self` on a bond: `a_chat` or `a_chat_at_a_glance`. */
export const her_part_follows = (
  use_case: 'usecase/a_chat' | 'usecase/a_chat_at_a_glance',
  bond: string,
): boundary.an_invocation => ({
  persona: 'self',
  use_case,
  version: '1.0.0',
  context: {},
  input: { bond },
})

/** A peer's request to `message` on `known`, on a bond, under its identity (F7), with the time its letter declares (MSG-8). */
export const a_peer_writes = (
  bond: string,
  identity: string,
  input: boundary.Json,
  declared_at = '2026-11-26T09:00:00.120Z',
): boundary.an_invocation => ({
  persona: 'known',
  use_case: 'usecase/message',
  version: '1.0.0',
  context: { bond, declared_at },
  operation: { id: identity, scope: `known/${bond}` },
  input,
})

/** The record of a message a node filed in a bond's chat, as its partition holds it. */
export const the_message = (partition: Partition, bond: string, message_id: string): unknown =>
  partition.kept.get(
    `state/chat/${encodeURIComponent(bond)}/message/${encodeURIComponent(message_id)}`,
  )

/** The messages a node filed in a bond's chat, as its partition holds them. */
export const the_messages = (partition: Partition, bond: string): readonly unknown[] =>
  [...partition.kept]
    .filter(([key]) => key.startsWith(`state/chat/${encodeURIComponent(bond)}/message/`))
    .map(([, value]) => value)

/** The facts a node recorded, in order, by the last segment of each part's path. */
export const the_facts = (partition: Partition): readonly string[] =>
  [...partition.kept]
    .filter(([key]) => key.startsWith('fact/'))
    .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .flatMap(([, value]) => {
      const parts: unknown =
        typeof value === 'object' && value !== null && !Array.isArray(value)
          ? Reflect.get(value, 'parts')
          : undefined
      return Array.isArray(parts)
        ? parts.map((part: unknown) => {
            const path: unknown =
              typeof part === 'object' && part !== null ? Reflect.get(part, 'path') : undefined
            return typeof path === 'string' ? (path.split('/').at(-1) ?? '') : ''
          })
        : []
    })
