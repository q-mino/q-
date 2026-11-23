import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import {
  $Calculation,
  $Command,
  $Composed,
  $Composition,
  $Delegated,
  $Each,
  $Earlier,
  $GivenByTheCaller,
  $Lookup,
  $Order,
  $Query,
  $Resources,
  $Version,
  builders_at,
  date_time,
  operation_id,
  time_zone,
  composes,
  each,
  given_by_the_caller,
  kind_of,
  pick,
} from '../../src/library/index.ts'
import type { RootContext } from '../../src/library/index.ts'

// The language at runtime (part 3.2, DOM-25): each builder gives back its
// parts with its kind, the schemas built with zod; what only the types know
// is not there. The components here are bare (no generator brands them), so
// only what holds before the brands is checked; Shed's, branded, in
// `builders.test.ts`.

const {
  id,
  fact,
  predicate,
  selection,
  calculation,
  effect,
  AND,
  OR,
  NOT,
  command,
  query,
  lookup,
  version,
  earlier,
  delegate,
} = builders_at<RootContext>()

describe('the components that are schemas', () => {
  const format = z.string().min(1)
  const tool_id = id({ format })

  test('an identity is a copy of its format, marked: one object, one path', () => {
    expect(tool_id).not.toBe(format)
    expect(tool_id.parse('T1')).toBe('T1')
    expect(tool_id.safeParse('').success).toBe(false)
    expect(kind_of(tool_id)).toEqual({ kind: 'id' })
    expect(kind_of(format)).toBeUndefined()
  })

  test('a fact declares its resources, or carries none', () => {
    const payload = z.object({ tool_id: format })
    const added = fact({ payload })
    expect(added).not.toBe(payload)
    expect(kind_of(added)).toEqual({ kind: 'fact' })
    expect($Resources in added).toBe(false)
    expect(added.parse({ tool_id: 'T1' })).toEqual({ tool_id: 'T1' })
  })

  test('a selection predicate and a calculation tell their subject', () => {
    const parameters = z.object({ day: z.string() })
    expect(kind_of(selection({ subject: 'loan', parameters }))).toEqual({
      kind: 'selection',
      subject: 'loan',
    })
    const loans = calculation({ subject: 'tool', parameters, value: z.number() })
    expect(kind_of(loans)).toEqual({ kind: 'calculation', subject: 'tool' })
    expect(loans[$Calculation].value.parse(3)).toBe(3)
  })

  test('an effect declares its order, or carries none: the order per resource', () => {
    const payload = z.object({ member: z.string() })
    expect($Order in effect({ payload })).toBe(false)
    expect(effect({ payload, order: 'any' })[$Order]).toBe('any')
    expect(kind_of(effect({ payload }))).toEqual({ kind: 'effect' })
  })
})

describe('conditions', () => {
  // Branded with their paths, as the generator brands them (DOM-24).
  const a_tool_has_this_id = predicate({
    parameters: z.object({ tool_id: z.string() }),
  }).brand<'business/tools/predicate/a_tool_has_this_id'>()
  const the_tool_is_in_service = predicate({
    parameters: z.object({ tool_id: z.string() }),
  }).brand<'business/tools/predicate/the_tool_is_in_service'>()

  test('AND is the strict object of its named components, its operands under its operator', () => {
    const the_tool_can_be_lent = AND({
      a_tool_has_the_requested_id: a_tool_has_this_id,
      the_tool_is_in_service,
    })
    expect(kind_of(the_tool_can_be_lent)).toEqual({ kind: 'condition' })
    expect(the_tool_can_be_lent[$Composed].and?.the_tool_is_in_service).toBe(the_tool_is_in_service)
    const bound = {
      a_tool_has_the_requested_id: { tool_id: 'T1' },
      the_tool_is_in_service: { tool_id: 'T1' },
    }
    expect(the_tool_can_be_lent.parse(bound)).toEqual(bound)
    expect(the_tool_can_be_lent.safeParse({ ...bound, more: {} }).success).toBe(false)
    expect(OR({ a: a_tool_has_this_id })[$Composed].or?.a).toBe(a_tool_has_this_id)
  })

  test("NOT takes its condition's parameters, in a copy of its schema", () => {
    const the_tool_is_new = NOT(a_tool_has_this_id)
    expect(the_tool_is_new).not.toBe(a_tool_has_this_id)
    expect(the_tool_is_new[$Composed].not).toBe(a_tool_has_this_id)
    expect(the_tool_is_new.parse({ tool_id: 'T1' })).toEqual({ tool_id: 'T1' })
  })

  test('NOT over a composed condition: its value tells its own operator alone', () => {
    const both = AND({ a: a_tool_has_this_id, b: the_tool_is_in_service })
    const not_both = NOT(both)
    expect(not_both[$Composed].not).toBe(both)
    expect(not_both[$Composed].and).toBeUndefined()
    expect(not_both.safeParse({ a: { tool_id: 'T1' }, b: { tool_id: 'T1' }, c: {} }).success).toBe(
      false,
    )
  })
})

describe('commands and queries', () => {
  const a_tool_has_this_id = predicate({
    parameters: z.object({ tool_id: z.string() }),
  }).brand<'business/tools/predicate/a_tool_has_this_id'>()
  const a_tool_has_been_retired = fact({
    payload: z.object({ tool_id: z.string() }),
  }).brand<'business/tools/fact/a_tool_has_been_retired'>()
  const send_a_notice = effect({
    payload: z.object({ tool_id: z.string() }),
  }).brand<'business/tools/effect/send_a_notice'>()
  const effects = { send_a_notice, wait_until_the_eve: send_a_notice }
  const input = z.object({ tool_id: z.string() })

  const retire_a_tool = command({
    input,
    outcomes: {
      the_tool_is_retired: [
        a_tool_has_this_id,
        a_tool_has_been_retired,
        pick(effects, 'send_a_notice'),
      ],
    },
    creator: () => (given) => ({
      the_tool_is_retired: [
        { tool_id: given.tool_id },
        { tool_id: given.tool_id },
        { send_a_notice: { id: given.tool_id, payload: { tool_id: given.tool_id } } },
      ],
    }),
  })

  test('a command is its creator, with its input as declared and its branches', () => {
    expect(kind_of(retire_a_tool)).toEqual({ kind: 'command' })
    expect(retire_a_tool.input).toBe(input)
    expect(Object.keys(retire_a_tool[$Command].outcomes)).toEqual(['the_tool_is_retired'])
    expect(retire_a_tool[$Command].input).toBeUndefined()
    const context = {
      now: date_time.parse('2026-11-19T09:00:00.000Z'),
      time_zone: time_zone.parse('Europe/Rome'),
      operation: { id: operation_id.parse('O-1'), scope: 'keeper/K-1' },
    }
    expect(retire_a_tool(context)({ tool_id: 'T1' }).the_tool_is_retired[2]).toEqual({
      send_a_notice: { id: 'T1', payload: { tool_id: 'T1' } },
    })
  })

  test('pick names some members of a namespace, the same objects, no others', () => {
    const picked = pick(effects, 'send_a_notice')
    expect(Object.keys(picked)).toEqual(['send_a_notice'])
    expect(picked.send_a_notice).toBe(send_a_notice)
  })

  test('composes and each name the transitions a branch applies', () => {
    expect(composes({ the_line_is_loaded: retire_a_tool })[$Composition].the_line_is_loaded).toBe(
      retire_a_tool,
    )
    expect(each(retire_a_tool)[$Each]).toBe(retire_a_tool)
  })

  test('a query is its creator, with its shape; its calculations only if it has some', () => {
    const the_tool_is_shown = selection({
      subject: 'tool',
      parameters: z.object({}),
    }).brand<'business/tools/selection/tool/the_tool_is_shown'>()
    const the_catalogue = query({
      input: z.object({}),
      fields: z.object({ tool_id: id({ format: z.string() }).brand<'tools/id/tool_id'>() }),
      identity: 'tool_id',
      selection: the_tool_is_shown,
      order: { tool_id: 'ascending' },
      creator: () => () => ({ selection: {} }),
    })
    expect(kind_of(the_catalogue)).toEqual({ kind: 'query' })
    expect(the_catalogue[$Query].identity).toBe('tool_id')
    expect(the_catalogue[$Query].selection).toBe(the_tool_is_shown)
    expect('calculations' in the_catalogue[$Query]).toBe(false)
  })
})

describe('the other components', () => {
  test('a lookup is its key and its value; a version its number', () => {
    const key = z.string()
    const hats = lookup({ key, value: z.array(z.string()) })
    expect(hats[$Lookup].key).toBe(key)
    expect(kind_of(hats)).toEqual({ kind: 'lookup' })
    expect(version('2.0.0')[$Version]).toBe('2.0.0')
  })

  test("a component of a past major tells the next's kind", () => {
    const next = fact({
      payload: z.object({ due_day: z.string() }),
    }).brand<'business/loans/fact/a_tool_has_been_lent'>()
    const to_next = (payload: { readonly due_date: string }) => ({
      due_day: payload.due_date.slice(0, 10),
    })
    const lent = earlier(next)({ payload: z.object({ due_date: z.string() }), to_next })
    expect(kind_of(lent)).toEqual({ kind: 'fact' })
    expect(lent[$Earlier].next).toBe(next)
    expect(lent[$Earlier].to_next).toBe(to_next)
    expect(lent.parse({ due_date: '2026-11-16T23:59:59.999Z' })).toEqual({
      due_date: '2026-11-16T23:59:59.999Z',
    })
    const again = delegate(next)
    expect(again[$Delegated]).toBe(next)
    expect(kind_of(again)).toEqual({ kind: 'fact' })
    expect(kind_of(delegate(z.object({})))).toBeUndefined()
  })

  test('a field the caller gives later is a mark, carried, never read', () => {
    expect(given_by_the_caller[$GivenByTheCaller]).toBe(true)
  })

  test('every builder at a point', () => {
    expect(Object.keys(builders_at<RootContext>()).sort()).toEqual(
      [
        'id',
        'fact',
        'predicate',
        'selection',
        'calculation',
        'effect',
        'AND',
        'OR',
        'NOT',
        'command',
        'cursor_step',
        'query',
        'command_use_case',
        'read_use_case',
        'command_use_case_over',
        'read_use_case_over',
        'lookup',
        'reaction',
        'node',
        'version',
        'earlier',
        'delegate',
      ].sort(),
    )
  })
})
