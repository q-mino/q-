import type { RootContext } from './context.ts'
import type { ConstructKind } from './kind.ts'
import type { LookupBuilder } from './lookup.ts'
import { lookup_builder } from './lookup.ts'
import type {
  CalculationBuilder,
  Component,
  EffectBuilder,
  FactBuilder,
  IdBuilder,
  PredicateBuilder,
  SelectionBuilder,
} from './component.ts'
import {
  calculation_builder,
  effect_builder,
  fact_builder,
  id_builder,
  predicate_builder,
  selection_builder,
} from './component.ts'
import type { AndBuilder, NotBuilder, OrBuilder } from './condition.ts'
import { and_builder, not_builder, or_builder } from './condition.ts'
import type { DelegateBuilder, VersionBuilder } from './version.ts'
import { delegate_builder, version_builder } from './version.ts'
import type { CommandBuilder } from './command.ts'
import { command_builder } from './command.ts'
import type { QueryBuilder } from './query.ts'
import { query_builder } from './query.ts'
import type { CursorStepBuilder } from './step.ts'
import { cursor_step_builder } from './step.ts'
import type { Accumulated, NodeBuilder, NothingAccumulated } from './node.ts'
import { node_builder } from './node.ts'
import type { CommandUseCaseBuilder, ReadUseCaseBuilder } from './use_case.ts'
import { command_use_case_builder, read_use_case_builder } from './use_case.ts'
import type { CommandUseCaseOverBuilder } from './command_leaf.ts'
import { command_use_case_over_builder } from './command_leaf.ts'
import type { ReactionBuilder } from './reaction.ts'
import { reaction_builder } from './reaction.ts'
import type { ReadUseCaseOverBuilder } from './read_leaf.ts'
import { read_use_case_over_builder } from './read_leaf.ts'
import type { EarlierBuilder } from './earlier.ts'
import { earlier_builder } from './earlier.ts'

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

/**
 * The builders bound to the context of a point of the tree, for its
 * `_scope.ts`. A folder with a node has two points: the point above, whose
 * builder of the node the generator writes in `_scope_node.ts`, and the
 * context the node gives, in `_scope.ts`, from which the scope of the leaves
 * takes its builders (`_scope_usecase.ts`); so that no import goes round.
 * Below a node of a business tree the point carries what the nodes above it
 * add to the commands (`accumulated`, `<node>_accumulated` in `_node.ts`,
 * SC-31), which its use cases take. The context, what closes and what
 * accumulates are the types': at runtime every point has the same builders.
 */
export const builders_at = <
  context extends RootContext,
  closes = never,
  accumulated extends Accumulated<unknown, Component> = NothingAccumulated,
>(): Builders<context, closes, accumulated> => ({
  id: id_builder,
  fact: fact_builder,
  predicate: predicate_builder,
  selection: selection_builder,
  calculation: calculation_builder,
  effect: effect_builder,
  AND: and_builder,
  OR: or_builder,
  NOT: not_builder,
  command: command_builder<context>(),
  cursor_step: cursor_step_builder<context>(),
  query: query_builder<context>(),
  command_use_case: command_use_case_builder<accumulated>(),
  read_use_case: read_use_case_builder,
  command_use_case_over: command_use_case_over_builder<context, closes>(),
  read_use_case_over: read_use_case_over_builder<context, closes>(),
  lookup: lookup_builder,
  reaction: reaction_builder,
  node: node_builder<context, closes, accumulated>(),
  version: version_builder,
  earlier: earlier_builder<context>(),
  delegate: delegate_builder,
})
