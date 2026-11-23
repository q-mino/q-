import { describe, expect, test } from 'vitest'
import { the_device_s_network, type AWindowOfTheNetwork } from '../../src/index.ts'

// The device's network (WEB-4; UI-5's strip): `navigator.onLine` false is
// no network for sure, true tells nothing; the page's `online` and
// `offline` events told to whoever listens. A fake `navigator` and `window`,
// by the parts the source uses (WEB-5).

type Event = 'online' | 'offline'

/** A page whose network the test turns off and on, firing the browser's events. */
const a_page = () => {
  const navigator = { onLine: true }
  const listeners = new Map<Event, Set<() => void>>([
    ['online', new Set()],
    ['offline', new Set()],
  ])
  const window: AWindowOfTheNetwork = {
    addEventListener: (type, listener) => listeners.get(type)?.add(listener),
    removeEventListener: (type, listener) => listeners.get(type)?.delete(listener),
  }
  const goes = (event: Event): void => {
    navigator.onLine = event === 'online'
    for (const listener of listeners.get(event) ?? []) listener()
  }
  const listening = (): number => [...listeners.values()].reduce((n, each) => n + each.size, 0)
  return { navigator, window, goes, listening }
}

describe("the device's network", () => {
  test('no network is told for sure; a network tells nothing', () => {
    const page = a_page()
    const network = the_device_s_network(page)
    expect(network.now()).toBe('not_told')
    page.goes('offline')
    expect(network.now()).toBe('offline')
    page.goes('online')
    expect(network.now()).toBe('not_told')
  })

  test('tells whoever listens at each change, until it stops listening', () => {
    const page = a_page()
    const network = the_device_s_network(page)
    const told: string[] = []
    const stop = network.when_it_changes(() => told.push(network.now()))
    page.goes('offline')
    page.goes('online')
    expect(told).toEqual(['offline', 'not_told'])
    stop()
    expect(page.listening()).toBe(0)
    page.goes('offline')
    expect(told).toEqual(['offline', 'not_told'])
  })
})
