import type { Registry } from './registry.ts'
import type { Operation, fingerprint } from './context.ts'

// What the ports meet at runtime and read the same way (part 5.1): a record's
// fields, a function of the domain called with its one argument, a
// component's path by object identity; two values the same, field by field
// (part 5.2); what a port serves (part 6.1). Internal, not exported from the
// index.

/**
 * The mark of a port the library builds (part 6.1): the component it serves
 * and its path, which a tree reads to find the port of the use case or the
 * lookup its leaves and nodes invoke (`tree_ports`), by the component
 * itself, so that the configurator gives the ports as their adapters give
 * them and a tree needs no registry of the domains it invokes.
 */
export const $Serves: unique symbol = Symbol('Serves')

/**
 * The duplicate branch of a command's port, looked up alone (PER-5, "A
 * retry after the input's window over `now` moved", A, 19 Nov 2026): what
 * the operation of a request recorded, before anything is parsed, which a
 * command leaf asks first; the library's own, so not in the port's type.
 */
export const $Recorded: unique symbol = Symbol('Recorded')

/**
 * What a command's operation recorded, looked up alone, at runtime (PER-5):
 * with the same fingerprint, the fact recorded, as the outcome it was; with
 * another, `identity_already_used`; nothing, `not_recorded`.
 */
export type RecordedLookup = (context: {
  readonly operation: Operation
  readonly fingerprint: fingerprint
}) => Promise<unknown>

/** The duplicate branch a port looks up alone (`$Recorded`), if the library built it with one. */
export const recorded_lookup_of = (port: unknown): RecordedLookup | undefined => {
  if (typeof port !== 'function' || !($Recorded in port)) return undefined
  const lookup: unknown = port[$Recorded]
  return typeof lookup === 'function'
    ? (context) => Promise.resolve<unknown>(Reflect.apply(lookup, undefined, [context]))
    : undefined
}

/**
 * What a read use case's port serves beside its use case (part 6.3): the
 * path of its entries' identity and the paths of the facts it names, so that
 * a leaf over it finds the part of a fact that touches an entry (DOM-17),
 * with no registry of the business.
 */
export interface ReadServed {
  readonly identity: string
  readonly facts: readonly string[]
}

/** What a port the library builds serves: a component, by its path; a read's entries too. */
export interface Served {
  readonly component: unknown
  readonly path: string
  readonly read?: ReadServed
}

/** A port, freshly built, marked with what it serves. */
export const serving = <port extends object>(
  port: port,
  served: Served,
): port & { readonly [$Serves]: Served } => Object.assign(port, { [$Serves]: served })

/** What a port serves, if the library built it; nothing for any other value. */
export const served_by = (port: unknown): Served | undefined => {
  if ((typeof port !== 'function' && typeof port !== 'object') || port === null) return undefined
  if (!($Serves in port)) return undefined
  const served: unknown = port[$Serves]
  if (!is_a_record(served) || typeof served['path'] !== 'string') return undefined
  const read = served['read']
  return {
    component: served['component'],
    path: served['path'],
    ...(is_a_record(read) &&
    typeof read['identity'] === 'string' &&
    Array.isArray(read['facts']) &&
    read['facts'].every((fact: unknown) => typeof fact === 'string')
      ? { read: { identity: read['identity'], facts: read['facts'] } }
      : {}),
  }
}

/** The folder of a component's path: its segments before the kind and the name. */
export const folder_of = (path: string): string => path.split('/').slice(0, -2).join('/')

/** Whether a folder is the other or holds it. */
export const is_at_or_above = (folder: string, below: string): boolean =>
  below === folder || below.startsWith(`${folder}/`)

/** Whether a value is a record, to read its fields. */
export const is_a_record = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** A function of the domain called with its one argument (a creator, a schema of the context): its result, unknown until parsed. */
export const called = (callee: unknown, argument: unknown): unknown => {
  if (typeof callee !== 'function') throw new Error('a creator is not a function')
  const result: unknown = Reflect.apply(callee, undefined, [argument])
  return result
}

/** A function of the domain called with its arguments (a projection, a fact and its composed parts): its result, unknown until parsed. */
export const called_with = (callee: unknown, args: readonly unknown[]): unknown => {
  if (typeof callee !== 'function') throw new Error('a creator is not a function')
  const result: unknown = Reflect.apply(callee, undefined, args)
  return result
}

/** The registry read in reverse: a component's path, by object identity (DOM-24). */
export const paths_in = (registry: Registry): ((component: unknown) => string | undefined) => {
  const paths = new Map<unknown, string>(
    Object.entries(registry).map(([path, entry]) => [entry, path]),
  )
  return (component) => paths.get(component)
}

/**
 * Whether two values are the same, field by field and deeply: how a composed
 * stream compares an entry that stays with itself before a fact (SC-19), as
 * the oracle does (DOM-17). Entries are parsed data: records, lists, values.
 */
export const same_value = (a: unknown, b: unknown): boolean => {
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return Object.is(a, b)
  }
  const other = new Map<string, unknown>(Object.entries(b))
  return (
    Array.isArray(a) === Array.isArray(b) &&
    Object.keys(a).length === other.size &&
    Object.entries(a).every(([key, value]) => other.has(key) && same_value(value, other.get(key)))
  )
}
