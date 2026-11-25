// The relay started on a machine (REL-1, REL-2, REL-3): its storage opened on
// the database of its settings (MBX-8), the relay composed by its
// configurator over the machine's world (the clock in UTC, the time that
// passes by Node's timers, the hash of libsodium, the room on the disk the
// database is on), checked before any request (CFG-2); its HTTP interface
// served by Node's HTTP server on 127.0.0.1 (`@hono/node-server`'s listener,
// WEB-7's), the executor of the deposits' waits started, and the relay asked
// to forget what is past (MBX-8) at its start and every hour. Its stop: no
// more connections taken, every open one let go (a collect that stays open,
// MBX-9, and a deposit in flight, which its phone tries again as the same
// operation, PST-11), the forgetting and the executor stopped, the database
// closed. [Q, C, 25 Nov 2026]

import { createServer, type Server } from 'node:http'
import { dirname } from 'node:path'
import { getRequestListener } from '@hono/node-server'
import * as zz from '@q-mino/domains/library'
import { the_deposit_address_of } from '@q-mino/domains/seals/safe/_dsl.ts'
import { libsodium_primitives } from '@q-mino/adapters-common'
import {
  the_relays_storage,
  the_room_on_the_disk,
  type HashOfACollectSecret,
  type ReadTheVolume,
} from '@q-mino/adapters-node'
import { relay } from './index.ts'
import type { Settings } from './settings.ts'

/** How often the relay is asked to forget what is past (MBX-8): every hour. */
export const the_forgetting_s_interval = 60 * 60 * 1000

/** How long the room on the disk is kept before it is read again (REL-3). */
export const the_disk_s_reading_lasts = 5_000

/**
 * The machine the relay runs on, the parts a test gives: how the system is
 * asked about a volume (`fs.promises.statfs`), the monotonic time in
 * milliseconds (`performance.now`), and how long a reading of the disk is
 * kept.
 */
export interface TheMachine {
  readonly read_the_volume: ReadTheVolume
  readonly monotonic: () => number
  readonly the_disk_is_read_again_after: number
}

/** The relay running: where it listens, and its stop. */
export interface TheRelayRunning {
  /** `http://127.0.0.1:<port>`. */
  readonly origin: string
  /** The relay stopped, cleanly: the server, the forgetting, the executor, the database. */
  readonly stops: () => Promise<void>
}

/** The relay's clock: the instant Node reads, in UTC; the relay's days are UTC's (MBX-2). */
const the_clock: zz.Clock = {
  now: () => zz.date_time.parse(new Date().toISOString()),
  time_zone: zz.time_zone.parse('UTC'),
}

/**
 * The time that passes, by Node's timers: a timer that does not keep the
 * process alive, so that a wait of seven days (MBX-2) does not hold a relay
 * that stops; the server does, while it listens.
 */
const the_time_that_passes: zz.Elapsed = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds).unref()
  })

/** The hash of a collect secret (MBX-6): BLAKE2b-256 of R, as a node's safe draws D (SEA-4), on libsodium. */
const the_hash_on_libsodium = async (): Promise<HashOfACollectSecret> => {
  const primitives = await libsodium_primitives()
  return (secret) => Promise.resolve(the_deposit_address_of(primitives)(secret))
}

/** The server listening on 127.0.0.1, at a port, its origin. */
const listening = (server: Server, port: number): Promise<string> =>
  new Promise<string>((listens, fails) => {
    server.once('error', fails)
    server.listen(port, '127.0.0.1', () => {
      server.off('error', fails)
      const address = server.address()
      if (address === null || typeof address === 'string') fails(new Error('no port'))
      else listens(`http://127.0.0.1:${String(address.port)}`)
    })
  })

/** The server closed: no more connections taken, every open one let go. */
const closed = (server: Server): Promise<void> =>
  new Promise<void>((closes) => {
    server.close(() => {
      closes()
    })
    server.closeAllConnections()
  })

/** The relay started, by its settings, on a machine (REL-1). */
export const the_relay_started =
  (settings: Settings) =>
  async (machine: TheMachine): Promise<TheRelayRunning> => {
    const storage = the_relays_storage(settings.database)
    try {
      const the_relay = await relay(storage)({
        clock: the_clock,
        elapsed: the_time_that_passes,
        hash: await the_hash_on_libsodium(),
        room: the_room_on_the_disk({
          path: dirname(settings.database),
          kept: settings.kept_free,
          read: machine.read_the_volume,
          now: machine.monotonic,
          read_again_after: machine.the_disk_is_read_again_after,
        }),
      })
      const listener = getRequestListener(the_relay.http.fetch, { overrideGlobalObjects: false })
      const server = createServer((incoming, outgoing) => {
        void listener(incoming, outgoing)
      })
      const origin = await listening(server, settings.port)
      const waits = the_relay.waits()
      const forgets = (): void => {
        storage.forget_what_is_past(the_clock.now())
      }
      forgets()
      const forgetting = setInterval(forgets, the_forgetting_s_interval).unref()
      return {
        origin,
        stops: async () => {
          await closed(server)
          clearInterval(forgetting)
          await waits.stop()
          storage.close()
        },
      }
    } catch (fault) {
      storage.close()
      throw fault
    }
  }
