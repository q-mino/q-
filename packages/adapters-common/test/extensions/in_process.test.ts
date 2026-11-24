import type * as boundary from '@q-mino/boundary'
import { describe, expect, test } from 'vitest'
import { in_process, type AnExtensionsSide } from '../../src/index.ts'

// The transport to an extension integrated in the kernel's process (EXT-13):
// its side given now or once its package is imported, what the kernel sends
// meanwhile waiting for it in order; an import that fails, its fall; every
// message copied as JSON; unloaded, it neither hears nor speaks.

const start: boundary.a_message_to_an_extension = { message: 'start' }
const stop: boundary.a_message_to_an_extension = { message: 'stop' }

/** A side that keeps what it receives. */
const a_side_that_keeps = (): AnExtensionsSide & { readonly received: unknown[] } => {
  const received: unknown[] = []
  return {
    received,
    receive: (message) => {
      received.push(message)
      return Promise.resolve()
    },
  }
}

/** A promise and how to settle it. */
const later = <T>() => {
  let settle: { resolve: (value: T) => void; reject: (why: unknown) => void } | undefined
  const promise = new Promise<T>((resolve, reject) => {
    settle = { resolve, reject }
  })
  if (settle === undefined) throw new Error('the promise has no hands')
  return { promise, ...settle }
}

const a_turn = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

describe('an extension in process', () => {
  test('its side given now: each message handed at once, copied', () => {
    const side = a_side_that_keeps()
    const sent = start
    in_process(() => side)(() => undefined).to_the_extension(sent)
    expect(side.received).toEqual([sent])
    expect(side.received[0]).not.toBe(sent)
  })

  test('its side given once imported: what the kernel sent meanwhile waits, in order', async () => {
    const side = a_side_that_keeps()
    const imported = later<AnExtensionsSide>()
    const transport = in_process(() => imported.promise)(() => undefined)
    transport.to_the_extension(stop)
    transport.to_the_extension(start)
    expect(side.received).toEqual([])
    imported.resolve(side)
    await a_turn()
    transport.to_the_extension(stop)
    expect(side.received).toEqual([stop, start, stop])
  })

  test('an import that fails is its fall', async () => {
    const told: unknown[] = []
    in_process(() => Promise.reject(new Error('offline')))((message) => told.push(message))
    await a_turn()
    expect(told).toEqual([{ message: 'fallen', why: 'offline' }])
  })

  test('unloaded before its side comes: it hears nothing, and says nothing', async () => {
    const side = a_side_that_keeps()
    const told: unknown[] = []
    const imported = later<AnExtensionsSide>()
    const transport = in_process((send) =>
      imported.promise.then((it) => {
        send({ message: 'ready' })
        return it
      }),
    )((message) => told.push(message))
    transport.to_the_extension(start)
    transport.unload()
    imported.resolve(side)
    await a_turn()
    expect(side.received).toEqual([])
    expect(told).toEqual([])
  })

  test('a message its side throws on is its fall', async () => {
    const told: unknown[] = []
    in_process(() => ({ receive: () => Promise.reject(new Error('broken')) }))((message) =>
      told.push(message),
    ).to_the_extension(start)
    await a_turn()
    expect(told).toEqual([{ message: 'fallen', why: 'broken' }])
  })
})
