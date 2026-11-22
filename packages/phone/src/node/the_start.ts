import { libsodium_primitives, the_reads_of_self } from '@q-mino/adapters-common'
import {
  a_realm_in_a_frame,
  ask_to_keep_the_storage,
  her_node_over,
  ids_drawn_at_random,
  the_node_s_storage,
  the_relay_s_http_transports,
  type AFetch,
  type ARealmsDocument,
  type AStorageManager,
  type CryptographicRandomness,
  type HerNode,
  type TheBrowsersStorage,
  type TheStorage,
} from '@q-mino/adapters-web'
import type * as zz from '@q-mino/domains/library'
import type { MailboxPort } from '@q-mino/domains/post/_dsl.ts'
import type { ACompositionFault } from '@q-mino/adapters-common'
import {
  phone,
  TheExtensionsDoNotCompose,
  type APhonesPartitions,
  type Phone,
  type PhoneWorld,
} from '@q-mino/memory'
import { a_phone_s_storage, the_kernel_s_domains } from './storage.ts'

// The PWA's composition root at its start (CFG-1, CFG-2, DOM-9; step 25,
// PWA-1, PWA-2): the node opened in this tab, as its writer or not (WEB-10);
// the storage asked to be kept (WEB-11); the phone composed over the
// browser's storage, transports and realms (STK-1, the one wiring of a
// phone), which checks every component at its wiring and every extension's
// manifest (CFG-2, EXT-4) before any consumer runs and before the screens
// ask anything; then its consumers started, and her node as the screens see
// it (WEB-19). Each outcome is a case of the start, never an exception: a
// composition fault tells why the node does not start (F6). The browser's
// objects are given (WEB-5).

/** The browser's objects the start takes (WEB-5). */
export interface TheBrowser extends TheBrowsersStorage {
  readonly storage: AStorageManager | undefined
  readonly fetch: AFetch
  readonly crypto: CryptographicRandomness
  readonly document: ARealmsDocument
}

/** An extension the app carries (EXT-9, PWA-3): its manifest as its build wrote it, its realm's script as the phone's build bundled it. */
export interface AnExtensionCarried {
  readonly manifest: unknown
  readonly script: string
}

/** The release's configuration (PWA-2): the node's database, its relay, the page of its links, the extensions it carries, the size of a partition. */
export interface TheConfiguration {
  readonly name: string
  readonly relay: string
  readonly page: string
  readonly extensions: readonly AnExtensionCarried[]
  readonly characters: number
}

/** The device's clock and the time that passes (WEB-4), given. */
export interface TheDevicesTime {
  readonly clock: zz.Clock
  readonly elapsed: zz.Elapsed
}

/** Why a node running stopped running (WEB-10): another tab took the writer, or a newer release closed the database. */
export type WhyItStopped = 'used_elsewhere' | 'closed_for_a_new_release'

/** A node running in this tab: her node for the screens, what the browser said of the storage, the node stopped, and when it stops by itself. */
export interface ANodeRunning {
  readonly her: HerNode
  readonly the_storage: TheStorage
  readonly stops: () => Promise<void>
  readonly stopped: Promise<WhyItStopped>
}

/**
 * Why the node does not start (PWA-2, PWA-5): an extension the app carries
 * does not compose, each fault by its extension's name and its case, told
 * in her words; or another fault. The message, whole, under "Perché".
 */
export type WhyItDoesNotStart =
  | {
      readonly why: 'an_extension_does_not_compose'
      readonly faults: readonly {
        readonly extension: string
        readonly fault: ACompositionFault['fault']
      }[]
      readonly message: string
    }
  | { readonly why: 'a_fault'; readonly message: string }

/** How the start went (PWA-2): another tab writes the node; the node does not start, and why; it runs. */
export type TheStart =
  | { readonly start: 'another_tab' }
  | { readonly start: 'it_does_not_start'; readonly why: WhyItDoesNotStart }
  | { readonly start: 'running'; readonly node: ANodeRunning }

/** How a tab asks to write the node (WEB-10): if no tab writes it, or taking it ("usa qui"). */
export type HowItAsks = 'if_no_tab_is' | 'use_here'

/** How often the collector passes while the app is open (STK-3, PWA-2): no push in stage 1, so the phone collects while it is open. */
export const a_collect_every = 5_000

const why_of = (fault: unknown): string => (fault instanceof Error ? fault.message : String(fault))

/** A consumer the node runs, stopped at its end: a fall it met is told by its stop, borne here (the node stops anyway). */
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

/**
 * The node's consumers while it runs (DOM-14, DOM-16, EXT-15, STK-3): every
 * executor and every reaction, the app (`user`'s executor), the extensions
 * following the office, and the collector at its pace. The post's executor
 * stops at a deposit's abort (PST-10: the effect unadvanced); it is started
 * again at the collector's next pass, as the stack's phone does.
 */
const the_node_runs = (
  node: Phone<APhonesPartitions>,
  time: TheDevicesTime,
  aborted: () => boolean,
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
  // The pause between two passes, cut short when the node stops.
  let wakes = (): void => undefined
  const stopping = new Promise<void>((resolve) => {
    wakes = resolve
  })
  const a_pause = (): Promise<void> => Promise.race([time.elapsed(a_collect_every), stopping])
  const passes = async (): Promise<void> => {
    while (on) {
      if (aborted()) {
        await stopped(the_post)
        the_post = node.the_executors['post/requests']()
      }
      try {
        await node.collects()
      } catch {
        // A mailbox not collected is left for the next pass (STK-3).
      }
      await a_pause()
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

/** The node's start in this tab (PWA-2). */
export const the_start =
  (browser: TheBrowser, configuration: TheConfiguration, time: TheDevicesTime) =>
  async (how: HowItAsks): Promise<TheStart> => {
    const opened = await the_node_s_storage(browser)(
      {
        name: configuration.name,
        paths: the_kernel_s_domains,
        extensions: configuration.extensions.flatMap((each) => the_name_of(each.manifest)),
        characters: configuration.characters,
      },
      how,
    )
    if (opened.writer === 'another_tab') {
      opened.closes()
      return { start: 'another_tab' }
    }
    const the_storage = await ask_to_keep_the_storage(browser.storage)
    const transports = the_relay_s_http_transports({
      fetch: browser.fetch,
      elapsed: time.elapsed,
    })
    const post = told_when_it_aborts(transports.mailbox)
    const world: PhoneWorld = {
      clock: time.clock,
      elapsed: time.elapsed,
      primitives: await libsodium_primitives(),
      mailbox: post.mailbox,
      collect: transports.collect,
      extensions: configuration.extensions.map((each) => ({
        manifest: each.manifest,
        runs: 'isolated',
        transport: a_realm_in_a_frame({ document: browser.document })(each.script),
      })),
      relays: [configuration.relay],
    }
    let node: Phone<APhonesPartitions>
    try {
      node = await phone(a_phone_s_storage(opened, browser.key_range))(world)
    } catch (fault) {
      // A composition fault (CFG-2, EXT-4): the node does not start, and lets the writer go.
      opened.let_go()
      opened.database.close()
      return {
        start: 'it_does_not_start',
        why:
          fault instanceof TheExtensionsDoNotCompose
            ? {
                why: 'an_extension_does_not_compose',
                faults: fault.extensions.flatMap((each) =>
                  each.faults.map((one) => ({ extension: each.name, fault: one.fault })),
                ),
                message: fault.message,
              }
            : { why: 'a_fault', message: why_of(fault) },
      }
    }
    const stops_running = the_node_runs(node, time, post.aborted)
    const draws_an_id = ids_drawn_at_random(browser.crypto)
    const her = her_node_over({
      clock: time.clock,
      draws_an_id,
      user: node.user,
      self: the_reads_of_self({
        clock: time.clock,
        self: (context, request) => node.personas().self(context, request),
      }),
      the_ticket_shown: node.the_ticket_shown,
      the_page: configuration.page,
      the_extensions_installed: () => node.extensions().map((each) => each.name),
      the_news: {
        held: async () => ({
          entries: await opened.held(),
          parts: await opened.held_parts(),
          notices: node.notices,
        }),
        traced: () => node.traced,
        tree_traced: () => node.tree_traced,
        when_written: node.when_written,
      },
      the_log: node.log,
      the_frames: {
        on_self: (extension) => node.the_extension(extension)?.on_self,
        traces: (entry) => {
          node.trace(entry)
        },
      },
      // The relay of the configuration, as the server's screen tells it, and how the client last met it (UI-5).
      the_relay: { address: configuration.relay, as_met: transports.the_relay },
    })
    let the_end: Promise<void> | undefined = undefined
    const stops = (): Promise<void> => {
      the_end ??= (async () => {
        await stops_running()
        opened.let_go()
        opened.database.close()
      })()
      return the_end
    }
    const stopped_by_itself = Promise.race([
      opened.lost.then(() => 'used_elsewhere' as const),
      opened.closed.then(() => 'closed_for_a_new_release' as const),
    ]).then(async (why) => {
      await stops()
      return why
    })
    return { start: 'running', node: { her, the_storage, stops, stopped: stopped_by_itself } }
  }

/** An extension's name, as its manifest names it, for its partition's store (WEB-12); one with no name has none, and its composition tells the fault. */
const the_name_of = (manifest: unknown): readonly string[] =>
  typeof manifest === 'object' &&
  manifest !== null &&
  'name' in manifest &&
  typeof manifest.name === 'string'
    ? [manifest.name]
    : []
