// library: what every domain shares (see docs/architecture.md).
// It never imports a domain and never names a q- concept.
export {
  date_time,
  day,
  time_zone,
  day_of,
  start_of,
  end_of,
  in_zone,
  semver,
  cursor,
  position,
} from './format.ts'
export type { Semver } from './format.ts'
export { operation_id, correlation, fingerprint } from './context.ts'
export type {
  RootContext,
  Now,
  Clock,
  Operation,
  OperationContext,
  OperationScopeContext,
  CorrelationContext,
  VersionContext,
  FingerprintContext,
  CommandRootContext,
} from './context.ts'
export { $Lookup } from './lookup.ts'
export type { Lookup, LookupBuilder, Answer, Lookups, LookupAdapter, LookupPort } from './lookup.ts'
export { $Resources, $Calculation, $Order } from './component.ts'
export type {
  Path,
  IdBuilder,
  FactBuilder,
  Resourced,
  ResourcesOf,
  ResourceFields,
  PredicateBuilder,
  SelectionBuilder,
  Calculation,
  CalculationBuilder,
  EffectBuilder,
  DeliveryOrder,
  Ordered,
  OrderOf,
  Component,
  PathOf,
} from './component.ts'
export { $Composed } from './condition.ts'
export type {
  Composed,
  Condition,
  Leaves,
  ConditionInput,
  Components,
  ComponentsParameters,
  OneKind,
  AndBuilder,
  OrBuilder,
  NotBuilder,
  SubjectOf,
  Operands,
} from './condition.ts'
export { $Version, $Earlier, $Delegated } from './version.ts'
export type { Version, VersionBuilder, Earlier, Delegated, DelegateBuilder } from './version.ts'
export type {
  Part,
  Envelope,
  Resource,
  StoredPart,
  PartFields,
  StoredEnvelope,
  ComposedBranches,
} from './envelope.ts'
export { $Composition, $Each, entry_id, $Command, pick, composes, each } from './command.ts'
export type {
  Entries,
  Each,
  Transitions,
  Composition,
  Outcome,
  Outcomes,
  ResolvedOutcomes,
  ResolvedTransitions,
  ResolvedEntries,
  CommandCreator,
  CommandInput,
  SchemaOf,
  Command,
  PredicatesAndFacts,
  CommandBuilder,
  PredicatesOf,
  FactsOf,
  TransitionsOf,
  EffectsOf,
  Commands,
  OutcomesOf,
  Picked,
} from './command.ts'
export { $Query } from './query.ts'
export type {
  Direction,
  Order,
  EntryOrder,
  IdentityFields,
  OneSubject,
  QueryShape,
  CalculationComponent,
  Calculations,
  Entry,
  CalculationsFit,
  QueryInput,
  QueryBinding,
  QueryCreator,
  Query,
  QueryBuilder,
  Queries,
  FieldsOf,
  QueryEntryOf,
  CalculationsOfQueries,
  PredicatesOfQueries,
} from './query.ts'
export type { PredicateFragments, Algebra, OrderKeyValue, CursorAlgebra } from './algebra.ts'
export { $Step } from './step.ts'
export type {
  StepOutcomes,
  ResolvedStep,
  StepCreator,
  CursorStep,
  StepFacts,
  CursorStepBuilder,
} from './step.ts'
export type {
  QuerySource,
  PlannedQuery,
  PlannedLeaves,
  Read,
  PlannedPage,
  ReadPage,
  ReadAdapter,
  CalculationFragments,
} from './read_adapter.ts'
export type {
  Snapshot,
  StreamEvent,
  Stream,
  LogEvent,
  FactLog,
  StreamStrategy,
  Streams,
} from './stream.ts'
export type {
  FactWrites,
  PlannedWrite,
  PlannedBranch,
  PlannedElementBranch,
  PlannedBranchOverAList,
  PlannedCommandBranch,
  StoredEntry,
  PlannedCommand,
  AlreadyRecorded,
  Execution,
  Execute,
  StepChoice,
  PlannedStep,
  StepExecution,
  ExecuteStep,
  Failure,
  PathFailure,
  PathFailures,
  CommandOutcome,
  ComposedPart,
  ComposedParts,
  ReadFailure,
  StepOutcome,
  OutcomeOf,
  StepSource,
  StepAdapter,
  StateAdapter,
} from './state_adapter.ts'
export type {
  NotFound,
  Refused,
  NodeEvent,
  InvalidRequest,
  VersionNotSupported,
  IdentityAlreadyUsed,
  SnapshotEvent,
} from './base_event.ts'
export { $GivenByTheCaller, given_by_the_caller } from './applicability.ts'
export type { Truth, GivenByTheCaller, Partly, Evaluated, Applicability } from './applicability.ts'
export { $Node } from './node.ts'
export type {
  Accumulated,
  NothingAccumulated,
  Node,
  AccumulatedOf,
  ContextOf,
  ClosesOf,
  EntryOf,
  NodeLookup,
  NodeLookups,
  Found,
  NodeBuilder,
} from './node.ts'
export { $UseCase } from './use_case.ts'
export type {
  CommandUseCase,
  CommandUseCaseBuilder,
  CommandUseCases,
  CommandsOf,
  ReadUseCase,
  ReadUseCaseBuilder,
  ReadUseCases,
  QueriesOf,
} from './use_case.ts'
export type { Events, EventOf, Projection, EventOutOf } from './use_case_over.ts'
export type {
  CommandUseCaseOver,
  WaitIsOver,
  Follows,
  LeafFlow,
  CommandUseCaseOverBuilder,
} from './command_leaf.ts'
export { $Reaction, nothing } from './reaction.ts'
export type { Reaction, ReactionBuilder } from './reaction.ts'
export type {
  LeafStream,
  FactProjection,
  ReadUseCaseOver,
  Actions,
  ApplicabilityOfLeaf,
  ApplicabilitiesOf,
  ActionBinding,
  ActionsFit,
  ReadBinding,
  ReadUseCaseOverBuilder,
  LeafStreamEvent,
} from './read_leaf.ts'
export { $Versions } from './registry.ts'
export type {
  Majors,
  Versions,
  StoredVersion,
  StoredVersions,
  Registry,
  RegistryEntry,
  PredicatesIn,
  SelectionsIn,
  CalculationsIn,
  FactsIn,
  FragmentOf,
} from './registry.ts'
export type {
  EarlierBuilder,
  FromNextEvents,
  OverTheNext,
  EarlierCommandLeaf,
  EarlierReadLeaf,
} from './earlier.ts'
export { builders_at } from './builders.ts'
export { command_use_case_ports } from './command_port.ts'
export { versions } from './versions.ts'
export type { VersionsBuilder } from './versions.ts'
export type { Builders, Sight } from './builders.ts'
export { identity_of, fingerprint_of, canonical_json, type Retried } from './stable.ts'
export { kind_of, is_a_schema } from './kind.ts'
export type { ConstructKind, Built } from './kind.ts'
export { as_json, json_schema_of } from './json_schema.ts'
export type { Json, JsonObject } from './json_schema.ts'
export type {
  CommandUseCasePort,
  ReadEvent,
  Page,
  Pages,
  ReadUseCasePort,
  WithActions,
  Action,
  Streamed,
  Applicabilities,
  ApplicableNames,
  ApplicabilityFragmentOf,
} from './use_case_port.ts'
export type {
  CommandLeafEvent,
  CommandLeafPort,
  ReadLeafEvent,
  ReadLeafPort,
  TreeLeaves,
  MajorOf,
  LeafAt,
  LeafPort,
  Invoked,
  TreePorts,
} from './tree.ts'
export type {
  ReactionPart,
  ReactionDeadLetter,
  WaitingPart,
  HeldPart,
  Discarded,
  ReactionState,
  ReactionWiring,
  ReactionWirings,
  Redelivered,
  ReactionConsumers,
} from './reaction_consumer.ts'
export type {
  EffectsIn,
  Delivered,
  Delivery,
  Deliveries,
  Outbox,
  QueuedEntry,
  EffectDeadLetter,
  WaitingEntry,
  HeldEntry,
  ExecutorState,
  EffectExecutor,
} from './effect.ts'
