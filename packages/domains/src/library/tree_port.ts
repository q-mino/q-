import * as z from 'zod'
import { semver } from './format.ts'
import { correlation, operation_id } from './context.ts'
import type { Majors, Registry, Versions } from './registry.ts'
import type { FactLog } from './stream.ts'
import type { Invoked, TreeLeaves, TreePorts } from './tree.ts'
import { $Node } from './node.ts'
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

/** What the ports of a tree invoke, at runtime: the ports by folder, the fact log. */
interface RuntimeWired {
  readonly invoked: Readonly<Record<string, Readonly<Record<string, unknown>>>>
  readonly log: FactLog
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

/** A command leaf: its events, by name, with their schemas. */
interface CommandLeaf extends TreeLeaf {
  readonly events: Readonly<Record<string, z.ZodType>>
}

/** A read leaf: the schema of its own entry. */
interface ReadLeaf extends TreeLeaf {
  readonly entry: z.ZodObject
}

/** Where a walk down the nodes ends: the context of the leaf's point, or an event that closes the request. */
type Walked =
  | { readonly closed: false; readonly context: Context }
  | { readonly closed: true; readonly event: RuntimeLeafEvent }

/** What the entry gives a command's operation (DOM-11): its id and its scope, which the entry composes. */
const operation_given = z.strictObject({ id: operation_id, scope: z.string() })

/** The base event of a request whose input is not in its leaf's schema (PER-5.3, D106.3). */
const input_not_in_schema: RuntimeLeafEvent = {
  event: 'invalid_request',
  reason: 'input_not_in_schema',
}

/** A node's perimeter that fails, or a lookup not known (PER-14, D87.5): no reason. */
const not_found: Walked = { closed: true, event: { event: 'not_found' } }

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
 * finds it by the component a leaf or a node names), and the fact log a
 * leaf that follows reads, by correlation (`Follows`).
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
 * (D105.1).
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

/**
 * The lookups of a node (PER-9), each `of` a key from the context, which may
 * be not known: a key or a value not known closes the request with
 * `not_found`, a perimeter (D87.5); else what each found, by name.
 */
const looked_up = async (
  lookups: readonly NodeLookupAt[],
  context: Context,
): Promise<Context | undefined> => {
  const answers = await Promise.all(
    lookups.map(async (lookup): Promise<readonly [string, unknown] | undefined> => {
      const key = known(called(lookup.of, context))
      if (key === undefined) return undefined
      const value = known(await called(lookup.port, key.value))
      return value === undefined ? undefined : [lookup.name, value.value]
    }),
  )
  const found = answers.flatMap((answer) => (answer === undefined ? [] : [answer]))
  return found.length === lookups.length ? Object.fromEntries(found) : undefined
}

/** One node run in its order (PER-5, PER-6): it takes, looks up, is found only if, is refused unless, gives. */
const run = async (node: TreeNode, given: Context): Promise<Walked> => {
  const context = taken(node, given)
  const found = await looked_up(node.looks_up, context)
  if (found === undefined) return not_found
  if (node.is_found_only_if.some(([, condition]) => !holds(condition, context, found))) {
    return not_found
  }
  const refused = node.is_refused_unless.flatMap(([name, condition]) =>
    holds(condition, context, found) ? [] : [name],
  )
  if (refused.length > 0) return { closed: true, event: { event: 'refused', reasons: refused } }
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
    ? { closed: true, event: { event: 'refused', reasons: refused } }
    : { closed: false, context }
}

/**
 * The major of a request's version (PER-17, D72.7): the current one since
 * part 6.1; a past major, and the gate, with part 6.4. A version that is no
 * semver is a fault of the entry, thrown.
 */
const at_the_current_major = (leaf: TreeLeaf, majors: Majors, version: unknown): void => {
  const parsed = semver.safeParse(version)
  if (!parsed.success) throw new Error(`${leaf.path}: the entry gives no version (PER-17)`)
  const current = Math.max(...Object.keys(majors).map(Number))
  const major = Number(parsed.data.split('.')[0])
  if (major !== current) {
    throw new Error(
      `${leaf.path}: a request at ${parsed.data}, not of the current major ${String(current)}: past majors and the gate come with part 6.4`,
    )
  }
}

/** An event a projection gives, parsed by its leaf's schema of that event; another is the projection's fault, thrown. */
const event_of = (leaf: CommandLeaf, projected: unknown): RuntimeLeafEvent => {
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
const projected_outcome = (leaf: CommandLeaf, outcome: unknown): RuntimeLeafEvent => {
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
      return event_of(
        leaf,
        called_with(projection[branch], [own['payload'], outcome['composed'] ?? {}]),
      )
    }
    case 'rejected':
      return event_of(leaf, called(projection['rejected'], outcome['failures']))
    case 'identity_already_used':
      return { event: 'identity_already_used' }
    case 'invalid_request':
      return input_not_in_schema
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

/** A command leaf's port (PER-6, D45): its outcome, projected, the first event and a terminal one (D72.3). */
const command_leaf_port = (leaf: CommandLeaf, majors: Majors) =>
  async function* (context: unknown, sent: unknown): AsyncIterable<RuntimeLeafEvent> {
    // The leaf of an actor from outside, and a flow that follows, with their parts.
    not_yet(leaf, [
      ['operation', '6.2'],
      ['follows', '6.3'],
    ])
    const entry = entry_of(context)
    at_the_current_major(leaf, majors, entry.version)
    const operation = operation_given.safeParse(entry.operation)
    if (!operation.success) throw new Error(`${leaf.path}: the entry gives no operation (DOM-11)`)
    const origin = correlation.safeParse(entry.correlation)
    if (!origin.success) throw new Error(`${leaf.path}: the entry gives no correlation (DOM-10)`)
    // PER-5.3: the input in the leaf's schema, before any node.
    const input = schema_of(leaf.input, { ...entry.given, operation: operation.data }).safeParse(
      sent,
    )
    if (!input.success) {
      yield input_not_in_schema
      return
    }
    // PER-5.4, PER-5.5: the nodes of the path, then the leaf's own limits.
    const walked = await walk(leaf.nodes, entry.given)
    const point = walked.closed ? walked : limits_of(leaf, walked.context, input.data)
    if (point.closed) {
      yield point.event
      return
    }
    const below = called(
      called(leaf.declared['creator'], { ...point.context, operation: operation.data }),
      input.data,
    )
    const outcomes = invoked_with(leaf.port, [
      {
        ...root_of(point.context),
        operation: operation.data,
        correlation: origin.data,
        // D100, LIB-11: over the leaf's path and its input as sent, after the schema.
        fingerprint: fingerprint_of({ path: leaf.path, input: sent }),
      },
      below,
    ])
    for await (const outcome of outcomes) {
      yield projected_outcome(leaf, outcome)
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

/**
 * A read leaf's port (PER-18, SC-22): the snapshot alone, one per page, each
 * entry projected; an input or a cursor not in its schema as the base event
 * the port below gives.
 */
const read_leaf_port = (leaf: ReadLeaf, majors: Majors) => {
  async function* read(
    context: unknown,
    sent: unknown,
    after?: unknown,
  ): AsyncIterable<RuntimeLeafEvent> {
    // A stream and the actions of a read, with part 6.3.
    not_yet(leaf, [
      ['stream', '6.3'],
      ['actions', '6.3'],
    ])
    const entry = entry_of(context)
    at_the_current_major(leaf, majors, entry.version)
    // PER-5.3: the input in the leaf's schema, before any node.
    const input = schema_of(leaf.input, entry.given).safeParse(sent)
    if (!input.success) {
      yield input_not_in_schema
      return
    }
    const walked = await walk(leaf.nodes, entry.given)
    const point = walked.closed ? walked : limits_of(leaf, walked.context, input.data)
    if (point.closed) {
      yield point.event
      return
    }
    const binding = binding_of(
      leaf,
      called(called(leaf.declared['creator'], point.context), input.data),
    )
    const page = {
      ...(binding.size === undefined ? {} : { size: binding.size }),
      ...(after === undefined ? {} : { after }),
    }
    const pages = invoked_with(pages_of(leaf), [root_of(point.context), binding.query, page])
    for await (const event of pages) {
      if (!is_a_record(event)) throw new Error(`${leaf.path}: the port below gives no event`)
      if (event['event'] === 'invalid_request') {
        // An input the query does not take, or a cursor not of its order key (SC-22).
        yield { event: 'invalid_request', reason: event['reason'] }
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
  // A stream, with part 6.3: its port is `Streamed` when the leaf declares one.
  return Object.assign(read, { streamed: leaf.declared['stream'] !== undefined })
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
      const missing = [
        ...tree_nodes.flatMap((node) =>
          node.looks_up.flatMap((lookup) =>
            lookup.port === undefined
              ? [`${node.path} looks up ${lookup.name}, which no port given serves (CFG-2)`]
              : [],
          ),
        ),
        ...(port === undefined ? [`${path} invokes a use case no port given serves (CFG-2)`] : []),
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
      return { leaf, own, missing }
    })
    // A node above two leaves is named once.
    const wiring = [...new Set([...unserved, ...built.flatMap((each) => each.missing)])]
    if (wiring.length > 0) throw new Error(wiring.join('\n'))
    return Object.fromEntries(
      built.map(({ leaf, own }): readonly [string, unknown] => {
        const entry = is_a_record(own) ? own['entry'] : undefined
        const events = is_a_record(own) ? own['events'] : undefined
        if (entry instanceof z.ZodObject) {
          return [leaf.name, read_leaf_port({ ...leaf, entry }, ports.majors)]
        }
        if (!is_a_record(events)) throw new Error(`${leaf.path} declares no events (DOM-3)`)
        const schemas = Object.fromEntries(
          Object.entries(events).flatMap(([name, schema]) =>
            is_a_schema(schema) ? [[name, schema]] : [],
          ),
        )
        return [leaf.name, command_leaf_port({ ...leaf, events: schemas }, ports.majors)]
      }),
    )
  }
}
