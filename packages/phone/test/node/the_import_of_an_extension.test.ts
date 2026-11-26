import { describe, expect, test } from 'vitest'
import { the_import_of_an_extension, the_pauses_of_an_import } from '../../src/node/index.ts'

// The import of an extension's configurator, tried again after a pause
// (PWA-3; part M3): refused by the network (GitHub Pages' 429 after a cold
// start), it is made again; failing for good, it falls once the pauses are
// over.

/** The time that passes, recorded and over at once. */
const a_clock_of_pauses = () => {
  const paused: number[] = []
  return {
    paused,
    elapsed: (milliseconds: number): Promise<void> => {
      paused.push(milliseconds)
      return Promise.resolve()
    },
  }
}

describe('the import of an extension (PWA-3)', () => {
  test('refused twice by the network, then imported: two pauses, the module', async () => {
    const time = a_clock_of_pauses()
    let tries = 0
    const module = await the_import_of_an_extension(time.elapsed)(() => {
      tries += 1
      return tries <= 2
        ? Promise.reject(new TypeError('Failed to fetch dynamically imported module'))
        : Promise.resolve({ name: 'ping_pong' })
    })
    expect(module).toEqual({ name: 'ping_pong' })
    expect(time.paused).toEqual([2_000, 4_000])
  })

  test('failing for good: every pause, then its last failure, the extension’s fall (EXT-15)', async () => {
    const time = a_clock_of_pauses()
    let tries = 0
    await expect(
      the_import_of_an_extension(time.elapsed)(() => {
        tries += 1
        return Promise.reject(new Error(`a broken release, try ${String(tries)}`))
      }),
    ).rejects.toThrow('a broken release, try 5')
    expect(time.paused).toEqual(the_pauses_of_an_import)
  })
})
