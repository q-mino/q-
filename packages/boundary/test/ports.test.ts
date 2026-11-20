import { describe, expect, expectTypeOf, test } from 'vitest'
import * as boundary from '../src/index.ts'

// The ports an extension calls, typed by its manifest's `touches` (EXT-3
// "What its code may call", EXT-2 "Calls", EXT-14; part 12.4).

const requests_only = boundary.manifest({ name: 'greetings', touches: ['the_port_of_requests'] })
const both = boundary.manifest({
  name: 'greetings',
  touches: ['the_port_of_requests', 'its_storage'],
})

describe('the ports given to an extension’s configurator (EXT-3)', () => {
  test('exactly those its touches names: a port not declared cannot be named', () => {
    expect(requests_only.touches).toEqual(['the_port_of_requests'])
    expect(both.touches).toEqual(['the_port_of_requests', 'its_storage'])
    expectTypeOf<boundary.PortsOf<typeof requests_only>>().toHaveProperty('the_port_of_requests')
    expectTypeOf<boundary.PortsOf<typeof requests_only>>().not.toHaveProperty('its_storage')
    expectTypeOf<boundary.PortsOf<typeof both>>().toHaveProperty('its_storage')
  })

  test('each a function whose promise gives the call’s answer', () => {
    expectTypeOf<boundary.PortsOf<typeof both>['the_port_of_requests']>().returns.toEqualTypeOf<
      Promise<boundary.an_answer_to_a_request>
    >()
    expectTypeOf<boundary.PortsOf<typeof both>['its_storage']['commit']>().returns.toEqualTypeOf<
      Promise<boundary.an_answer_to_a_commit>
    >()
  })
})

describe('the port of requests (F7, EXT-2)', () => {
  const request = {
    bond: 'B-1',
    invokes: { persona: 'known', use_case: 'usecase/greet', version: '1.0.0' },
    input: { words: 'ciao' },
    effect: 'business/greetings/effect/send_a_greeting',
    id: 'E-1',
    waits: 60,
  }

  test('a request names the bond, its own leaf on known, the effect, the entry and the time it waits', () => {
    expect(boundary.a_request.parse(request)).toEqual(request)
    expect(boundary.a_request.safeParse({ ...request, extension: 'ping_pong' }).success).toBe(false)
    expect(
      boundary.a_request.safeParse({ ...request, invokes: { ...request.invokes, persona: 'self' } })
        .success,
    ).toBe(false)
    expect(boundary.a_request.safeParse({ ...request, waits: 0 }).success).toBe(false)
  })

  test('its answer is closed: responded, no response, the bond gone, refused with why', () => {
    for (const answer of [
      { answer: 'responded', event: { event: 'greeted' } },
      { answer: 'no_response' },
      { answer: 'the_bond_is_gone' },
      { answer: 'refused', why: 'not_offered_to_the_bond' },
    ]) {
      expect(boundary.an_answer_to_a_request.parse(answer)).toEqual(answer)
    }
    expect(
      boundary.an_answer_to_a_request.safeParse({ answer: 'refused', why: 'busy' }).success,
    ).toBe(false)
  })
})

describe('the storage, a partition (EXT-14)', () => {
  test('a read of keys or of a range, a commit of sets and deletes', () => {
    expect(boundary.a_read.parse({ read: 'keys', keys: ['a', 'b'] })).toEqual({
      read: 'keys',
      keys: ['a', 'b'],
    })
    expect(boundary.a_read.parse({ read: 'range', from: 'log/', before: 'log0' })).toEqual({
      read: 'range',
      from: 'log/',
      before: 'log0',
    })
    expect(boundary.a_read.parse({ read: 'range' })).toEqual({ read: 'range' })
    const writes = [
      { write: 'set', key: 'a', value: { n: 1 } },
      { write: 'delete', key: 'b' },
    ]
    expect(boundary.a_commit.parse(writes)).toEqual(writes)
    expect(boundary.a_commit.safeParse([{ write: 'set', key: 'a' }]).success).toBe(false)
  })

  test('the answers: the entries, committed, refused with why', () => {
    expect(
      boundary.an_answer_to_a_read.parse({ answer: 'read', entries: [{ key: 'a', value: 1 }] }),
    ).toEqual({ answer: 'read', entries: [{ key: 'a', value: 1 }] })
    expect(
      boundary.an_answer_to_a_commit.parse({ answer: 'refused', why: 'the_partition_is_full' }),
    ).toEqual({
      answer: 'refused',
      why: 'the_partition_is_full',
    })
    expect(
      boundary.an_answer_to_a_read.safeParse({ answer: 'refused', why: 'the_partition_is_full' })
        .success,
    ).toBe(false)
  })
})

describe('the kernel’s node above the mounted folders (EXT-5)', () => {
  test('what a response on known may carry beside the leaf’s events: not_found, the base events', () => {
    for (const event of [
      { event: 'not_found' },
      { event: 'invalid_request', reason: 'not_a_leaf' },
      { event: 'invalid_request', reason: 'input_not_in_schema' },
      { event: 'version_not_supported', current: '2.1.0', oldest: 1 },
      { event: 'identity_already_used' },
    ]) {
      expect(boundary.the_kernels_events_on_known.parse(event)).toEqual(event)
    }
    expect(
      boundary.the_kernels_events_on_known.safeParse({ event: 'not_found', reason: 'x' }).success,
    ).toBe(false)
    expect(boundary.a_base_event.safeParse({ event: 'not_found' }).success).toBe(false)
  })
})
