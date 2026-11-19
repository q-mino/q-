import * as z from 'zod'
import { position, semver, type Semver } from './format.ts'
import { correlation, operation_id, type Operation } from './context.ts'
import type { Majors, Registry, Versions } from './registry.ts'
import type { FactLog, LogEvent } from './stream.ts'
import type { Elapsed, Invoked, TreeLeaves, TreePorts } from './tree.ts'
import { $Versions } from './registry.ts'
import type { NotKnown, Trace, TraceReason, Traced, TracedFailure, TracedIssue } from './trace.ts'
import { $Node, type EntryOf } from './node.ts'
import { $Delegated, $Earlier, $Version } from './version.ts'
import { $UseCase } from './use_case.ts'
import { is_a_schema } from './kind.ts'
import { fingerprint_of, is_a_json_value } from './stable.ts'
import { and as kleene_and } from './actions.ts'
import {
  called,
  called_with,
  folder_of,
  is_a_record,
  is_at_or_above,
  paths_in,
  recorded_lookup_of,
  served_by,
  type ReadServed,
} from './runtime.ts'

// The ports of a tree (PER-5, PER-6, DOM-11, D106), which the library builds
// over the ports the tree invokes (part 6.1): for each leaf, a request enters
// from the node at the top, which takes what the entry gives; the library
// checks the input of the leaf against its schema, walks the nodes of its
// path down, each in its order (its lookups, its perimeters, its limits, what
// it gives), runs the leaf's own limits, then its creator, and invokes the
// use case below with the root's context, copied, and, for a command, the
// operation, its fingerprint, computed here over the leaf's path and the
// input as sent (D100), and the correlation from the origin (DOM-10); the
// outcome, or each page, comes back projected into the leaf's own words.
// Since part 6.2 a request answered with no fact leaves an entry in the
// tree's trace, with why (F6, PER-14), and a leaf may name its operation in
// its input (SC-34).

/** A record of the context, as the ports meet it at runtime. */
type Context = Readonly<Record<string, unknown>>

/** An event of a leaf at runtime: its name and its fields, parsed by the leaf's schemas. */
type RuntimeLeafEvent = { readonly event: string } & Context

/** What the ports of a tree are built from, at runtime. */
interface RuntimeTreePorts {
  readonly registry: Registry
  readonly versions: Versions
  readonly majors: Majors
  readonly top: unknown
  readonly use_cases: Readonly<Record<string, unknown>>
}

/** What the ports of a tree invoke, at runtime: the ports by folder, the fact log, the trace, the time that passes. */
interface RuntimeWired {
  readonly invoked: Readonly<Record<string, Readonly<Record<string, unknown>>>>
  readonly log: FactLog
  readonly trace: unknown
  readonly elapsed?: Elapsed
}

/** A lookup a node runs, with the port that answers it. */
interface NodeLookupAt {
  readonly name: string
  readonly port: unknown
  readonly of: unknown
}

/** A node met on a path, its parts as declared (PER-6), its lookups with their ports. */
interface TreeNode {
  readonly path: string
  readonly takes: z.ZodObject | undefined
  readonly looks_up: readonly NodeLookupAt[]
  readonly is_found_only_if: readonly (readonly [string, unknown])[]
  readonly is_refused_unless: readonly (readonly [string, unknown])[]
  readonly gives: unknown
}

/**
 * The window of a tree (PER-17, A, 17 Nov 2026): its majors, the folders
 * the generator lists (`_majors.ts`), and the version it speaks, its current
 * major's `version.ts`'s, which the gate tells with the oldest major.
 */
interface Window {
  readonly current: Semver
  readonly major: number
  readonly minor: number
  readonly oldest: number
  readonly majors: ReadonlySet<number>
}

/**
 * A leaf of a past major, one step over the next major's leaf (`earlier`,
 * PER-17): its input and the step forward, its events (a command leaf's, or
 * its stream's own, a read leaf's) or its entry and the steps back, each
 * over the context of the leaf's point first (A, 17 Nov 2026, SC-12). A
 * delegated leaf is no step: it is the next major's.
 */
interface PastStep {
  readonly major: number
  readonly input: unknown
  readonly declared: Context
  readonly events: Readonly<Record<string, z.ZodType>>
  readonly entry?: z.ZodObject
}

/**
 * A leaf as the ports meet it at runtime: its declaration, the port it
 * invokes, the nodes of its path; the tree's window, and, by each major of
 * the window that has a leaf at its path, the steps from that major's leaf
 * up to it, none for the current major (PER-17).
 */
interface TreeLeaf {
  readonly name: string
  readonly path: string
  readonly input: unknown
  readonly declared: Context
  readonly port: unknown
  readonly nodes: readonly TreeNode[]
  readonly window: Window
  readonly pasts: ReadonlyMap<number, readonly PastStep[]>
}

/**
 * What a command leaf follows, at runtime (DOM-3, D58.2): the events that
 * end its flow; the projection of each fact it follows, by its path, which
 * the store's versions give (DOM-24); how long it waits at most, and the
 * port that measures it; the fact log it reads, by correlation; the
 * versions that read what the log stored (DOM-22).
 */
interface LeafFollowing {
  readonly ends: ReadonlySet<string>
  readonly projections: ReadonlyMap<string, unknown>
  readonly at_most: number
  readonly elapsed: Elapsed
  readonly log: FactLog
  readonly versions: Versions
}

/** A command leaf: its events, by name, with their schemas; what it follows, if it does. */
interface CommandLeaf extends TreeLeaf {
  readonly events: Readonly<Record<string, z.ZodType>>
  readonly following?: LeafFollowing
}

/**
 * How a read leaf streams, at runtime (PER-18): the events of its own, by
 * name, with their schemas, and the projection of the facts it names; what
 * the port below serves, its entries' identity and the facts it names.
 */
interface LeafStreaming {
  readonly events: Readonly<Record<string, z.ZodType>>
  readonly facts: Context
  readonly served: ReadServed
}

/** An action of a read leaf (SC-33): a command leaf of its folder, by its name, and the use case it invokes. */
interface LeafAction {
  readonly name: string
  readonly use_case: unknown
  readonly declared: Context
}

/** A read leaf: the schema of its own entry; how it streams, if it does; its actions, if it lists some. */
interface ReadLeaf extends TreeLeaf {
  readonly entry: z.ZodObject
  readonly streaming?: LeafStreaming
  readonly actions: readonly LeafAction[]
}

/**
 * Where a walk down the nodes ends: the context of the leaf's point, or an
 * event that closes the request, with why, for the trace (F6, PER-14).
 */
type Walked =
  | { readonly closed: false; readonly context: Context }
  | { readonly closed: true; readonly event: RuntimeLeafEvent; readonly why: TraceReason }

/** What the entry gives a command's operation (DOM-11): its id and its scope, which the entry composes. */
const operation_given = z.strictObject({ id: operation_id, scope: z.string() })

/** What the entry gives a leaf whose input names its operation (SC-34): the scope alone. */
const operation_scope_given = z.strictObject({ scope: z.string() })

/** The base event of a request whose input is not in its leaf's schema (PER-5.3, D106.3). */
const input_not_in_schema: RuntimeLeafEvent = {
  event: 'invalid_request',
  reason: 'input_not_in_schema',
}

/** A node's perimeter that fails, or a lookup not known (PER-14, D87.5): no reason. */
const not_found: RuntimeLeafEvent = { event: 'not_found' }

/** The fields and rules a schema refused in an input (D106.3), for the trace. */
const issues_of = (error: z.ZodError): readonly TracedIssue[] =>
  error.issues.map((issue) => ({
    field: issue.path.map((key) => (typeof key === 'number' ? key : String(key))),
    rule: issue.code,
    message: issue.message,
  }))

/**
 * The ports of the leaves of a tree (PER-6): the registry where the library
 * finds the nodes and the leaves by path, the versions of the store it reads
 * (`Follows`), the majors of the persona (`persona/member/_majors.ts`,
 * generated from its folders, A, 17 Nov 2026), where it finds the leaf of a
 * past major at the message's version, the node at the top, which takes
 * what the entry gives, and the current leaves, command and read, one port
 * per name (`LeafPort`). Curried as `command_use_case_ports`: then the ports
 * the tree invokes, by the path of their folder, as the library built them
 * (each knows the use case or the lookup it serves, so that the library
 * finds it by the component a leaf or a node names), the fact log a leaf
 * that follows reads, by correlation (`Follows`), and the tree's trace,
 * where every request answered with no fact leaves an entry with why, for
 * the user of the node (`Trace`, F6, PER-14).
 *
 * At wiring (CFG-2) it stops, naming every fault in one message: a leaf, or
 * the top, not in the registry; a leaf given under another name than its
 * path's, or not below the top; a node below the top that takes from the
 * entry, or one that binds or requires, which its business's command port
 * runs (D105); a port given that the library did not build, or in another
 * folder than its own; a use case a leaf invokes, or a lookup a node runs,
 * that no port given serves; a read leaf that streams over a port that
 * does not, or lists actions over a port with no `with_actions` (D110,
 * SC-33); a leaf that follows a fact of no domain whose versions were given,
 * or with no port to measure its wait (`elapsed`); majors that do not hold
 * one current registry declaring its version under its major; a leaf given
 * that is not the current major's at its path (a leaf of `1/` in place of
 * the current one, which the types let through), or a past major's leaf at
 * its path that does not lead to it (PER-17, part 6.4).
 *
 * Per request, in the order of PER-5: the gate (`version_not_supported`,
 * with the version the tree speaks and its oldest major), for a major the
 * window has not or the current major at a higher minor, the patch not
 * counted; the version's major picks the leaf, a path it has not
 * `not_a_leaf`; for a command leaf, its operation looked up in its scope,
 * the fingerprint over the input as sent (PER-5, "A retry after the input's
 * window over `now` moved"): recorded with the same fingerprint, the fact
 * recorded, projected (at a past major after the nodes, whose point's
 * context the steps back read), with another `identity_already_used`, none
 * on; the input in the schema of that major's leaf, built over
 * the context the entry gives (`invalid_request`, `input_not_in_schema`),
 * before any node, so that a caller learns nothing the public contract does
 * not tell (PER-7); the
 * nodes, outer first, each in its order: the top's `takes` parsed from the
 * entry (one it does not parse is the entry's fault, thrown), its lookups,
 * a key or a value not known closing with `not_found`, its perimeters
 * (`not_found`, no reason), its limits, all evaluated (`refused`, every
 * failed one named), what it gives; the leaf's limits, likewise; the
 * creator, over the context of the leaf's point (and, for a command, its
 * operation); the use case below, given the root's context alone, copied
 * (D105.1). A leaf whose input names its operation (SC-34) is given its
 * scope alone by the entry, and the library reads the id from its input
 * after the schema. At a past major (PER-17) the input goes forward after
 * the nodes, step by step (`to_next`, over the point's context), each next
 * major's schema checking it (`invalid_request`); the current leaf's limits,
 * creator and projection answer, and each event of its own, an entry, an
 * event of its stream's own, comes back step by step (`from_next`); the
 * nodes' closings and the base events cross as they are.
 */
export function tree_ports<
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
  readonly trace: Trace<EntryOf<top>>
  readonly elapsed?: Elapsed
}) => TreePorts<top, majors, use_cases>

// The body, typed by what it meets at runtime (DOM-25, "The ports, typed by
// their declaration"): the sixth place.
export function tree_ports(ports: RuntimeTreePorts): unknown {
  return runtime_tree_ports(ports)
}

/** The parts a node declares, as a record. */
const declared_of = (component: unknown, symbol: typeof $Node | typeof $UseCase): Context => {
  if (typeof component !== 'object' || component === null || !(symbol in component)) return {}
  const parts: unknown = Reflect.get(component, symbol)
  if (!is_a_record(parts)) return {}
  const declared = parts['declared']
  return is_a_record(declared) ? { ...declared } : {}
}

/** The entries of a record of conditions (perimeters, limits), by name; none with none. */
const conditions_of = (conditions: unknown): readonly (readonly [string, unknown])[] =>
  is_a_record(conditions) ? Object.entries(conditions) : []

/** Whether a condition of a node or a leaf holds: over the context, then what was found or the input. */
const holds = (condition: unknown, context: Context, over: unknown): boolean =>
  called(called(condition, context), over) === true

/** The schema of an input as declared, a schema or a function of the context (DOM-21), built over it. */
const schema_of = (input: unknown, context: Context): z.ZodType => {
  const schema = typeof input === 'function' ? called(input, context) : input
  if (!is_a_schema(schema)) throw new Error('an input is no schema (DOM-21)')
  return schema
}

/** What the entry gives a request, split: the context, the operation, the correlation, the version. */
const entry_of = (
  context: unknown,
): {
  readonly given: Context
  readonly operation: unknown
  readonly correlation: unknown
  readonly version: unknown
} => {
  if (!is_a_record(context)) throw new Error('the entry gives no context (PER-6)')
  const library = new Set(['operation', 'correlation', 'version'])
  return {
    given: Object.fromEntries(Object.entries(context).filter(([key]) => !library.has(key))),
    operation: context['operation'],
    correlation: context['correlation'],
    version: context['version'],
  }
}

/** The root's context, copied, which a leaf gives the use case it invokes (PER-6, D105.1). */
const root_of = (context: Context): Context => ({
  now: context['now'],
  time_zone: context['time_zone'],
})

/** Whether a value is a stream of events, as a port gives them. */
const is_a_stream = (value: unknown): value is AsyncIterable<unknown> =>
  typeof value === 'object' && value !== null && Symbol.asyncIterator in value

/** A port invoked with its arguments: its stream of events. */
const invoked_with = (port: unknown, args: readonly unknown[]): AsyncIterable<unknown> => {
  const events = called_with(port, args)
  if (!is_a_stream(events)) throw new Error('a port gives no stream of events (DOM-3)')
  return events
}

/**
 * What a node takes from the entry, at the top of a tree (PER-4, PER-6):
 * the fields its schema names, parsed by it; one it does not parse is a
 * fault of the entry, which verified it, thrown.
 */
const taken = (node: TreeNode, given: Context): Context => {
  if (node.takes === undefined) return given
  const shape = node.takes.shape
  const parsed = node.takes.safeParse(
    Object.fromEntries(
      Object.keys(shape).flatMap((key) => (key in given ? [[key, given[key]]] : [])),
    ),
  )
  if (!parsed.success) {
    throw new Error(`${node.path}: the entry gives what the top does not take (PER-4, PER-6)`)
  }
  return { ...given, ...parsed.data }
}

/** An answer of a lookup (D30): its value if known, nothing if not. */
const known = (answer: unknown): { readonly value: unknown } | undefined =>
  is_a_record(answer) && answer['answer'] === 'known' ? { value: answer['value'] } : undefined

/** A lookup answered: what it found, by name, or what was not known. */
type Answered = { readonly name: string; readonly value: unknown } | NotKnown

/**
 * The lookups of a node (PER-9), each `of` a key from the context, which may
 * be not known: what each found, by name, and every lookup whose key or
 * value was not known, which closes the request with `not_found`, a
 * perimeter (D87.5), the trace naming each.
 */
const looked_up = async (
  lookups: readonly NodeLookupAt[],
  context: Context,
): Promise<{ readonly found: Context; readonly not_known: readonly NotKnown[] }> => {
  const answers = await Promise.all(
    lookups.map(async (lookup): Promise<Answered> => {
      const key = known(called(lookup.of, context))
      if (key === undefined) return { lookup: lookup.name, not_known: 'key' }
      const value = known(await called(lookup.port, key.value))
      return value === undefined
        ? { lookup: lookup.name, not_known: 'value' }
        : { name: lookup.name, value: value.value }
    }),
  )
  return {
    found: Object.fromEntries(
      answers.flatMap((answer) => ('name' in answer ? [[answer.name, answer.value]] : [])),
    ),
    not_known: answers.flatMap((answer) => ('not_known' in answer ? [answer] : [])),
  }
}

/** One node run in its order (PER-5, PER-6): it takes, looks up, is found only if, is refused unless, gives. */
const run = async (node: TreeNode, given: Context): Promise<Walked> => {
  const context = taken(node, given)
  const { found, not_known } = await looked_up(node.looks_up, context)
  if (not_known.length > 0) {
    return {
      closed: true,
      event: not_found,
      why: { closed_by: 'a_lookup', node: node.path, lookups: not_known },
    }
  }
  const outside = node.is_found_only_if.find(([, condition]) => !holds(condition, context, found))
  if (outside !== undefined) {
    return {
      closed: true,
      event: not_found,
      why: { closed_by: 'a_perimeter', node: node.path, perimeter: outside[0] },
    }
  }
  const refused = node.is_refused_unless.flatMap(([name, condition]) =>
    holds(condition, context, found) ? [] : [name],
  )
  if (refused.length > 0) {
    return {
      closed: true,
      event: { event: 'refused', reasons: refused },
      why: { closed_by: 'limits', at: node.path, reasons: refused },
    }
  }
  if (node.gives === undefined) return { closed: false, context }
  const gives = called(called(node.gives, context), found)
  if (!is_a_record(gives)) throw new Error(`${node.path}: it gives no record (PER-6)`)
  return { closed: false, context: { ...context, ...gives } }
}

/** The nodes of a path walked down, outer first: the context of the leaf's point, or the event that closed it. */
const walk = async (nodes: readonly TreeNode[], context: Context): Promise<Walked> => {
  const [node, ...below] = nodes
  if (node === undefined) return { closed: false, context }
  const ran = await run(node, context)
  return ran.closed ? ran : walk(below, ran.context)
}

/** The leaf's own limits (PER-5.5, A, 13 Nov 2026 (2)), over its point's context and the input: every failed one named. */
const limits_of = (leaf: TreeLeaf, context: Context, input: unknown): Walked => {
  const refused = conditions_of(leaf.declared['is_refused_unless']).flatMap(([name, condition]) =>
    holds(condition, context, input) ? [] : [name],
  )
  return refused.length > 0
    ? {
        closed: true,
        event: { event: 'refused', reasons: refused },
        why: { closed_by: 'limits', at: leaf.path, reasons: refused },
      }
    : { closed: false, context }
}

/** The version a request carries (PER-17, D72.7): one that is no semver is a fault of the entry, thrown. */
const version_of = (leaf: TreeLeaf, version: unknown): Semver => {
  const parsed = semver.safeParse(version)
  if (!parsed.success) throw new Error(`${leaf.path}: the entry gives no version (PER-17)`)
  return parsed.data
}

/** The major and the minor of a version. */
const major_and_minor = (version: Semver): readonly [number, number] => {
  const [major, minor] = version.split('.').map(Number)
  return [major ?? Number.NaN, minor ?? Number.NaN]
}

/**
 * Where a request's version leads (PER-17, D72.7, A, 17 Nov 2026), at the
 * entry of the tree, before any node, so that no lookup runs: the gate,
 * `version_not_supported`, for a major the window has not (a `1.2.0` once
 * `1/` is deleted, a `3.0.0` on a tree at 2.0.0) or the current major at a
 * higher minor (a `2.1.0` on 2.0.0), the patch not counted, telling the
 * version the tree speaks and its oldest major; a major with no leaf at the
 * path, `not_a_leaf` (D106.3); else the steps from its leaf to the current.
 */
const picked = (
  leaf: TreeLeaf,
  version: Semver,
):
  | { readonly closed: true; readonly event: RuntimeLeafEvent; readonly why: TraceReason }
  | { readonly closed: false; readonly past: readonly PastStep[] } => {
  const { window } = leaf
  const [major, minor] = major_and_minor(version)
  if (!window.majors.has(major) || (major === window.major && minor > window.minor)) {
    return {
      closed: true,
      event: { event: 'version_not_supported', current: window.current, oldest: window.oldest },
      why: { closed_by: 'the_gate', current: window.current, oldest: window.oldest },
    }
  }
  const past = leaf.pasts.get(major)
  return past === undefined
    ? {
        closed: true,
        event: { event: 'invalid_request', reason: 'not_a_leaf' },
        why: { closed_by: 'not_a_leaf', major },
      }
    : { closed: false, past }
}

/**
 * The input of a past major's leaf gone forward to the current leaf's
 * (PER-17): each step's `to_next`, over the context of the leaf's point,
 * then the next major's schema, built over what the entry gives, as at the
 * request's major; an input a later major's schema refuses (a static rule
 * over `now`, DOM-21) is `invalid_request`, each field and rule for the
 * trace. With no step, the input as it is.
 */
const forward = (
  past: readonly PastStep[],
  current: unknown,
  point: Context,
  given: Context,
  input: unknown,
):
  | { readonly forwarded: true; readonly input: unknown }
  | { readonly forwarded: false; readonly issues: readonly TracedIssue[] } => {
  const [step, ...above] = past
  if (step === undefined) return { forwarded: true, input }
  const parsed = schema_of(above[0]?.input ?? current, given).safeParse(
    called(called(step.declared['to_next'], point), input),
  )
  return parsed.success
    ? forward(above, current, point, given, parsed.data)
    : { forwarded: false, issues: issues_of(parsed.error) }
}

/**
 * An event of the current leaf, back in the words of the request's major
 * (PER-17): its step back at each major, the nearest the current first, each
 * over the context of the leaf's point, taken once (`from_next`), and parsed
 * by that major's schema of the event, one not in it the past leaf's fault,
 * thrown; the nodes' closings and the base events cross as they are.
 */
const back_events = (
  path: string,
  past: readonly PastStep[],
  steps_back: (step: PastStep) => unknown,
  own: ReadonlySet<string>,
): ((event: RuntimeLeafEvent) => RuntimeLeafEvent) => {
  const steps = past.toReversed().map((step) => ({ step, from_next: steps_back(step) }))
  return (event) =>
    own.has(event.event)
      ? steps.reduce<RuntimeLeafEvent>((current, { step, from_next }) => {
          const each = is_a_record(from_next) ? from_next[current.event] : undefined
          if (typeof each !== 'function') {
            throw new Error(
              `${path}: no step back of ${current.event} at major ${String(step.major)} (PER-17)`,
            )
          }
          // A stream's event keeps its position, identity and entry.
          return {
            ...current,
            ...event_of({ path, events: step.events }, called(each, current['payload'])),
          }
        }, event)
      : event
}

/**
 * An entry of the current read leaf, back in the words of the request's
 * major (PER-17, PER-18): its step back at each major, the nearest the
 * current first, over the context of the leaf's point, taken once, and
 * parsed by that major's entry, one not in it the past leaf's fault, thrown.
 */
const back_entry = (
  path: string,
  past: readonly PastStep[],
  point: Context,
): ((entry: unknown) => unknown) => {
  const steps = past
    .toReversed()
    .map((step) => ({ step, from_next: called(step.declared['from_next'], point) }))
  return (entry) =>
    steps.reduce((current, { step, from_next }) => {
      const parsed = step.entry?.safeParse(called(from_next, current))
      if (parsed?.success !== true) {
        throw new Error(
          `${path}: its step back at major ${String(step.major)} gives an entry not in its schema (PER-17)`,
        )
      }
      return parsed.data
    }, entry)
}

/** The predicates a business rejection names (DOM-6, D105.4), as the trace keeps them. */
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

/** What a leaf's port hands the tree's trace for a request answered with no fact (F6). */
interface Tracing {
  readonly trace: unknown
  readonly leaf: TreeLeaf
  readonly given: Context
  readonly version: Semver
  readonly sent: unknown
  readonly operation?: Operation | Pick<Operation, 'scope'>
  readonly correlation?: correlation
}

/**
 * The event a request closes with, handed first to the tree's trace with
 * why (F6, PER-14): the library waits for nothing, so that the answer never
 * depends on the trace (D54); one that throws is the adapter's fault.
 */
const traced = (
  tracing: Tracing,
  answered: RuntimeLeafEvent,
  why: TraceReason,
): RuntimeLeafEvent => {
  const entry: Traced<Context> = {
    path: tracing.leaf.path,
    given: tracing.given,
    version: tracing.version,
    ...(tracing.operation === undefined ? {} : { operation: tracing.operation }),
    ...(tracing.correlation === undefined ? {} : { correlation: tracing.correlation }),
    sent: tracing.sent,
    answered,
    why,
  }
  called(tracing.trace, entry)
  return answered
}

/** An event a projection gives, parsed by its leaf's schema of that event; another is the projection's fault, thrown. */
const event_of = (
  leaf: Pick<CommandLeaf, 'path' | 'events'>,
  projected: unknown,
): { readonly event: string; readonly payload: unknown } => {
  if (!is_a_record(projected) || typeof projected['event'] !== 'string') {
    throw new Error(`${leaf.path}: a projection gives no event (D45)`)
  }
  const name = projected['event']
  const schema = leaf.events[name]
  if (schema === undefined)
    throw new Error(`${leaf.path}: ${name} is not one of its events (DOM-3)`)
  const payload = schema.safeParse(projected['payload'])
  if (!payload.success) {
    throw new Error(`${leaf.path}: the payload of ${name} is not in its schema (DOM-21)`)
  }
  return { event: name, payload: payload.data }
}

/**
 * The outcome of the use case a command leaf invokes, in the leaf's words
 * (D45, DOM-7): a branch applied, by its projection, from its own part's
 * payload and the parts it composed (SC-54); the rejection, by its
 * projection, from its failures; the identity already used and an input the
 * use case below does not take, as the base events, unprojected (DOM-11,
 * DOM-21).
 */
const projected_outcome = (
  leaf: CommandLeaf,
  outcome: unknown,
): { readonly event: RuntimeLeafEvent; readonly why?: TraceReason } => {
  if (!is_a_record(outcome)) throw new Error(`${leaf.path}: the port below gives no outcome`)
  const projection = leaf.declared['projection']
  if (!is_a_record(projection)) throw new Error(`${leaf.path}: it has no projection (D45)`)
  switch (outcome['outcome']) {
    case 'applied': {
      const branch = outcome['branch']
      const fact = outcome['fact']
      const parts = is_a_record(fact) ? fact['parts'] : undefined
      const own: unknown = Array.isArray(parts) ? parts[0] : undefined
      if (typeof branch !== 'string' || !is_a_record(own)) {
        throw new Error(`${leaf.path}: the port below gives an applied outcome with no fact`)
      }
      if (typeof projection[branch] !== 'function') {
        throw new Error(`${leaf.path}: no projection of the branch ${branch} (D45)`)
      }
      return {
        event: event_of(
          leaf,
          called_with(projection[branch], [own['payload'], outcome['composed'] ?? {}]),
        ),
      }
    }
    case 'rejected':
      return {
        event: event_of(leaf, called(projection['rejected'], outcome['failures'])),
        why: {
          closed_by: 'the_business',
          outcome: { outcome: 'rejected', failures: failures_of(outcome['failures']) },
        },
      }
    case 'identity_already_used':
      return {
        event: { event: 'identity_already_used' },
        why: { closed_by: 'the_business', outcome: { outcome: 'identity_already_used' } },
      }
    case 'invalid_request':
      return {
        event: input_not_in_schema,
        why: {
          closed_by: 'the_business',
          outcome: { outcome: 'invalid_request', reason: 'input_not_in_schema' },
        },
      }
    default:
      throw new Error(`${leaf.path}: the port below gives an outcome no command has (DOM-7)`)
  }
}

/**
 * A command's operation as the entry gives it (DOM-11): whole, or its scope
 * alone for a leaf whose input names the id (SC-34, D91.2), with the field
 * that names it.
 */
type Entered =
  | { readonly by: 'the_entry'; readonly operation: Operation }
  | { readonly by: 'the_input'; readonly identity: string; readonly scope: string }

/**
 * The operation the entry gives a command leaf (DOM-11): whole, or its
 * scope alone where its input names the id (`operation.identity`, SC-34);
 * another is the entry's fault, thrown, an id given beside the one the
 * input names among them.
 */
const operation_entered = (leaf: TreeLeaf, given: unknown): Entered => {
  const named = leaf.declared['operation']
  if (named === undefined) {
    const operation = operation_given.safeParse(given)
    if (!operation.success) throw new Error(`${leaf.path}: the entry gives no operation (DOM-11)`)
    return { by: 'the_entry', operation: operation.data }
  }
  if (!is_a_record(named) || typeof named['identity'] !== 'string') {
    throw new Error(`${leaf.path}: its operation names no field of its input (SC-34)`)
  }
  const scope = operation_scope_given.safeParse(given)
  if (!scope.success) {
    throw new Error(
      `${leaf.path}: the entry gives an operation that is not its scope alone: its input names its id (SC-34)`,
    )
  }
  return { by: 'the_input', identity: named['identity'], scope: scope.data.scope }
}

/**
 * The operation of a request (DOM-11): the entry's, or its scope with the
 * id its input names, read after the schema (SC-34, PER-5.3); none when
 * the input's field holds no operation's id (an empty text).
 */
const operation_of = (entered: Entered, input: unknown): Operation | undefined => {
  if (entered.by === 'the_entry') return entered.operation
  const id = operation_id.safeParse(is_a_record(input) ? input[entered.identity] : undefined)
  return id.success ? { id: id.data, scope: entered.scope } : undefined
}

/** The end of a leaf's wait, a mark the race below tells from an event of the log. */
const over: unique symbol = Symbol('over')

/**
 * The facts a command leaf follows after an outcome that does not end its
 * flow (DOM-3, D58.2, D72.8): the fact log from the position of the
 * outcome's fact on, that fact left out (its own event is the outcome's);
 * of each fact of its chain, by correlation (DOM-10), whatever its domain,
 * every part under a path it follows, read at the current shape (DOM-22),
 * projected into its events, in the order of the log and of the parts
 * (SC-44), up to the first in `ends`. At most so long: then
 * `the_wait_is_over`, at the outcome's position, which closes the flow and
 * records nothing; so too when the log keeps the position no longer
 * (`position_unavailable`), from which nothing more can be followed. The
 * log is read as a consumer reads it, once per request: a retry that
 * meets its recorded fact follows again from its position (D72.8).
 */
async function* followed(
  leaf: CommandLeaf,
  following: LeafFollowing,
  from: position,
  chain: correlation,
): AsyncIterable<RuntimeLeafEvent> {
  const wait_is_over: RuntimeLeafEvent = { event: 'the_wait_is_over', position: from }
  const elapsed = following.elapsed(following.at_most).then((): typeof over => over)
  const log = following.log(from)[Symbol.asyncIterator]()
  try {
    for (;;) {
      const next: IteratorResult<LogEvent> | typeof over = await Promise.race([log.next(), elapsed])
      if (next === over || next.done === true) {
        yield wait_is_over
        return
      }
      const event = next.value
      if (event.event === 'position_unavailable') {
        yield wait_is_over
        return
      }
      if (event.event === 'caught_up' || event.position === from) continue
      if (event.fact.correlation !== chain) continue
      for (const part of event.fact.parts) {
        const projection = following.projections.get(part.path)
        if (projection === undefined) continue
        const read = following.versions[$Versions].part(part)
        const own = event_of(leaf, called(projection, read.payload))
        yield own
        if (following.ends.has(own.event)) return
      }
    }
  } finally {
    // A log waiting for its next fact is let go, not awaited.
    void log.return?.()
  }
}

/**
 * The events of a command leaf for an outcome of the use case below (D45,
 * DOM-3): projected, in the words of the request's major (`back`); one that
 * closes with no fact, traced with why (F6, PER-14); one that does not end
 * the leaf's flow, followed by the facts of its chain (D58.2).
 */
async function* answered(
  leaf: CommandLeaf,
  outcome: unknown,
  back: (event: RuntimeLeafEvent) => RuntimeLeafEvent,
  tracing: Tracing,
): AsyncIterable<RuntimeLeafEvent> {
  const projected = projected_outcome(leaf, outcome)
  const following = leaf.following
  const goes_on = following !== undefined && !following.ends.has(projected.event.event)
  if (projected.why !== undefined) {
    // A rejection records no fact, so no chain follows it (DOM-3).
    if (goes_on) {
      throw new Error(
        `${leaf.path}: ${projected.event.event} closes a request with no fact, and is not one of its ends (DOM-3)`,
      )
    }
    yield traced(tracing, back(projected.event), projected.why)
    return
  }
  yield back(projected.event)
  if (!goes_on) return
  // DOM-3, D58.2: the flow stays open on what the leaf follows, from
  // its outcome's fact, by its chain's correlation.
  // The chain is the outcome's fact's (DOM-10): a retry that meets it
  // follows the chain the first request began, whatever it sent.
  const fact = is_a_record(outcome) ? outcome['fact'] : undefined
  const from = position.safeParse(is_a_record(outcome) ? outcome['position'] : undefined)
  const chain = correlation.safeParse(is_a_record(fact) ? fact['correlation'] : undefined)
  if (!from.success || !chain.success) {
    throw new Error(
      `${leaf.path}: the port below gives an applied outcome with no position or no correlation`,
    )
  }
  for await (const event of followed(leaf, following, from.data, chain.data)) yield back(event)
}

/**
 * What a command leaf's operation recorded, looked up in its scope before
 * the leaf's schema (PER-5, "A retry after the input's window over `now`
 * moved", A, 19 Nov 2026): the operation as the entry gives it, or, where
 * the input names its id (SC-34), the id its field holds as sent; the
 * fingerprint over the leaf's path and the input as sent (LIB-11), which
 * needs no schema; the port below compares it (DOM-11). Its outcome, the
 * fact recorded or `identity_already_used`; none when nothing was recorded,
 * or when nothing can be looked up: an input that names no id, or names it
 * at a past major, where the id is read once the input has gone forward
 * (with its case); an input that is no JSON value, which no request
 * recorded.
 */
const recorded_before_the_schema = async (
  leaf: CommandLeaf,
  entered: Entered,
  past: readonly PastStep[],
  sent: unknown,
): Promise<{ readonly operation: Operation; readonly outcome: unknown } | undefined> => {
  const operation =
    entered.by === 'the_entry'
      ? entered.operation
      : past.length === 0
        ? operation_of(entered, sent)
        : undefined
  if (operation === undefined || !is_a_json_value(sent)) return undefined
  const lookup = recorded_lookup_of(leaf.port)
  if (lookup === undefined) {
    throw new Error(`${leaf.path}: the port below looks up no operation (PER-5)`)
  }
  const outcome = await lookup({
    operation,
    fingerprint: fingerprint_of({ path: leaf.path, input: sent }),
  })
  return is_a_record(outcome) && outcome['outcome'] === 'not_recorded'
    ? undefined
    : { operation, outcome }
}

/** The base event of a request whose input names no operation's id (SC-34), with why, for the trace. */
const names_no_operation = (entered: Entered): TraceReason => ({
  closed_by: 'the_input',
  issues: [
    {
      field: entered.by === 'the_input' ? [entered.identity] : [],
      rule: 'operation_id',
      message: 'it names no operation (DOM-11)',
    },
  ],
})

/**
 * A command leaf's port (PER-6, D45): its outcome, projected, the first
 * event and a terminal one (D72.3). A request answered with no fact leaves
 * its entry in the tree's trace, with why (F6, PER-14). At a past major
 * (PER-17) the request's input is checked by its major's leaf, before any
 * node, and goes forward after them (`to_next`, over the point's context);
 * the current leaf's limits, creator and projection answer, and each event
 * of its own comes back in the major's words (`from_next`), what it follows
 * too.
 */
const command_leaf_port = (leaf: CommandLeaf, trace: unknown) =>
  async function* (context: unknown, sent: unknown): AsyncIterable<RuntimeLeafEvent> {
    const entry = entry_of(context)
    const version = version_of(leaf, entry.version)
    const entered = operation_entered(leaf, entry.operation)
    const origin = correlation.safeParse(entry.correlation)
    if (!origin.success) throw new Error(`${leaf.path}: the entry gives no correlation (DOM-10)`)
    const scope = entered.by === 'the_entry' ? entered.operation.scope : entered.scope
    const tracing: Tracing = {
      trace,
      leaf,
      given: entry.given,
      version,
      sent,
      operation: entered.by === 'the_entry' ? entered.operation : { scope },
      correlation: origin.data,
    }
    // PER-5.2: the gate, then the leaf of the version's major, before any node.
    const at = picked(leaf, version)
    if (at.closed) {
      yield traced(tracing, at.event, at.why)
      return
    }
    // PER-5, a retry after the input's window over `now` moved (A, 19 Nov
    // 2026): the operation looked up in its scope, the hat claimed, before
    // the schema and the nodes: what it recorded is what the caller already
    // knows, a hat revoked meanwhile included.
    const recorded = await recorded_before_the_schema(leaf, entered, at.past, sent)
    if (recorded !== undefined) {
      const tracing_recorded: Tracing = { ...tracing, operation: recorded.operation }
      const outcome = recorded.outcome
      const applied = is_a_record(outcome) && outcome['outcome'] === 'applied'
      if (at.past.length === 0 || !applied) {
        yield* answered(leaf, outcome, (event) => event, tracing_recorded)
        return
      }
      // PER-17: at a past major the steps back read the context of the
      // leaf's point, so the nodes are walked; one that closes answers.
      const point = await walk(leaf.nodes, entry.given)
      if (point.closed) {
        yield traced(tracing_recorded, point.event, point.why)
        return
      }
      const back = back_events(
        leaf.path,
        at.past,
        (step) => called(step.declared['from_next'], point.context),
        new Set(Object.keys(leaf.events)),
      )
      yield* answered(leaf, outcome, back, tracing_recorded)
      return
    }
    // PER-5.3: the input in the schema of the major's leaf, before any node,
    // built over what the entry gives every command leaf: the root's
    // context and the operation's scope.
    const given = { ...entry.given, operation: { scope } }
    const input = schema_of(at.past[0]?.input ?? leaf.input, given).safeParse(sent)
    if (!input.success) {
      yield traced(tracing, input_not_in_schema, {
        closed_by: 'the_input',
        issues: issues_of(input.error),
      })
      return
    }
    // SC-34, D91.2: the id of the operation, where its input names it,
    // after the schema; at a past major, from the current leaf's input,
    // once it has gone forward.
    const named = at.past.length === 0 ? operation_of(entered, input.data) : undefined
    if (at.past.length === 0 && named === undefined) {
      yield traced(tracing, input_not_in_schema, names_no_operation(entered))
      return
    }
    const tracing_named: Tracing = named === undefined ? tracing : { ...tracing, operation: named }
    // PER-5.4: the nodes of the path.
    const walked = await walk(leaf.nodes, entry.given)
    if (walked.closed) {
      yield traced(tracing_named, walked.event, walked.why)
      return
    }
    // PER-17: the input forward to the current leaf's, over the point's context.
    const ahead = forward(at.past, leaf.input, walked.context, given, input.data)
    if (!ahead.forwarded) {
      yield traced(tracing_named, input_not_in_schema, {
        closed_by: 'the_input',
        issues: ahead.issues,
      })
      return
    }
    const operation = named ?? operation_of(entered, ahead.input)
    if (operation === undefined) {
      yield traced(tracing, input_not_in_schema, names_no_operation(entered))
      return
    }
    const tracing_operation: Tracing = { ...tracing, operation }
    const back = back_events(
      leaf.path,
      at.past,
      (step) => called(step.declared['from_next'], walked.context),
      new Set(Object.keys(leaf.events)),
    )
    // PER-5.5: the leaf's own limits, the current leaf's.
    const point = limits_of(leaf, walked.context, ahead.input)
    if (point.closed) {
      yield traced(tracing_operation, point.event, point.why)
      return
    }
    const below = called(
      called(leaf.declared['creator'], { ...point.context, operation }),
      ahead.input,
    )
    const outcomes = invoked_with(leaf.port, [
      {
        ...root_of(point.context),
        operation,
        correlation: origin.data,
        // D100, LIB-11: over the leaf's path and its input as sent, after the schema.
        fingerprint: fingerprint_of({ path: leaf.path, input: sent }),
      },
      below,
    ])
    for await (const outcome of outcomes) {
      yield* answered(leaf, outcome, back, tracing_operation)
      return
    }
    throw new Error(`${leaf.path}: the port below gives no outcome (DOM-3)`)
  }

/** An entry of the use case below, in the read leaf's words (D45, PER-18): projected field by field, parsed. */
const entry_in = (leaf: ReadLeaf, entry: unknown): unknown => {
  const parsed = leaf.entry.safeParse(called(leaf.declared['projection'], entry))
  if (!parsed.success)
    throw new Error(`${leaf.path}: a projection gives an entry not in its schema`)
  return parsed.data
}

/** What a read leaf's creator binds (SC-22): the query's input and, if it reads in pages, their size. */
const binding_of = (leaf: ReadLeaf, bound: unknown): { query: unknown; size: unknown } => {
  if (!is_a_record(bound) || !('query' in bound)) {
    throw new Error(`${leaf.path}: its creator binds no query (SC-21)`)
  }
  const page = bound['page']
  return { query: bound['query'], size: is_a_record(page) ? page['size'] : undefined }
}

/** The pages of the read use case a leaf invokes, as its port gives them. */
const pages_of = (leaf: ReadLeaf, port: unknown): unknown => {
  if (typeof port !== 'function' || !('pages' in port)) {
    throw new Error(`${leaf.path}: the port below reads no pages (SC-22)`)
  }
  return port.pages
}

/** The reason the port below gives for an input or a cursor it does not take (DOM-21, SC-22). */
const not_taken = (
  leaf: ReadLeaf,
  reason: unknown,
): 'input_not_in_schema' | 'cursor_not_in_schema' => {
  if (reason === 'input_not_in_schema' || reason === 'cursor_not_in_schema') return reason
  throw new Error(`${leaf.path}: the port below gives an invalid request with no reason (D106.3)`)
}

/** An input or a cursor the port below does not take (DOM-21, SC-22): the base event, traced. */
const not_taken_by = (leaf: ReadLeaf, tracing: Tracing, reason: unknown): RuntimeLeafEvent => {
  const why = not_taken(leaf, reason)
  return traced(
    tracing,
    { event: 'invalid_request', reason: why },
    { closed_by: 'the_business', outcome: { outcome: 'invalid_request', reason: why } },
  )
}

/** A projection of a named fact, with the payload of the part it projects. */
interface NamedPart {
  readonly projection: unknown
  readonly payload: unknown
}

/**
 * The part of a fact the leaf names that touches an entry (DOM-17, PER-18,
 * A, 16 Nov 2026 (6)): among the parts whose path is a fact the read use
 * case names and whose name the leaf projects (`stream.facts`), the first,
 * in the order of the parts, whose resources hold the entry's identity, by
 * the path of the query's identity: the notice of the round touches
 * Gianni's R8, the step's own part does not. Two such parts touching one
 * entry come with their case.
 */
const named_part = (
  streaming: LeafStreaming,
  fact: unknown,
  identity: unknown,
): NamedPart | undefined => {
  const parts: unknown = is_a_record(fact) ? fact['parts'] : undefined
  if (!Array.isArray(parts)) return undefined
  return parts.flatMap((part: unknown): readonly NamedPart[] => {
    if (!is_a_record(part) || typeof part['path'] !== 'string') return []
    if (!streaming.served.facts.includes(part['path'])) return []
    const projection = streaming.facts[part['path'].split('/').at(-1) ?? '']
    const resources = part['resources']
    const touches =
      Array.isArray(resources) &&
      resources.some(
        (resource: unknown) =>
          is_a_record(resource) &&
          resource['path'] === streaming.served.identity &&
          resource['value'] === identity,
      )
    return typeof projection === 'function' && touches
      ? [{ projection, payload: part['payload'] }]
      : []
  })[0]
}

/**
 * An event of the stream of the read use case below, in the leaf's words
 * (PER-18, D72.5, D72.6): every entry projected as in the snapshot; a fact
 * the leaf names, by the part that touches the entry, its own event, with the
 * entry and the payload projected from the part; any other fact, and an
 * entry `changed` by a fact that did not touch it (SC-19), `fact`, the entry
 * alone, never the envelope (PER-18); `entered`, `left` by its identity, as
 * it is; `caught_up` and `position_unavailable`, the position opaque.
 */
const stream_event_in = (
  leaf: ReadLeaf,
  streaming: LeafStreaming,
  projected: (entry: unknown) => unknown,
  event: Context,
): RuntimeLeafEvent => {
  const { position, identity } = event
  switch (event['event']) {
    case 'fact': {
      const entry = projected(event['entry'])
      const named = named_part(streaming, event['fact'], identity)
      if (named === undefined) return { event: 'fact', position, identity, entry }
      const own = event_of(
        { path: leaf.path, events: streaming.events },
        called(named.projection, named.payload),
      )
      return { event: own.event, position, identity, entry, payload: own.payload }
    }
    case 'changed':
      return { event: 'fact', position, identity, entry: projected(event['entry']) }
    case 'entered':
      return { event: 'entered', position, identity, entry: projected(event['entry']) }
    case 'left':
      return { event: 'left', position, identity }
    case 'caught_up':
      return { event: 'caught_up', position }
    case 'position_unavailable':
      return { event: 'position_unavailable' }
    default:
      throw new Error(`${leaf.path}: the port below gives an event no stream has (DOM-17)`)
  }
}

/**
 * The port below of a read leaf that lists actions (SC-33, D47.4, D51.1):
 * the same port again, its entries with the applicability of each, by the
 * use case its command leaf invokes and, from an entry, the input the
 * leaf's creator gives it from the input the read's creator binds, over the
 * context of the read's point, which the command leaves of its folder share
 * (their nodes above are its own, already passed); no operation, which the
 * caller mints later (DOM-12). Each entry then takes the leaf's own limits,
 * over that context and the input from the entry, each its own value (a
 * limit that reads a field the caller gives reads the mark, D51.4), in AND
 * outside the business's value (D105), which the projection writes in the
 * persona's words. A leaf that lists none reads the port as it is.
 */
const with_actions = (
  leaf: ReadLeaf,
  context: Context,
  bound: unknown,
): { readonly port: unknown; readonly entry: (entry: unknown) => unknown } => {
  if (leaf.actions.length === 0) return { port: leaf.port, entry: (entry) => entry }
  const from_the_entry = (name: string): unknown => {
    const each = is_a_record(bound) ? bound[name] : undefined
    if (typeof each !== 'function') {
      throw new Error(`${leaf.path}: its creator binds no input of the action ${name} (SC-33)`)
    }
    return each
  }
  const input_of = (action: LeafAction, entry: unknown): unknown =>
    called(called(action.declared['creator'], context), called(from_the_entry(action.name), entry))
  const port = leaf.port
  const acting =
    typeof port === 'function' && 'with_actions' in port
      ? called(
          port.with_actions,
          Object.fromEntries(
            leaf.actions.map((action) => [
              action.name,
              {
                use_case: action.use_case,
                input: () => (entry: unknown) => input_of(action, entry),
              },
            ]),
          ),
        )
      : undefined
  if (acting === undefined) throw new Error(`${leaf.path}: its port below evaluates no actions`)
  return {
    port: acting,
    entry: (entry) => {
      if (!is_a_record(entry)) return entry
      const limited = leaf.actions.map((action): readonly [string, unknown] => {
        const business = entry[action.name]
        if (!is_a_record(business)) {
          throw new Error(`${leaf.path}: the port below gives no applicability of ${action.name}`)
        }
        const value = business['value']
        const input = called(from_the_entry(action.name), entry)
        const limits = Object.fromEntries(
          conditions_of(action.declared['is_refused_unless']).map(
            ([name, condition]) => [name, holds(condition, context, input)] as const,
          ),
        )
        return [
          action.name,
          {
            ...business,
            value: kleene_and([
              ...Object.values(limits),
              value === true || value === false ? value : 'not_known',
            ]),
            limits,
          },
        ]
      })
      return { ...entry, ...Object.fromEntries(limited) }
    },
  }
}

/**
 * A read leaf's port (PER-18, SC-22): the snapshot, each entry projected;
 * where it streams, then its stream's events, or from a position its
 * stream alone, a resume (DOM-2); where it does not, one snapshot per
 * page, after a cursor if it resumes; an input or a cursor not in its
 * schema as the base event the port below gives. A request closed before
 * any snapshot leaves its entry in the tree's trace, with why (F6,
 * PER-14); the events of a stream are no rejection, and are not traced. At
 * a past major (PER-17) the request's input is checked by its major's leaf,
 * before any node, and goes forward after them (`to_next`); the current
 * leaf reads, and each entry comes back in the major's words (`from_next`),
 * each event of its stream's own too, by the identity the current leaf's
 * stream gives, which the past leaf's field holds (PER-18).
 */
const read_leaf_port = (leaf: ReadLeaf, trace: unknown) => {
  async function* read(
    context: unknown,
    sent: unknown,
    resume?: unknown,
  ): AsyncIterable<RuntimeLeafEvent> {
    const entry = entry_of(context)
    const version = version_of(leaf, entry.version)
    const tracing: Tracing = { trace, leaf, given: entry.given, version, sent }
    // PER-5.2: the gate, then the leaf of the version's major, before any node.
    const at = picked(leaf, version)
    if (at.closed) {
      yield traced(tracing, at.event, at.why)
      return
    }
    // PER-5.3: the input in the schema of the major's leaf, before any node.
    const input = schema_of(at.past[0]?.input ?? leaf.input, entry.given).safeParse(sent)
    if (!input.success) {
      yield traced(tracing, input_not_in_schema, {
        closed_by: 'the_input',
        issues: issues_of(input.error),
      })
      return
    }
    // PER-5.4: the nodes, at every request, a resume too.
    const walked = await walk(leaf.nodes, entry.given)
    if (walked.closed) {
      yield traced(tracing, walked.event, walked.why)
      return
    }
    // PER-17: the input forward to the current leaf's, over the point's context.
    const ahead = forward(at.past, leaf.input, walked.context, entry.given, input.data)
    if (!ahead.forwarded) {
      yield traced(tracing, input_not_in_schema, { closed_by: 'the_input', issues: ahead.issues })
      return
    }
    // PER-5.5: the current leaf's limits, at every request, a resume too
    // (SC-32: a stream opened on 31 March, resumed on 1 April).
    const point = limits_of(leaf, walked.context, ahead.input)
    if (point.closed) {
      yield traced(tracing, point.event, point.why)
      return
    }
    const bound: unknown = called(called(leaf.declared['creator'], point.context), ahead.input)
    const binding = binding_of(leaf, bound)
    const root = root_of(point.context)
    // SC-33: the port below again, with the actions, past the checks of
    // PER-5, which close a request before any read (SC-32).
    const acting = with_actions(leaf, point.context, is_a_record(bound) ? bound['actions'] : {})
    const in_its_major = back_entry(leaf.path, at.past, point.context)
    const projected = (each: unknown): unknown => in_its_major(entry_in(leaf, acting.entry(each)))
    if (leaf.streaming !== undefined) {
      // A leaf that streams reads whole (SC-22): the snapshot, then the
      // stream from its position; from a position, the stream alone.
      const back = back_events(
        leaf.path,
        at.past,
        (step) => {
          const stream = step.declared['stream']
          return called(is_a_record(stream) ? stream['from_next'] : undefined, point.context)
        },
        new Set(Object.keys(leaf.streaming.events)),
      )
      const events = invoked_with(
        acting.port,
        resume === undefined ? [root, binding.query] : [root, binding.query, resume],
      )
      for await (const event of events) {
        if (!is_a_record(event)) throw new Error(`${leaf.path}: the port below gives no event`)
        if (event['event'] === 'invalid_request') {
          yield not_taken_by(leaf, tracing, event['reason'])
          return
        }
        const entries = event['entries']
        if (event['event'] === 'snapshot' && Array.isArray(entries)) {
          yield {
            event: 'snapshot',
            entries: entries.map(projected),
            position: event['position'],
            total: event['total'],
          }
          continue
        }
        yield back(stream_event_in(leaf, leaf.streaming, projected, event))
      }
      return
    }
    const page = {
      ...(binding.size === undefined ? {} : { size: binding.size }),
      ...(resume === undefined ? {} : { after: resume }),
    }
    const pages = invoked_with(pages_of(leaf, acting.port), [root, binding.query, page])
    for await (const event of pages) {
      if (!is_a_record(event)) throw new Error(`${leaf.path}: the port below gives no event`)
      if (event['event'] === 'invalid_request') {
        // An input the query does not take, or a cursor not of its order key (SC-22).
        yield not_taken_by(leaf, tracing, event['reason'])
        return
      }
      const entries = event['entries']
      if (event['event'] !== 'snapshot' || !Array.isArray(entries)) {
        throw new Error(`${leaf.path}: the port below gives a page that is no snapshot`)
      }
      yield {
        event: 'snapshot',
        entries: entries.map(projected),
        position: event['position'],
        total: event['total'],
        ...(event['next'] === undefined ? {} : { next: event['next'] }),
      }
    }
  }
  // `Streamed` when the leaf declares how it streams (PER-18).
  return Object.assign(read, { streamed: leaf.streaming !== undefined })
}

/**
 * How a read leaf streams, as the port below serves it (PER-18, CFG-2): its
 * events and its facts' projection, from its declaration; the identity's
 * path and the facts the read use case names, from its port. A stream over
 * a port that does not stream is a composition fault, named at wiring.
 */
const streaming_of = (
  path: string,
  declared: Context,
  port: unknown,
): LeafStreaming | string | undefined => {
  const stream = declared['stream']
  if (stream === undefined) return undefined
  const served = served_by(port)?.read
  const streamed =
    (typeof port === 'function' || (typeof port === 'object' && port !== null)) &&
    'streamed' in port &&
    port.streamed === true
  if (!streamed || served === undefined) {
    return `${path} streams over a port that does not stream (CFG-2, PER-18)`
  }
  const declared_events = is_a_record(stream) ? stream['events'] : undefined
  const facts = is_a_record(stream) ? stream['facts'] : undefined
  return {
    events: Object.fromEntries(
      Object.entries(is_a_record(declared_events) ? declared_events : {}).flatMap(
        ([name, schema]) => (is_a_schema(schema) ? [[name, schema]] : []),
      ),
    ),
    facts: is_a_record(facts) ? facts : {},
    served,
  }
}

/**
 * What a command leaf follows, as the store serves it (DOM-3, CFG-2): its
 * ends; each fact it follows by its path in the domains whose versions the
 * store was given, with its projection by the name in that path; how long
 * at most, measured by the port the configurator gives. A fact of no domain
 * given, or no port to measure the wait, is a composition fault, named at
 * wiring with the others; a leaf that follows nothing, nothing.
 */
const following_of = (
  path: string,
  declared: Context,
  versions: Versions,
  wired: RuntimeWired,
): { readonly faults: readonly string[] } | { readonly following: LeafFollowing } | undefined => {
  const follows = declared['follows']
  if (follows === undefined) return undefined
  if (!is_a_record(follows)) return { faults: [`${path} follows nothing it declares (DOM-3)`] }
  const { facts, projection, at_most } = follows
  const ends = declared['ends']
  const paths = (Array.isArray(facts) ? facts : []).map((fact: unknown) =>
    versions[$Versions].path(fact),
  )
  const faults = [
    ...(paths.some((each) => each === undefined)
      ? [`${path} follows a fact of no domain whose majors the versions were given (DOM-22, CFG-2)`]
      : []),
    ...(wired.elapsed === undefined
      ? [`${path} follows, and no port given measures how long it waits (elapsed, CFG-2)`]
      : []),
  ]
  if (faults.length > 0 || wired.elapsed === undefined) return { faults }
  const projections = new Map(
    paths.flatMap((each): readonly (readonly [string, unknown])[] => {
      if (each === undefined) return []
      const by_name = is_a_record(projection) ? projection[each.split('/').at(-1) ?? ''] : undefined
      return typeof by_name === 'function' ? [[each, by_name]] : []
    }),
  )
  return {
    following: {
      ends: new Set(
        (Array.isArray(ends) ? ends : []).filter((name: unknown) => typeof name === 'string'),
      ),
      projections,
      at_most: typeof at_most === 'number' ? at_most : 0,
      elapsed: wired.elapsed,
      log: wired.log,
      versions,
    },
  }
}

/** The command leaves a read leaf lists as its actions, by name (SC-33), as it holds them. */
const actions_of_leaf = (own: unknown): readonly LeafAction[] => {
  const actions = is_a_record(own) ? own['actions'] : undefined
  return is_a_record(actions)
    ? Object.entries(actions).map(([name, action]): LeafAction => {
        const parts: unknown =
          typeof action === 'object' && action !== null ? Reflect.get(action, $UseCase) : undefined
        return {
          name,
          use_case: is_a_record(parts) ? parts['use_case'] : undefined,
          declared: declared_of(action, $UseCase),
        }
      })
    : []
}

/**
 * The window of a tree from its majors (PER-17, CFG-2): one registry
 * declares the version (its `version.ts`), under the major that version
 * names; or why the tree cannot be wired.
 */
const window_of = (majors: Majors): Window | string => {
  const declared = Object.entries(majors).flatMap(([major, registry]) =>
    Object.values(registry).flatMap((entry) => {
      if (typeof entry !== 'object' || !($Version in entry)) return []
      const version = semver.safeParse(entry[$Version])
      return version.success ? [{ major: Number(major), version: version.data }] : []
    }),
  )
  const [current] = declared
  if (current === undefined || declared.length > 1) {
    return `the majors given declare ${String(declared.length)} versions: a tree's majors hold one current registry, whose version.ts declares its version (PER-17, CFG-2)`
  }
  const [major, minor] = major_and_minor(current.version)
  if (major !== current.major) {
    return `the majors given hold version ${current.version} as major ${String(current.major)}: the current major is the one its version declares (PER-17, CFG-2)`
  }
  const numbers = Object.keys(majors).map(Number)
  return {
    current: current.version,
    major,
    minor,
    oldest: Math.min(...numbers),
    majors: new Set(numbers),
  }
}

/** A step of a past major's leaf, from what `earlier` built (PER-17): its input, its declaration whole, its events or its entry. */
const past_step = (major: number, component: object): PastStep => {
  const own: unknown = Reflect.get(component, $UseCase)
  const declared = declared_of(component, $UseCase)
  const entry = is_a_record(own) ? own['entry'] : undefined
  const stream = declared['stream']
  const events =
    entry instanceof z.ZodObject
      ? is_a_record(stream)
        ? stream['events']
        : {}
      : is_a_record(own)
        ? own['events']
        : {}
  return {
    major,
    input: Reflect.get(component, 'input'),
    declared,
    events: Object.fromEntries(
      Object.entries(is_a_record(events) ? events : {}).flatMap(([name, schema]) =>
        is_a_schema(schema) ? [[name, schema]] : [],
      ),
    ),
    ...(entry instanceof z.ZodObject ? { entry } : {}),
  }
}

/**
 * The steps from a past major's leaf up to the current leaf (PER-17): an
 * `earlier` is a step over its next major's leaf, a `delegate` the next's
 * itself; one that leads elsewhere than the current leaf given is a fault,
 * named at wiring (CFG-2).
 */
const steps_up = (
  major: number,
  component: unknown,
  current: unknown,
  left: number,
): readonly PastStep[] | undefined => {
  if (component === current) return []
  if (left === 0 || typeof component !== 'object' || component === null) return undefined
  if ($Delegated in component) return steps_up(major, component[$Delegated], current, left - 1)
  if (!($Earlier in component)) return undefined
  const over: unknown = component[$Earlier]
  const above = steps_up(major, is_a_record(over) ? over['next'] : undefined, current, left - 1)
  return above === undefined ? undefined : [past_step(major, component), ...above]
}

/**
 * Each major of the window with a leaf at a path, and the steps from it to
 * the current leaf, none for the current major (PER-17, D72.7); the faults
 * at wiring (CFG-2): a leaf given that is not the current major's at its
 * path (`my_loans` of `1/` given in place of the current one, which the
 * types let through, leaves being structural: Shed's README, § Left by
 * Shed), a past major's leaf that does not lead to it.
 */
const pasts_of = (
  path: string,
  use_case: unknown,
  majors: Majors,
  window: Window,
): {
  readonly pasts: ReadonlyMap<number, readonly PastStep[]>
  readonly faults: readonly string[]
} => {
  if (majors[window.major]?.[path] !== use_case) {
    return {
      pasts: new Map(),
      faults: [
        `${path} is given as a leaf that is not the current major's at its path (PER-17, CFG-2)`,
      ],
    }
  }
  const found = Object.entries(majors).flatMap(([number, registry]) => {
    const major = Number(number)
    if (major === window.major || !(path in registry)) return []
    return [{ major, steps: steps_up(major, registry[path], use_case, window.majors.size) }]
  })
  return {
    pasts: new Map([
      [window.major, []],
      ...found.flatMap(({ major, steps }) =>
        steps === undefined ? [] : [[major, steps] as const],
      ),
    ]),
    faults: found.flatMap(({ major, steps }) =>
      steps === undefined
        ? [
            `${path} of major ${String(major)} does not lead to the current leaf given (PER-17, CFG-2)`,
          ]
        : [],
    ),
  }
}

const runtime_tree_ports = (
  ports: RuntimeTreePorts,
): ((wired: RuntimeWired) => Readonly<Record<string, unknown>>) => {
  const path_of = paths_in(ports.registry)
  const window = window_of(ports.majors)
  const top = path_of(ports.top)
  const leaves = Object.entries(ports.use_cases).map(([name, use_case]) => ({
    name,
    use_case,
    path: path_of(use_case),
  }))
  const nodes = Object.entries(ports.registry).flatMap(([path, component]) =>
    typeof component === 'object' && $Node in component
      ? [{ path, component, declared: declared_of(component, $Node) }]
      : [],
  )
  const pasts = new Map(
    leaves.flatMap(({ name, use_case, path }) =>
      path === undefined || typeof window === 'string'
        ? []
        : [[name, pasts_of(path, use_case, ports.majors, window)] as const],
    ),
  )
  const faults = [
    ...(top === undefined ? ['the top is not in the registry given (DOM-24)'] : []),
    ...(typeof window === 'string' ? [window] : []),
    ...leaves.flatMap(({ name, path }) => {
      if (path === undefined) return [`the leaf ${name} is not in the registry given (DOM-24)`]
      return [
        ...(path.endsWith(`/usecase/${name}`) ? [] : [`${path} is given as ${name} (DOM-24)`]),
        ...(top === undefined || is_at_or_above(folder_of(top), folder_of(path))
          ? []
          : [`${path} is not below the top, ${top} (PER-6)`]),
        ...(pasts.get(name)?.faults ?? []),
      ]
    }),
    ...nodes.flatMap(({ path, component, declared }) => [
      ...(declared['takes'] !== undefined && component !== ports.top
        ? [`${path} takes from the entry, which only the top does (PER-6)`]
        : []),
      ...(declared['binds'] !== undefined || declared['requires'] !== undefined
        ? [`${path} binds or requires, which its business's command port runs (D105)`]
        : []),
    ]),
  ]
  if (faults.length > 0 || typeof window === 'string') throw new Error(faults.join('\n'))

  return (wired) => {
    const served = new Map<unknown, unknown>()
    const unserved = Object.entries(wired.invoked).flatMap(([folder, given]) =>
      Object.entries(given).flatMap(([name, port]) => {
        const serves = served_by(port)
        if (serves === undefined) {
          return [`${folder}: ${name} is a port the library did not build (CFG-2)`]
        }
        if (!is_at_or_above(folder, folder_of(serves.path))) {
          return [`${folder}: ${name} serves ${serves.path}, of another folder (CFG-2)`]
        }
        served.set(serves.component, port)
        return []
      }),
    )
    const top_folder = folder_of(top ?? '')
    const path_nodes = (path: string) =>
      nodes
        .filter(
          (node) =>
            is_at_or_above(folder_of(node.path), folder_of(path)) &&
            is_at_or_above(top_folder, folder_of(node.path)),
        )
        .toSorted((a, b) => a.path.split('/').length - b.path.split('/').length)
    const built = leaves.map(({ name, use_case, path = '' }) => {
      const parts = declared_of(use_case, $UseCase)
      const own: unknown =
        typeof use_case === 'object' && use_case !== null
          ? Reflect.get(use_case, $UseCase)
          : undefined
      const invokes = is_a_record(own) ? own['use_case'] : undefined
      const tree_nodes = path_nodes(path).map((node): TreeNode => {
        const looks_up = conditions_of(node.declared['looks_up']).map(
          ([lookup_name, declared]) => ({
            name: lookup_name,
            port: served.get(is_a_record(declared) ? declared['lookup'] : undefined),
            of: is_a_record(declared) ? declared['of'] : undefined,
          }),
        )
        const takes = node.declared['takes']
        return {
          path: node.path,
          takes: takes instanceof z.ZodObject ? takes : undefined,
          looks_up,
          is_found_only_if: conditions_of(node.declared['is_found_only_if']),
          is_refused_unless: conditions_of(node.declared['is_refused_unless']),
          gives: node.declared['gives'],
        }
      })
      const port = served.get(invokes)
      const streaming = port === undefined ? undefined : streaming_of(path, parts, port)
      const actions = actions_of_leaf(own)
      const evaluates =
        typeof port === 'function' && 'with_actions' in port && port.with_actions !== undefined
      const following = following_of(path, parts, ports.versions, wired)
      const missing = [
        ...tree_nodes.flatMap((node) =>
          node.looks_up.flatMap((lookup) =>
            lookup.port === undefined
              ? [`${node.path} looks up ${lookup.name}, which no port given serves (CFG-2)`]
              : [],
          ),
        ),
        ...(port === undefined ? [`${path} invokes a use case no port given serves (CFG-2)`] : []),
        ...(typeof streaming === 'string' ? [streaming] : []),
        ...(actions.length > 0 && port !== undefined && !evaluates
          ? [`${path} lists actions over a port that evaluates none (D110, SC-33, CFG-2)`]
          : []),
        ...(following !== undefined && 'faults' in following ? following.faults : []),
      ]
      const leaf: TreeLeaf = {
        name,
        path,
        input:
          typeof use_case === 'object' && use_case !== null
            ? Reflect.get(use_case, 'input')
            : undefined,
        declared: parts,
        port,
        nodes: tree_nodes,
        window,
        pasts: pasts.get(name)?.pasts ?? new Map(),
      }
      return {
        leaf,
        own,
        actions,
        missing,
        streaming: typeof streaming === 'string' ? undefined : streaming,
        following:
          following !== undefined && 'following' in following ? following.following : undefined,
      }
    })
    // A node above two leaves is named once.
    const wiring = [...new Set([...unserved, ...built.flatMap((each) => each.missing)])]
    if (wiring.length > 0) throw new Error(wiring.join('\n'))
    return Object.fromEntries(
      built.map(({ leaf, own, actions, streaming, following }): readonly [string, unknown] => {
        const entry = is_a_record(own) ? own['entry'] : undefined
        const events = is_a_record(own) ? own['events'] : undefined
        if (entry instanceof z.ZodObject) {
          return [
            leaf.name,
            read_leaf_port(
              { ...leaf, entry, actions, ...(streaming === undefined ? {} : { streaming }) },
              wired.trace,
            ),
          ]
        }
        if (!is_a_record(events)) throw new Error(`${leaf.path} declares no events (DOM-3)`)
        const schemas = Object.fromEntries(
          Object.entries(events).flatMap(([name, schema]) =>
            is_a_schema(schema) ? [[name, schema]] : [],
          ),
        )
        return [
          leaf.name,
          command_leaf_port(
            { ...leaf, events: schemas, ...(following === undefined ? {} : { following }) },
            wired.trace,
          ),
        ]
      }),
    )
  }
}
