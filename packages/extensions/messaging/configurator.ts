import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import {
  a_partition,
  after,
  chat_selection,
  chat_sources,
  chats_fragments,
  chats_writes,
  message_selection,
  message_sources,
  the_delivery_of_a_message,
  the_effect,
  the_name_of_a_letter,
} from './adapter/index.ts'
import { majors as chats_majors } from './business/chats/_majors.ts'
import { registry as chats_registry } from './business/chats/_registry.ts'
import {
  a_chat,
  a_chat_at_a_glance,
  close_a_message,
  read_a_chat,
  receive_a_message,
  write_a_message,
} from './business/chats/_usecase.ts'
import { manifest } from './manifest.ts'
import package_json from './package.json' with { type: 'json' }
import { majors as known_majors } from './persona/known/_majors.ts'
import { known } from './persona/known/_node.ts'
import { registry as known_registry } from './persona/known/_registry.ts'
import { message } from './persona/known/_usecase.ts'
import { majors as self_majors } from './persona/self/_majors.ts'
import { self } from './persona/self/_node.ts'
import { registry as self_registry } from './persona/self/_registry.ts'
import * as on_self from './persona/self/_usecase.ts'

// The composition root of messaging (CFG-1, EXT-9, EXT-15; MSG-1; part M2,
// on ping pong's model): given what the kernel gives it through the
// boundary (the ports its manifest touches, `PortsOf`; its notices) and what
// its realm gives it (the clock, the time that passes), it wires its state
// adapter over its partition, its office's ports (its commands, and its
// reads with their streams, composed by the library from its read and its
// fact log, LIB-8), its trees' ports with their mounted points as tops, and
// its executor, not started (CFG-2); it speaks to the kernel only through
// the boundary's side of the messages (`the_extensions_side`), where
// `messaging` hands it. Preinstalled and off (MSG-10): nothing here; the
// kernel's configurator installs it, and the user activates it (EXT-7).

/** What the extension's realm gives it beside the boundary: its clock and the time that passes (DOM-3, DOM-14). */
export interface Realm {
  readonly clock: zz.Clock
  readonly elapsed: zz.Elapsed
}

/** One event, as an invocation the extension does not serve gives it: `not_a_leaf` (D106.3). */
async function* not_a_leaf(): AsyncIterable<unknown> {
  yield await Promise.resolve({ event: 'invalid_request', reason: 'not_a_leaf' })
}

/** The operation a command's invocation names; none is the kernel's fault, thrown (EXT-2). */
const operation_of = (invocation: boundary.an_invocation): zz.Operation => {
  if (invocation.operation === undefined) {
    throw new Error(`${invocation.use_case}: a command's invocation names no operation (EXT-2)`)
  }
  return {
    id: zz.operation_id.parse(invocation.operation.id),
    scope: invocation.operation.scope,
  }
}

/**
 * Messaging, wired and not started (CFG-2): what the boundary's side of the
 * messages serves. A leaf is invoked by its persona and its path in its
 * surface: the context the kernel's node gave, parsed by the mounted point's
 * schema (one that does not parse is the kernel's fault, thrown), with the
 * realm's `now` and the version; a command with the operation and the
 * correlation (the operation's when the kernel gives none, D72.7); its tree
 * port checks the version, the input and the operation (PER-5). A read is
 * its snapshot, then each change, until its consumer stops (DOM-2). Its
 * executor runs from `start` to `stop`; a dead letter is found by its name
 * among the entries the executor holds, and handed to it while it runs.
 */
export const configurator =
  (realm: Realm) =>
  async (given: {
    readonly ports: boundary.PortsOf<typeof manifest>
    readonly notices: boundary.Notices
  }): Promise<boundary.AnExtension> => {
    const partition = a_partition(given.ports.its_storage)
    const versions = await zz.versions([chats_majors])({
      stored: partition.stored_versions,
    })
    const commands = zz.command_use_case_ports({
      registry: chats_registry,
      versions,
      use_cases: { write_a_message, close_a_message, receive_a_message, read_a_chat },
    })({
      algebra: partition.algebra(chats_fragments),
      write: chats_writes,
      execute: partition.execute,
      recorded: partition.recorded,
    })
    const the_chats_composed = { strategy: 'composed', log: partition.log } as const
    const messages = zz.read_use_case_ports({
      registry: chats_registry,
      versions,
      use_cases: { a_chat },
    })({
      algebra: { ...message_selection, after },
      sources: message_sources,
      read: partition.reads.read,
      page: partition.reads.page,
      streams: { a_chat: the_chats_composed },
    })
    const glances = zz.read_use_case_ports({
      registry: chats_registry,
      versions,
      use_cases: { a_chat_at_a_glance },
    })({
      algebra: { ...chat_selection, after },
      sources: chat_sources,
      read: partition.reads.read,
      page: partition.reads.page,
      streams: { a_chat_at_a_glance: the_chats_composed },
    })
    const wired = {
      invoked: { 'business/chats': { ...commands, ...messages, ...glances } },
      log: partition.log,
      trace: (traced: unknown) => {
        given.notices.traced(traced)
      },
      elapsed: realm.elapsed,
    }
    const the_self_leaves = zz.tree_ports({
      registry: self_registry,
      versions,
      majors: self_majors,
      top: self,
      use_cases: {
        write_a_message: on_self.write_a_message,
        read_a_chat: on_self.read_a_chat,
        a_chat: on_self.a_chat,
        a_chat_at_a_glance: on_self.a_chat_at_a_glance,
      },
    })(wired)
    const the_known_leaves = zz.tree_ports({
      registry: known_registry,
      versions,
      majors: known_majors,
      top: known,
      use_cases: { message },
    })(wired)
    const executor = zz.effect_executor({
      registry: chats_registry,
      versions,
      returns: { close_a_message },
    })({
      'business/chats/effect/deliver_a_message': the_delivery_of_a_message(
        given.ports.the_port_of_requests,
      ),
    })
    const state = partition.executor(given.notices)
    let running: zz.EffectExecutor | undefined = undefined
    /** A dead letter of the executor by its name, while it runs. */
    const the_letter = async (letter: string): Promise<zz.EffectDeadLetter | undefined> =>
      running === undefined
        ? undefined
        : (await state.held(the_effect)).find(
            (held): held is zz.EffectDeadLetter =>
              held.held === 'dead_letter' && the_name_of_a_letter(held) === letter,
          )
    return {
      invoke: (invocation) => {
        const entry = {
          now: realm.clock.now(),
          time_zone: realm.clock.time_zone,
          version: invocation.version,
        }
        const command = () => {
          const operation = operation_of(invocation)
          return {
            operation,
            correlation: zz.correlation.parse(invocation.correlation ?? operation.id),
          }
        }
        // cast: each tree port parses the input by the leaf's schema at the request's major, an invalid one its `invalid_request` (DOM-21, PER-5)
        const input = invocation.input as never
        if (invocation.persona === 'known') {
          return invocation.use_case === 'usecase/message'
            ? the_known_leaves.message(
                { ...known.context.parse(invocation.context), ...entry, ...command() },
                input,
              )
            : not_a_leaf()
        }
        const on_self_context = { ...self.context.parse(invocation.context), ...entry }
        switch (invocation.use_case) {
          case 'usecase/write_a_message':
            return the_self_leaves.write_a_message({ ...on_self_context, ...command() }, input)
          case 'usecase/read_a_chat':
            return the_self_leaves.read_a_chat({ ...on_self_context, ...command() }, input)
          case 'usecase/a_chat':
            return the_self_leaves.a_chat(on_self_context, input)
          case 'usecase/a_chat_at_a_glance':
            return the_self_leaves.a_chat_at_a_glance(on_self_context, input)
          default:
            return not_a_leaf()
        }
      },
      start: () => {
        running ??= executor({
          outbox: partition.outbox,
          returns: { close_a_message: commands.close_a_message },
          state,
          clock: realm.clock,
          elapsed: realm.elapsed,
        })
      },
      stop: async () => {
        const stopping = running
        running = undefined
        await stopping?.stop()
      },
      redeliver: async (letter) => {
        const held = await the_letter(letter)
        if (held !== undefined) await running?.redeliver(held)
      },
      discard: (letter) => async (trace) => {
        const held = await the_letter(letter)
        if (held !== undefined) await running?.discard(held)(trace)
      },
    }
  }

/**
 * Messaging as the kernel hosts it (EXT-2, EXT-15): its side of the
 * boundary's messages over its configurator, which says `ready` with its
 * manifest's name, its package's version and the boundary's, once wired;
 * then `receive` takes each message of the kernel's.
 */
export const messaging = (host: Realm & { readonly send: boundary.Send }) =>
  boundary.the_extensions_side({
    name: manifest.name,
    version: boundary.semver.parse(package_json.version),
    declaration: manifest,
    send: host.send,
    configurator: configurator(host),
  })
