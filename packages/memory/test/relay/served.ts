// The relay served on this machine (WEB-7, MBX-9, TST-4): the relay's
// configurator over its storage on SQLite, in memory (`packages/relay`,
// MBX-8), its HTTP interface served by Node's HTTP server on a port of
// 127.0.0.1 (`@hono/node-server`'s listener, the one step 24's main will
// serve with), opened by the test and closed at its end, every connection
// with it. The phones name the relay by the address their tickets declare
// (BND-4, `https`): the test's `fetch` takes it to the server, as a name
// resolved on this machine, and injects the transport's faults below the
// client (TST-4): the request lost before the relay, its answer lost after
// it, the request doubled on the way, an abort before or after the relay.

import { createServer, type Server } from 'node:http'
import { getRequestListener } from '@hono/node-server'
import { always_room, the_relays_storage } from '@q-mino/adapters-node'
import type { AFetch, AnAnswer, ARequest } from '@q-mino/adapters-web'
import { relay, type World } from '@q-mino/relay'

/** A fault of the network on a request to the relay (TST-4), below the client. */
export type AFaultOfTheNetwork =
  | 'none'
  | 'lost'
  | 'answer_lost'
  | 'doubled'
  | 'aborted_before_the_relay'
  | 'aborted_after_the_relay'

/** The server listening on a port of this machine, its origin. */
const listening = (server: Server): Promise<string> =>
  new Promise<string>((listens, fails) => {
    server.once('error', fails)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (address === null || typeof address === 'string') fails(new Error('no port'))
      else listens(`http://127.0.0.1:${String(address.port)}`)
    })
  })

/** The server closed, every connection with it, within a second, else the test fails. */
const closed = (server: Server): Promise<void> =>
  new Promise<void>((closes, fails) => {
    const late = setTimeout(() => {
      fails(new Error('the server did not close in a second'))
    }, 1000)
    server.close(() => {
      clearTimeout(late)
      closes()
    })
    server.closeAllConnections()
  })

/**
 * An answer dropped once the relay has answered: its body read up to its
 * first line or its end, then let go (a collect's stays open, MBX-9).
 */
const dropped = async (answer: Response): Promise<void> => {
  const body = answer.body
  if (body === null) return
  const reader = body.getReader()
  for (;;) {
    const read = await reader.read()
    if (read.done) break
    const bytes: unknown = read.value
    if (!(bytes instanceof Uint8Array) || bytes.includes(0x0a)) break
  }
  await reader.cancel()
}

/**
 * The answers the relay's interface gave, each body counted open until it
 * ends or the server lets it go (the phone let it go, MBX-9).
 */
const counted =
  (open: { count: number }) =>
  (answer: Response): Response => {
    const body = answer.body
    if (body === null) return answer
    const reader = body.getReader()
    open.count += 1
    let closed = false
    const close = () => {
      if (!closed) open.count -= 1
      closed = true
    }
    return new Response(
      new ReadableStream<Uint8Array>({
        pull: async (controller) => {
          const read = await reader.read()
          const bytes: unknown = read.value
          if (read.done || !(bytes instanceof Uint8Array)) {
            close()
            controller.close()
          } else controller.enqueue(bytes)
        },
        cancel: async () => {
          close()
          await reader.cancel()
        },
      }),
      { status: answer.status, headers: answer.headers },
    )
  }

/** The network's faults, as a schedule the test sets: each request meets the next, then none. */
const a_network = () => {
  const schedule: AFaultOfTheNetwork[] = []
  return {
    /** The next requests meet these faults, in order. */
    will: (...faults: readonly AFaultOfTheNetwork[]): void => {
      schedule.push(...faults)
    },
    next: (): AFaultOfTheNetwork => schedule.shift() ?? 'none',
  }
}

/**
 * A relay served (WEB-7): its configurator over SQLite in memory, in a world
 * the test gives, its interface on a port of this machine; a `fetch` that
 * takes the relay's address to it, through the network's faults; how many
 * requests it served; and its end, the server and the storage closed.
 */
export const a_relay_served = async (world: Omit<World, 'room'>, the_relay_s_address: string) => {
  const storage = the_relays_storage(':memory:')
  // A disk with room, always: the disk's check is the relay's main's tests' (REL-3, REL-6).
  const the_relay = await relay(storage)({ ...world, room: always_room })
  let served = 0
  const open = { count: 0 }
  const listener = getRequestListener(
    async (request) => {
      served += 1
      return counted(open)(await the_relay.http.fetch(request))
    },
    { overrideGlobalObjects: false },
  )
  const server = createServer((incoming, outgoing) => {
    void listener(incoming, outgoing)
  })
  const origin = await listening(server)
  const network = a_network()

  /** The request to the server on this machine. */
  const to_the_server = (address: string, request: ARequest): Promise<Response> =>
    globalThis.fetch(
      address.startsWith(the_relay_s_address)
        ? origin + address.slice(the_relay_s_address.length)
        : address,
      request,
    )

  const fetch: AFetch = async (address, request): Promise<AnAnswer> => {
    const fault = network.next()
    if (fault === 'lost') throw new TypeError('fetch failed (TST-4: the request lost)')
    if (fault === 'aborted_before_the_relay')
      throw new DOMException('aborted (TST-4: before the relay)', 'AbortError')
    const answer = await to_the_server(address, request)
    if (fault === 'answer_lost') {
      await dropped(answer)
      throw new TypeError('fetch failed (TST-4: the answer lost)')
    }
    if (fault === 'aborted_after_the_relay') {
      await dropped(answer)
      throw new DOMException('aborted (TST-4: after the relay)', 'AbortError')
    }
    if (fault === 'doubled') {
      await dropped(answer)
      return to_the_server(address, request)
    }
    return answer
  }

  return {
    relay: the_relay,
    storage,
    origin,
    fetch,
    /** The network's faults the next requests meet (TST-4). */
    will: network.will,
    /** How many requests the relay's interface was handed. */
    served: (): number => served,
    /** How many of the relay's answers are still open: a collect until the phone lets it go (MBX-9). */
    answers_open: (): number => open.count,
    /** The relay down: its server closed, every connection with it; its storage kept. */
    down: (): Promise<void> => closed(server),
    /** The end: the server closed, if it is not, and the storage. */
    closes: async (): Promise<void> => {
      if (server.listening) await closed(server)
      storage.close()
    },
  }
}

/** A relay served, as the tests hold it. */
export type ARelayServed = Awaited<ReturnType<typeof a_relay_served>>
