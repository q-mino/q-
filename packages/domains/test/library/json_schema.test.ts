import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { json_schema_of } from '../../src/library/index.ts'

// The JSON Schema export of a schema (DOM-21, TST-7): its input side, and the
// marks of what JSON Schema cannot tell, never left as "anything".

describe('the JSON Schema export of a schema', () => {
  it('exports the input side of a strict object, a default making a field optional', () => {
    expect(
      json_schema_of(z.strictObject({ tool_id: z.string().min(1), size: z.number().default(50) })),
    ).toEqual({
      type: 'object',
      properties: {
        tool_id: { type: 'string', minLength: 1 },
        size: { type: 'number', default: 50 },
      },
      required: ['tool_id'],
      additionalProperties: false,
    })
  })

  it('marks a field that must be absent, a refinement and a form JSON Schema has no word for', () => {
    expect(
      json_schema_of(
        z.strictObject({
          retired_on: z.undefined().optional(),
          lines: z
            .array(z.string())
            .min(1)
            .refine((lines) => new Set(lines).size === lines.length),
          on: z.date(),
        }),
      ),
    ).toEqual({
      type: 'object',
      properties: {
        retired_on: { not: {} },
        lines: { type: 'array', items: { type: 'string' }, minItems: 1, 'x-refined': true },
        on: { 'x-unrepresentable': 'date' },
      },
      required: ['lines', 'on'],
      additionalProperties: false,
    })
  })

  it('tells nothing of a brand, which is in the types alone', () => {
    expect(json_schema_of(z.string().min(1).brand<'tools/id/tool_id'>())).toEqual(
      json_schema_of(z.string().min(1)),
    )
  })
})
