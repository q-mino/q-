import { afterAll, expect, vi } from 'vitest'
import { libsodium_primitives } from '@q-mino/adapters-common'
import { the_relay_s_http_transports } from '@q-mino/adapters-web'
import { a_relay_served } from '../relay/served.ts'
import { fake_primitives } from '../seals/primitives.ts'
import { the_relay, type AFactory } from './harness.ts'
import { stories_of_the_stack } from './stories.ts'
import type { Primitives } from '@q-mino/domains/seals/safe/_dsl.ts'

// The scenarios of stage 1 over HTTP (step 20; WEB-7, TST-1, TST-4): each
// story's relay is the relay's configurator over SQLite (MBX-8), its
// interface served on a port of this machine (MBX-9), opened with the story
// and closed at its end; the phones' transports are the relay's HTTP client
// (WEB-6), the page's `fetch` taking the relay's address to the server. The
// relay's waits run in the story's world, on its clock. The fault plans
// decorate the client's transports, as they decorate the stack's in process
// (ADP-5); the faults of the network below the client are its own tests'
// (`../relay/over_http.test.ts`).

// Each test has fifteen seconds, as on the oracle (`stack.test.ts`): a
// scenario turns on real timers, round after round.
vi.setConfig({ testTimeout: 15_000 })

/** A time that never passes: the relay is never unheard in a story (the longest wait is the client's own tests'). */
const no_time = (): Promise<void> => new Promise<void>(() => undefined)

/** The requests the relays served handed to the relay's interface, over every story of this file. */
let served_in_all = 0

/** The factory over HTTP (TST-1): the relay served, in the story's world, and the client to it. */
const over_http = (primitives: Primitives): AFactory => ({
  primitives,
  relay: async (world) => {
    const served = await a_relay_served(world, the_relay)
    const waits = served.relay.waits()
    const transports = the_relay_s_http_transports({ fetch: served.fetch, elapsed: no_time })
    return {
      transports: () => transports,
      stops: async () => {
        served_in_all += served.served()
        await waits.stop()
        await served.closes()
      },
    }
  },
})

stories_of_the_stack('over HTTP, the relay on SQLite, fake primitives', over_http(fake_primitives))
stories_of_the_stack(
  'over HTTP, the relay on SQLite, libsodium',
  over_http(await libsodium_primitives()),
  ['lossy'],
)

// The stories went over HTTP: their deposits and collects reached the relays served.
afterAll(() => {
  expect(served_in_all).toBeGreaterThan(0)
})
