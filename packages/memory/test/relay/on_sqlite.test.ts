import type * as zz from '@q-mino/domains/library'
import { the_relays_storage } from '@q-mino/adapters-node'
import { relay } from '@q-mino/relay'
import { a_world, harnessed, hash, type Start } from './harness.ts'
import { stories_of_the_relay } from './stories.ts'

// The relay's stories on its storage, SQLite (TST-1, MBX-7, MBX-8): its
// conformance suite, the same stories as on the oracle (`relay.test.ts`),
// through the relay's configurator. Its read is streamed by the library over
// its log, so a collect from a position is read again (DOM-18). Every entry
// and every fact given twice (TST-4) is a decorator of its outbox and of its
// log (ADP-5), as the executor and the log's readers meet them; the
// composed stream's own facts given twice are the library's case, run on the
// oracle composed. The relay keeps no trace (CFG-3): a story reads none.

/** Every value of a stream given twice, in its order (TST-4). */
const twice = <event>(given: AsyncIterable<event>): AsyncIterable<event> => ({
  async *[Symbol.asyncIterator]() {
    for await (const each of given) {
      yield each
      yield each
    }
  },
})

const a_relay_on_sqlite = async (start: Start = {}) => {
  const storage = the_relays_storage(':memory:')
  const world = a_world()
  const outbox: zz.Outbox = (effect) => (from) => twice(storage.outbox(effect)(from))
  const log: zz.FactLog = (from) => twice(storage.log(from))
  const the_relay = await relay(start.redelivered === true ? { ...storage, outbox, log } : storage)(
    {
      ...world,
      hash,
    },
  )
  return harnessed(the_relay, world, { traced: () => [], forget: storage.forget })
}

stories_of_the_relay('on SQLite', a_relay_on_sqlite, 'by_reading_again')
