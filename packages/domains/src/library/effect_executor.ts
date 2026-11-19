import { operation_id, type Clock, type CommandRootContext } from './context.ts'
import { in_zone } from './format.ts'
import type { entry_id } from './command.ts'
import { kind_of } from './kind.ts'
import { $Versions, type Registry, type Versions } from './registry.ts'
import { fingerprint_of } from './stable.ts'
import type { EntryFields } from './state_adapter.ts'
import type { TracedFailure } from './trace.ts'
import type { Elapsed } from './tree.ts'
import { $UseCase, type CommandUseCases } from './use_case.ts'
import type { CommandUseCasePort } from './use_case_port.ts'
import type { Redelivered } from './reaction_consumer.ts'
import type {
  Deliveries,
  EffectDeadLetter,
  EffectExecutor,
  ExecutorState,
  Outbox,
  QueuedEntry,
} from './effect.ts'
import { called_with, is_a_record, paths_in, served_by } from './runtime.ts'

// The effect executor (DOM-14, DOM-15, PER-12; part 7.1): an internal entry,
// a durable consumer of a domain's outbox, one delivery unit per effect.
// Its holds per resource (SC-53, SC-56) are part 7.2's.

/**
 * The library's delivery of an effect with no world (a wait: the eve of a
 * due date): the payload back, as the return's input. The executor waits
 * for `not_before` for every effect, so this one only answers: never
 * transient nor exhausted. It fits an effect whose payload is its return's
 * input. A timer is not a construct (A, 13 Nov 2026 (3)).
 */
export const returns_the_payload = <payload>(entry: {
  readonly id: entry_id
  readonly payload: payload
}): Promise<{ readonly outcome: 'delivered'; readonly returns: payload }> =>
  Promise.resolve({ outcome: 'delivered', returns: entry.payload })

/**
 * What an executor is wired to (DOM-14): its domain's outbox, the ports of
 * its return use cases, its own durable state, its clock, and the time that
 * passes (`Elapsed`, the configurator's, as a tree's that waits, DOM-3):
 * the domains have no clock that wakes (GR-8), so the executor reads the
 * clock and asks to be woken when an entry's `not_before` comes, or when a
 * transient delivery is to be tried again.
 */
export interface ExecutorPorts<returns extends CommandUseCases> {
  readonly outbox: Outbox
  readonly returns: { readonly [name in keyof returns]: CommandUseCasePort<returns[name]> }
  readonly state: ExecutorState
  readonly clock: Clock
  readonly elapsed: Elapsed
}

/**
 * The effect executor of a domain (DOM-14, PER-12): an internal entry, a
 * durable consumer of its outbox, one delivery unit per effect, with its own
 * position and dead letters. Each effect's entries are met in the order of
 * the outbox, from the effect's position on; each goes when its
 * `not_before` has come by the executor's clock (an entry not yet due holds
 * nothing: a later one already due goes first), the due ones one at a time
 * in the order of the outbox. For each entry it reads its payload at the
 * current shape (`Versions`: Marta's eve, queued at 1.x, reaches its return
 * at 2.0.0), delivers it at least once, and, if the world answered and the
 * effect has a return, invokes the return's port as "system · executor of
 * effect E" (D91.3): the scope is the effect's path, the operation's id the
 * entry's, so that a double report is the duplicate branch (DOM-11); the
 * fingerprint is over the return's path and what the world said, its input
 * as sent (D108.3, LIB-11); the correlation is the entry's, the fact's that
 * queued it (DOM-10); the context is the clock's, `now` told in its zone. A
 * transient delivery is tried again after a pause, its effect's later
 * entries behind it; an exhausted one, and a return that refuses what the
 * world said, become a dead letter (DOM-15). The position is the last entry
 * up to which every entry is handled, delivered or held: a later entry
 * delivered before an earlier one comes due is delivered again after a
 * fall, at least once. A technical abort (a delivery or a return's port that
 * throws) stops its effect where it is, unadvanced, and `stop` reports it:
 * its entry comes again when the executor starts again. Curried as
 * `command_use_case_ports`: the registry and the domain's return use cases,
 * where it finds each effect's return; then the deliveries; then its ports.
 */
export function effect_executor<
  const registry extends Registry,
  const returns extends CommandUseCases,
>(executor: {
  readonly registry: registry
  readonly versions: Versions
  readonly returns: returns
}): (deliveries: Deliveries<registry, returns>) => (ports: ExecutorPorts<returns>) => EffectExecutor
export function effect_executor(executor: RuntimeExecutor): unknown {
  return runtime_executor(executor)
}

/** What an executor is built from, at runtime. */
interface RuntimeExecutor {
  readonly registry: Registry
  readonly versions: Versions
  readonly returns: CommandUseCases
}

/** What a running executor is wired to, at runtime. */
interface RuntimeExecutorPorts {
  readonly outbox: Outbox
  readonly returns: Readonly<Record<string, unknown>>
  readonly state: ExecutorState
  readonly clock: Clock
  readonly elapsed: Elapsed
}

/** The return of an effect: its use case's name and path. */
interface Return {
  readonly name: string
  readonly use_case: unknown
  readonly path: string
}

/** What a delivery told, as the executor reads it (DOM-15). */
type Told =
  | { readonly outcome: 'delivered'; readonly said: { readonly returns: unknown } | undefined }
  | { readonly outcome: 'transient' }
  | { readonly outcome: 'exhausted'; readonly reason: string }

/** Why a return refused what the world said: the cause of its dead letter (DOM-15). */
type Refused = Exclude<EffectDeadLetter['cause'], { readonly cause: 'exhausted' }>

/** How long the executor pauses before a transient delivery is tried again: implementation freedom (D114). */
const retry_after = 60_000

/** What a delivery answered (`Delivered`), read at runtime: one that is none of its cases is the delivery's fault. */
const told_by = (effect: string, answered: unknown): Told => {
  if (!is_a_record(answered))
    throw new Error(`the delivery of ${effect} answered no outcome (DOM-15)`)
  const outcome = answered['outcome']
  if (outcome === 'transient') return { outcome }
  if (outcome === 'exhausted') {
    const reason = answered['reason']
    if (typeof reason !== 'string')
      throw new Error(`the delivery of ${effect} is exhausted with no reason (DOM-15)`)
    return { outcome, reason }
  }
  if (outcome === 'delivered') {
    return { outcome, said: 'returns' in answered ? { returns: answered['returns'] } : undefined }
  }
  throw new Error(`the delivery of ${effect} answered no outcome (DOM-15)`)
}

/** The predicates a return's rejection names (DOM-6), by their paths, as the library knows them at runtime. */
const failures_of = (failures: unknown): readonly TracedFailure[] =>
  Array.isArray(failures)
    ? failures.flatMap((failure: unknown): readonly TracedFailure[] => {
        if (!is_a_record(failure)) return []
        const { branch, components, predicate } = failure
        if (typeof predicate !== 'string' || !Array.isArray(components)) return []
        return [
          {
            ...(typeof branch === 'string' ? { branch } : {}),
            components: components.filter((name: unknown) => typeof name === 'string'),
            predicate,
          },
        ]
      })
    : []

/** Whether a value is a stream of events, as a port gives them. */
const is_a_stream = (value: unknown): value is AsyncIterable<unknown> =>
  typeof value === 'object' && value !== null && Symbol.asyncIterator in value

/** A return's outcome: the first event of its port's stream (DOM-2). */
const outcome_of = async (events: unknown): Promise<unknown> => {
  if (!is_a_stream(events)) throw new Error("a return's port gives no stream of events (DOM-2)")
  for await (const event of events) return event
  throw new Error("a return's port gave no outcome (DOM-2)")
}

/** The entry an effect holds as a letter, named by the key (effect, id) (DOM-13). */
const is_the_entry = (a: QueuedEntry) => (b: QueuedEntry) =>
  a.entry.effect === b.entry.effect && a.entry.id === b.entry.id

/** The body of `effect_executor`, typed by what it meets at runtime. */
const runtime_executor = (executor: RuntimeExecutor) => {
  const path_of = paths_in(executor.registry)
  const effects = Object.entries(executor.registry).flatMap(([path, component]) =>
    kind_of(component)?.kind === 'effect' ? [path] : [],
  )
  // At wiring (CFG-2), every fault in one message: an effect whose entries
  // the store's versions do not read (DOM-22); a return use case that names
  // no effect it returns from, one of no effect of the registry, two returns
  // of one effect (DOM-13), one not in the registry.
  const faults: string[] = effects.flatMap((effect) =>
    executor.versions[$Versions].reads(effect)
      ? []
      : [`${effect} is of no domain whose majors the versions were given (DOM-22)`],
  )
  const returns = Object.entries(executor.returns).flatMap(
    ([name, use_case]): readonly (readonly [string, Return])[] => {
      const path = path_of(use_case)
      const from = use_case[$UseCase].returns_from
      const effect = from === undefined ? undefined : path_of(from)
      if (path === undefined) {
        faults.push(`the return ${name} is not in the registry given (DOM-24)`)
        return []
      }
      if (effect === undefined || !effects.includes(effect)) {
        faults.push(`the return ${name} returns from no effect of the registry given (DOM-13)`)
        return []
      }
      return [[effect, { name, use_case, path }]]
    },
  )
  const returns_by_effect = new Map(returns)
  for (const [effect] of returns) {
    if (returns.filter(([other]) => other === effect).length > 1) {
      faults.push(`${effect} has two returns: one return per effect (DOM-13)`)
    }
  }
  if (faults.length > 0) throw new Error(`the effect executor: ${[...new Set(faults)].join('; ')}`)

  return (deliveries: Readonly<Record<string, unknown>>) => {
    const unknown_deliveries = Object.keys(deliveries).filter((path) => !effects.includes(path))
    const undelivered = effects.filter((effect) => typeof deliveries[effect] !== 'function')
    if (unknown_deliveries.length > 0 || undelivered.length > 0) {
      throw new Error(
        `the effect executor: ${[
          ...undelivered.map((effect) => `${effect} has no delivery (DOM-14)`),
          ...unknown_deliveries.map(
            (path) => `${path} is delivered but is no effect of the registry`,
          ),
        ].join('; ')}`,
      )
    }

    return (ports: RuntimeExecutorPorts): EffectExecutor => {
      // At wiring (CFG-2): every return's port, the library's, of that use case.
      const unwired = [...returns_by_effect.values()].filter(
        (each) => served_by(ports.returns[each.name])?.component !== each.use_case,
      )
      if (unwired.length > 0) {
        throw new Error(
          `the effect executor: ${unwired
            .map((each) => `the port of ${each.name} is not the library's port of its use case`)
            .join('; ')}`,
        )
      }
      let stopping = false
      let stop_now = (): void => undefined
      const stopped = new Promise<'stopped'>((resolve) => {
        stop_now = () => {
          resolve('stopped')
        }
      })
      const fell: Error[] = []

      /** The context of a return: the clock's `now`, told in its zone, the entry's operation, correlation and fingerprint. */
      const context_of = (
        effect: string,
        returning: Return,
        fields: EntryFields,
        said: unknown,
      ): CommandRootContext => ({
        now: in_zone(ports.clock.time_zone)(ports.clock.now()),
        time_zone: ports.clock.time_zone,
        operation: { scope: effect, id: operation_id.parse(fields.id) },
        correlation: fields.correlation,
        fingerprint: fingerprint_of({ path: returning.path, input: said }),
      })

      /** The return invoked with what the world said: nothing when it applied, else why it refused (DOM-15). */
      const returned = async (
        effect: string,
        returning: Return,
        fields: EntryFields,
        said: unknown,
      ): Promise<Refused | undefined> => {
        const outcome = await outcome_of(
          called_with(ports.returns[returning.name], [
            context_of(effect, returning, fields, said),
            said,
          ]),
        )
        if (!is_a_record(outcome)) throw new Error(`the return ${returning.name} gave no outcome`)
        switch (outcome['outcome']) {
          case 'applied':
            return undefined
          case 'rejected':
            return { cause: 'rejected', returns: said, failures: failures_of(outcome['failures']) }
          case 'identity_already_used':
            return { cause: 'identity_already_used', returns: said }
          case 'invalid_request':
            return { cause: 'invalid_request', returns: said }
          default:
            throw new Error(`the return ${returning.name} gave no outcome`)
        }
      }

      /**
       * An entry delivered (DOM-14, DOM-15): its payload at the current
       * shape; transient, tried again after a pause; exhausted, a dead
       * letter; delivered, its return, if any, with what the world said.
       * Nothing when it is handled, else the letter it becomes; `stopped`
       * when the executor is asked to stop while it pauses.
       */
      const delivered = async (
        queued: QueuedEntry,
      ): Promise<EffectDeadLetter | 'handled' | 'stopped'> => {
        const effect = queued.entry.effect
        const fields = executor.versions[$Versions].entry(queued.entry)
        const returning = returns_by_effect.get(effect)
        for (;;) {
          const told = told_by(
            effect,
            await Promise.resolve(
              called_with(deliveries[effect], [{ id: fields.id, payload: fields.payload }]),
            ),
          )
          if (told.outcome === 'transient') {
            const woke = await Promise.race([
              stopped,
              ports.elapsed(retry_after).then(() => 'woken' as const),
            ])
            if (woke === 'stopped') return 'stopped'
            continue
          }
          if (told.outcome === 'exhausted') {
            return {
              ...queued,
              held: 'dead_letter',
              cause: { cause: 'exhausted', reason: told.reason },
            }
          }
          if (returning === undefined) return 'handled'
          if (told.said === undefined) {
            throw new Error(`the delivery of ${effect} said nothing for its return (DOM-15)`)
          }
          const refused = await returned(effect, returning, fields, told.said.returns)
          return refused === undefined
            ? 'handled'
            : { ...queued, held: 'dead_letter', cause: refused }
        }
      }

      /** The milliseconds until an instant, by the executor's clock: none or less when it has come. */
      const until = (instant: string | undefined): number =>
        instant === undefined ? 0 : Date.parse(instant) - Date.parse(ports.clock.now())

      /**
       * One effect's delivery, its own unit (D108): from its position, the
       * entries of the outbox, each delivered when due, the due ones in the
       * order of the outbox; the position advanced past every entry handled
       * before the first one not yet handled.
       */
      const run = async (effect: string): Promise<void> => {
        const from = await ports.state.position(effect)
        const outbox = ports.outbox(effect)(from)[Symbol.asyncIterator]()
        let next: Promise<IteratorResult<QueuedEntry>> | undefined = outbox.next()
        let met: readonly { readonly queued: QueuedEntry; readonly handled: boolean }[] = []
        while (!stopping) {
          const due = met.find((each) => !each.handled && until(each.queued.entry.not_before) <= 0)
          if (due !== undefined) {
            const outcome = await delivered(due.queued)
            if (outcome === 'stopped') return
            if (outcome !== 'handled') await ports.state.hold(outcome)
            met = met.map((each) => (each === due ? { ...each, handled: true } : each))
            const open = met.findIndex((each) => !each.handled)
            const passed = open === -1 ? met.length : open
            const last = met[passed - 1]
            met = met.slice(passed)
            if (last !== undefined) await ports.state.advance(effect)(last.queued.position)
            continue
          }
          const waits = met.map((each) => until(each.queued.entry.not_before))
          const woke = await Promise.race([
            stopped,
            ...(waits.length === 0
              ? []
              : [ports.elapsed(Math.min(...waits)).then(() => 'woken' as const)]),
            ...(next === undefined ? [] : [next.then((arrived) => ({ arrived }))]),
          ])
          if (woke === 'stopped' || woke === 'woken') continue
          if (woke.arrived.done === true) {
            next = undefined
            if (met.length === 0) return
            continue
          }
          next = outbox.next()
          // The position is inclusive: the entry at it was handled before.
          if (woke.arrived.value.position !== from) {
            met = [...met, { queued: woke.arrived.value, handled: false }]
          }
        }
      }

      const runs = effects.map((effect) =>
        run(effect).catch((error: unknown) => {
          fell.push(new Error(`the delivery of ${effect} fell`, { cause: error }))
        }),
      )

      /** A letter the executor holds still, by its key, as its state keeps it. */
      const held = async (letter: EffectDeadLetter): Promise<boolean> =>
        (await ports.state.held(letter.entry.effect)).some(is_the_entry(letter))

      return {
        stop: async () => {
          stopping = true
          stop_now()
          await Promise.all(runs)
          const first = fell[0]
          if (first !== undefined) throw first
        },
        // An operator's redelivery of a letter (D67.3, D108.4): exhausted,
        // the effect again; refused, the return again with what the world
        // said, never the effect. The entries waiting behind it come with
        // the holds (part 7.2).
        redeliver: async (letter): Promise<Redelivered<EffectDeadLetter>> => {
          if (!(await held(letter))) return { outcome: 'not_held' }
          const returning = returns_by_effect.get(letter.entry.effect)
          const outcome =
            letter.cause.cause === 'exhausted' || returning === undefined
              ? await delivered(letter)
              : await returned(
                  letter.entry.effect,
                  returning,
                  executor.versions[$Versions].entry(letter.entry),
                  letter.cause.returns,
                ).then((refused) =>
                  refused === undefined
                    ? ('handled' as const)
                    : { ...letter, held: 'dead_letter' as const, cause: refused },
                )
          if (outcome === 'stopped') return { outcome: 'dead_letter', letter }
          if (outcome === 'handled') {
            await ports.state.release(letter)
            return { outcome: 'delivered' }
          }
          await ports.state.hold(outcome)
          return { outcome: 'dead_letter', letter: outcome }
        },
        discard: (letter) => async (trace) => {
          if (!(await held(letter))) return
          await ports.state.release(letter)
          await ports.state.discarded({
            letter,
            by: trace.by,
            reason: trace.reason,
            at: in_zone(ports.clock.time_zone)(ports.clock.now()),
          })
        },
      }
    }
  }
}
