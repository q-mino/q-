import type * as z from 'zod'
import type { Semver, cursor, position } from './format.ts'
import type {
  CorrelationContext,
  OperationContext,
  OperationScopeContext,
  VersionContext,
} from './context.ts'
import type { Delegated } from './version.ts'
import type { CommandInput, Commands, SchemaOf } from './command.ts'
import type { Queries, QueryInput } from './query.ts'
import type {
  IdentityAlreadyUsed,
  InvalidRequest,
  SnapshotEvent,
  VersionNotSupported,
} from './base_event.ts'
import type { EntryOf } from './node.ts'
import type { $UseCase, CommandUseCase, ReadUseCase } from './use_case.ts'
import type { EventOutOf, Events } from './use_case_over.ts'
import type { CommandUseCaseOver } from './command_leaf.ts'
import type { LeafStream, LeafStreamEvent, ReadUseCaseOver } from './read_leaf.ts'
import type { Majors } from './registry.ts'
import type { Streamed } from './use_case_port.ts'

// The ports of a tree (PER-6, DOM-11, D106): a request enters a tree from a
// leaf. The library walks its path down from the node at the top, which takes
// what the entry gives, runs the nodes it meets, then the leaf, which invokes
// another tree's use case. Its events are the leaf's own, how the nodes of
// its path may close it, and the base events, which no leaf declares.

/** The events of a command leaf: its own, how its path may close it, the base events. */
export type CommandLeafEvent<leaf> = leaf extends {
  [$UseCase]: { events: infer events extends Events; closes?: infer closes; waits?: infer waits }
}
  ? EventOutOf<events> | closes | waits | InvalidRequest | VersionNotSupported | IdentityAlreadyUsed
  : never

/**
 * The port of a command leaf: what the entry gives the top of its tree, with
 * the operation (its id and its scope, which the entry composes, DOM-11), the
 * version the message carries (`VersionContext`), and the input of the leaf
 * at that version in; its events out. The library computes the operation's
 * fingerprint at the leaf, over its path and its input as sent, after the
 * schema (D100), and gives it with the operation to the command port, which
 * compares it (D79.5). The entry gives the correlation too, the client's or
 * a new one (D72.7), which the leaf follows, if it follows (`Follows`).
 * For a current leaf whose input names its operation (SC-34), the entry
 * gives its scope alone, at every major: the library reads the id from the
 * input (`OperationScopeContext`).
 */
export type CommandLeafPort<entry, majors, name extends string, leaf> = <
  const version extends Semver,
>(
  context: entry & OperationGiven<leaf> & CorrelationContext & VersionContext<version>,
  input: LeafInput<LeafAt<majors, name, version>>,
) => AsyncIterable<CommandLeafEvent<LeafAt<majors, name, version>>>

/** What the entry gives a command leaf of its operation: the whole, or the scope alone if its input names it (SC-34). */
type OperationGiven<leaf> = leaf extends {
  [$UseCase]: { events: unknown; operation?: infer identity }
}
  ? [identity] extends [never]
    ? OperationContext
    : OperationScopeContext
  : OperationContext

/**
 * The events of a read leaf: the snapshot of its own entries, then, if it
 * streams, the events of its stream; how its path may close it; the base
 * events of a request, the gate and an invalid request (no operation, so no
 * `identity_already_used`).
 */
export type ReadLeafEvent<leaf> = leaf extends {
  [$UseCase]: {
    entry: infer entry extends z.ZodObject
    closes?: infer closes
    stream?: infer stream
  }
}
  ? | SnapshotEvent<z.output<entry>>
    | (stream extends {
        identity: infer identity extends keyof z.output<entry>
        events: infer events extends Events
      }
        ? LeafStreamEvent<z.output<entry>, z.output<entry>[identity], events>
        : never)
    | closes
    | InvalidRequest
    | VersionNotSupported
  : never

/**
 * The port of a read leaf: what the entry gives the top of its tree, with no
 * operation (a read has none), the version the message carries
 * (`VersionContext`), the input of the leaf at that version, and, if it
 * streams, a position to resume from, as the stream gave it; if it does not,
 * a cursor to resume its pages from, as a snapshot gave it (`next`, SC-22),
 * one snapshot per page, read when the consumer asks for the next; its
 * events out.
 * With `stream` (the current leaf's, which every major's follows) it is
 * `Streamed`; a stream over a port of the invoked tree that does not stream
 * is a composition fault, stopped at wiring (CFG-2).
 */
export type ReadLeafPort<entry, majors, name extends string, stream> = stream extends LeafStream
  ? (<const version extends Semver>(
      context: entry & VersionContext<version>,
      input: LeafInput<LeafAt<majors, name, version>>,
      from?: position,
    ) => AsyncIterable<ReadLeafEvent<LeafAt<majors, name, version>>>) &
      Streamed
  : (<const version extends Semver>(
      context: entry & VersionContext<version>,
      input: LeafInput<LeafAt<majors, name, version>>,
      after?: cursor,
    ) => AsyncIterable<ReadLeafEvent<LeafAt<majors, name, version>>>) & {
      readonly streamed: false
    }

/** The leaves of a tree, by name: command and read use cases over another. */
export type TreeLeaves = Readonly<
  Record<
    string,
    | CommandUseCaseOver<
        CommandUseCase<Commands[string]>,
        CommandInput<z.ZodType>,
        Events,
        unknown,
        unknown,
        string,
        string
      >
    | ReadUseCaseOver<
        ReadUseCase<Queries[string]>,
        QueryInput<z.ZodType>,
        z.ZodObject,
        unknown,
        LeafStream | undefined,
        unknown
      >
  >
>

/** The major of a version (`1` for `'1.4.0'`); any major for a version the type does not know. */
export type MajorOf<version extends Semver> =
  version extends `${infer major extends number}.${number}.${number}` ? major : number

/** A leaf as it answers: a delegated one is the leaf of the next major. */
type Answering<leaf> = leaf extends Delegated<infer next> ? Answering<next> : leaf

/** The leaf of a name in a major's registry, by its path (`…/usecase/borrow_a_tool`), as it answers. */
type LeafIn<registry, name extends string> = Answering<
  registry[Extract<keyof registry, `${string}/usecase/${name}`>]
>

/** The input of a leaf, as a client sends it. */
type LeafInput<leaf> = leaf extends { readonly input: infer input }
  ? z.input<SchemaOf<input>>
  : never

/**
 * The leaf of a name at a version: the one of its major; none if the tree
 * has no such major; for a version the type does not know, any of them.
 */
export type LeafAt<majors, name extends string, version extends Semver> =
  MajorOf<version> extends infer major
    ? number extends major
      ? { [each in keyof majors]: LeafIn<majors[each], name> }[keyof majors]
      : major extends keyof majors
        ? LeafIn<majors[major], name>
        : never
    : never

/**
 * The port of a leaf of a tree with its majors, by its kind, a read leaf
 * declaring its entry, a command leaf its events (PER-17, D72.7, A, 17 Nov
 * 2026): one per name, the version in the context picking the major, in
 * whose registry the library finds the leaf by its path; a delegated leaf is
 * the next major's. A path a major has not is `not_a_leaf`; a major out of
 * the window, the gate (`VersionNotSupported`). Typed by the version: Marta's test client at
 * `'1.4.0'` reads the events of 1.x, the generic entry, with any version, the
 * union of the majors.
 */
export type LeafPort<entry, majors, name extends string, leaf> = leaf extends {
  [$UseCase]: { entry: z.ZodObject; stream?: infer stream }
}
  ? ReadLeafPort<entry, majors, name, stream>
  : CommandLeafPort<entry, majors, name, leaf>

/**
 * The ports that a tree invokes, by the path of their folder
 * (`business/loans`, `auth/accounts`), as their adapters give them: the
 * library finds a use case's or a lookup's port by its path, in the
 * registries, and stops at wiring if one is missing.
 */
export type Invoked = Readonly<Record<string, Readonly<Record<string, unknown>>>>

/**
 * The time that passes, as the configurator measures it (DOM-3, part 6.3):
 * a promise that resolves once so many milliseconds have elapsed. A leaf
 * that follows waits at most so long (`Follows.at_most`), then its flow
 * closes with `the_wait_is_over`. The domains have no clock that wakes
 * (GR-8): the configurator gives one (a timeout of its runtime), the harness
 * one the scenario ends when it says (TST-3).
 */
export type Elapsed = (milliseconds: number) => Promise<void>

/**
 * The ports of a tree, one per leaf, by name (PER-6): a named type, so that
 * a configurator's declaration names it with its arguments instead of
 * spelling every leaf's port out.
 */
export type TreePorts<top, majors extends Majors, use_cases extends TreeLeaves> = {
  readonly [name in keyof use_cases & string]: LeafPort<EntryOf<top>, majors, name, use_cases[name]>
}
