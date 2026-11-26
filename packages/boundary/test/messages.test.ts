import { describe, expect, test } from 'vitest'
import * as boundary from '../src/index.ts'

// The messages of the boundary (EXT-2, EXT-15, EXT-16; part 12.4): one ADT
// per direction, every message a JSON value.

/** A message as it crosses an isolated realm's frame: copied as JSON (EXT-13). */
const copied = (message: unknown): unknown => JSON.parse(JSON.stringify(message))

const invocation = {
  message: 'invoke',
  id: 'I-1',
  persona: 'known',
  use_case: 'usecase/greet',
  version: '1.0.0',
  context: { bond: 'B-1' },
  operation: { id: 'R-1', scope: 'known/B-1' },
  input: { words: 'ciao' },
}

describe('from the kernel to an extension', () => {
  const samples = [
    invocation,
    {
      message: 'invoke',
      id: 'I-2',
      persona: 'self',
      use_case: 'usecase/the_greetings',
      version: '1.0.0',
      context: {},
      correlation: 'C-1',
      input: {},
    },
    {
      message: 'answer',
      id: 'K-1',
      port: 'the_port_of_requests',
      answer: { answer: 'responded', event: { event: 'greeted' } },
    },
    { message: 'answer', id: 'K-2', port: 'its_storage', answer: { answer: 'committed' } },
    { message: 'answer', id: 'K-3', port: 'its_storage', answer: { answer: 'read', entries: [] } },
    { message: 'end', id: 'I-2' },
    { message: 'start' },
    { message: 'stop' },
    { message: 'redeliver', letter: 'L-1' },
    { message: 'discard', letter: 'L-1', by: 'the user', reason: 'Bruno changed phone' },
  ]

  test('each parses as it crossed', () => {
    for (const message of samples) {
      expect(boundary.a_message_to_an_extension.parse(copied(message))).toEqual(message)
    }
  })

  test('refused: a value no JSON carries, an unknown field, an unknown message', () => {
    expect(
      boundary.a_message_to_an_extension.safeParse({ ...invocation, input: { at: new Date(0) } })
        .success,
    ).toBe(false)
    expect(
      boundary.a_message_to_an_extension.safeParse({ ...invocation, input: { words: undefined } })
        .success,
    ).toBe(false)
    expect(
      boundary.a_message_to_an_extension.safeParse({ ...invocation, input: Number.NaN }).success,
    ).toBe(false)
    expect(
      boundary.a_message_to_an_extension.safeParse({ ...invocation, extension: 'greetings' })
        .success,
    ).toBe(false)
    expect(boundary.a_message_to_an_extension.safeParse({ message: 'load' }).success).toBe(false)
    expect(
      boundary.a_message_to_an_extension.safeParse({
        message: 'answer',
        id: 'K-1',
        port: 'the_port_of_requests',
        answer: { answer: 'committed' },
      }).success,
    ).toBe(false)
  })
})

describe('from an extension to the kernel', () => {
  const samples = [
    { message: 'event', id: 'I-1', event: { event: 'greeted', words: 'ciao' } },
    { message: 'done', id: 'I-1' },
    {
      message: 'call',
      id: 'K-1',
      port: 'the_port_of_requests',
      request: {
        bond: 'B-1',
        invokes: { persona: 'known', use_case: 'usecase/greet', version: '1.0.0' },
        input: {},
        effect: 'business/greetings/effect/send_a_greeting',
        id: 'E-1',
        waits: 60,
      },
    },
    {
      message: 'call',
      id: 'K-2',
      port: 'its_storage',
      request: { call: 'read', read: { read: 'range', from: 'log/' } },
    },
    {
      message: 'call',
      id: 'K-3',
      port: 'its_storage',
      request: { call: 'commit', writes: [{ write: 'delete', key: 'a' }] },
    },
    { message: 'ready', name: 'greetings', version: '0.1.0', boundary_version: '1.0.0' },
    { message: 'fallen', why: 'TypeError: x is undefined' },
    {
      message: 'dead_letter',
      letter: 'L-1',
      of: 'an_effect',
      path: 'business/greetings/effect/send_a_greeting',
      entry: { id: 'E-1' },
      cause: { cause: 'exhausted', reason: 'the response does not parse' },
    },
    { message: 'released', letter: 'L-1' },
    { message: 'traced', entry: { leaf: 'usecase/greet', closed_by: 'the_input' } },
  ]

  test('each parses as it crossed', () => {
    for (const message of samples) {
      expect(boundary.a_message_from_an_extension.parse(copied(message))).toEqual(message)
    }
  })

  test('refused: a value no JSON carries, an event with no name, a call to no port', () => {
    expect(
      boundary.a_message_from_an_extension.safeParse({
        message: 'event',
        id: 'I-1',
        event: { event: 'greeted', at: () => 0 },
      }).success,
    ).toBe(false)
    expect(
      boundary.a_message_from_an_extension.safeParse({
        message: 'event',
        id: 'I-1',
        event: { words: 'ciao' },
      }).success,
    ).toBe(false)
    expect(
      boundary.a_message_from_an_extension.safeParse({
        message: 'traced',
        entry: { at: Number.POSITIVE_INFINITY },
      }).success,
    ).toBe(false)
    expect(
      boundary.a_message_from_an_extension.safeParse({
        message: 'call',
        id: 'K-1',
        port: 'the_kernels_bonds',
        request: {},
      }).success,
    ).toBe(false)
  })
})

describe('between a part and the kernel (EXT-16)', () => {
  test('to the part: its place with its data, the events of what it invoked or follows', () => {
    for (const message of [
      { message: 'placed', place: 'a_bond', data: { bond: 'B-1' } },
      { message: 'placed', place: 'the_extension', data: {} },
      { message: 'event', id: 'F-1', event: { event: 'snapshot', entries: [] } },
      { message: 'done', id: 'F-1' },
    ]) {
      expect(boundary.a_message_to_a_part.parse(copied(message))).toEqual(message)
    }
    expect(
      boundary.a_message_to_a_part.safeParse({
        message: 'placed',
        place: 'the_extension',
        data: { bond: 'B-1' },
      }).success,
    ).toBe(false)
  })

  test('from the part: its own extension’s leaves on self, no extension named, no persona', () => {
    for (const message of [
      {
        message: 'invoke',
        id: 'F-1',
        use_case: 'usecase/greet_a_bond',
        version: '1.0.0',
        input: { bond: 'B-1' },
      },
      {
        message: 'follow',
        id: 'F-2',
        use_case: 'usecase/the_greetings_of_a_bond',
        version: '1.0.0',
        input: {},
      },
    ]) {
      expect(boundary.a_message_from_a_part.parse(copied(message))).toEqual(message)
    }
    const invoke = {
      message: 'invoke',
      id: 'F-1',
      use_case: 'usecase/greet_a_bond',
      version: '1.0.0',
      input: {},
    }
    expect(
      boundary.a_message_from_a_part.safeParse({ ...invoke, extension: 'ping_pong' }).success,
    ).toBe(false)
    expect(boundary.a_message_from_a_part.safeParse({ ...invoke, persona: 'known' }).success).toBe(
      false,
    )
    expect(
      boundary.a_message_from_a_part.safeParse({ ...invoke, input: { at: 10n } }).success,
    ).toBe(false)
  })
})
