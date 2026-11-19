import type { Json, JsonObject } from '@q-mino/domains/library'

// A conservative inclusion over JSON Schema (DOM-24, PER-17): whether every
// value one schema accepts the other accepts too, decided over the forms the
// trees' zod schemas give, as the library exports them (`json_schema_of`):
// objects, strict or not; strings with their lengths, a pattern, a format;
// numbers and integers with their bounds; literals and enumerations; arrays
// and tuples; unions, discriminated or not; a nullable; a field that must be
// absent. What it cannot decide (a keyword it does not know, a refinement, a
// form JSON Schema has no word for) it answers no: a change, never a
// compatible one.

/** A JSON Schema: an object, or `true` (anything) and `false` (nothing). */
export type Schema = boolean | JsonObject

const annotations: ReadonlySet<string> = new Set([
  '$schema',
  'title',
  'description',
  'default',
  'examples',
  'deprecated',
  'readOnly',
  'writeOnly',
])

/** The marks of what the export cannot tell (`json_schema_of`): never decided, but by equality. */
const marks: readonly string[] = ['x-refined', 'x-unrepresentable']

const is_a_list = (json: Json | undefined): json is readonly Json[] => Array.isArray(json)

const is_an_object = (json: Json | undefined): json is JsonObject =>
  typeof json === 'object' && json !== null && !Array.isArray(json)

/** A JSON value as a schema, if it is one. */
export const as_schema = (json: Json | undefined): Schema | undefined =>
  typeof json === 'boolean' || is_an_object(json) ? json : undefined

/** Two JSON values the same, their keys in any order. */
export const same = (a: Json, b: Json): boolean => {
  if (is_a_list(a) || is_a_list(b)) {
    return (
      is_a_list(a) &&
      is_a_list(b) &&
      a.length === b.length &&
      a.every((item, index) => {
        const other = b[index]
        return other !== undefined && same(item, other)
      })
    )
  }
  if (is_an_object(a) || is_an_object(b)) {
    if (!is_an_object(a) || !is_an_object(b)) return false
    const keys = Object.keys(a)
    return (
      keys.length === Object.keys(b).length &&
      keys.every((key) => {
        const mine = a[key]
        const theirs = b[key]
        return mine !== undefined && theirs !== undefined && same(mine, theirs)
      })
    )
  }
  return a === b
}

/** A schema's constraints, its annotations left out. */
const constraints = (schema: JsonObject): JsonObject =>
  Object.fromEntries(Object.entries(schema).filter(([key]) => !annotations.has(key)))

const only = (schema: JsonObject, keys: readonly string[]): boolean =>
  Object.keys(schema).every((key) => keys.includes(key))

/** Whether a schema accepts nothing: `false`, or `not` anything. */
const nothing = (schema: Schema): boolean => {
  if (typeof schema === 'boolean') return !schema
  const not = schema['not']
  return not === true || (is_an_object(not) && Object.keys(constraints(not)).length === 0)
}

/** Whether a schema accepts anything: `true`, or no constraint. */
const anything = (schema: Schema): boolean =>
  typeof schema === 'boolean' ? schema : Object.keys(constraints(schema)).length === 0

const marked = (schema: JsonObject): boolean => marks.some((mark) => mark in schema)

/** The values of a literal or an enumeration, if the schema is one. */
const finite = (schema: JsonObject): readonly Json[] | undefined => {
  const literal = schema['const']
  if (literal !== undefined) return [literal]
  const values = schema['enum']
  return is_a_list(values) ? values : undefined
}

const strings = (json: Json | undefined): readonly string[] =>
  is_a_list(json) ? json.flatMap((item) => (typeof item === 'string' ? [item] : [])) : []

const number_or = (json: Json | undefined, otherwise: number): number =>
  typeof json === 'number' ? json : otherwise

/** All of some answers: no if one is no, undecided if one is undecided. */
const all = (answers: readonly (boolean | undefined)[]): boolean | undefined =>
  answers.includes(false) ? false : answers.includes(undefined) ? undefined : true

const type_holds = (type: string, value: Json): boolean => {
  switch (type) {
    case 'null':
      return value === null
    case 'boolean':
      return typeof value === 'boolean'
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number'
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value)
    case 'array':
      return is_a_list(value)
    case 'object':
      return is_an_object(value)
    default:
      return false
  }
}

/** Whether a schema accepts a value: yes, no, or undecided. */
const accepts = (schema: Schema, value: Json): boolean | undefined => {
  if (typeof schema === 'boolean') return schema
  const own = constraints(schema)
  if (marked(own)) return undefined
  return all(
    Object.entries(own).map(([key, constraint]): boolean | undefined => {
      switch (key) {
        case 'not':
          return nothing(schema) ? false : undefined
        case 'type':
          return typeof constraint === 'string' ? type_holds(constraint, value) : undefined
        case 'const':
          return same(constraint, value)
        case 'enum':
          return is_a_list(constraint) ? constraint.some((one) => same(one, value)) : undefined
        case 'anyOf':
        case 'oneOf': {
          const answers = is_a_list(constraint)
            ? constraint.map((branch) => {
                const one = as_schema(branch)
                return one === undefined ? undefined : accepts(one, value)
              })
            : [undefined]
          if (answers.includes(undefined)) return undefined
          const yes = answers.filter((answer) => answer === true).length
          return key === 'anyOf' ? yes > 0 : yes === 1
        }
        case 'minLength':
          return typeof value !== 'string' || value.length >= number_or(constraint, 0)
        case 'maxLength':
          return typeof value !== 'string' || value.length <= number_or(constraint, Infinity)
        case 'minimum':
          return typeof value !== 'number' || value >= number_or(constraint, -Infinity)
        case 'maximum':
          return typeof value !== 'number' || value <= number_or(constraint, Infinity)
        case 'exclusiveMinimum':
          return typeof value !== 'number' || value > number_or(constraint, -Infinity)
        case 'exclusiveMaximum':
          return typeof value !== 'number' || value < number_or(constraint, Infinity)
        case 'minItems':
          return !is_a_list(value) || value.length >= number_or(constraint, 0)
        case 'maxItems':
          return !is_a_list(value) || value.length <= number_or(constraint, Infinity)
        case 'required':
          return !is_an_object(value) || strings(constraint).every((name) => name in value)
        case 'properties':
        case 'additionalProperties': {
          if (!is_an_object(value)) return true
          const properties = is_an_object(own['properties']) ? own['properties'] : {}
          if (key === 'properties') {
            return all(
              Object.entries(properties).map(([name, property]) => {
                const one = as_schema(property)
                const field = value[name]
                return field === undefined
                  ? true
                  : one === undefined
                    ? undefined
                    : accepts(one, field)
              }),
            )
          }
          const others = as_schema(constraint)
          return all(
            Object.entries(value)
              .filter(([name]) => !(name in properties))
              .map(([, field]) => (others === undefined ? undefined : accepts(others, field))),
          )
        }
        case 'items':
        case 'prefixItems': {
          if (!is_a_list(value)) return true
          const prefix = is_a_list(own['prefixItems']) ? own['prefixItems'] : []
          if (key === 'prefixItems') {
            return all(
              prefix.map((item, index) => {
                const one = as_schema(item)
                const element = value[index]
                return element === undefined
                  ? true
                  : one === undefined
                    ? undefined
                    : accepts(one, element)
              }),
            )
          }
          const rest = as_schema(constraint)
          return all(
            value
              .slice(prefix.length)
              .map((element) => (rest === undefined ? undefined : accepts(rest, element))),
          )
        }
        default:
          return undefined
      }
    }),
  )
}

/** The branches of a union, when the schema is that union alone. */
const branches = (schema: JsonObject, key: 'anyOf' | 'oneOf'): readonly Schema[] | undefined => {
  const union = schema[key]
  if (!is_a_list(union) || !only(schema, [key])) return undefined
  const found = union.flatMap((branch) => {
    const one = as_schema(branch)
    return one === undefined ? [] : [one]
  })
  return found.length === union.length ? found : undefined
}

const type_of = (schema: JsonObject): string | undefined =>
  typeof schema['type'] === 'string' ? schema['type'] : undefined

/** Whether two schemas share no value, decided conservatively: a type, or a literal of a field both require (a discriminated union's). */
const disjoint = (a: Schema, b: Schema): boolean => {
  if (nothing(a) || nothing(b)) return true
  if (typeof a === 'boolean' || typeof b === 'boolean') return false
  const values = finite(a)
  if (values !== undefined) return values.every((value) => accepts(b, value) === false)
  const ta = type_of(a)
  const tb = type_of(b)
  const numeric = (type: string): boolean => type === 'number' || type === 'integer'
  if (ta !== undefined && tb !== undefined && ta !== tb && !(numeric(ta) && numeric(tb))) {
    return true
  }
  if (ta !== 'object' || tb !== 'object') return false
  const pa = is_an_object(a['properties']) ? a['properties'] : {}
  const pb = is_an_object(b['properties']) ? b['properties'] : {}
  const required = strings(b['required'])
  return strings(a['required'])
    .filter((name) => required.includes(name))
    .some((name) => {
      const mine = as_schema(pa[name])
      const theirs = as_schema(pb[name])
      return mine !== undefined && theirs !== undefined && disjoint(mine, theirs)
    })
}

interface Bound {
  readonly value: number
  readonly exclusive: boolean
}

const lower = (schema: JsonObject): Bound | undefined => {
  const inclusive = typeof schema['minimum'] === 'number' ? schema['minimum'] : undefined
  const exclusive =
    typeof schema['exclusiveMinimum'] === 'number' ? schema['exclusiveMinimum'] : undefined
  if (exclusive !== undefined && (inclusive === undefined || exclusive >= inclusive)) {
    return { value: exclusive, exclusive: true }
  }
  return inclusive === undefined ? undefined : { value: inclusive, exclusive: false }
}

const upper = (schema: JsonObject): Bound | undefined => {
  const inclusive = typeof schema['maximum'] === 'number' ? schema['maximum'] : undefined
  const exclusive =
    typeof schema['exclusiveMaximum'] === 'number' ? schema['exclusiveMaximum'] : undefined
  if (exclusive !== undefined && (inclusive === undefined || exclusive <= inclusive)) {
    return { value: exclusive, exclusive: true }
  }
  return inclusive === undefined ? undefined : { value: inclusive, exclusive: false }
}

/** Whether the inner bound is as tight as the outer one, on its side (`1` above, `-1` below). */
const tighter = (inner: Bound | undefined, outer: Bound | undefined, side: 1 | -1): boolean => {
  if (outer === undefined) return true
  if (inner === undefined) return false
  if (inner.value * side < outer.value * side) return true
  return inner.value === outer.value && (inner.exclusive || !outer.exclusive)
}

const strict_string = ['type', 'minLength', 'maxLength', 'pattern', 'format']
const strict_number = [
  'type',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
]
const strict_array = ['type', 'items', 'prefixItems', 'minItems', 'maxItems']
const strict_object = ['type', 'properties', 'required', 'additionalProperties']

const within_typed = (inner: JsonObject, outer: JsonObject, type: string): boolean => {
  switch (type) {
    case 'null':
    case 'boolean':
      return only(inner, ['type']) && only(outer, ['type'])
    case 'string':
      return (
        only(inner, strict_string) &&
        only(outer, strict_string) &&
        number_or(inner['minLength'], 0) >= number_or(outer['minLength'], 0) &&
        number_or(inner['maxLength'], Infinity) <= number_or(outer['maxLength'], Infinity) &&
        (outer['pattern'] === undefined ||
          (inner['pattern'] !== undefined && same(inner['pattern'], outer['pattern']))) &&
        (outer['format'] === undefined ||
          (inner['format'] !== undefined && same(inner['format'], outer['format'])))
      )
    case 'number':
    case 'integer': {
      const step = typeof outer['multipleOf'] === 'number' ? outer['multipleOf'] : undefined
      return (
        only(inner, strict_number) &&
        only(outer, strict_number) &&
        tighter(lower(inner), lower(outer), -1) &&
        tighter(upper(inner), upper(outer), 1) &&
        (step === undefined ||
          (typeof inner['multipleOf'] === 'number' && inner['multipleOf'] % step === 0))
      )
    }
    case 'array': {
      if (!only(inner, strict_array) || !only(outer, strict_array)) return false
      const inner_prefix = is_a_list(inner['prefixItems']) ? inner['prefixItems'] : []
      const outer_prefix = is_a_list(outer['prefixItems']) ? outer['prefixItems'] : []
      const inner_rest = as_schema(inner['items']) ?? true
      const outer_rest = as_schema(outer['items']) ?? true
      const longest = Math.max(inner_prefix.length, outer_prefix.length)
      const most = number_or(inner['maxItems'], Infinity)
      const positions = Array.from({ length: longest }, (_, index) => index).filter(
        (index) => index < most,
      )
      return (
        number_or(inner['minItems'], 0) >= number_or(outer['minItems'], 0) &&
        most <= number_or(outer['maxItems'], Infinity) &&
        positions.every((index) => {
          const mine = index < inner_prefix.length ? as_schema(inner_prefix[index]) : inner_rest
          const theirs = index < outer_prefix.length ? as_schema(outer_prefix[index]) : outer_rest
          return mine !== undefined && theirs !== undefined && within(mine, theirs)
        }) &&
        (most <= longest || within(inner_rest, outer_rest))
      )
    }
    case 'object': {
      if (!only(inner, strict_object) || !only(outer, strict_object)) return false
      const inner_properties = is_an_object(inner['properties']) ? inner['properties'] : {}
      const outer_properties = is_an_object(outer['properties']) ? outer['properties'] : {}
      const inner_others = as_schema(inner['additionalProperties']) ?? true
      const outer_others = as_schema(outer['additionalProperties']) ?? true
      const required = strings(inner['required'])
      return (
        strings(outer['required']).every((name) => required.includes(name)) &&
        Object.entries(inner_properties).every(([name, property]) => {
          const mine = as_schema(property)
          const theirs = as_schema(outer_properties[name]) ?? outer_others
          return mine !== undefined && within(mine, theirs)
        }) &&
        Object.entries(outer_properties)
          .filter(([name]) => !(name in inner_properties))
          .every(([, property]) => {
            const theirs = as_schema(property)
            return theirs !== undefined && within(inner_others, theirs)
          }) &&
        within(inner_others, outer_others)
      )
    }
    default:
      return false
  }
}

/**
 * Whether every value the inner schema accepts the outer one accepts too
 * (`within(old, new)`: the new schema only widens). Conservative: undecided
 * is no.
 */
export const within = (inner: Schema, outer: Schema): boolean => {
  if (nothing(inner) || anything(outer)) return true
  if (typeof inner === 'boolean' || typeof outer === 'boolean') return false
  const mine = constraints(inner)
  const theirs = constraints(outer)
  if (same(mine, theirs)) return true
  // A refinement only narrows what the rest of its schema accepts: the inner one is within that rest.
  if ('x-refined' in mine) {
    return within(
      Object.fromEntries(Object.entries(mine).filter(([key]) => key !== 'x-refined')),
      outer,
    )
  }
  if (marked(mine) || marked(theirs)) return false
  const own = branches(mine, 'anyOf') ?? branches(mine, 'oneOf')
  if (own !== undefined) return own.every((branch) => within(branch, outer))
  const any = branches(theirs, 'anyOf')
  if (any !== undefined) return any.some((branch) => within(inner, branch))
  const one = branches(theirs, 'oneOf')
  if (one !== undefined) {
    return one.some(
      (branch, index) =>
        within(inner, branch) && one.every((other, at) => at === index || disjoint(inner, other)),
    )
  }
  const values = finite(mine)
  if (values !== undefined) return values.every((value) => accepts(outer, value) === true)
  if (finite(theirs) !== undefined) return false
  const inner_type = type_of(mine)
  const outer_type = type_of(theirs)
  if (inner_type === undefined || outer_type === undefined) return false
  if (inner_type !== outer_type && !(inner_type === 'integer' && outer_type === 'number')) {
    return false
  }
  return within_typed(mine, theirs, outer_type)
}
