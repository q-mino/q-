import * as z from 'zod'

// The JSON Schema export of a schema (DOM-21, TST-7): the shape a signature
// gives and takes, as JSON Schema (draft 2020-12), the snapshot CI compares
// with the one released (DOM-24). Exported on the input side, what a schema
// parses: a field with a default is optional there. What JSON Schema cannot
// tell is marked, never left as "anything": a field that must be absent
// (`z.undefined()`) accepts nothing (`not: {}`); a refinement, a function the
// shape does not show, `x-refined`; a form JSON Schema has no word for
// (a transform, a function, a date), `x-unrepresentable` with its zod type.
// A reader that cannot decide over a marked shape takes any change of it as a
// change.

/** A JSON value, as `JSON.parse` gives it. */
export type Json = null | boolean | number | string | readonly Json[] | JsonObject

/** A JSON object. */
export interface JsonObject {
  readonly [key: string]: Json
}

const is_a_record = (value: unknown): value is object =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** A value of plain data as JSON; anything that is not JSON fails. */
export const as_json = (value: unknown): Json => {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (Array.isArray(value)) return value.map((item: unknown) => as_json(item))
  if (is_a_record(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]: [string, unknown]) => [key, as_json(item)]),
    )
  }
  throw new Error(`not JSON: ${typeof value}`)
}

/** The zod types JSON Schema has no word for: marked, so that no reader takes them as "anything". */
const unrepresentable: ReadonlySet<string> = new Set([
  'bigint',
  'symbol',
  'void',
  'date',
  'map',
  'set',
  'transform',
  'nan',
  'custom',
  'function',
  'promise',
])

/** The JSON Schema of a schema, on its input side, with the marks of what JSON Schema cannot tell (DOM-21, TST-7). */
export const json_schema_of = (schema: z.ZodType): Json => {
  const whole = z.toJSONSchema(schema, {
    io: 'input',
    unrepresentable: 'any',
    override: (context) => {
      const definition = context.zodSchema._zod.def
      if (definition.type === 'undefined') context.jsonSchema.not = {}
      else if (unrepresentable.has(definition.type)) {
        context.jsonSchema['x-unrepresentable'] = definition.type
      }
      const checks = 'checks' in definition ? definition.checks : undefined
      if (checks?.some((check) => check._zod.def.check === 'custom') === true) {
        context.jsonSchema['x-refined'] = true
      }
    },
  })
  const json = as_json(whole)
  if (!is_a_record(json)) return json
  return Object.fromEntries(Object.entries(json).filter(([key]) => key !== '$schema'))
}
