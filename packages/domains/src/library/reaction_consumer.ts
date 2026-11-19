import type { Clock, CommandRootContext } from './context.ts'
import { in_zone, type date_time, type position } from './format.ts'
import type { Resource, StoredEnvelope } from './envelope.ts'
import { kind_of } from './kind.ts'
import { $Versions, type Registry, type Versions } from './registry.ts'
import { fingerprint_of, reaction_operation } from './stable.ts'
import type { FactLog, LogEvent } from './stream.ts'
import type { ReadFailure } from './state_adapter.ts'
import type { TracedFailure } from './trace.ts'
import { $Reaction, nothing, type ReactionPaths } from './reaction.ts'
import type { CommandUseCasePort } from './use_case_port.ts'
import { called, called_with, is_a_record, served_by } from './runtime.ts'
import { failures_of, freed_in, lanes_of, outcome_of, share, type Lane } from './consumer.ts'

// The consumers of reactions (DOM-16, D89.6): a durable consumer per
// reaction, with its position, its dead letters and the parts waiting behind
// them (SC-42), and how an operator resolves a letter, which the effect
// executor shares (SC-53). Since part 7.3 their body, below.

/**
 * A part of a fact as a reaction's consumer meets it (D89.6, D113.3): the
 * fact, at its position, and the part, by its position in the fact. Named by
 * the fact's operation and the part, as the reaction's operation is
 * (`reaction_operation`), whatever position an adapter gives it.
 */
export interface ReactionPart {
  readonly reaction: string
  readonly position: position
  readonly fact: StoredEnvelope
  readonly part: number
}

/**
 * A dead letter of a reaction (D89.7, D67.3): the part it reacted to, and
 * why. Operational, outside the domains, shown, never a business fact. It
 * holds its part's resources (D94.7): the later parts of the reaction that
 * touch one of them wait behind it (`WaitingPart`). An operator redelivers
 * it after a fix, with the same operation, the command evaluated again (a
 * refusal leaves no fact, D79.2), or discards it, with a trace
 * (`ReactionConsumers`). Its cause, an ADT:
 * - `rejected`: the command refused, its failures by their paths, as the
 *   trace of a tree names them (`TracedFailure`; a step's, its read,
 *   `ReadFailure`): a dead letter is of no domain's type (part 7.3);
 * - `identity_already_used`: the operation came back with another
 *   fingerprint; the first outcome stands;
 * - `invalid_request`: the translation gave an input the use case's
 *   schema refuses (DOM-21), a fault of the reaction, never a technical
 *   abort delivered again for ever.
 */
export interface ReactionDeadLetter extends ReactionPart {
  readonly held: 'dead_letter'
  readonly cause:
    | {
        readonly cause: 'rejected'
        readonly failures: readonly (TracedFailure | ReadFailure)[]
      }
    | { readonly cause: 'identity_already_used' }
    | { readonly cause: 'invalid_request' }
}

/**
 * A part waiting behind a held one (D94.7, D67.3; SC-42): it touches a
 * resource that a dead letter, or a part waiting before it, holds, so it is
 * not delivered, and it holds its own resources in turn, so that no later
 * part of one of them overtakes it (the order per resource, D64.4). Marta's
 * damaged return of the drill is in a dead letter; Gianni's, two days on,
 * waits behind it, and holds Gianni too. Shown with the dead letters: the
 * software informs.
 */
export interface WaitingPart extends ReactionPart {
  readonly held: 'waiting'
}

/** A part a reaction holds, an ADT: a dead letter, or a part waiting behind one. */
export type HeldPart = ReactionDeadLetter | WaitingPart

/**
 * The trace of a dead letter discarded (D67.3): the letter, a reaction's or
 * an effect's (SC-53), who discarded it, why, and when, by the clock of its
 * consumer.
 */
export interface Discarded<letter = ReactionDeadLetter> {
  readonly letter: letter
  readonly by: string
  readonly reason: string
  readonly at: date_time
}

/**
 * Where the consumers of reactions keep their own state, durable (D89.6):
 * a position per reaction (none before its first fact), the parts it holds
 * (D94.7: its dead letters and the parts waiting behind them), and the
 * traces of the letters discarded. A held part is named by its fact's
 * operation and its part (`ReactionPart`): holding one again replaces it,
 * so that a part met again after a fall is held once, a waiting part
 * delivered and rejected becomes a dead letter in its place, and a letter
 * redelivered and rejected again keeps its new failures. SC-42
 */
export interface ReactionState {
  readonly position: (reaction: string) => Promise<position | undefined>
  readonly advance: (reaction: string) => (to: position) => Promise<void>
  /** The parts a reaction holds, in the order of its log (position, then part). */
  readonly held: (reaction: string) => Promise<readonly HeldPart[]>
  readonly hold: (part: HeldPart) => Promise<void>
  /** A held part let go: delivered at last, or its letter discarded. */
  readonly release: (part: ReactionPart) => Promise<void>
  readonly discarded: (trace: Discarded) => Promise<void>
}

/**
 * What a reaction is wired to: the fact log of the store of its fact's
 * domain (DOM-17), and the port of the use case it invokes.
 */
export type ReactionWiring<reaction> = reaction extends {
  [$Reaction]: { invokes: infer use_case }
}
  ? { readonly log: FactLog; readonly invokes: CommandUseCasePort<use_case> }
  : never

/** The wirings of the reactions of a registry, by path: exhaustive, so that a reaction not wired does not compile. */
export type ReactionWirings<registry> = {
  readonly [path in ReactionPaths<registry>]: ReactionWiring<registry[path]>
}

/**
 * What a dead letter redelivered gives (D67.3), an ADT, a reaction's or an
 * effect's (SC-53): `delivered`, its command applied (or nothing to invoke,
 * D88.2; for an effect, the world answered and the return applied), and the
 * parts or entries waiting behind it go on; `dead_letter`, refused or
 * exhausted again, still holding, with what was said this time; `not_held`,
 * the letter no longer held (redelivered or discarded before).
 */
export type Redelivered<letter = ReactionDeadLetter> =
  | { readonly outcome: 'delivered' }
  | { readonly outcome: 'dead_letter'; readonly letter: letter }
  | { readonly outcome: 'not_held' }

/**
 * The running consumers of a set of reactions: they stop when asked, after
 * the fact they are delivering; and an operator resolves their dead letters
 * through them (D67.3), since a letter's delivery and the parts waiting
 * behind it are the consumer's, in its own order (SC-42):
 * - `redeliver`: the letter's part again, with the same operation, after a
 *   fix; delivered, the consumer releases it and delivers the parts that
 *   waited behind it, in the order of the log;
 * - `discard`: the letter let go, with a trace (who, why), its part never
 *   delivered; the parts behind it go on as after a delivery.
 * Dead letters are operational: no domain sees them, and correcting a
 * domain's data stays a command of a persona (D67.3).
 */
export interface ReactionConsumers {
  readonly stop: () => Promise<void>
  readonly redeliver: (letter: ReactionDeadLetter) => Promise<Redelivered>
  readonly discard: (
    letter: ReactionDeadLetter,
  ) => (trace: { readonly by: string; readonly reason: string }) => Promise<void>
}

/** What the consumers of a set of reactions are wired to: their own durable state, and the clock that gives each command its `now`. */
export interface ReactionPorts {
  readonly state: ReactionState
  readonly clock: Clock
}

/**
 * The consumers of a set of reactions (DOM-16, PER-12, D89.6): internal
 * entries, not personas, one durable consumer per reaction, its own
 * delivery unit, with its own position and dead letters; the reactions run
 * side by side. Each reads its fact log from its position, inclusive, the
 * fact at it left out (it was handled; from the first fact the log keeps,
 * with none: in Shed every reaction is there from the start, D64.3), in the
 * order of the log, so in order per resource; skips the parts of other
 * paths; for each part of its fact's path, in the order of the parts
 * (DOM-16: at most one command per part), read at the current shape
 * (`Versions`: Marta's damaged return, recorded at 1.x, delivered after
 * 2.0.0), translates it purely (D89.3) and invokes its use case under
 * `reaction_operation` over the fact's operation and the part, with the
 * fact's correlation (DOM-10: the workshop's fact is of Marta's chain), the
 * fingerprint over the use case's path and the input as translated
 * (LIB-11: the consumer is the retrier, D108.3), and the clock's `now`,
 * told in its zone; a part translated to `nothing` invokes nothing (D88.2).
 * Applied (an exact duplicate too, the recorded fact), the next part;
 * rejected, `identity_already_used` or `invalid_request`, a dead letter
 * (DOM-21), then the next part; after the last part it advances. A dead
 * letter holds its part's resources for its reaction (SC-42): a later part
 * of its path that touches one of them, by the resources in its envelope
 * (D107), is not delivered and waits behind it (`WaitingPart`), whatever
 * its translation would give, holding its own in turn; the position goes
 * on, and the other resources flow. A part met again that the state holds,
 * by its fact's operation and its position in the fact, is held once. An
 * operator resolves a letter through the running consumers (`redeliver`,
 * `discard`), served by its reaction's unit between two facts; then each
 * part that waited behind it and that nothing held before it still holds
 * goes on, in the order of the log, as met for the first time. A technical
 * abort (the port or the log throws, a version the store's versions do not
 * know, the log that keeps the position no longer) stops its reaction
 * where it is, unadvanced, and `stop` reports it: the fact comes again when
 * the consumers start again, the duplicate branch covering the parts
 * already applied. One partition per reaction: the order per resource is
 * kept by keeping the log's (D64.4); partitions by resource, one consumer
 * active per partition, are the library's and the adapter's, with an
 * adapter that partitions its log (A, 16 Nov 2026). Curried as
 * `effect_executor`: the registry of the reactions and the store's
 * versions; their wirings, by path; their ports.
 */
export function reaction_consumers<const registry extends Registry>(reactions: {
  readonly registry: registry
  readonly versions: Versions
}): (wirings: ReactionWirings<registry>) => (ports: ReactionPorts) => ReactionConsumers
export function reaction_consumers(reactions: RuntimeReactions): unknown {
  return runtime_consumers(reactions)
}

/** What the consumers are built from, at runtime. */
interface RuntimeReactions {
  readonly registry: Registry
  readonly versions: Versions
}

/** What a reaction is wired to, at runtime: its log, and a port the library is to have built. */
interface RuntimeWiring {
  readonly log: FactLog
  readonly invokes: unknown
}

/** A reaction as its consumer reads it: its path, its fact's path, its translation, the use case it invokes. */
interface Declared {
  readonly reaction: string
  readonly when: string
  readonly translation: unknown
  readonly use_case: unknown
}

/** A reaction wired: its log, its use case's port and that use case's path. */
interface Wired extends Declared {
  readonly log: FactLog
  readonly port: unknown
  readonly invoked: string
}

/** A reaction's declaration as its component carries it (`$Reaction`): its fact, its use case, its translation. */
const declared_in = (
  reaction: string,
  component: unknown,
): { readonly when: unknown; readonly invokes: unknown; readonly translation: unknown } => {
  const carried: unknown =
    typeof component === 'object' && component !== null && $Reaction in component
      ? component[$Reaction]
      : undefined
  if (!is_a_record(carried) || !is_a_record(carried['declared']))
    throw new Error(`${reaction} carries no declaration (DOM-16)`)
  return {
    when: carried['when'],
    invokes: carried['invokes'],
    translation: carried['declared']['translation'],
  }
}

/** The part a reaction holds, named by its fact's operation and its position in the fact (SC-42). */
const is_the_part = (a: ReactionPart) => (b: ReactionPart) =>
  a.reaction === b.reaction &&
  a.part === b.part &&
  a.fact.operation.scope === b.fact.operation.scope &&
  a.fact.operation.id === b.fact.operation.id

/** The resources of a part a reaction meets or holds, as written with it (DOM-10). */
const resources_of = (each: ReactionPart): readonly Resource[] =>
  each.fact.parts[each.part]?.resources ?? []

/** The body of `reaction_consumers`, typed by what it meets at runtime. */
const runtime_consumers = (reactions: RuntimeReactions) => {
  const versions = reactions.versions[$Versions]
  // At wiring (CFG-2), every fault in one message: a reaction to a fact of
  // no domain whose majors the store's versions were given (DOM-22).
  const faults: string[] = []
  const declared = Object.entries(reactions.registry).flatMap(
    ([reaction, component]): readonly Declared[] => {
      if (kind_of(component)?.kind !== 'reaction') return []
      const declaration = declared_in(reaction, component)
      const when = versions.path(declaration.when)
      if (when === undefined || !versions.reads(when)) {
        faults.push(
          `${reaction} reacts to a fact of no domain whose majors the versions were given (DOM-22)`,
        )
        return []
      }
      return [
        {
          reaction,
          when,
          translation: declaration.translation,
          use_case: declaration.invokes,
        },
      ]
    },
  )
  if (faults.length > 0) throw new Error(`the consumers of the reactions: ${faults.join('; ')}`)

  return (wirings: Readonly<Record<string, RuntimeWiring | undefined>>) => {
    // At wiring (CFG-2), every fault in one message: a reaction not wired, a
    // wiring of no reaction (the types say so too), a port that is not the
    // library's port of the use case the reaction invokes.
    const paths = declared.map((each) => each.reaction)
    const unwired: string[] = [
      ...paths.flatMap((path) =>
        wirings[path] === undefined ? [`${path} is not wired (DOM-16)`] : [],
      ),
      ...Object.keys(wirings).flatMap((path) =>
        paths.includes(path) ? [] : [`${path} is wired but is no reaction of the registry`],
      ),
    ]
    const wired = declared.flatMap((each): readonly Wired[] => {
      const wiring = wirings[each.reaction]
      if (wiring === undefined) return []
      const served = served_by(wiring.invokes)
      if (served === undefined || served.component !== each.use_case) {
        unwired.push(
          `the port ${each.reaction} invokes is not the library's port of its use case (DOM-16)`,
        )
        return []
      }
      return [{ ...each, log: wiring.log, port: wiring.invokes, invoked: served.path }]
    })
    if (unwired.length > 0) throw new Error(`the consumers of the reactions: ${unwired.join('; ')}`)

    return (ports: ReactionPorts): ReactionConsumers => {
      let stopping = false
      let stop_now = (): void => undefined
      const stopped = new Promise<'stopped'>((resolve) => {
        stop_now = () => {
          resolve('stopped')
        }
      })
      const fell: Error[] = []
      const by_path = new Map(wired.map((each) => [each.reaction, each]))

      /**
       * A part delivered (DOM-16): at the current shape, translated, and
       * the use case invoked under the reaction's operation; nothing to
       * invoke, or applied, it is handled; else the letter it becomes.
       */
      const delivered = async (
        each: Wired,
        part: ReactionPart,
      ): Promise<ReactionDeadLetter | 'handled'> => {
        const stored = part.fact.parts[part.part]
        if (stored === undefined)
          throw new Error(`${each.reaction} met a part its fact has not (DOM-10)`)
        const input = called(each.translation, versions.part(stored).payload)
        if (input === nothing) return 'handled'
        const context: CommandRootContext = {
          now: in_zone(ports.clock.time_zone)(ports.clock.now()),
          time_zone: ports.clock.time_zone,
          operation: reaction_operation(each.reaction)({
            operation: part.fact.operation,
            part: part.part,
          }),
          correlation: part.fact.correlation,
          fingerprint: fingerprint_of({ path: each.invoked, input }),
        }
        const outcome = await outcome_of(called_with(each.port, [context, input]))
        if (!is_a_record(outcome))
          throw new Error(`the use case ${each.reaction} invokes gave no outcome`)
        const letter = (cause: ReactionDeadLetter['cause']): ReactionDeadLetter => ({
          reaction: part.reaction,
          position: part.position,
          fact: part.fact,
          part: part.part,
          held: 'dead_letter',
          cause,
        })
        switch (outcome['outcome']) {
          case 'applied':
            return 'handled'
          case 'rejected':
            return letter({ cause: 'rejected', failures: failures_of(outcome['failures']) })
          case 'identity_already_used':
            return letter({ cause: 'identity_already_used' })
          case 'invalid_request':
            return letter({ cause: 'invalid_request' })
          default:
            throw new Error(`the use case ${each.reaction} invokes gave no outcome`)
        }
      }

      /**
       * A fact met (DOM-16, SC-42): each part of the reaction's path, in
       * order; one the state holds, held once; one that touches a resource
       * the reaction holds, held behind it; any other delivered, a letter
       * held if refused.
       */
      const met = async (
        each: Wired,
        event: Extract<LogEvent, { readonly event: 'fact' }>,
      ): Promise<void> => {
        for (const [index, stored] of event.fact.parts.entries()) {
          if (stored.path !== each.when) continue
          const part: ReactionPart = {
            reaction: each.reaction,
            position: event.position,
            fact: event.fact,
            part: index,
          }
          const held = await ports.state.held(each.reaction)
          if (held.some(is_the_part(part))) continue
          if (held.some((one) => share(resources_of(one))(stored.resources))) {
            await ports.state.hold({ ...part, held: 'waiting' })
            continue
          }
          const outcome = await delivered(each, part)
          if (outcome !== 'handled') await ports.state.hold(outcome)
        }
      }

      const { lanes, asked_on, served, close } = lanes_of(paths)

      /**
       * One reaction's delivery, its own unit (D89.6): from its position,
       * the facts of its log, each met then the position advanced past it.
       * Between two facts it serves what an operator asks of its letters,
       * then delivers the parts waiting that go on, before the facts it
       * meets.
       */
      const run = async (each: Wired, lane: Lane): Promise<void> => {
        const from = await ports.state.position(each.reaction)
        const log = each.log(from)[Symbol.asyncIterator]()
        let next: Promise<IteratorResult<LogEvent>> | undefined = log.next()
        while (!stopping) {
          const ask = lane.asked.shift()
          if (ask !== undefined) {
            await ask.serve()
            continue
          }
          const freed = freed_in<HeldPart>(resources_of)(await ports.state.held(each.reaction))[0]
          if (freed !== undefined) {
            const outcome = await delivered(each, freed)
            await (outcome === 'handled' ? ports.state.release(freed) : ports.state.hold(outcome))
            continue
          }
          // An operator who asked while the unit read its state is served first.
          if (lane.asked.length > 0) continue
          const woke = await Promise.race([
            stopped,
            asked_on(lane),
            ...(next === undefined ? [] : [next.then((arrived) => ({ arrived }))]),
          ])
          if (woke === 'stopped' || woke === 'asked') continue
          if (woke.arrived.done === true) {
            next = undefined
            continue
          }
          next = log.next()
          const event = woke.arrived.value
          if (event.event === 'caught_up') continue
          if (event.event === 'position_unavailable') {
            throw new Error(`the log keeps the position of ${each.reaction} no longer (DOM-17)`)
          }
          // The position is inclusive: the fact at it was handled before.
          if (event.position === from) continue
          await met(each, event)
          await ports.state.advance(each.reaction)(event.position)
        }
      }

      const runs = wired.map((each) => {
        const lane = lanes.get(each.reaction)
        if (lane === undefined) throw new Error(`${each.reaction} has no unit`)
        return run(each, lane)
          .catch((error: unknown) => {
            fell.push(new Error(`the delivery of ${each.reaction} fell`, { cause: error }))
          })
          .finally(() => {
            close(lane, fell.at(-1) ?? new Error('the consumers of the reactions are stopped'))
          })
      })

      /** The letter a reaction holds by the key of one, as its state keeps it now: none if it is no longer a letter. */
      const letter_held = async (
        letter: ReactionDeadLetter,
      ): Promise<ReactionDeadLetter | undefined> => {
        const held = (await ports.state.held(letter.reaction)).find(is_the_part(letter))
        return held?.held === 'dead_letter' ? held : undefined
      }

      return {
        stop: async () => {
          stopping = true
          stop_now()
          await Promise.all(runs)
          const first = fell[0]
          if (first !== undefined) throw first
        },
        // An operator's redelivery of a letter (D67.3), by its reaction's
        // unit: the part again, with the same operation, after a fix.
        // Delivered, the letter is released and the parts behind it go on;
        // refused again, it holds still, with why this time.
        redeliver: (letter) =>
          served(letter.reaction, async (): Promise<Redelivered> => {
            const held = await letter_held(letter)
            const each = by_path.get(letter.reaction)
            if (held === undefined || each === undefined) return { outcome: 'not_held' }
            const outcome = await delivered(each, held)
            if (outcome === 'handled') {
              await ports.state.release(held)
              return { outcome: 'delivered' }
            }
            await ports.state.hold(outcome)
            return { outcome: 'dead_letter', letter: outcome }
          }) ?? Promise.resolve({ outcome: 'not_held' }),
        // An operator lets a letter go, with a trace (D67.3): its part never
        // delivered, the parts behind it go on as after a delivery.
        discard: (letter) => (trace) =>
          served(letter.reaction, async () => {
            const held = await letter_held(letter)
            if (held === undefined) return
            await ports.state.release(held)
            await ports.state.discarded({
              letter: held,
              by: trace.by,
              reason: trace.reason,
              at: in_zone(ports.clock.time_zone)(ports.clock.now()),
            })
          }) ?? Promise.resolve(),
      }
    }
  }
}
