import * as z from 'zod'
import {
  an_event,
  a_message_to_an_extension,
  type a_message_from_an_extension,
} from './messages.ts'
import {
  an_answer_to_a_commit,
  an_answer_to_a_read,
  an_answer_to_a_request,
  type port,
  type Ports,
  type PortsOf,
} from './ports.ts'
import { json, type Json, type semver } from './values.ts'
import { version as boundary_version } from './version.ts'

// The extension's side of the boundary (EXT-2, EXT-15; part 12.4): the one
// place where an extension meets the messages, generic, so that every
// extension speaks them alike and its configurator only wires its trees. It
// turns the kernel's ports into calls and their answers, paired by an id it
// names; hands the kernel's messages to what the configurator built (an
// invocation, its consumers' start and stop, the user's request on a dead
// letter); and sends the extension's life and notices. Every message it
// sends is a JSON value, checked by the boundary's schema before it goes.

/** An invocation of one of the extension's leaves, as the kernel sends it (EXT-2 "In"), without the id that pairs it. */
export type an_invocation = Omit<
  Extract<a_message_to_an_extension, { readonly message: 'invoke' }>,
  'message' | 'id'
>

/** How an extension sends a message to the kernel: in process a call, isolated a frame's `postMessage` (EXT-13). */
export type Send = (message: a_message_from_an_extension) => void

/** A dead letter of the extension's executor or consumers, as its notice tells it (EXT-2 "Its notices"). */
export interface a_dead_letter {
  readonly letter: string
  readonly of: 'an_effect' | 'a_reaction'
  readonly path: string
  readonly entry: unknown
  readonly cause: unknown
}

/** The notices an extension sends (EXT-2, F6): claims the kernel shows in its mark, never reading its partition. */
export interface Notices {
  readonly dead_letter: (letter: a_dead_letter) => void
  readonly released: (letter: string) => void
  readonly traced: (entry: unknown) => void
}

/**
 * What an extension's configurator builds, not started (CFG-2, EXT-15): its
 * leaves, invoked by path, each giving its events in order; its consumers'
 * start and stop; the user's request on one of its dead letters, by name.
 */
export interface AnExtension {
  readonly invoke: (invocation: an_invocation) => AsyncIterable<unknown>
  readonly start: () => void
  readonly stop: () => Promise<void>
  readonly redeliver: (letter: string) => Promise<void>
  readonly discard: (
    letter: string,
  ) => (trace: { readonly by: string; readonly reason: string }) => Promise<void>
}

/** A value's JSON text; nothing for `undefined` or a function, which `JSON.stringify`'s type does not tell. */
const stringified = (value: unknown): string | undefined => JSON.stringify(value)

/** A value as a message carries it: JSON as `JSON.stringify` writes it (a field `undefined` left out), or its text where it is none. */
const as_json = (value: unknown): Json => {
  try {
    const written = stringified(value)
    return json.parse(written === undefined ? null : JSON.parse(written))
  } catch {
    return String(value)
  }
}

/** An error's message, or the value's text. */
const why = (error: unknown): string => (error instanceof Error ? error.message : String(error))

/** A call waiting for its answer: the port it called, and how its promise settles. */
interface Waiting {
  readonly port: port
  readonly settle: (answer: unknown) => void
}

/**
 * The extension's side of the boundary (EXT-2, EXT-15): from its name and
 * version (its manifest's), its declaration's `touches`, the way it sends a
 * message to the kernel, and its configurator, given the ports its manifest
 * names (`PortsOf`) and its notices. Each message the kernel sends is given
 * to `receive`, at once: its configurator builds it over its ports, whose
 * answers come in through `receive`, then it says it is `ready`, with the
 * boundary version it was built with (a configurator that throws makes it
 * `fallen`), and every other message waits for it:
 * - `invoke`: the leaf's events, each an `event` paired by the invocation's
 *   id, then `done`; an event that is no JSON object named by `event` is
 *   traced, not sent (the kernel would trace it, EXT-15); an invocation that
 *   throws makes the extension `fallen`;
 * - `end` (K-4): the invocation its id names, still in flight, ended: no
 *   event of it is sent any more, `return()` is asked of its leaf's
 *   iterator (a leaf's generator waiting for its next event finishes that
 *   step first: so the library's streams, which stop at their next turn),
 *   and `done` sent; one no longer in flight, nothing;
 * - `answer`: the answer of the call its id names, parsed by the port's
 *   answer; one that names no call, or that does not parse, is traced;
 * - `start`, `stop`, `redeliver`, `discard`: handed to what was built.
 * A message that does not parse is traced: the kernel's fault, which the
 * extension cannot answer.
 */
export const the_extensions_side = <
  const declaration extends { readonly touches: readonly port[] },
>(made: {
  readonly name: string
  readonly version: semver
  readonly declaration: declaration
  readonly send: Send
  readonly configurator: (given: {
    readonly ports: PortsOf<declaration>
    readonly notices: Notices
  }) => Promise<AnExtension>
}): { readonly receive: (message: unknown) => Promise<void> } => {
  const waiting = new Map<string, Waiting>()
  let calls = 0
  const notices: Notices = {
    dead_letter: (letter) => {
      made.send({
        message: 'dead_letter',
        letter: letter.letter,
        of: letter.of,
        path: letter.path,
        entry: as_json(letter.entry),
        cause: as_json(letter.cause),
      })
    },
    released: (letter) => {
      made.send({ message: 'released', letter })
    },
    traced: (entry) => {
      made.send({ message: 'traced', entry: as_json(entry) })
    },
  }
  /** A call to a port: its message sent under a new id, its answer parsed by the port's (a kernel's answer that does not parse rejects it). */
  const call = <answer>(
    port: port,
    message: (id: string) => Extract<a_message_from_an_extension, { readonly message: 'call' }>,
    answer: z.ZodType<answer>,
  ): Promise<answer> =>
    new Promise((resolve, reject) => {
      calls += 1
      const id = `call-${String(calls)}`
      waiting.set(id, {
        port,
        settle: (given) => {
          const parsed = answer.safeParse(given)
          if (parsed.success) resolve(parsed.data)
          else reject(new Error(`the answer to ${id} is not ${port}'s (EXT-2)`))
        },
      })
      made.send(message(id))
    })
  const ports: Ports = {
    the_port_of_requests: (request) =>
      call(
        'the_port_of_requests',
        (id) => ({ message: 'call', id, port: 'the_port_of_requests', request }),
        an_answer_to_a_request,
      ),
    its_storage: {
      read: (read) =>
        call(
          'its_storage',
          (id) => ({ message: 'call', id, port: 'its_storage', request: { call: 'read', read } }),
          an_answer_to_a_read,
        ),
      commit: (writes) =>
        call(
          'its_storage',
          (id) => ({
            message: 'call',
            id,
            port: 'its_storage',
            request: { call: 'commit', writes },
          }),
          an_answer_to_a_commit,
        ),
    },
  }
  // Built while its storage's answers come in: `receive` is given at once,
  // and every message but an answer waits for it.
  const built: Promise<AnExtension | undefined> = made.configurator({ ports, notices }).then(
    (extension) => {
      made.send({ message: 'ready', name: made.name, version: made.version, boundary_version })
      return extension
    },
    (error: unknown) => {
      made.send({ message: 'fallen', why: why(error) })
      return undefined
    },
  )
  /** The invocations in flight, by their id: how each is ended by the kernel (K-4). */
  const in_flight = new Map<string, () => void>()
  const invoked = async (
    extension: AnExtension,
    id: string,
    invocation: an_invocation,
  ): Promise<void> => {
    const iterator = extension.invoke(invocation)[Symbol.asyncIterator]()
    const ended = new Promise<'ended'>((resolve) => {
      in_flight.set(id, () => {
        resolve('ended')
      })
    })
    try {
      for (;;) {
        const step = iterator.next()
        // A step overtaken by the end settles later: its fault, if any, is no longer the flow's.
        void step.catch(() => undefined)
        const next = await Promise.race([step, ended])
        if (next === 'ended') {
          void iterator.return?.().catch((error: unknown) => {
            notices.traced({ an_invocation_not_ended: { id, why: why(error) } })
          })
          break
        }
        if (next.done === true) break
        const event = an_event.safeParse(as_json(next.value))
        if (event.success) made.send({ message: 'event', id, event: event.data })
        else notices.traced({ an_event_not_sent: { id, event: as_json(next.value) } })
      }
      made.send({ message: 'done', id })
    } catch (error) {
      made.send({ message: 'fallen', why: why(error) })
    } finally {
      in_flight.delete(id)
    }
  }
  const receive = async (message: unknown): Promise<void> => {
    const parsed = a_message_to_an_extension.safeParse(message)
    if (!parsed.success) {
      notices.traced({ a_message_not_parsed: as_json(message) })
      return
    }
    const received = parsed.data
    if (received.message === 'answer') {
      const call_waiting = waiting.get(received.id)
      if (call_waiting?.port !== received.port) {
        notices.traced({ an_answer_to_no_call: as_json(received) })
        return
      }
      waiting.delete(received.id)
      call_waiting.settle(received.answer)
      return
    }
    const extension = await built
    if (extension === undefined) return
    switch (received.message) {
      case 'invoke':
        await invoked(extension, received.id, {
          persona: received.persona,
          use_case: received.use_case,
          version: received.version,
          context: received.context,
          input: received.input,
          ...(received.operation === undefined ? {} : { operation: received.operation }),
          ...(received.correlation === undefined ? {} : { correlation: received.correlation }),
        })
        return
      case 'end':
        in_flight.get(received.id)?.()
        return
      case 'start':
        extension.start()
        return
      case 'stop':
        await extension.stop()
        return
      case 'redeliver':
        await extension.redeliver(received.letter)
        return
      case 'discard':
        await extension.discard(received.letter)({ by: received.by, reason: received.reason })
        return
    }
  }
  return { receive }
}
