import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { json_schema_of } from '@q-mino/domains/library'
import { as_schema, within, type Schema } from '../src/index.ts'

// The conservative inclusion over JSON Schema (DOM-24, PER-17), on the zod
// forms the trees use, as the library exports them: whether every value the
// first accepts the second accepts too; what it cannot decide is no.

const schema = (of: z.ZodType): Schema => as_schema(json_schema_of(of)) ?? false

/** Whether every value `inner` parses, `outer` parses too, by their JSON Schema. */
const fits = (inner: z.ZodType, outer: z.ZodType): boolean => within(schema(inner), schema(outer))

describe('the inclusion over the zod forms of the trees', () => {
  it('widens an object by an optional field, a strict object never by a required one', () => {
    const before = z.strictObject({ tool_id: z.string().min(1) })
    const optional = z.strictObject({ tool_id: z.string().min(1), note: z.string().optional() })
    const required = z.strictObject({ tool_id: z.string().min(1), note: z.string() })
    expect(fits(before, optional)).toBe(true)
    expect(fits(optional, before)).toBe(false)
    expect(fits(before, required)).toBe(false)
    expect(fits(required, before)).toBe(false)
    // A field that must be absent (`z.undefined()`): absent fits, any value does not.
    const absent = z.strictObject({ tool_id: z.string(), retired_on: z.undefined().optional() })
    expect(fits(absent, z.strictObject({ tool_id: z.string() }))).toBe(true)
    expect(fits(absent, z.strictObject({ tool_id: z.string(), retired_on: z.string() }))).toBe(
      false,
    )
  })

  it('orders strings by their lengths, a pattern and a format kept, numbers by their bounds', () => {
    expect(fits(z.string().min(2).max(10), z.string().min(1).max(80))).toBe(true)
    expect(fits(z.string().min(1).max(80), z.string().min(2).max(10))).toBe(false)
    expect(fits(z.iso.date(), z.string())).toBe(true)
    expect(fits(z.string(), z.iso.date())).toBe(false)
    expect(fits(z.number().int().min(1).max(5), z.number().nonnegative())).toBe(true)
    expect(fits(z.number().nonnegative(), z.number().int())).toBe(false)
    expect(fits(z.number().positive(), z.number().nonnegative())).toBe(true)
    expect(fits(z.number().nonnegative(), z.number().positive())).toBe(false)
  })

  it('orders literals and enumerations by their values', () => {
    const three = z.enum(['garden', 'power', 'hand'])
    const four = z.enum(['garden', 'power', 'hand', 'ladder'])
    expect(fits(three, four)).toBe(true)
    expect(fits(four, three)).toBe(false)
    expect(fits(z.literal('hand'), three)).toBe(true)
    expect(fits(z.literal('ladder'), three)).toBe(false)
    expect(fits(three, z.string().min(1))).toBe(true)
    expect(fits(z.string().min(1), three)).toBe(false)
    expect(fits(three.nullable(), four.nullable())).toBe(true)
    expect(fits(three.nullable(), four)).toBe(false)
  })

  it('takes a discriminated union by its branches, one more branch wider', () => {
    const lent = z.strictObject({ state: z.literal('lent'), loan_id: z.string() })
    const free = z.strictObject({ state: z.literal('free') })
    const lost = z.strictObject({ state: z.literal('lost'), on: z.iso.date() })
    const two = z.discriminatedUnion('state', [lent, free])
    const three = z.discriminatedUnion('state', [lent, free, lost])
    expect(fits(two, three)).toBe(true)
    expect(fits(three, two)).toBe(false)
    expect(fits(free, two)).toBe(true)
    expect(fits(lost, two)).toBe(false)
  })

  it('orders arrays by their items and lengths, tuples by their positions', () => {
    expect(fits(z.array(z.string()).min(1).max(5), z.array(z.string()).max(50))).toBe(true)
    expect(fits(z.array(z.string()), z.array(z.string()).min(1))).toBe(false)
    expect(fits(z.array(z.literal('a')), z.array(z.string()))).toBe(true)
    expect(fits(z.tuple([z.literal('a')]), z.array(z.string()))).toBe(true)
    expect(fits(z.array(z.string()), z.tuple([z.string()]))).toBe(false)
  })

  it('decides nothing within a refinement or a form JSON Schema has no word for, but their equality', () => {
    const refined = z.strictObject({ day: z.iso.date() }).refine((input) => input.day !== '')
    expect(fits(refined, refined)).toBe(true)
    expect(fits(z.strictObject({ day: z.iso.date() }), refined)).toBe(false)
    // A refinement only narrows: the refined within the same schema unrefined, not the other way.
    expect(fits(refined, z.strictObject({ day: z.iso.date() }))).toBe(true)
    const dated = z.strictObject({ on: z.date() })
    expect(fits(dated, dated)).toBe(true)
    expect(fits(dated, z.unknown())).toBe(true)
    expect(fits(z.strictObject({ on: z.string() }), dated)).toBe(false)
  })
})
