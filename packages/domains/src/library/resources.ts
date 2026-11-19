import * as z from 'zod'
import type { Resource } from './envelope.ts'
import { $Resources } from './component.ts'

// The resources of a fact (DOM-10, V9): the identities in its payload, each
// by its path and value, which the library derives from the fact's schema,
// finding the identities in the registry; nobody writes them. A fact may
// declare narrower ones (SC-55): the fields of its payload that carry them.

/** Whether a value is a record, to read its fields. */
const is_a_record = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * The identities a value holds, by its schema, in the order of its fields
 * and elements: a schema that is an identity (`identity` gives its path)
 * holds the value itself; an object its fields', an optional, nullable,
 * default or read-only schema its inner one's when the value is there, an
 * array and a tuple their elements', a union the first option the value
 * parses with. Other schemas hold none.
 */
export const identities_in =
  (identity: (schema: unknown) => string | undefined) =>
  (schema: z.core.$ZodType, value: unknown): readonly Resource[] => {
    const walk = (node: z.core.$ZodType, held: unknown): readonly Resource[] => {
      const path = identity(node)
      if (path !== undefined) return [{ path, value: held }]
      if (held === undefined || held === null) return []
      if (node instanceof z.ZodObject) {
        const shape: z.core.$ZodShape = node.shape
        return is_a_record(held)
          ? Object.entries(shape).flatMap(([field, inner]) => walk(inner, held[field]))
          : []
      }
      if (
        node instanceof z.ZodOptional ||
        node instanceof z.ZodNullable ||
        node instanceof z.ZodDefault ||
        node instanceof z.ZodReadonly
      ) {
        return walk(node.unwrap(), held)
      }
      if (node instanceof z.ZodArray) {
        return Array.isArray(held)
          ? held.flatMap((element: unknown) => walk(node.element, element))
          : []
      }
      if (node instanceof z.ZodTuple) {
        return Array.isArray(held) ? node.def.items.flatMap((item, i) => walk(item, held[i])) : []
      }
      if (node instanceof z.ZodUnion) {
        const option = node.options.find((each) => z.safeParse(each, held).success)
        return option === undefined ? [] : walk(option, held)
      }
      return []
    }
    return walk(schema, value)
  }

/** The same resources once each, by path and value, in the order first met. */
const distinct = (resources: readonly Resource[]): readonly Resource[] =>
  resources.filter(
    (resource, i) =>
      resources.findIndex(
        (other) => other.path === resource.path && Object.is(other.value, resource.value),
      ) === i,
  )

/**
 * The resources of a part (DOM-10): every identity of its payload, or, if
 * its fact declares narrower ones (SC-55), those of the fields it names,
 * each with every identity it holds, at any depth; each once.
 */
export const resources_of =
  (identity: (schema: unknown) => string | undefined) =>
  (fact: z.ZodObject, payload: unknown): readonly Resource[] => {
    const declared: unknown = $Resources in fact ? fact[$Resources] : undefined
    const fields = Array.isArray(declared)
      ? declared.filter((field): field is string => typeof field === 'string')
      : undefined
    const holding = identities_in(identity)
    if (fields === undefined) return distinct(holding(fact, payload))
    return distinct(
      fields.flatMap((field) => {
        const shape: z.core.$ZodShape = fact.shape
        const inner = shape[field]
        return inner === undefined || !is_a_record(payload) ? [] : holding(inner, payload[field])
      }),
    )
  }
