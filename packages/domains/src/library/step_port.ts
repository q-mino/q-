import * as z from 'zod'
import { cursor, type position } from './format.ts'
import type { CommandRootContext } from './context.ts'
import type { Envelope, PartFields, StoredEnvelope, StoredPart } from './envelope.ts'
import { $Command, type Commands } from './command.ts'
import { $Step } from './step.ts'
import { closed_order, type Direction } from './query.ts'
import type { OrderKeyValue } from './algebra.ts'
import type {
  PlannedBranch,
  PlannedStep,
  ReadFailure,
  StepChoice,
  StepExecution,
} from './state_adapter.ts'
import type { PlannedQuery } from './read_adapter.ts'
import { cursor_of, key_of, type OrderKey } from './stable.ts'
import { bind, fold, leaves_of, type Bound, type BoundLeaf } from './bound_condition.ts'
import { is_a_schema } from './kind.ts'
import { called, is_a_record } from './runtime.ts'
import { read_fields, written, type PartWrite, type PlannedPart } from './plan.ts'

// The port of a step of a process with a cursor (DOM-20, D97, D111, D112),
// which the command ports build beside the commands' (part 7.4): per
// invocation, the input parsed by its schema, built over the context
// (DOM-21); the plan, one message (A, 16 Nov 2026): the read of the process
// by its key from the input, as the adapter's source gives it, and the
// choice, a pure function of the library over what was read (`choose`): the
// process parsed by the read's schema, in the stage that steps, or not found;
// the creator run over it; the instances after its cursor, by the selection
// the creator binds and the order closed by the identity (D109); for an
// instance, the branches of the composed transition, each with the step's
// part, its cursor written by the library at the instance (the order key,
// `cursor_of`); the instances past one passed over; the closing. Then the
// outcome (DOM-7): advanced, its fact the step's part and the transition's;
// completed; the process not found, a rejection naming the read; from the
// duplicate branch, the fact recorded or the identity already used (DOM-11).

/** The operators of the selection a step walks, as the port meets them at runtime (`CursorAlgebra`). */
interface RuntimeSelection<selection, field> {
  readonly predicate: Readonly<Record<string, (parameters: unknown) => selection>>
  readonly and: (components: readonly selection[]) => selection
  readonly or: (components: readonly selection[]) => selection
  readonly not: (operand: selection) => selection
  readonly after: (key: readonly OrderKeyValue<field>[]) => selection
}

/** Where a step finds its process and its instances, at runtime (`StepSource`). */
interface RuntimeStepSource<read, source, field> {
  readonly reads: (input: unknown) => read
  readonly from: source
  readonly fields: Readonly<Record<string, field>>
}

/** What a state adapter gives for its steps, as the port meets it at runtime (`StepAdapter`). */
export interface RuntimeSteps<fragment, write, read, selection, source, field> {
  readonly selection: RuntimeSelection<selection, field>
  readonly sources: Readonly<Record<string, RuntimeStepSource<read, source, field>>>
  readonly execute: (
    plan: PlannedStep<fragment, write, read, selection, source, field>,
  ) => Promise<StepExecution>
}

/** An outcome of a step as its port gives it at runtime (`StepOutcome`): every value parsed by its schema. */
export type RuntimeStepOutcome =
  | {
      readonly outcome: 'applied'
      readonly branch: 'advances' | 'completes'
      readonly position: position
      readonly fact: Envelope<readonly PartFields[]>
    }
  | { readonly outcome: 'rejected'; readonly failures: readonly ReadFailure[] }
  | { readonly outcome: 'identity_already_used' }
  | { readonly outcome: 'invalid_request' }

/** A step use case's port at runtime: one message in, its outcome out (DOM-3). */
export type RuntimeStepPort = (
  context: CommandRootContext,
  input: unknown,
) => AsyncIterable<RuntimeStepOutcome>

/**
 * What the command ports lend a step's port (part 7.4): a component's
 * path; a fact's part planned with no condition; a transition planned on
 * the input its creator gives it, over the context of the step's point, its
 * branches each a part, none when the input is not in its schema; the
 * command algebra's folding of a condition, and its fragment of a leaf; a
 * stored part read at the current shape (DOM-22).
 */
export interface StepKit<fragment, write> {
  readonly path_of: (component: unknown) => string | undefined
  readonly fact_part: (fact: z.ZodObject, resolved: unknown) => Omit<PartWrite<write>, 'entries'>
  readonly transition: (
    context: Readonly<Record<string, unknown>>,
    above: readonly string[],
  ) => (
    name: string,
    transition: unknown,
    input: unknown,
  ) => readonly PlannedPart<write>[] | undefined
  readonly folded: (bound: Bound) => fragment
  readonly fragment_of: (leaf: BoundLeaf) => fragment
  readonly read_part: (stored: StoredPart) => PartFields
}

/** A step's parts at runtime, as its builder gives them (part 3.2), with where it keeps its cursor. */
export interface RuntimeStep {
  readonly creator: unknown
  readonly input: unknown
  readonly reads: z.ZodType
  /** The read's path, which a rejection names (DOM-20). */
  readonly read: string
  /** Where the process keeps its cursor, field by field from the top (DOM-20, D112.1). */
  readonly kept_at: readonly string[]
  readonly fields: z.ZodObject
  readonly identity: string
  readonly selection: z.ZodType
  readonly order: readonly (readonly [string, Direction])[]
  readonly composes: unknown
  readonly advances: z.ZodObject
  /** The field of the step's part that keeps the cursor, which the library writes (DOM-20). */
  readonly cursor: string
  readonly completes: z.ZodObject
}

/**
 * Where a schema keeps a cursor (DOM-20, D112.1): the paths of the fields
 * whose schema is the library's cursor, at any depth of its objects, an
 * optional, nullable, default or read-only one by its inner schema; none in
 * another schema. A process may keep it in its stage (`progress.cursor`), a
 * step's part at its top.
 */
export const cursors_in = (
  schema: unknown,
  at: readonly string[] = [],
): readonly (readonly string[])[] => {
  if (schema === cursor) return [at]
  if (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodDefault ||
    schema instanceof z.ZodReadonly
  ) {
    return cursors_in(schema.unwrap(), at)
  }
  if (schema instanceof z.ZodObject) {
    const shape: z.core.$ZodShape = schema.shape
    return Object.entries(shape).flatMap(([name, field]) => cursors_in(field, [...at, name]))
  }
  return []
}

/** The value at a path of fields in a parsed value; none where a field is absent. */
const value_at = (value: unknown, path: readonly string[]): unknown =>
  path.reduce<unknown>((at, field) => (is_a_record(at) ? at[field] : undefined), value)

/**
 * A step's parts, read from its builder's value (part 3.2), with the faults
 * of its declaration the library meets at wiring (CFG-2), each a line: its
 * read not in the registry given (a rejection names it by its path), or
 * keeping no cursor, or two (the generator checks it, DOM-20); its part
 * keeping its cursor in no field of its own at its top, or in two; the
 * transition it composes not a command of the registry given, a step, or a
 * command that composes in turn (DOM-19). None for a command that is no
 * step.
 */
export const step_parts =
  (path_of: (component: unknown) => string | undefined) =>
  (path: string, command: Commands[string]): RuntimeStep | readonly string[] | undefined => {
    if (!($Step in command)) return undefined
    const parts: unknown = command[$Step]
    if (!is_a_record(parts)) throw new Error(`${path}: a step with no parts (DOM-20)`)
    const { reads, composes, outcomes, fields, identity, selection, order } = parts
    const advances = is_a_record(outcomes) ? outcomes['advances'] : undefined
    const completes = is_a_record(outcomes) ? outcomes['completes'] : undefined
    if (
      !is_a_schema(reads) ||
      !(fields instanceof z.ZodObject) ||
      typeof identity !== 'string' ||
      !is_a_schema(selection) ||
      !is_a_record(order) ||
      !(advances instanceof z.ZodObject) ||
      !(completes instanceof z.ZodObject) ||
      typeof composes !== 'function'
    ) {
      throw new Error(`${path}: a step whose parts its builder did not give (DOM-20)`)
    }
    const read = path_of(reads)
    const kept = cursors_in(reads)
    const own = cursors_in(advances).filter((at) => at.length === 1)
    const transition = path_of(composes)
    const branches = outcomes_of(composes)
    const faults = [
      ...(read === undefined
        ? [
            `${path}: its read is not in the registry given, so a rejection could not name it (DOM-20)`,
          ]
        : []),
      ...(kept.length === 1
        ? []
        : [
            `${path}: its read ${read ?? ''} keeps ${kept.length === 0 ? 'no cursor' : 'two cursors'}: a process keeps one, the library's (DOM-20)`,
          ]),
      ...(own.length === 1
        ? []
        : [
            `${path}: its part keeps the cursor in ${own.length === 0 ? 'no field' : 'two fields'} of its own (DOM-20)`,
          ]),
      ...(transition === undefined || $Step in composes || branches === undefined
        ? [`${path}: it composes no command of the registry given (DOM-19)`]
        : []),
      ...(branches?.some((branch) => branch[3] !== undefined) === true
        ? [
            `${transition ?? path}: it composes in turn: a composed transition composes nothing (DOM-19)`,
          ]
        : []),
    ]
    const kept_at = kept[0]
    const field = own[0]?.[0]
    if (faults.length > 0 || read === undefined || kept_at === undefined || field === undefined) {
      return faults
    }
    const written_order: Readonly<Record<string, Direction | undefined>> = Object.fromEntries(
      Object.entries(order).flatMap(([name, direction]) =>
        direction === 'ascending' || direction === 'descending' ? [[name, direction]] : [],
      ),
    )
    return {
      creator: command,
      input: 'input' in command ? command.input : undefined,
      reads,
      read,
      kept_at,
      fields,
      identity,
      selection,
      order: closed_order(written_order, identity),
      composes,
      advances,
      cursor: field,
      completes,
    }
  }

/**
 * The branches of a command, read at runtime (`$Command`): each a list of
 * its parts, the condition, the fact, the entries, the composition; none
 * for a value that declares no branches.
 */
const outcomes_of = (command: unknown): readonly (readonly unknown[])[] | undefined => {
  if ((typeof command !== 'function' && typeof command !== 'object') || command === null) {
    return undefined
  }
  const declared: unknown = $Command in command ? command[$Command] : undefined
  const outcomes = is_a_record(declared) ? declared['outcomes'] : undefined
  if (!is_a_record(outcomes)) return undefined
  const branches = Object.values(outcomes)
  return branches.every((branch) => Array.isArray(branch))
    ? branches.map((branch: readonly unknown[]) => branch)
    : undefined
}

/** The facts a step records, its own and its transition's (DOM-19): what its duplicate branch reads back (CFG-2). */
export const facts_of_a_step = (step: RuntimeStep): readonly unknown[] => [
  step.advances,
  step.completes,
  ...(outcomes_of(step.composes) ?? []).map((branch) => branch[1]),
]

/** The walk a step's choice plans (`StepChoice`), kept for its outcome. */
type Walk<fragment, write, selection, source, field> = Omit<
  Extract<StepChoice<fragment, write, selection, source, field>, { readonly choice: 'walk' }>,
  'choice'
>

/**
 * The port of a step (DOM-20) over the adapter's steps, with what the
 * command ports lend it; the adapter's source of the step checked at
 * wiring (CFG-2): it gives where the process and the instances are, and
 * reads every field of the order.
 */
export const step_port =
  <fragment, write, read, selection, source, field>(
    kit: StepKit<fragment, write>,
    steps: RuntimeSteps<fragment, write, read, selection, source, field>,
  ) =>
  (
    name: string,
    path: string,
    step: RuntimeStep,
    above: readonly string[],
  ): RuntimeStepPort | string => {
    const source = steps.sources[name]
    if (source === undefined) return `${path}: the adapter gives no source of ${name} (ADP-8)`
    const unread = step.order.flatMap(([field]) => (field in source.fields ? [] : [field]))
    if (unread.length > 0) {
      return `${path}: the adapter reads no field ${unread.join(', ')} of its order (ADP-8)`
    }
    const identity = kit.path_of(step.fields.shape[step.identity])
    if (identity === undefined) {
      return `${path}: its identity ${step.identity} is an identity that no registry given names (DOM-24)`
    }
    const binding = bind(kit.path_of)
    const fragment_of = (leaf: BoundLeaf): selection => {
      const fragment = steps.selection.predicate[leaf.path]
      if (fragment === undefined)
        throw new Error(`the adapter gives no fragment of ${leaf.path} (ADP-8)`)
      return fragment(leaf.parameters)
    }
    const folded = fold<selection>({
      leaf: fragment_of,
      and: steps.selection.and,
      or: steps.selection.or,
      not: steps.selection.not,
    })
    const ordered = step.order.map(([field, direction]): readonly [field, Direction] => {
      const fragment = source.fields[field]
      if (fragment === undefined) {
        throw new Error(`${path}: the adapter reads no field ${field} of its order (ADP-8)`)
      }
      return [fragment, direction]
    })
    /** The instances after an order key's values, by the selection bound; every one with none (D109). */
    const instances_after = (
      bound: selection,
      values: readonly unknown[] | undefined,
    ): PlannedQuery<selection, source, field> => ({
      from: source.from,
      fields: source.fields,
      identity: { field: step.identity, path: identity },
      selection:
        values === undefined
          ? bound
          : steps.selection.and([
              bound,
              steps.selection.after(
                ordered.map(([field, direction], i) => ({ field, direction, value: values[i] })),
              ),
            ]),
      order: ordered,
    })
    /** The order key of an instance as the adapter gave it: each field of the order, its value (LIB-9). */
    const key_of_instance = (instance: unknown): OrderKey =>
      step.order.map(([field]) => {
        const value = is_a_record(instance) ? instance[field] : undefined
        return value === undefined ? [field] : [field, value]
      })
    /**
     * The values of the order key the process's cursor encodes, as the
     * library wrote it; one that encodes another order's key (its fields by
     * name, in order) is a fault, thrown: the step's order changed while a
     * process was under way, which the library cannot walk on.
     */
    const decoded = (text: unknown): readonly unknown[] => {
      const key = typeof text === 'string' ? key_of(text) : undefined
      if (
        key?.length !== step.order.length ||
        key.some((pair, i) => pair[0] !== step.order[i]?.[0])
      ) {
        throw new Error(
          `${path}: the cursor its process keeps is not of its order (DOM-20): a step's order changed while a process was under way`,
        )
      }
      return key.map((pair) => (pair.length === 2 ? pair[1] : undefined))
    }

    return async function* (context, input) {
      const seen: Readonly<Record<string, unknown>> = Object.fromEntries(
        Object.entries(context).filter(([key]) => key !== 'correlation' && key !== 'fingerprint'),
      )
      const schema = is_a_schema(step.input) ? step.input : called(step.input, seen)
      if (!is_a_schema(schema)) throw new Error(`${path}: a step's input is not a schema (DOM-21)`)
      const parsed = schema.safeParse(input)
      if (!parsed.success) {
        yield { outcome: 'invalid_request' }
        return
      }
      const resolving = called(called(step.creator, seen), parsed.data)
      const transitioned = kit.transition(seen, above)
      /**
       * The choice over the process as read (D112.2), pure: not found in
       * the stage the step reads; else the walk, from its cursor.
       */
      const choose = (
        process: unknown,
      ): Walk<fragment, write, selection, source, field> | undefined => {
        const read = step.reads.safeParse(process)
        if (!read.success) return undefined
        const resolved = called(resolving, read.data)
        if (!is_a_record(resolved)) throw new Error(`${path}: the creator resolves no step`)
        const composes = resolved['composes']
        const advancing = resolved['advances']
        if (typeof composes !== 'function' || !is_a_record(advancing)) {
          throw new Error(`${path}: the creator resolves no composition or no part (DOM-20)`)
        }
        const bound = folded(binding(step.selection, resolved['selection']))
        const kept = value_at(read.data, step.kept_at)
        const values = kept === undefined ? undefined : decoded(kept)
        const advances = (instance: unknown): readonly PlannedBranch<fragment, write>[] => {
          const walked = step.fields.safeParse(instance)
          if (!walked.success) {
            throw new Error(
              `${path}: the adapter gives an instance its fields do not parse (ADP-8): ${walked.error.message}`,
            )
          }
          const own = {
            ...kit.fact_part(step.advances, {
              ...advancing,
              [step.cursor]: cursor_of(key_of_instance(instance)),
            }),
            entries: [],
          }
          const parts = transitioned('composes', step.composes, called(composes, walked.data))
          if (parts === undefined) {
            throw new Error(
              `${path}: the input it gives its transition for ${JSON.stringify(walked.data[step.identity])} is not in the transition's schema (DOM-20, DOM-21): with its case`,
            )
          }
          return parts.map((part) => ({
            condition: kit.folded(part.bound),
            leaves: leaves_of(part.bound).map(kit.fragment_of),
            ...written(
              context,
              'advances',
            )({
              parts: [own, part],
              composed: { composes: part.name },
            }),
          }))
        }
        return {
          instances: instances_after(bound, values),
          advances,
          passing_over: (instance) =>
            instances_after(
              bound,
              key_of_instance(instance).map((pair) => (pair.length === 2 ? pair[1] : undefined)),
            ),
          completes: written(
            context,
            'completes',
          )({
            parts: [{ ...kit.fact_part(step.completes, resolved['completes']), entries: [] }],
            composed: {},
          }),
        }
      }
      // The walk the adapter's last choice planned, for the outcome: the
      // adapter may choose again, whole, after a conflict (DOM-9).
      const chosen: { walk?: Walk<fragment, write, selection, source, field> } = {}
      const execution = await steps.execute({
        operation: context.operation,
        read: source.reads(parsed.data),
        choose: (process) => {
          const walk = choose(process)
          if (walk === undefined) {
            delete chosen.walk
            return { choice: 'not_found' }
          }
          chosen.walk = walk
          return { choice: 'walk', ...walk }
        },
      })
      /** An applied outcome (DOM-7): its branch, its position, its fact as a reader sees it. */
      const applied = (
        branch: 'advances' | 'completes',
        at: position,
        fact: StoredEnvelope,
        read_part: (part: StoredPart) => PartFields,
      ): RuntimeStepOutcome => ({
        outcome: 'applied',
        branch,
        position: at,
        fact: {
          parts: fact.parts.map(read_part),
          operation: fact.operation,
          correlation: fact.correlation,
        },
      })
      switch (execution.outcome) {
        case 'recorded': {
          const branch = execution.fact.branch
          if (execution.fact.fingerprint !== context.fingerprint) {
            yield { outcome: 'identity_already_used' }
          } else if (branch === 'advances' || branch === 'completes') {
            yield applied(branch, execution.position, execution.fact, kit.read_part)
          } else {
            throw new Error(`${path}: its operation recorded a fact of no step's branch (DOM-11)`)
          }
          return
        }
        case 'advanced': {
          const branch = chosen.walk?.advances(execution.instance)[execution.branch]
          if (branch === undefined)
            throw new Error(`${path}: the adapter advanced on no branch it was given`)
          yield applied('advances', execution.position, branch.fact, read_fields)
          return
        }
        case 'completed': {
          const walk = chosen.walk
          if (walk === undefined)
            throw new Error(`${path}: the adapter completed a process it did not find`)
          yield applied('completes', execution.position, walk.completes.fact, read_fields)
          return
        }
        case 'not_found':
          yield { outcome: 'rejected', failures: [{ read: step.read }] }
          return
      }
    }
  }
