// Shed's wished library (DOM-25): the library Shed asks for, the requirement
// of the library's steps of the plan. Since part 3.1 the library's types are
// in `domains/src/library/` (zen0), with the values that already had a body:
// this file re-exports it, and declares with no body what is still to be
// built, grouped by the part of the plan that gives each its body. Each part
// moves its declarations into the library, so that its diff shows them leave;
// at 7.5 Shed imports the library and this file is deleted (`docs/plan.md`).

import type {
  Applicabilities,
  ApplicabilityFragmentOf,
  ApplicableNames,
  Clock,
  CommandUseCasePort,
  CommandUseCases,
  CommandsOf,
  Component,
  Deliveries,
  EffectExecutor,
  ExecutorState,
  FactLog,
  FactWrites,
  FactsIn,
  Invoked,
  LookupAdapter,
  LookupPort,
  Lookups,
  Majors,
  Operation,
  Outbox,
  QueriesOf,
  ReactionConsumers,
  ReactionState,
  ReactionWirings,
  ReadAdapter,
  ReadUseCasePort,
  ReadUseCases,
  Registry,
  StateAdapter,
  StoredVersions,
  Streams,
  TreeLeaves,
  TreePorts,
  Versions,
  entry_id,
  position,
} from '../../src/library/index.ts'

export * from '../../src/library/index.ts'

// Part 4.1, a command on the oracle.

/**
 * The ports of a set of command use cases over a state adapter for their
 * commands, with the registry where the library finds the paths of their
 * predicates and facts, and the versions of the store, which read the fact
 * that the duplicate branch gives back, recorded maybe at a past major
 * (`Versions`). Curried, so that the use cases fix the types before the
 * adapter is written. The command ports stay inside the library.
 */
export declare function command_use_case_ports<const use_cases extends CommandUseCases>(ports: {
  readonly registry: Registry
  readonly versions: Versions
  readonly use_cases: use_cases
}): <fragment, write, read, selection, source, field>(
  adapter: StateAdapter<CommandsOf<use_cases>, fragment, write, read, selection, source, field>,
) => { readonly [name in keyof use_cases]: CommandUseCasePort<use_cases[name]> }

// Part 4.4, the versions of the facts.

/**
 * The versions of a store, composed once by the configurator from the
 * majors of every domain whose data it keeps (`versions([loans, tools])`),
 * then checked against what the store keeps, and given to every builder
 * that reads stored data. At wiring (CFG-2) the library stops on a path and
 * version the store keeps and no major reads, naming them: a past major's
 * folder deleted while a fact or a wait of it is kept (D101: a folder goes
 * when nothing kept has its major), so that the release does not start,
 * rather than a reader stopping weeks later. It stops too on a builder that
 * reads a domain absent here (the consumer of `damage` reads a fact of
 * `loans`), and on a domain whose current major is not the one of its
 * `version.ts` (A, 17 Nov 2026).
 */
export declare function versions(
  majors: readonly Majors[],
): (store: { readonly stored: StoredVersions }) => Promise<Versions>

/**
 * The facts of a log for an adapter's rebuild of its state (DOM-22: stored
 * state is migrated only through the translation, A, 17 Nov 2026): from the
 * first fact the log keeps to the end of what it had recorded when the
 * rebuild began, in order, each part at the current shape through the
 * adapter's writes, which know that shape alone. When (a release that
 * changes its tables: `loans` from `due_date` to `due_day`) and how it
 * writes are the adapter's; no adapter rewrites a value by hand.
 */
export declare function replay<const facts extends Component, write>(replay: {
  readonly versions: Versions
  readonly writes: FactWrites<facts, write>
}): (
  log: FactLog,
) => AsyncIterable<{ readonly position: position; readonly writes: readonly write[] }>

// Part 5.1, a query and its snapshot.

/**
 * The ports of a set of read use cases over a read adapter and the stream
 * strategies it declares, with the registry where the library finds the
 * paths of their selection predicates and of the facts a stream carries (a
 * stream reads the facts of a domain, D64.1). Curried as
 * `command_use_case_ports`. An adapter that evaluates the actions of its
 * reads (D110, SC-33) declares it query by query, as its streams, since
 * whether an evaluation per entry is cheap depends on the technology and
 * the data: for each such query, the fragments of its domain's command
 * predicates (`applicability`), its commands' own (ADP-8). The port of a
 * query in it has `with_actions` (A, 18 Nov 2026 (8)).
 */
export declare function read_use_case_ports<
  const registry extends Registry,
  const use_cases extends ReadUseCases,
>(ports: {
  readonly registry: registry
  readonly versions: Versions
  readonly use_cases: use_cases
}): <
  selection,
  source,
  field,
  const streams extends Streams<
    QueriesOf<use_cases>,
    selection,
    source,
    field,
    ApplicabilityFragmentOf<applicability>
  >,
  const applicability extends Applicabilities<QueriesOf<use_cases>, registry> | undefined =
    undefined,
>(
  adapter: ReadAdapter<
    QueriesOf<use_cases>,
    selection,
    source,
    field,
    ApplicabilityFragmentOf<applicability>
  > & {
    readonly streams: streams
    readonly applicability?: applicability
  },
) => {
  readonly [name in keyof use_cases]: ReadUseCasePort<
    QueriesOf<use_cases>[name],
    FactsIn<registry>,
    name extends keyof streams ? true : false,
    name extends ApplicableNames<applicability> ? true : false
  >
}

// Part 6.1, the leaves and ports of a tree.

/**
 * The ports of the leaves of a tree (PER-6): the registry where the library
 * finds the nodes and the leaves by path, the versions of the store it reads
 * (`Follows`), the majors of the persona (`persona/member/_majors.ts`,
 * generated from its folders, A, 17 Nov 2026), where it finds the leaf of a
 * past major at the message's version, the node at the top, which takes
 * what the entry gives, and the current leaves, command and read, one port
 * per name (`LeafPort`). At wiring (CFG-2) it stops on a current
 * leaf that is not the one of its path in the current major, and on a read
 * leaf that lists actions over a port with no `with_actions` (D110, SC-33). Curried as
 * `command_use_case_ports`: then the ports the tree invokes, and the fact
 * log a leaf that follows reads, by correlation (`Follows`).
 */
export declare function tree_ports<
  const top,
  const majors extends Majors,
  const use_cases extends TreeLeaves,
>(ports: {
  readonly registry: Registry
  readonly versions: Versions
  readonly majors: majors
  readonly top: top
  readonly use_cases: use_cases
}): (wired: {
  readonly invoked: Invoked
  readonly log: FactLog
}) => TreePorts<top, majors, use_cases>

// Part 6.2, nodes and lookups.

/**
 * The ports of a set of lookups over an adapter, with the registry where the
 * library finds their paths. Curried as `command_use_case_ports`.
 */
export declare function lookup_ports<const lookups extends Lookups>(ports: {
  readonly registry: Registry
  readonly lookups: lookups
}): (adapter: LookupAdapter<lookups>) => {
  readonly [name in keyof lookups]: LookupPort<lookups[name]>
}

// Part 7.1, the effect executor.

/**
 * The library's delivery of an effect with no world (a wait: the eve of a
 * due date): the payload back, as the return's input. The executor waits
 * for `not_before` for every effect, so this one only answers: never
 * transient nor exhausted. It fits an effect whose payload is its return's
 * input. A timer is not a construct (A, 13 Nov 2026 (3)).
 */
export declare const returns_the_payload: <payload>(entry: {
  readonly id: entry_id
  readonly payload: payload
}) => Promise<{ readonly outcome: 'delivered'; readonly returns: payload }>

/**
 * The effect executor of a domain (DOM-14, PER-12): an internal entry, a
 * durable consumer of its outbox, one delivery unit per effect, with its own
 * position, order and dead letters. For each entry it waits for
 * `not_before` by its clock, reads its payload at the current shape
 * (`Versions`: Marta's eve, queued at 1.x, reaches its return at 2.0.0),
 * delivers it at least once, and, if the world
 * answered and the effect has a return, invokes the return's port as
 * "system · executor of effect E" (D91.3): the scope is the effect's path,
 * the operation's id the entry's, so that a double report is the duplicate
 * branch (DOM-11) and the fingerprint covers the entry and what the world
 * said (D108.3); the context is the clock's, `now` told in its zone.
 * A dead letter holds its entry's resources for its effect (D108, D67.3;
 * SC-53), those of the part that queued it (`StoredEntry.resources`): a
 * later entry of the effect that touches one of them is not delivered; it
 * waits behind (`WaitingEntry`), and holds its own resources in turn. A
 * wait is never exhausted, but its return may refuse it: held the same way.
 * The position goes on past a held entry, and the other resources flow: a
 * dead letter stops its resources in its effect, never its effect, nor
 * another effect of the same resources (D108, the delivery unit is the
 * effect). When a letter is delivered at last or discarded
 * (`EffectExecutor`), the executor delivers the entries waiting behind it
 * that nothing held before them still holds, in the order of the outbox,
 * each as an entry met for the first time: it waits for its `not_before`,
 * and one refused becomes a dead letter in its place. It reads what it
 * holds from its state when it starts. An effect that tolerates reordering
 * (`order: 'any'`, D67.3, SC-56) holds nothing: its dead letters wait for
 * the operator, and its later entries go on, of any resource. Curried as
 * `command_use_case_ports`: the registry and the domain's return use cases,
 * where it finds each effect's return; then the deliveries; then its ports.
 */
export declare function effect_executor<
  const registry extends Registry,
  const returns extends CommandUseCases,
>(executor: {
  readonly registry: registry
  readonly versions: Versions
  readonly returns: returns
}): (
  deliveries: Deliveries<registry, returns>,
) => (ports: {
  readonly outbox: Outbox
  readonly returns: { readonly [name in keyof returns]: CommandUseCasePort<returns[name]> }
  readonly state: ExecutorState
  readonly clock: Clock
}) => EffectExecutor

// Part 7.3, the reactions.

/**
 * A reaction's operation (DOM-16, D91.3, LIB-10): its scope the reaction's
 * path ("system · reaction R"), its id a stable function of the library over
 * that path, the operation that recorded the fact (DOM-10) and the part the
 * reaction reacts to, by its position in the fact (D113.3), so that a fact
 * delivered again is the duplicate branch (DOM-11): Luca retires the ladder,
 * the consumer falls before saving its position, the fact comes again, one
 * work sheet (TST-4). In the stability corpus: it never changes once
 * released.
 */
export declare const reaction_operation: (
  reaction: string,
) => (delivered: { readonly operation: Operation; readonly part: number }) => Operation

/**
 * The consumers of a set of reactions (DOM-16, PER-12, D89.6): internal
 * entries, not personas, one durable consumer per reaction, its own delivery
 * unit, with its own position and dead letters. Each reads its fact log from
 * its position (the first fact the log keeps, with none: in Shed every
 * reaction is there from the start; where a reaction added later starts is
 * the deployment's, D64.3), in the order of the log, so in order per
 * resource; skips the parts of other paths; for each part of its path, in
 * the order of the parts (DOM-16: at most one command per part), read at
 * the current shape (`Versions`: Marta's damaged return, recorded at 1.x
 * and delivered after 2.0.0), translates it purely (D89.3) and invokes its use case with `reaction_operation` over
 * the fact's operation and the part, and the clock's context; a part
 * translated to `nothing` invokes nothing (D88.2). Then, by the outcome of
 * each:
 * - applied (an exact duplicate too, the recorded fact): the next part;
 * - rejected, identity already used: to its dead letter, then the next part;
 * - a technical abort (the port fails, the process falls): it does not
 *   advance, and delivers the fact again from its position (D65.6), the
 *   duplicate branch covering the parts already applied.
 * After the last part it advances.
 * A dead letter holds its part's resources for its reaction (D94.7, D67.3;
 * SC-42): a later part of the reaction's path that touches one of them, by
 * the resources in its envelope (D107), is not delivered; it waits behind
 * (`WaitingPart`), and holds its own resources in turn, so that no part of
 * one of them overtakes it. A part translated to `nothing` waits the same:
 * the hold is by resource, never by what a translation would give. The
 * position goes on past a held part, and the other resources flow: a dead
 * letter stops its resources, never its reaction, nor the other reactions
 * (D89.6). When a letter is delivered at last or discarded
 * (`ReactionConsumers`), the consumer delivers the parts waiting behind it
 * that nothing held before them still holds, in the order of the log, each
 * as a part met for the first time; one refused becomes a dead letter in
 * its place. It reads what it holds from its state when it starts. A
 * consumer that tolerates reordering (D67.3) comes with its case.
 * The contract is the order per resource, not a total one: a
 * consumer may deliver facts of disjoint resources in parallel (partitions
 * by resource, one consumer active per partition at a time, else two
 * instances may swap two facts of one tool), its position then the
 * partition's: the library's and the adapter's, not the domain's (A, 16
 * Nov 2026); what a reaction holds is the reaction's, whatever its
 * partitions. Curried as `effect_executor`: the registry of the
 * reactions; their wirings; the state and the clock.
 */
export declare function reaction_consumers<const registry extends Registry>(reactions: {
  readonly registry: registry
  readonly versions: Versions
}): (
  wirings: ReactionWirings<registry>,
) => (ports: { readonly state: ReactionState; readonly clock: Clock }) => ReactionConsumers
