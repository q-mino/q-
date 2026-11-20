import { a_relay } from './harness.ts'
import { stories_of_the_relay } from './stories.ts'

// The relay's stories on q-'s oracle (TST-1, TST-2): its read streamed
// natively, the reference, and composed by the library over the cell's log,
// as an adapter with no stream of its own (DOM-2, D69.3), whose resume is a
// read again (DOM-18).

stories_of_the_relay(
  'on the oracle, streamed natively',
  (start = {}) => a_relay(start),
  'from_the_position',
)
stories_of_the_relay(
  'on the oracle, streamed by the library over its log',
  (start = {}) => a_relay({ ...start, streams: 'composed' }),
  'by_reading_again',
)
