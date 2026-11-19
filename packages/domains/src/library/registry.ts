import type * as z from 'zod'
import type { Semver } from './format.ts'
import type { PartFields, StoredPart } from './envelope.ts'
import type { EntryFields, StoredEntry } from './state_adapter.ts'
import type { RootContext } from './context.ts'
import type { Lookup } from './lookup.ts'
import type { Component, Path, PathOf } from './component.ts'
import type { Delegated, Version } from './version.ts'
import type { CommandInput, Commands } from './command.ts'
import type { CalculationComponent, Queries, QueryInput } from './query.ts'
import type { Accumulated, Node } from './node.ts'
import type { CommandUseCase, ReadUseCase } from './use_case.ts'
import type { Events } from './use_case_over.ts'
import type { CommandUseCaseOver } from './command_leaf.ts'
import type { Reaction } from './reaction.ts'
import type { LeafStream, ReadUseCaseOver } from './read_leaf.ts'

// The registry (DOM-24): every path of a domain with its component, the map
// the library reads at runtime, by object identity; and the majors of a
// domain, the registry of each past major beside the current one (DOM-22,
// PER-17).

/**
 * The majors of a domain whose data a store keeps, by number: the current
 * one's registry and each past major's (`business/loans/1/`). The generator
 * writes them from the folders (`business/loans/_majors.ts`), so that no
 * major is forgotten: the only file of the current version that names a past
 * major, which the generator rewrites when a folder is deleted.
 */
export type Majors = Readonly<Record<number, Registry>>

export const $Versions: unique symbol = Symbol('Versions')

/**
 * The versions of a store (DOM-22, A, 17 Nov 2026): the one place where
 * stored data becomes parsed data. By the path and the version a part of a
 * fact or an outbox entry carries, the major picks the folder (`1/`, or the
 * current); `earlier` parses with the past shape and chains the steps to the
 * next major, `delegate` passes to it, the current parses with its schema;
 * each part of a fact by its own version. Every reader meets the current
 * shapes only, never a version: the ports of the commands (the duplicate
 * branch gives back the fact recorded, maybe at 1.x), of the reads and their
 * streams, native or composed, the trees (`follows`), the reaction
 * consumers, the effect executor, the adapter's rebuild (`replay`). A
 * version the library does not know (a 2.1.0 written by a newer instance
 * during a rolling release, read by one at 2.0.0; a major whose folder is
 * gone) stops the reader, which retries; it never skips nor guesses. The
 * translation is the domain's, in its folders: the library runs it, as it
 * runs the steps of a leaf of a past major. The log is never rewritten.
 */
export interface Versions {
  readonly [$Versions]: {
    /**
     * A part of a fact as stored, at the current shape: its path, its
     * payload parsed, its resources as written; it stops (throws) on a
     * version it does not know, and the reader retries.
     */
    readonly part: (stored: StoredPart) => PartFields
    /**
     * An outbox entry as stored, at the current shape: its effect's path,
     * its id, its payload parsed, when it may go and its resources as
     * queued (a translation touches the payload alone, A, 17 Nov 2026); it
     * stops (throws) on a version it does not know.
     */
    readonly entry: (stored: StoredEntry) => EntryFields
    /**
     * Whether the store's versions read a path: its domain is among the
     * majors given. A builder that reads stored data checks at its wiring
     * every path it may read (CFG-2), and stops on one of a domain absent
     * (the consumer of `damage` reads a fact of `loans`, A, 17 Nov 2026).
     */
    readonly reads: (path: string) => boolean
  }
}

/** A path and a version a store keeps, among the parts of its facts and its outbox entries. */
export interface StoredVersion {
  readonly path: string
  readonly version: Semver
}

/**
 * What a store keeps, by path and version, distinct: a few rows, one per
 * shape and version, among the parts of its facts and its outbox entries
 * (DOM-22, A, 17 Nov 2026). The adapter gives it, so that the library can
 * tell at wiring whether its versions read all it keeps.
 */
export type StoredVersions = () => Promise<readonly StoredVersion[]>

/**
 * A domain's path registry (DOM-24), generated in `_registry.ts`: every path
 * with its component, the map of the domain: identities, values, facts,
 * predicates, named conditions, commands and their inputs, selection
 * predicates, queries and their inputs, use cases, lookups, reactions. The configurator gives
 * the library the registries of the domains it composes; the library reads
 * them in reverse, from a component to its path, by object identity. One
 * object, one path.
 */
export type Registry = Readonly<Record<string, RegistryEntry>>

/**
 * What a registry maps a path to: a schema, an input that is a function of
 * the context (DOM-21), a command, a query, a use case, a lookup.
 */
export type RegistryEntry =
  | z.ZodType
  | CommandInput<z.ZodType>
  | Commands[string]
  | Queries[string]
  | CommandUseCase<Commands[string]>
  | ReadUseCase<Queries[string]>
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
  | Lookup<z.ZodType, z.ZodType>
  | Node<unknown, RootContext, unknown, Accumulated<unknown, Component>>
  | Reaction<Component, CommandUseCase<Commands[string]>>
  | Version<Semver>
  | Delegated<unknown>

/** The components of a generated module of one kind. */
export type ComponentsIn<module, kind extends string> = {
  [name in keyof module]: module[name] extends Component
    ? PathOf<module[name]> extends Path<kind>
      ? module[name]
      : never
    : never
}[keyof module]

/** The predicates declared in a generated module (`_predicate.ts`), for an adapter's fragments. */
export type PredicatesIn<module> = ComponentsIn<module, 'predicate'>

/** The selection predicates of a generated module (`_loan_selection.ts`, one subject in Shed), for an adapter's fragments. */
export type SelectionsIn<module> = ComponentsIn<module, 'selection'>

/** The calculations of a generated module (`_tool_calculation.ts`, one subject in Shed), for an adapter's fragments. */
export type CalculationsIn<module> = Extract<
  ComponentsIn<module, 'calculation'>,
  CalculationComponent
>

/** The facts declared in a generated module (`_fact.ts`), for an adapter's writes. */
export type FactsIn<module> = ComponentsIn<module, 'fact'>

/** The fragment type of a set of predicate fragments; none with none. */
export type FragmentOf<fragments> =
  fragments extends Readonly<Record<string, (parameters: never) => infer fragment>>
    ? fragment
    : never
