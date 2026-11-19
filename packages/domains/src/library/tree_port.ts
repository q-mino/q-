import * as z from 'zod'
import { position, semver, type Semver } from './format.ts'
import { correlation, operation_id, type Operation } from './context.ts'
import type { Majors, Registry, Versions } from './registry.ts'
import type { FactLog, LogEvent } from './stream.ts'
import type { Elapsed, Invoked, TreeLeaves, TreePorts } from './tree.ts'
import { $Versions } from './registry.ts'
import type { NotKnown, Trace, TraceReason, Traced, TracedFailure, TracedIssue } from './trace.ts'
import { $Node, type EntryOf } from './node.ts'
import { $UseCase } from './use_case.ts'
import { is_a_schema } from './kind.ts'
import { fingerprint_of } from './stable.ts'
import {
  called,
  called_with,
  folder_of,
  is_a_record,
  is_at_or_above,
  paths_in,
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

/** A leaf as the ports meet it at runtime: its declaration, the port it invokes, the nodes of its path. */
interface TreeLeaf {
  readonly name: string
  readonly path: string
  readonly input: unknown
  readonly declared: Context
  readonly port: unknown
  readonly nodes: readonly TreeNode[]
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

/** A read leaf: the schema of its own entry; how it streams, if it does. */
interface ReadLeaf extends TreeLeaf {
  readonly entry: z.ZodObject
  readonly streaming?: LeafStreaming
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
 * that no port given serves. The checks of a current leaf that is not the
 * one of its path in the current major, and of a read leaf that lists
 * actions over a port with no `with_actions` (D110, SC-33), come with their
 * parts (6.4, 6.3).
 *
 * Per request, in the order of PER-5: the version's major picks the leaf
 * (the current major since part 6.1; past majors and the gate with part
 * 6.4); the input in the leaf's schema, built over the context the entry
 * gives (`invalid_request`, `input_not_in_schema`), before any node, so that
 * a caller learns nothing the public contract does not tell (PER-7); the
 * nodes, outer first, each in its order: the top's `takes` parsed from the
 * entry (one it does not parse is the entry's fault, thrown), its lookups,
 * a key or a value not known closing with `not_found`, its perimeters
 * (`not_found`, no reason), its limits, all evaluated (`refused`, every
 * failed one named), what it gives; the leaf's limits, likewise; the
 * creator, over the context of the leaf's point (and, for a command, its
 * operation); the use case below, given the root's context alone, copied
 * (D105.1). A leaf whose input names its operation (SC-34) is given its
 * scope alone by the entry, and the library reads the id from its input
 * after the schema.
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

/**
 * The major of a request's version (PER-17, D72.7): the current one since
 * part 6.1; a past major, and the gate, with part 6.4. A version that is no
 * semver is a fault of the entry, thrown.
 */
const at_the_current_major = (leaf: TreeLeaf, majors: Majors, version: unknown): Semver => {
  const parsed = semver.safeParse(version)
  if (!parsed.success) throw new Error(`${leaf.path}: the entry gives no version (PER-17)`)
  const current = Math.max(...Object.keys(majors).map(Number))
  const major = Number(parsed.data.split('.')[0])
  if (major !== current) {
    throw new Error(
      `${leaf.path}: a request at ${parsed.data}, not of the current major ${String(current)}: past majors and the gate come with part 6.4`,
    )
  }
  return parsed.data
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

/** What waits for a later part of the plan, named, at the request. */
const not_yet = (leaf: TreeLeaf, parts: readonly (readonly [string, string])[]): void => {
  const waiting = parts.filter(([part]) => leaf.declared[part] !== undefined)
  if (waiting.length > 0) {
    throw new Error(
      `${leaf.path} declares ${waiting.map(([part, plan]) => `${part} (part ${plan})`).join(', ')}`,
    )
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
 * A command leaf's port (PER-6, D45): its outcome, projected, the first
 * event and a terminal one (D72.3). A request answered with no fact leaves
 * its entry in the tree's trace, with why (F6, PER-14).
 */
const command_leaf_port = (leaf: CommandLeaf, majors: Majors, trace: unknown) =>
  async function* (context: unknown, sent: unknown): AsyncIterable<RuntimeLeafEvent> {
    const entry = entry_of(context)
    const version = at_the_current_major(leaf, majors, entry.version)
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
    // PER-5.3: the input in the leaf's schema, before any node, built over
    // what the entry gives every command leaf: the root's context and the
    // operation's scope.
    const input = schema_of(leaf.input, { ...entry.given, operation: { scope } }).safeParse(sent)
    if (!input.success) {
      yield traced(tracing, input_not_in_schema, {
        closed_by: 'the_input',
        issues: issues_of(input.error),
      })
      return
    }
    // SC-34, D91.2: the id of the operation, where its input names it, after the schema.
    const operation = operation_of(entered, input.data)
    if (operation === undefined) {
      yield traced(tracing, input_not_in_schema, {
        closed_by: 'the_input',
        issues: [
          {
            field: entered.by === 'the_input' ? [entered.identity] : [],
            rule: 'operation_id',
            message: 'it names no operation (DOM-11)',
          },
        ],
      })
      return
    }
    const tracing_operation: Tracing = { ...tracing, operation }
    // PER-5.4, PER-5.5: the nodes of the path, then the leaf's own limits.
    const walked = await walk(leaf.nodes, entry.given)
    const point = walked.closed ? walked : limits_of(leaf, walked.context, input.data)
    if (point.closed) {
      yield traced(tracing_operation, point.event, point.why)
      return
    }
    const below = called(
      called(leaf.declared['creator'], { ...point.context, operation }),
      input.data,
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
        yield traced(tracing_operation, projected.event, projected.why)
        return
      }
      yield projected.event
      if (!goes_on) return
      // DOM-3, D58.2: the flow stays open on what the leaf follows, from
      // its outcome's fact, by its chain's correlation.
      // The chain is the outcome's fact's (DOM-10): a retry that meets it
      // follows the chain the first request began, whatever it sent.
      const fact = is_a_record(outcome) ? outcome['fact'] : undefined
      const at = position.safeParse(is_a_record(outcome) ? outcome['position'] : undefined)
      const chain = correlation.safeParse(is_a_record(fact) ? fact['correlation'] : undefined)
      if (!at.success || !chain.success) {
        throw new Error(
          `${leaf.path}: the port below gives an applied outcome with no position or no correlation`,
        )
      }
      yield* followed(leaf, following, at.data, chain.data)
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
const pages_of = (leaf: ReadLeaf): unknown => {
  const port = leaf.port
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
  event: Context,
): RuntimeLeafEvent => {
  const { position, identity } = event
  switch (event['event']) {
    case 'fact': {
      const entry = entry_in(leaf, event['entry'])
      const named = named_part(streaming, event['fact'], identity)
      if (named === undefined) return { event: 'fact', position, identity, entry }
      const own = event_of(
        { path: leaf.path, events: streaming.events },
        called(named.projection, named.payload),
      )
      return { event: own.event, position, identity, entry, payload: own.payload }
    }
    case 'changed':
      return { event: 'fact', position, identity, entry: entry_in(leaf, event['entry']) }
    case 'entered':
      return { event: 'entered', position, identity, entry: entry_in(leaf, event['entry']) }
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
 * A read leaf's port (PER-18, SC-22): the snapshot, each entry projected;
 * where it streams, then its stream's events, or from a position its
 * stream alone, a resume (DOM-2); where it does not, one snapshot per
 * page, after a cursor if it resumes; an input or a cursor not in its
 * schema as the base event the port below gives. A request closed before
 * any snapshot leaves its entry in the tree's trace, with why (F6,
 * PER-14); the events of a stream are no rejection, and are not traced.
 */
const read_leaf_port = (leaf: ReadLeaf, majors: Majors, trace: unknown) => {
  async function* read(
    context: unknown,
    sent: unknown,
    resume?: unknown,
  ): AsyncIterable<RuntimeLeafEvent> {
    const entry = entry_of(context)
    const version = at_the_current_major(leaf, majors, entry.version)
    const tracing: Tracing = { trace, leaf, given: entry.given, version, sent }
    // PER-5.3: the input in the leaf's schema, before any node.
    const input = schema_of(leaf.input, entry.given).safeParse(sent)
    if (!input.success) {
      yield traced(tracing, input_not_in_schema, {
        closed_by: 'the_input',
        issues: issues_of(input.error),
      })
      return
    }
    // PER-5.4, PER-5.5: the nodes, then the leaf's limits, at every request,
    // a resume too (SC-32: a stream opened on 31 March, resumed on 1 April).
    const walked = await walk(leaf.nodes, entry.given)
    const point = walked.closed ? walked : limits_of(leaf, walked.context, input.data)
    if (point.closed) {
      yield traced(tracing, point.event, point.why)
      return
    }
    // The actions of a read, with their block of part 6.3: past the checks
    // of PER-5, which close a request before any read (SC-32).
    not_yet(leaf, [['actions', '6.3']])
    const binding = binding_of(
      leaf,
      called(called(leaf.declared['creator'], point.context), input.data),
    )
    const root = root_of(point.context)
    if (leaf.streaming !== undefined) {
      // A leaf that streams reads whole (SC-22): the snapshot, then the
      // stream from its position; from a position, the stream alone.
      const events = invoked_with(
        leaf.port,
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
            entries: entries.map((each: unknown) => entry_in(leaf, each)),
            position: event['position'],
            total: event['total'],
          }
          continue
        }
        yield stream_event_in(leaf, leaf.streaming, event)
      }
      return
    }
    const page = {
      ...(binding.size === undefined ? {} : { size: binding.size }),
      ...(resume === undefined ? {} : { after: resume }),
    }
    const pages = invoked_with(pages_of(leaf), [root, binding.query, page])
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
        entries: entries.map((each: unknown) => entry_in(leaf, each)),
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

const runtime_tree_ports = (
  ports: RuntimeTreePorts,
): ((wired: RuntimeWired) => Readonly<Record<string, unknown>>) => {
  const path_of = paths_in(ports.registry)
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
  const faults = [
    ...(top === undefined ? ['the top is not in the registry given (DOM-24)'] : []),
    ...leaves.flatMap(({ name, path }) => {
      if (path === undefined) return [`the leaf ${name} is not in the registry given (DOM-24)`]
      return [
        ...(path.endsWith(`/usecase/${name}`) ? [] : [`${path} is given as ${name} (DOM-24)`]),
        ...(top === undefined || is_at_or_above(folder_of(top), folder_of(path))
          ? []
          : [`${path} is not below the top, ${top} (PER-6)`]),
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
  if (faults.length > 0) throw new Error(faults.join('\n'))

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
      }
      return {
        leaf,
        own,
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
      built.map(({ leaf, own, streaming, following }): readonly [string, unknown] => {
        const entry = is_a_record(own) ? own['entry'] : undefined
        const events = is_a_record(own) ? own['events'] : undefined
        if (entry instanceof z.ZodObject) {
          return [
            leaf.name,
            read_leaf_port(
              { ...leaf, entry, ...(streaming === undefined ? {} : { streaming }) },
              ports.majors,
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
            ports.majors,
            wired.trace,
          ),
        ]
      }),
    )
  }
}
