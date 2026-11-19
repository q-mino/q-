import type * as z from 'zod'
import type { Semver, date_time, position } from './format.ts'
import type { Operation, correlation } from './context.ts'
import type { Component, PathOf } from './component.ts'
import type { Condition, Leaves } from './condition.ts'
import type { Envelope, Part, Resource, StoredEnvelope } from './envelope.ts'
import type {
  Commands,
  Composition,
  Each,
  Entries,
  FactsOf,
  InputOf,
  Outcomes,
  OutcomesOf,
  PredicatesOf,
  TransitionsOf,
  Transitions,
  TransitionsOfOutcome,
  entry_id,
} from './command.ts'
import type { Algebra, CursorAlgebra } from './algebra.ts'
import type { $Step } from './step.ts'
import type { PlannedQuery, QuerySource } from './read_adapter.ts'

// Adapters (LIB-14): typed tools to implement the command port. The library
// derives what an adapter must cover and types the outcome. The algebra of
// fragments (`algebra.ts`) is one way, recommended (ADP-8), not required: the
// adapter implements the port as it wants. No concept of state here.

/**
 * The adapter's write for each fact, under its path: how the fact's values
 * reach the state (DOM-5). Exhaustive, as a match over an ADT.
 */
export type FactWrites<facts extends Component, write> = {
  readonly [fact in facts as PathOf<fact>]: (fact: z.output<fact>) => write
}

/**
 * What a branch writes: its writes, one per part of its fact, in the order
 * of the parts (a command's one, then one per transition its branch
 * composes; a step's two, the step's part, then the composed transition's,
 * DOM-10), its fact in its envelope and its outbox
 * entries, which the adapter records with the writes, atomically (DOM-8,
 * D12), for the streams (DOM-17) and the effect executor (DOM-14) to read.
 */
export interface PlannedWrite<write> {
  readonly writes: readonly write[]
  readonly fact: StoredEnvelope
  readonly entries: readonly StoredEntry[]
}

/**
 * A branch ready to execute, in the order of the branches: its condition
 * composed, each leaf apart (to name the failures), and what it writes. A
 * branch that composes is planned once per branch of its transition, in
 * their order, its condition with the transition's (SC-10): the adapter
 * meets plain branches, and the library maps the index it applied back. A
 * transition on a list is planned per element (`PlannedBranchOverAList`).
 */
export interface PlannedBranch<fragment, write> extends PlannedWrite<write> {
  readonly condition: fragment
  readonly leaves: readonly fragment[]
}

/** A branch of the transition an element of a list may apply (SC-54): its condition composed, each leaf apart. */
export interface PlannedElementBranch<fragment> {
  readonly condition: fragment
  readonly leaves: readonly fragment[]
}

/**
 * A branch that composes a transition on each element of a list, ready to
 * execute (SC-54, D113.1): its condition, with its single transitions' as
 * a plain branch's (SC-10), each leaf apart; then, per element, in the order
 * of the list, the branches of the transition in their order. Planned once
 * per branch of a list's transition, its branches would be as many as their
 * combinations (2^N for a sheet of N lines and two branches), and the
 * elements choose on their own (D113.1): so the adapter chooses, for each
 * element, the first branch that holds, and the branch holds when its
 * condition does and every element has one. What it writes is a pure
 * function of the library over the choice (`applies`), as a step's
 * `choose`: its writes, its fact, the branch's own part then each
 * element's, and its outbox entries, which the adapter records as a plain
 * branch's, in the same step.
 */
export interface PlannedBranchOverAList<fragment, write> {
  readonly condition: fragment
  readonly leaves: readonly fragment[]
  readonly elements: readonly (readonly PlannedElementBranch<fragment>[])[]
  readonly applies: (chosen: readonly number[]) => PlannedWrite<write>
}

/** A branch of a command, as planned: plain, or over a list (SC-54). */
export type PlannedCommandBranch<fragment, write> =
  PlannedBranch<fragment, write> | PlannedBranchOverAList<fragment, write>

/**
 * An outbox entry as an adapter stores it (DOM-13): the path of its effect,
 * its id, the version of its domain when it was queued (DOM-10, DOM-22), its
 * payload and the instant it may go at the earliest. The library parses the
 * payload by the path at that version and takes it to the current shape
 * (`Versions`) before the delivery, so that a wait queued at 1.x gives its
 * return the input of 2.0.0; the version the adapter keeps opaque, as a
 * position. A translation touches the payload alone: when the entry may go
 * stays as it was queued, and a new rule of the business that moves it is
 * the return's guard (D68.3; A, 17 Nov 2026).
 */
export interface StoredEntry extends EntryFields {
  readonly version: Semver
}

/**
 * An outbox entry at the current shape (DOM-13, DOM-22): the path of its
 * effect, its id, its payload parsed, the instant it may go at the earliest
 * and its resources, as the library gives it to the effect executor from
 * the entry as stored (`StoredEntry`, `Versions`), with no version: a reader
 * sees the current shape only (D101, PER-18).
 */
export interface EntryFields {
  readonly effect: string
  readonly id: entry_id
  readonly payload: unknown
  readonly not_before?: date_time
  /**
   * The resources of the part whose branch queued it (D108, D107, D113.3;
   * SC-53), which the library writes from the fact's envelope: nobody
   * writes them, and a translation leaves them as queued. On them the
   * executor keeps the order of its effect and holds behind a dead letter.
   */
  readonly resources: readonly Resource[]
  /**
   * The correlation of the fact that queued it (DOM-10), which the library
   * writes from the envelope: the executor returns with it, so that the
   * return's fact is of the chain the queuing fact began (A, 16 Nov 2026
   * (5)). A translation leaves it as queued.
   */
  readonly correlation: correlation
}

/**
 * A command ready to execute: the operation it runs under, which the
 * adapter looks up first (the duplicate branch, DOM-11), and its branches,
 * in order. The fact each branch writes carries the operation, the branch's
 * name and the fingerprint (`StoredEnvelope`). SC-11
 */
export interface PlannedCommand<fragment, write> {
  readonly operation: Operation
  readonly branches: readonly PlannedCommandBranch<fragment, write>[]
}

/**
 * The fact an operation had already recorded, as stored, at its position:
 * the duplicate branch (DOM-11). The library compares its fingerprint with
 * the request's: the same, the recorded outcome, its branch by name; another,
 * `identity_already_used`. SC-11
 */
export interface AlreadyRecorded {
  readonly outcome: 'recorded'
  readonly position: position
  readonly fact: StoredEnvelope
}

/**
 * What the adapter's execution tells the library: the operation's fact,
 * already recorded; the index of the applied branch, for a branch over a
 * list the index of the transition's branch each element applied, in the
 * order of the list (none for a plain branch, SC-54), and the position of
 * its fact; or, when none applies, the value of every leaf of every branch,
 * read in the same step or in a second one, as the technology allows: for a
 * branch over a list its own leaves, then those of each element's branches,
 * element by element, branch by branch.
 */
export type Execution =
  | AlreadyRecorded
  | {
      readonly outcome: 'applied'
      readonly branch: number
      readonly elements: readonly number[]
      readonly position: position
    }
  | { readonly outcome: 'rejected'; readonly leaves: readonly (readonly boolean[])[] }

/**
 * The execution of a planned command, in one consistent step of the adapter
 * (DOM-9): the fact the operation recorded, if any, read first; else the
 * first branch that holds writes (over a list, its condition and a branch
 * of the transition on every element, SC-54); nothing writes otherwise. The
 * step is isolated from every other: run at the same time as others, the
 * outcomes are those of some serial order (TST-5). A step the technology
 * aborts for a conflict (a serializable transaction, the unique key of an
 * operation) the adapter runs again, whole: the plan is data, and nothing
 * left the step. SC-11: Marta and Gianni ask for the drill at the same
 * instant, one has it, the other reads `the_tool_is_not_available`; Marta's
 * phone sends her request again while the first is in flight, and the
 * second reads the first's fact, never a second fact for one operation.
 */
export type Execute<fragment, write> = (plan: PlannedCommand<fragment, write>) => Promise<Execution>

/**
 * The choice of a step (D112.2), an ADT: the process not found in the stage
 * the step reads, nothing to write (the library names the read); or the walk
 * over the instances, in the order closed by the identity (D109):
 * - `instances`: the selection's instances after the cursor (every one,
 *   before the first step);
 * - `advances`: for an instance as read (its fields), the branches of the
 *   composed transition, each with the step's part, its cursor at the
 *   instance, before the transition's;
 * - `passing_over`: the instances after one on which no branch of the
 *   transition holds, which the choice passes over: the conditions of the
 *   transition are part of the choice (D112.2, A, 16 Nov 2026 (3));
 * - `completes`: none left, the closing.
 */
export type StepChoice<fragment, write, selection, source, field> =
  | { readonly choice: 'not_found' }
  | {
      readonly choice: 'walk'
      readonly instances: PlannedQuery<selection, source, field>
      readonly advances: (instance: unknown) => readonly PlannedBranch<fragment, write>[]
      readonly passing_over: (instance: unknown) => PlannedQuery<selection, source, field>
      readonly completes: PlannedWrite<write>
    }

/**
 * A step ready to execute (DOM-20), in one transaction of the adapter (one
 * message, A, 16 Nov 2026): the operation it runs under, which the adapter
 * looks up first, as a command's (SC-11); the read of its process (`read`), whose result,
 * as stored or none, the adapter gives to `choose`, pure, the library's: it
 * parses the process with the read's schema, runs the creator and plans the
 * choice.
 */
export interface PlannedStep<fragment, write, read, selection, source, field> {
  readonly operation: Operation
  readonly read: read
  readonly choose: (process: unknown) => StepChoice<fragment, write, selection, source, field>
}

/**
 * What the adapter's execution of a step tells the library: the operation's
 * fact, already recorded (a reaction's redelivery); it advanced, at an
 * instance as read, the index of the transition's branch applied and the
 * position of its fact; it completed, at its position; or the process was
 * not found in the stage the step reads.
 */
export type StepExecution =
  | AlreadyRecorded
  | {
      readonly outcome: 'advanced'
      readonly instance: unknown
      readonly branch: number
      readonly position: position
    }
  | { readonly outcome: 'completed'; readonly position: position }
  | { readonly outcome: 'not_found' }

/**
 * The execution of a planned step, in one consistent step of the adapter,
 * isolated as a command's (`Execute`): the fact the operation recorded, if
 * any, read first; else it reads the process; not found, nothing writes; else, the instances in
 * order, the first on which a branch of the transition holds writes that
 * branch, the instances before it passed over; none left, the closing
 * writes. The oracle filters; SQL reads one instance at a time (`limit 1`),
 * then the next past one passed over, in the same transaction.
 */
export type ExecuteStep<fragment, write, read, selection, source, field> = (
  plan: PlannedStep<fragment, write, read, selection, source, field>,
) => Promise<StepExecution>

/** A failed predicate, where it stands: its branch, its components' names, its path. */
export interface Failure<outcomes extends Outcomes> {
  readonly branch: keyof outcomes & string
  readonly components: readonly string[]
  readonly predicate: PathOf<PredicatesOf<outcomes> | ComposedPredicatesOf<outcomes>>
}

/**
 * A failed predicate of a node of the command's path (D105.4, SC-31): its
 * components' names in the node's condition, its path. No branch: the
 * condition holds for every branch, so it is named once (D105, on who
 * composes); never the node, structure of the code, not the outcome's
 * meaning.
 */
export interface PathFailure<leaves extends Component> {
  readonly components: readonly string[]
  readonly predicate: PathOf<leaves>
}

/** The failures of a path's predicates: none with no node that requires. */
export type PathFailures<leaves extends Component> = [leaves] extends [never]
  ? never
  : PathFailure<leaves>

/**
 * The predicates of the transitions a command's branches compose, which a
 * rejection may name too, under the transition's name then its own
 * components (`the_reservation_is_taken_up`, …). SC-10
 */
type ComposedPredicatesOf<outcomes extends Outcomes> = PredicatesOfEach<TransitionsOf<outcomes>>

/**
 * A part a branch composed, as a leaf reads it (SC-54): the branch of the
 * transition applied, by name, and its fact's payload, an ADT by branch, as
 * a command's outcome.
 */
export type ComposedPart<transition> = {
  [branch in keyof OutcomesOf<transition> & string]: {
    readonly branch: branch
    readonly fact: z.output<OutcomesOf<transition>[branch][1]>
  }
}[keyof OutcomesOf<transition> & string]

/**
 * The parts a branch composed, under the names of its composition (SC-10,
 * SC-54): a transition's part, or, for a transition on a list, one part per
 * element, in the order of the list; nothing for a branch that composes
 * none. Luca's screen reads which lines of his short sheet went in and
 * which were left.
 */
export type ComposedParts<outcome> = outcome extends readonly [
  Condition,
  Component,
  Entries,
  Composition<infer transitions>,
]
  ? {
      readonly [name in keyof transitions]: transitions[name] extends Each<infer transition>
        ? readonly ComposedPart<transition>[]
        : ComposedPart<transitions[name]>
    }
  : Readonly<Record<string, never>>

/**
 * What the outcome of a branch that composes adds (SC-10, SC-54): the parts
 * it composed, by the names of its composition, each with the branch of the
 * transition it applied, which a leaf's projection reads (`ComposedParts`);
 * nothing for a branch that composes none.
 */
type ComposedOutcome<outcome> = outcome extends readonly [
  Condition,
  Component,
  Entries,
  Composition<Transitions>,
]
  ? { readonly composed: ComposedParts<outcome> }
  : unknown

/**
 * The outcome of a command (DOM-7), an ADT: one declared branch applied, with
 * its typed fact in its envelope and its position, and, if it composes, the
 * parts it composed by name; the rejection, naming every failed predicate
 * (DOM-6); from the duplicate branch, the identity of the operation already
 * used with another fingerprint (DOM-11, D79.4); or an input not in the
 * command's schema, built over the context (DOM-21): a static rule, not a
 * rejection. No projection sees the last two: they cross a use case over
 * another as they are, as base events.
 */
export type CommandOutcome<outcomes extends Outcomes, leaves extends Component = never> =
  | {
      [branch in keyof outcomes & string]: {
        readonly outcome: 'applied'
        readonly branch: branch
        readonly position: position
        readonly fact: Envelope<
          readonly [
            Part<outcomes[branch][1]>,
            ...Part<FactsOfEach<TransitionsOfOutcome<outcomes[branch]>>>[],
          ]
        >
      } & ComposedOutcome<outcomes[branch]>
    }[keyof outcomes & string]
  | {
      readonly outcome: 'rejected'
      readonly failures: readonly (Failure<outcomes> | PathFailures<leaves>)[]
    }
  | { readonly outcome: 'identity_already_used' }
  | InvalidInput

/**
 * The input of a command, or of the nodes of its path, not in its schema,
 * which the library builds over the context before parsing (DOM-21): an
 * undeclared field, a value its schema refuses, a static rule over the input
 * and `now` (Gianni books the ladder for a day outside the window, SC-6).
 * Nothing is planned or executed. A leaf gives it as the base event
 * `invalid_request` (`input_not_in_schema`); a reaction or the effect
 * executor, as a dead letter.
 */
export interface InvalidInput {
  readonly outcome: 'invalid_request'
}

/**
 * A step's rejection (DOM-20): the process is not in the stage the step
 * reads, named by the read's path, which the library finds in the registry
 * (a value carries no path of its own in its type).
 */
export interface ReadFailure {
  readonly read: string
}

/**
 * The outcome of a step (DOM-20), an ADT: it advanced, its fact composite,
 * the step's part, then the part of the composed command's applied branch
 * (DOM-10, D111); it completed, the closing part alone; it was rejected, the
 * process not in the stage the step reads; or, from the duplicate branch,
 * the identity of the operation was already used (DOM-11); or its input was
 * not in its schema (DOM-21).
 */
export type StepOutcome<step> = step extends {
  [$Step]: {
    composes: infer composes
    outcomes: {
      advances: infer advances extends Component
      completes: infer completes extends Component
    }
  }
}
  ? | {
        readonly outcome: 'applied'
        readonly branch: 'advances'
        readonly position: position
        readonly fact: Envelope<readonly [Part<advances>, Part<FactsOf<OutcomesOf<composes>>>]>
      }
    | {
        readonly outcome: 'applied'
        readonly branch: 'completes'
        readonly position: position
        readonly fact: Envelope<readonly [Part<completes>]>
      }
    | { readonly outcome: 'rejected'; readonly failures: readonly ReadFailure[] }
    | { readonly outcome: 'identity_already_used' }
    | InvalidInput
  : never

/**
 * The outcome of a command, or of a step when the command is one; below a
 * node, its rejection may name the predicates of the path (`leaves`, SC-31).
 */
export type OutcomeOf<command, leaves extends Component = never> = command extends {
  [$Step]: unknown
}
  ? StepOutcome<command>
  : CommandOutcome<OutcomesOf<command>, leaves>

/**
 * A command and the transitions it composes (D111), for a step its own, for
 * a branch its composition (SC-10): an adapter covers all.
 */
type WithComposed<command> =
  | command
  | (command extends { [$Step]: { composes: infer composes } } ? composes : never)
  | TransitionsOf<OutcomesOf<command>>

/** The predicates of each command of a union, one by one. */
type PredicatesOfEach<command> = command extends unknown ? PredicatesOf<OutcomesOf<command>> : never

/** The facts of each command of a union, one by one. */
type FactsOfEach<command> = command extends unknown ? FactsOf<OutcomesOf<command>> : never

/**
 * Every predicate of a set of commands, and of the transitions their steps
 * compose, command by command: the outcomes of two commands are two
 * records, whose common keys would be none.
 */
type AllPredicates<commands extends Commands> = {
  [name in keyof commands]: PredicatesOfEach<WithComposed<commands[name]>>
}[keyof commands]

/** Every fact of a set of commands, and of the transitions their steps compose, command by command. */
type AllFacts<commands extends Commands> = {
  [name in keyof commands]: FactsOfEach<WithComposed<commands[name]>>
}[keyof commands]

/** The steps among a set of commands, by name (DOM-20). */
type StepsAmong<commands extends Commands> = {
  readonly [
    name in keyof commands as commands[name] extends { [$Step]: unknown } ? name : never
  ]: commands[name]
}

/** The parts of a step for the library: what it reads, composes, and walks. */
type StepParts<step> = step extends { [$Step]: infer parts } ? parts : never

/** The schema of the instances a step walks, as a query's entries. */
type StepFieldsOf<step> =
  StepParts<step> extends { fields: infer fields extends z.ZodObject } ? fields : never

/** Every selection predicate the selections of a set of steps use. */
type StepSelections<steps extends Commands> =
  StepParts<steps[keyof steps]> extends { selection: infer selection extends Condition }
    ? Leaves<selection>
    : never

/**
 * Where a step finds what it reads (DOM-20): its process, by its key from
 * the step's input (`reads`), as stored, which the library parses with the
 * read's schema (none, or in another stage, is the step's rejection); its
 * instances, as a query's candidates (`from`, `fields`).
 */
export interface StepSource<step, read, source, field> extends QuerySource<
  StepFieldsOf<step>,
  source,
  field
> {
  readonly reads: (input: z.output<InputOf<step>>) => read
}

/**
 * What a state adapter gives for the steps among its commands (DOM-20): the
 * operators of the selection of their instances, with the comparison with
 * the cursor; where each finds its process and its instances, under the
 * step's name; the execution. Its fragments of reads are of three types, as
 * a read adapter's (`ReadAdapter`), and one more, the read of a process.
 */
export interface StepAdapter<
  steps extends Commands,
  fragment,
  write,
  read,
  selection,
  source,
  field,
> {
  readonly selection: CursorAlgebra<StepSelections<steps>, selection, field>
  readonly sources: {
    readonly [name in keyof steps]: StepSource<steps[name], read, source, field>
  }
  readonly execute: ExecuteStep<fragment, write, read, selection, source, field>
}

/**
 * What a state adapter gives for a set of commands, of one or more domains:
 * the predicates and the facts of the commands and of the transitions their
 * steps compose; and, if there are steps among them, what they read.
 */
export type StateAdapter<
  commands extends Commands,
  fragment,
  write,
  read = never,
  selection = never,
  source = never,
  field = never,
> = {
  readonly algebra: Algebra<AllPredicates<commands>, fragment>
  readonly write: FactWrites<AllFacts<commands>, write>
  readonly execute: Execute<fragment, write>
} & ([keyof StepsAmong<commands>] extends [never]
  ? unknown
  : {
      readonly steps: StepAdapter<
        StepsAmong<commands>,
        fragment,
        write,
        read,
        selection,
        source,
        field
      >
    })
