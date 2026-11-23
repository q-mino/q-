import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import { greetings } from '../configurator.ts'

// A fake kernel for the test extension (part 12.4): what block 3 of the
// kernel's side will do for real, played by the test. It hosts `greetings`
// in process through the boundary's messages, each copied as JSON (EXT-13:
// the oracle and the phone speak one protocol); serves its storage from a
// partition held as a map, each commit all or none; answers its port of
// requests with what the story says; and keeps what the extension sent.

/** A partition held as a map (EXT-14): its keys in the order of their code units; a commit all or none, refused when full. */
export const a_partition = () => {
  const kept = new Map<string, boundary.Json>()
  let full = false
  const sorted = (): readonly string[] =>
    [...kept.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  return {
    kept,
    fill: (now_full: boolean) => {
      full = now_full
    },
    read: (read: boundary.a_read): boundary.an_answer_to_a_read => ({
      answer: 'read',
      entries:
        read.read === 'keys'
          ? read.keys.flatMap((key) => {
              const value = kept.get(key)
              return value === undefined ? [] : [{ key, value }]
            })
          : sorted()
              .filter(
                (key) =>
                  (read.from === undefined || key >= read.from) &&
                  (read.before === undefined || key < read.before),
              )
              .flatMap((key) => {
                const value = kept.get(key)
                return value === undefined ? [] : [{ key, value }]
              }),
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

/** How the story answers the port of requests: per request, the port's answer. */
export type Answering = (request: boundary.a_request) => boundary.an_answer_to_a_request

/** The clock of the stories: 20 November 2026, 10:00 in Rome. */
const clock: zz.Clock = {
  now: () => zz.date_time.parse('2026-11-20T09:00:00.000Z'),
  time_zone: zz.time_zone.parse('Europe/Rome'),
}

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
 * This package compiles with no host's types (`types: []`, no `setTimeout`), and
 * ES2024's `Atomics.waitAsync` is one; its promise settles from the event
 * loop, so that the timers due run first.
 */
const a_tick = async (): Promise<void> => {
  const waited = Atomics.waitAsync(no_one_writes, 0, 0, 1)
  if (waited.async) await waited.value
}

/**
 * A node hosting `greetings` (EXT-15): the extension loaded over a
 * partition, `ready` awaited. `invoke` sends an invocation and gives its
 * events once `done`; `start`, `stop`, `redeliver` send the kernel's
 * messages; `requests` are the requests the port was called with;
 * `sent` every message the extension sent; `until` waits for a condition.
 */
export const a_node = async (story: {
  readonly partition: Partition
  readonly answering: Answering
}) => {
  const sent: boundary.a_message_from_an_extension[] = []
  const requests: boundary.a_request[] = []
  const flows = new Map<string, unknown[]>()
  let invocations = 0
  /** What the kernel does with a message of the extension's: a call answered, an event kept. */
  const kernel = (message: boundary.a_message_from_an_extension): void => {
    sent.push(message)
    if (message.message === 'event') flows.get(message.id)?.push(message.event)
    if (message.message !== 'call') return
    const answer =
      message.port === 'the_port_of_requests'
        ? {
            message: 'answer',
            id: message.id,
            port: message.port,
            answer: (() => {
              requests.push(message.request)
              return story.answering(message.request)
            })(),
          }
        : {
            message: 'answer',
            id: message.id,
            port: message.port,
            answer:
              message.request.call === 'read'
                ? story.partition.read(message.request.read)
                : story.partition.commit(message.request.writes),
          }
    void Promise.resolve().then(() => extension.receive(copied(answer)))
  }
  const extension = greetings({
    clock,
    // A real timer, never `Promise.resolve()`: an executor that waits on a
    // promise already settled loops on microtasks, and no timer fires.
    elapsed: a_tick,
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
    start: () => extension.receive({ message: 'start' }),
    stop: () => extension.receive({ message: 'stop' }),
    redeliver: (letter: string) => extension.receive({ message: 'redeliver', letter }),
    settled: async () => {
      await turns(2000)
      await a_tick()
    },
  }
}

/** Anna's gesture on her bond with Bruno: `greet_a_bond` on `self`, under an operation of her phone's. */
export const anna_greets = (bond: string, operation: string): boundary.an_invocation => ({
  persona: 'self',
  use_case: 'usecase/greet_a_bond',
  version: '1.0.0',
  context: {},
  operation: { id: operation, scope: 'self/user' },
  input: { bond },
})

/** A peer's request to `greet` on `known`, on a bond, under its identity (F7). */
export const a_peer_greets = (
  bond: string,
  identity: string,
  input: boundary.Json = { words: 'ciao' },
): boundary.an_invocation => ({
  persona: 'known',
  use_case: 'usecase/greet',
  version: '1.0.0',
  context: { bond },
  operation: { id: identity, scope: `known/${bond}` },
  input,
})

/** The greeting a node keeps, by its identity, as its partition holds it. */
export const the_greeting = (partition: Partition, greeting_id: string): unknown =>
  partition.kept.get(`state/greeting/${greeting_id}`)
