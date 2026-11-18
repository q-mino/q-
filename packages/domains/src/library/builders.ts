import type { RootContext } from './context.ts'
import type { LookupBuilder } from './lookup.ts'
import type {
  CalculationBuilder,
  Component,
  EffectBuilder,
  FactBuilder,
  IdBuilder,
  PredicateBuilder,
  SelectionBuilder,
} from './component.ts'
import type { AndBuilder, NotBuilder, OrBuilder } from './condition.ts'
import type { DelegateBuilder, VersionBuilder } from './version.ts'
import type { CommandBuilder } from './command.ts'
import type { QueryBuilder } from './query.ts'
import type { CursorStepBuilder } from './step.ts'
import type { Accumulated, NodeBuilder, NothingAccumulated } from './node.ts'
import type { CommandUseCaseBuilder, ReadUseCaseBuilder } from './use_case.ts'
import type { CommandUseCaseOverBuilder } from './command_leaf.ts'
import type { ReactionBuilder } from './reaction.ts'
import type { ReadUseCaseOverBuilder } from './read_leaf.ts'
import type { EarlierBuilder } from './earlier.ts'

// Builders at a point of the tree (PER-6, DOM-25): the context of a creator
// comes from where it sits, not from its annotation.

/**
 * Every builder of the components, at a point of the tree: the authored files
 * build only with them, never with the library directly. The generator writes
 * in each folder of the tree `_scope.ts`, the scope of the folder, which
 * exports by name these builders, with the context the nodes above give at its
 * point (`RootContext` with none) and their `closes` (`never` with none); and
 * beside it one scope per kind (`_scope_command.ts`), which exports by name
 * the builders of its kind, taken from the folder's, and as namespaces the
 * components of the folder in the layers below the kind, its ancestors and
 * the doors the map opens to it. An authored file imports one scope, the one
 * of the kind it builds (`command`, `fact.a_tool_has_been_retired`). The
 * folder's scope is the one door to the builders, the place where a builder
 * could be added.
 *
 * Those whose creators read the context are bound to the context of the point
 * and to how the nodes above it may close a request (`closes`), which the
 * leaves built there carry: a creator gets the context with no annotation;
 * one that asks for more than the point gives does not compile. A command,
 * and a use case over one, add their operation (`OperationContext`). The
 * others are the same at every point.
 */
export interface Builders<
  context extends RootContext,
  closes,
  accumulated extends Accumulated<unknown, Component> = NothingAccumulated,
> {
  readonly id: IdBuilder
  readonly fact: FactBuilder
  readonly predicate: PredicateBuilder
  readonly selection: SelectionBuilder
  readonly calculation: CalculationBuilder
  readonly effect: EffectBuilder
  readonly AND: AndBuilder
  readonly OR: OrBuilder
  readonly NOT: NotBuilder
  readonly command: CommandBuilder<context>
  readonly cursor_step: CursorStepBuilder<context>
  readonly query: QueryBuilder<context>
  readonly command_use_case: CommandUseCaseBuilder<accumulated>
  readonly read_use_case: ReadUseCaseBuilder
  readonly command_use_case_over: CommandUseCaseOverBuilder<context, closes>
  readonly read_use_case_over: ReadUseCaseOverBuilder<context, closes>
  readonly lookup: LookupBuilder
  readonly reaction: ReactionBuilder
  readonly node: NodeBuilder<context, closes, accumulated>
  readonly version: VersionBuilder
  readonly earlier: EarlierBuilder<context>
  readonly delegate: DelegateBuilder
}

/** The kinds of construct, the segment of a path after its folders (DOM-24, DOM-25). */
export type ConstructKind =
  | 'id'
  | 'value'
  | 'fact'
  | 'predicate'
  | 'selection'
  | 'calculation'
  | 'effect'
  | 'command'
  | 'query'
  | 'usecase'
  | 'lookup'
  | 'node'
  | 'reaction'
  | 'version'

/**
 * What a folder of the tree sees of the others (LIB-1, DOM-25): for the
 * folders under a first segment (`business`), the kinds of construct they see
 * of each folder under another (`business: { business: ['id'] }`). The
 * architecture's rule, given to the generator as data: the library knows
 * folders and kinds of construct, never kinds of domain. The generator writes
 * into the scopes of a folder every folder it sees, under its name, with those
 * namespaces only (`tools.id.tool_id`); what is not listed is not seen, and
 * does not compile.
 */
export type Sight = Readonly<Record<string, Readonly<Record<string, readonly ConstructKind[]>>>>
