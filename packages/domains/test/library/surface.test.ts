import { describe, expect, test } from 'vitest'
import { $UseCase, json_schema_of, the_surface_of, type Majors } from '../../src/library/index.ts'
import { majors as keeper_majors } from '../shed/persona/keeper/_majors.ts'
import {
  retire_a_tool,
  retire_a_tool_input,
  the_loans_of_the_month,
} from '../shed/persona/keeper/_usecase.ts'
import { registry as member_registry } from '../shed/persona/member/_registry.ts'
import { registry as member_1 } from '../shed/persona/member/1/_registry.ts'
import { borrow_a_tool } from '../shed/persona/member/_usecase.ts'

// The surface of the leaves below a folder, as data (EXT-10; part 12.4), on
// the library's test domains: what another unit reads to serve them from
// outside. Its JSON Schemas are the export's (`json_schema_of`, as the
// generator's snapshot, DOM-24); its events whole, as the tree port gives
// them.

describe('the surface of the leaves below a folder (EXT-10)', () => {
  test('Giorgio’s leaves: the version, the inputs and the events as the export gives them, whole', () => {
    const surface = the_surface_of({ majors: keeper_majors, at: 'persona/keeper' })
    expect(surface.version).toBe('1.0.0')
    expect(Object.keys(surface.majors)).toEqual(['1'])
    const retire = surface.majors['1']?.['usecase/retire_a_tool']
    expect(retire).toMatchObject({ kind: 'command', answers_in_one_event: true })
    expect(retire?.input).toEqual(json_schema_of(retire_a_tool_input))
    const events = Object.keys(retire?.events ?? {})
    expect(events).toContain('not_found')
    expect(events).not.toContain('refused')
    const own: Readonly<Record<string, Parameters<typeof json_schema_of>[0]>> =
      retire_a_tool[$UseCase].events
    expect(events).toEqual([...Object.keys(own), 'not_found'])
    for (const [name, payload] of Object.entries(own)) {
      expect(retire?.events[name]).toEqual({
        type: 'object',
        properties: {
          event: { type: 'string', const: name },
          payload: json_schema_of(payload),
        },
        required: ['event', 'payload'],
        additionalProperties: false,
      })
    }
    expect(retire?.events['not_found']).toEqual({
      type: 'object',
      properties: { event: { type: 'string', const: 'not_found' } },
      required: ['event'],
      additionalProperties: false,
    })
  })

  test('a leaf that follows does not answer in one event; a read gives its snapshot', () => {
    const surface = the_surface_of({ majors: keeper_majors, at: 'persona/keeper' })
    const loading = surface.majors['1']?.['usecase/load_tools_from_a_sheet']
    expect(loading?.answers_in_one_event).toBe(false)
    expect(loading?.events).toHaveProperty('the_wait_is_over')
    const month = surface.majors['1']?.['usecase/the_loans_of_the_month']
    expect(month).toMatchObject({ kind: 'read', answers_in_one_event: true })
    expect(Object.keys(month?.events ?? {})).toEqual(['snapshot', 'not_found'])
    expect(month?.events['snapshot']).toMatchObject({
      properties: {
        event: { const: 'snapshot' },
        entries: {
          type: 'array',
          items: json_schema_of(the_loans_of_the_month[$UseCase].entry),
        },
      },
    })
  })

  test('Marta’s borrowing at two majors: each its own events, the current leaf’s limit refused', () => {
    const majors = {
      2: {
        'persona/member/node/member': member_registry['persona/member/node/member'],
        'persona/member/usecase/borrow_a_tool':
          member_registry['persona/member/usecase/borrow_a_tool'],
        'persona/member/version/member': member_registry['persona/member/version/member'],
      },
      1: {
        'persona/member/usecase/borrow_a_tool': member_1['persona/member/usecase/borrow_a_tool'],
      },
    } satisfies Majors
    const surface = the_surface_of({ majors, at: 'persona/member' })
    expect(surface.version).toBe('2.0.0')
    const now = surface.majors['2']?.['usecase/borrow_a_tool']
    const then = surface.majors['1']?.['usecase/borrow_a_tool']
    expect(now?.events['refused']).toEqual({
      type: 'object',
      properties: {
        event: { type: 'string', const: 'refused' },
        reasons: {
          type: 'array',
          items: { type: 'string', enum: ['the_member_card_is_valid_today'] },
        },
      },
      required: ['event', 'reasons'],
      additionalProperties: false,
    })
    expect(then?.events['refused']).toEqual(now?.events['refused'])
    expect(now?.events['you_have_the_tool']).toMatchObject({
      properties: {
        payload: json_schema_of(borrow_a_tool[$UseCase].events.you_have_the_tool),
      },
    })
    expect(then?.events['you_have_the_tool']).toMatchObject({
      properties: { payload: { required: ['loan_id', 'tool_id', 'due_date'] } },
    })
  })

  test('Gianni’s reservations, a read leaf that streams: its snapshot, its stream’s events whole, not in one event (EXT-10, D72.5)', () => {
    const with_no_actions = Object.fromEntries(
      Object.entries(member_registry).filter(([path]) => !path.endsWith('/my_loans')),
    )
    const surface = the_surface_of({ majors: { 2: with_no_actions }, at: 'persona/member' })
    const reservations = surface.majors['2']?.['usecase/my_reservations']
    expect(reservations).toMatchObject({ kind: 'read', answers_in_one_event: false })
    expect(Object.keys(reservations?.events ?? {})).toEqual([
      'snapshot',
      'the_tool_you_booked_is_in_repair',
      'fact',
      'entered',
      'left',
      'caught_up',
      'position_unavailable',
      'not_found',
    ])
    expect(reservations?.events['left']).toMatchObject({
      required: ['event', 'position', 'identity'],
    })
    expect(reservations?.events['the_tool_you_booked_is_in_repair']).toMatchObject({
      required: ['event', 'position', 'identity', 'entry', 'payload'],
    })
    const catalogue = surface.majors['2']?.['usecase/the_shelf']
    expect(catalogue).toMatchObject({ kind: 'read', answers_in_one_event: false })
  })

  test('faults: a read leaf that lists actions, a folder its leaves are not below, majors with no version', () => {
    expect(() =>
      the_surface_of({ majors: { 2: member_registry, 1: member_1 }, at: 'persona/member' }),
    ).toThrow('a read leaf that lists actions has its surface with its case (EXT-10)')
    expect(() => the_surface_of({ majors: keeper_majors, at: 'persona/member' })).toThrow(
      'persona/keeper/usecase/retire_a_tool is not below persona/member (EXT-10)',
    )
    expect(() => the_surface_of({ majors: { 1: { ...member_1 } }, at: 'persona/member' })).toThrow(
      'the majors of persona/member do not declare one version under its major',
    )
  })
})
