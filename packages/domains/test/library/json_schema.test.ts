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

  it('marks what zod’s reading of the export loses: a URL’s protocol, finite keys, an overwrite, a pipe, a Unicode pattern (EXT-6)', () => {
    expect(
      json_schema_of(
        z.strictObject({
          relay: z.url({ protocol: /^https$/ }).max(2048),
          counts: z.record(z.enum(['a', 'b']), z.number()),
          name: z.string().trim().min(1),
          code: z.string().pipe(z.string().min(2)),
          letters: z.string().regex(/^\p{L}+$/u),
          plain: z.string().regex(/^[a-z]+$/),
        }),
      ),
    ).toMatchObject({
      properties: {
        relay: { 'x-lossy': ['url'] },
        counts: { 'x-lossy': ['record_keys'] },
        name: { 'x-lossy': ['overwrite'] },
        code: { 'x-lossy': ['pipe'] },
        letters: { 'x-lossy': ['unicode_pattern'] },
        plain: { type: 'string', pattern: '^[a-z]+$' },
      },
    })
    expect(json_schema_of(z.string().regex(/^[a-z]+$/))).not.toHaveProperty('x-lossy')
  })

  it('tells nothing of a brand, which is in the types alone', () => {
    expect(json_schema_of(z.string().min(1).brand<'tools/id/tool_id'>())).toEqual(
      json_schema_of(z.string().min(1)),
    )
  })
})
