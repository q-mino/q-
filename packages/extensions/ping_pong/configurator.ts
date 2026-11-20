import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import {
  a_partition,
  pings_fragments,
  pings_writes,
  the_delivery_of_a_request_for_a_pong,
  the_effect,
  the_name_of_a_letter,
} from './adapter/index.ts'
import { majors as pings_majors } from './business/pings/_majors.ts'
import { registry as pings_registry } from './business/pings/_registry.ts'
import { answer_a_ping, close_a_ping, send_a_ping } from './business/pings/_usecase.ts'
import { manifest } from './manifest.ts'
import package_json from './package.json' with { type: 'json' }
import { majors as known_majors } from './persona/known/_majors.ts'
import { known } from './persona/known/_node.ts'
import { registry as known_registry } from './persona/known/_registry.ts'
import { ping } from './persona/known/_usecase.ts'
import { majors as self_majors } from './persona/self/_majors.ts'
import { self } from './persona/self/_node.ts'
import { registry as self_registry } from './persona/self/_registry.ts'
import * as on_self from './persona/self/_usecase.ts'

// The composition root of ping pong (CFG-1, EXT-9, EXT-15; PNG-1; part
// 14.2, on the model of greetings'): given what the kernel gives it through the boundary (the ports its
// manifest touches, `PortsOf`; its notices) and what its realm gives it
// (the clock, the time that passes), it wires its state adapter over its
// partition, its business's ports, its trees' ports with their mounted
// points as tops (the fact log, which `send_a_ping` on `self` follows, and
// the time that passes, which ends its wait, DOM-3), and its executor, not
// started (CFG-2); it speaks to the kernel only through the boundary's side
// of the messages (`the_extensions_side`), where `ping_pong` hands it.
// Preinstalled and off (PNG-1): nothing here; the kernel's configurator
// installs it, and the user activates it (EXT-7).

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
 * Ping pong, wired and not started (CFG-2): what the boundary's
 * side of the messages serves. A leaf is invoked by its persona and its
 * path in its surface: the context the kernel's node gave, parsed by the
 * mounted point's schema (one that does not parse is the kernel's fault,
 * thrown), with the realm's `now`, the version, the operation and the
 * correlation (the operation's when the kernel gives none, D72.7); its tree
 * port checks the version, the input and the operation (PER-5). Its
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
    const versions = await zz.versions([pings_majors])({
      stored: partition.stored_versions,
    })
    const pings = zz.command_use_case_ports({
      registry: pings_registry,
      versions,
      use_cases: { send_a_ping, close_a_ping, answer_a_ping },
    })({
      algebra: partition.algebra(pings_fragments),
      write: pings_writes,
      execute: partition.execute,
      recorded: partition.recorded,
    })
    const wired = {
      invoked: { 'business/pings': pings },
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
      use_cases: { send_a_ping: on_self.send_a_ping },
    })(wired)
    const the_known_leaves = zz.tree_ports({
      registry: known_registry,
      versions,
      majors: known_majors,
      top: known,
      use_cases: { ping },
    })(wired)
    const executor = zz.effect_executor({
      registry: pings_registry,
      versions,
      returns: { close_a_ping },
    })({
      'business/pings/effect/ask_for_a_pong': the_delivery_of_a_request_for_a_pong(
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
          now: zz.in_zone(realm.clock.time_zone)(realm.clock.now()),
          time_zone: realm.clock.time_zone,
          version: invocation.version,
        }
        const command = (): zz.Operation & { readonly correlation: zz.correlation } => {
          const operation = operation_of(invocation)
          return {
            ...operation,
            correlation: zz.correlation.parse(invocation.correlation ?? operation.id),
          }
        }
        if (invocation.persona === 'self' && invocation.use_case === 'usecase/send_a_ping') {
          const { correlation, ...operation } = command()
          return the_self_leaves.send_a_ping(
            { ...self.context.parse(invocation.context), ...entry, operation, correlation },
            invocation.input as never, // cast: the tree port parses the input by the leaf's schema at the request's major, an invalid one its `invalid_request` (DOM-21, PER-5)
          )
        }
        if (invocation.persona === 'known' && invocation.use_case === 'usecase/ping') {
          const { correlation, ...operation } = command()
          return the_known_leaves.ping(
            { ...known.context.parse(invocation.context), ...entry, operation, correlation },
            invocation.input as never, // cast: the tree port parses the input by the leaf's schema at the request's major, an invalid one its `invalid_request` (DOM-21, PER-5)
          )
        }
        return not_a_leaf()
      },
      start: () => {
        running ??= executor({
          outbox: partition.outbox,
          returns: { close_a_ping: pings.close_a_ping },
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
 * Ping pong as the kernel hosts it (EXT-2, EXT-15): its side of
 * the boundary's messages over its configurator, which says `ready` with
 * its manifest's name, its package's version and the boundary's, once
 * wired; then `receive` takes each message of the kernel's.
 */
export const ping_pong = (host: Realm & { readonly send: boundary.Send }) =>
  boundary.the_extensions_side({
    name: manifest.name,
    version: boundary.semver.parse(package_json.version),
    declaration: manifest,
    send: host.send,
    configurator: configurator(host),
  })
