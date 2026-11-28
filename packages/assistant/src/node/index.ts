// The assistant's node in Node (AST-2; STK-1, STK-3, CFG-1): the kernel's
// phone, `phone(storage, release)(world)`, over the node's storage on
// SQLite (part B2, `node.sqlite`, NDB-1..NDB-3), in Node's world: the
// system clock in Rome, Node's timers for the time that passes, libsodium's
// primitives (SEA-9), the relay's HTTP client over Node's `fetch` (WEB-6),
// messaging and ping pong carried, integrated (EXT-13). On from its start
// to its stop, as the PWA's node while its app is open (`phone`'s
// `the_start.ts`): every executor and every reaction, the app (`user`'s
// executor), the extensions following the office, and the collector at its
// pace; the post's executor started again after a deposit's abort (PST-10).
// A second assistant over the same file is told, and nothing is composed
// (DOM-9). [Q, C, 28 Nov 2026]

import { libsodium_primitives } from '@q-mino/adapters-common'
import { the_node_s_storage_on_sqlite } from '@q-mino/adapters-node'
import { the_relay_s_http_transports, type AFetch } from '@q-mino/adapters-web'
import type * as zz from '@q-mino/domains/library'
import type { MailboxPort } from '@q-mino/domains/post/_dsl.ts'
import type { Primitives } from '@q-mino/domains/seals/safe/_dsl.ts'
import {
  on_the_node_s_database,
  phone,
  type AnExtensionOfTheApp,
  type APhonesPartitions,
  type Phone,
} from '@q-mino/memory'
import { messaging } from '@q-mino/messaging'
import messaging_manifest_json from '@q-mino/messaging/manifest.json' with { type: 'json' }
import { ping_pong } from '@q-mino/ping_pong'
import ping_pong_manifest_json from '@q-mino/ping_pong/manifest.json' with { type: 'json' }

/** The kernel's seven domains, whose records the node's database keeps (`phone`'s `storage.ts`). */
export const the_kernel_s_domains = [
  'seals/safe',
  'post/requests',
  'bonds/address_book',
  'extensions/activations',
  'user/activities',
  'user/drafts',
  'user/choices',
] as const

/** The extensions the assistant carries (AST-2): messaging and ping pong, their manifests as their builds write them. */
const messaging_manifest: unknown = messaging_manifest_json
const ping_pong_manifest: unknown = ping_pong_manifest_json
export const the_extensions_carried: readonly AnExtensionOfTheApp[] = [
  { manifest: messaging_manifest, realm: messaging },
  { manifest: ping_pong_manifest, realm: ping_pong },
]

/** The size of an extension's partition, in characters (EXT-14): the PWA's. */
const a_partition_s_size = 1_000_000

/** A consumer the node runs, stopped at its end. */
interface Running {
  readonly stop: () => Promise<void>
}

const stopped = async (running: Running): Promise<void> => {
  try {
    await running.stop()
  } catch {
    // A consumer fell before it was stopped: what it held stays in the storage (DOM-14).
  }
}

/** The post's mailbox port, which says whether a deposit aborted since it was last asked (PST-10). */
const told_when_it_aborts = (mailbox: MailboxPort) => {
  let aborted = false
  return {
    mailbox: {
      deposit: async (deposit) => {
        try {
          return await mailbox.deposit(deposit)
        } catch (fault) {
          aborted = true
          throw fault
        }
      },
    } satisfies MailboxPort,
    aborted: (): boolean => {
      const was = aborted
      aborted = false
      return was
    },
  }
}

/** The node's consumers while it runs (DOM-14, EXT-15, STK-3), as the PWA's: its stop. */
const the_node_runs = (
  node: Phone<APhonesPartitions>,
  elapsed: zz.Elapsed,
  collect_every: number,
  aborted: () => boolean,
  told: (line: string) => void,
) => {
  const the_others: Running[] = [
    ...Object.values(node.the_reactions).map((start) => start()),
    ...Object.entries(node.the_executors)
      .filter(([effect]) => effect !== 'post/requests')
      .map(([, start]) => start()),
    node.the_extensions_follow_the_office(),
    node.the_app(),
  ]
  let the_post: Running = node.the_executors['post/requests']()
  let on = true
  let wakes = (): void => undefined
  const stopping = new Promise<void>((resolve) => {
    wakes = resolve
  })
  let unheard = false
  const passes = async (): Promise<void> => {
    while (on) {
      if (aborted()) {
        await stopped(the_post)
        the_post = node.the_executors['post/requests']()
      }
      try {
        await node.collects()
        if (unheard) told('the relay is heard again')
        unheard = false
      } catch {
        // A mailbox not collected is left for the next pass (STK-3); told once.
        if (!unheard) told('the relay is not heard: the collector tries again')
        unheard = true
      }
      await Promise.race([elapsed(collect_every), stopping])
    }
  }
  const passing = passes()
  return async (): Promise<void> => {
    on = false
    wakes()
    for (const each of [...the_others].reverse()) await stopped(each)
    await stopped(the_post)
    for (const extension of node.extensions()) await extension.hosted.unload()
    await passing
  }
}

/** What the node in Node is given (AST-14). */
export interface TheNodesWiring {
  /** The node's database file (`node.sqlite`). */
  readonly file: string
  readonly relay: string
  readonly clock: zz.Clock
  readonly elapsed: zz.Elapsed
  readonly fetch: AFetch
  /** How often the collector passes, in milliseconds. */
  readonly collect_every: number
  readonly journal: (line: string) => void
}

/** The node in Node started: its phone, its primitives, its stop; or another assistant holds its file. */
export type TheNodeStarted =
  | {
      readonly node: 'running'
      readonly phone: Phone<APhonesPartitions>
      readonly primitives: Primitives
      readonly stops: () => Promise<void>
    }
  | { readonly node: 'another_connection' }

/** The assistant's node started (AST-2): over its file, in Node's world. */
export const the_node_started = async (wiring: TheNodesWiring): Promise<TheNodeStarted> => {
  const opened = await the_node_s_storage_on_sqlite(wiring.file)({
    paths: the_kernel_s_domains,
    characters: a_partition_s_size,
  })
  if (opened.writer === 'another_connection') return { node: 'another_connection' }
  const transports = the_relay_s_http_transports({ fetch: wiring.fetch, elapsed: wiring.elapsed })
  const post = told_when_it_aborts(transports.mailbox)
  const primitives = await libsodium_primitives()
  let node: Phone<APhonesPartitions>
  try {
    node = await phone(on_the_node_s_database(opened))({
      clock: wiring.clock,
      elapsed: wiring.elapsed,
      primitives,
      mailbox: post.mailbox,
      collect: transports.collect,
      extensions: the_extensions_carried,
      relays: [wiring.relay],
    })
  } catch (fault) {
    await opened.close()
    throw fault
  }
  const stops_running = the_node_runs(
    node,
    wiring.elapsed,
    wiring.collect_every,
    post.aborted,
    wiring.journal,
  )
  let the_end: Promise<void> | undefined = undefined
  return {
    node: 'running',
    phone: node,
    primitives,
    stops: () => {
      the_end ??= (async () => {
        await stops_running()
        await opened.close()
      })()
      return the_end
    },
  }
}
