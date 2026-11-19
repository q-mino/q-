import type { Registry } from './registry.ts'

// What the ports meet at runtime and read the same way (part 5.1): a record's
// fields, a function of the domain called with its one argument, a
// component's path by object identity; two values the same, field by field
// (part 5.2). Internal, not exported from the index.

/** Whether a value is a record, to read its fields. */
export const is_a_record = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** A function of the domain called with its one argument (a creator, a schema of the context): its result, unknown until parsed. */
export const called = (callee: unknown, argument: unknown): unknown => {
  if (typeof callee !== 'function') throw new Error('a creator is not a function')
  const result: unknown = Reflect.apply(callee, undefined, [argument])
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
