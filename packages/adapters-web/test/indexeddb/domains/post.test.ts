import * as zz from '@q-mino/domains/library'
import { majors } from '@q-mino/domains/post/requests/_majors.ts'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { expect, onTestFinished, test } from 'vitest'
import { post_ports_on_indexeddb, the_node_s_storage } from '../../../src/index.ts'

// The module of `post` on IndexedDB (part 21.2, WEB-8, WEB-9), a smoke test
// on fake-indexeddb in Node: a request sent and answered, read back through
// the read port; the same operation again, the fact it recorded; a response
// from another face, refused with nothing written. The calls as the post's
// stories make them over the oracle (`memory`'s `test/post/harness.ts`).
// The suites of the stories over IndexedDB are another part's.

const time_zone = zz.time_zone.parse('UTC')
const now = zz.date_time.parse('2026-11-20T10:00:00.000Z')

/** 32 bytes in base64url: a request's identity, a face's key. */
const thirty_two_bytes = (letter: string): string => `${letter.repeat(42)}A`

const P1 = thirty_two_bytes('P')
const anna = thirty_two_bytes('a')
const bruno = thirty_two_bytes('b')
const carla = thirty_two_bytes('c')

/** Anna's ping, on Bruno's mailbox, for 60 seconds. */
const a_ping = {
  request_id: P1,
  from: { face_id: 'anna', key: anna },
  to: { key: bruno, mailbox: { deposit_address: 'DB', relays: ['https://relay.q-mino.test'] } },
  invokes: {
    of: 'an_extension' as const,
    extension: 'ping_pong',
    persona: 'known' as const,
    use_case: 'ping',
    version: '1.0.0',
  },
  input: {},
  waits: 60,
}

/** Every event of a port's stream, until it ends. */
const all = async <event>(events: AsyncIterable<event>): Promise<readonly event[]> => {
  const every: event[] = []
  for await (const event of events) every.push(event)
  return every
}

/** The context of a command under an operation (DOM-11), its fingerprint over its path and its input. */
const sent_as = (path: string, input: unknown, operation: string): zz.CommandRootContext => ({
  now: now,
  time_zone,
  operation: { id: zz.operation_id.parse(operation), scope: 'the_port_of_requests' },
  correlation: zz.correlation.parse(`correlation-${operation}`),
  fingerprint: zz.fingerprint_of({ path, input }),
})

/** Anna's phone: a node of its own on a fresh IndexedDB, its writer, the ports of `post/requests` over it. */
const a_phone = async () => {
  const opened = await the_node_s_storage({
    indexed_db: new IDBFactory(),
    key_range: IDBKeyRange,
    locks: navigator.locks,
  })(
    {
      name: `post ${crypto.randomUUID()}`,
      paths: ['post/requests'],
      extensions: [],
      characters: 1000,
    },
    'if_no_tab_is',
  )
  if (opened.writer !== 'this_tab') throw new Error('the phone is not the writer')
  onTestFinished(() => {
    opened.let_go()
    opened.database.close()
  })
  const versions = await zz.versions([majors])({ stored: opened.stored_versions })
  const post = post_ports_on_indexeddb(opened)(versions)
  return {
    opened,
    sends: (operation: string) =>
      all(
        post.send_a_request(
          sent_as('post/requests/usecase/send_a_request', a_ping, operation),
          a_ping,
        ),
      ),
    takes: (from: string, operation: string) => {
      const given = { request_id: P1, from, event: { pong: true } }
      return all(
        post.take_a_response(
          sent_as('post/requests/usecase/take_a_response', given, operation),
          given,
        ),
      )
    },
    the_answer: async () => {
      const [first] = await all(
        post.the_answer_to_a_request({ now, time_zone }, { request_id: P1 }),
      )
      if (first?.event !== 'snapshot') throw new Error('a read began with no snapshot')
      return first.entries
    },
  }
}

test("a request sent waits; Bruno's pong answers it, as the read port gives back", async () => {
  const phone = await a_phone()
  expect(await phone.the_answer()).toEqual([])
  expect(await phone.sends(P1)).toMatchObject([
    {
      outcome: 'applied',
      branch: 'the_request_is_new_so_it_is_sent',
      position: '1',
      fact: {
        parts: [
          {
            path: 'post/requests/fact/a_request_has_been_sent',
            payload: {
              sent_request: { id: P1, status: 'waiting', until: '2026-11-20T10:01:00.000Z' },
            },
          },
        ],
      },
    },
  ])
  expect(await phone.the_answer()).toEqual([{ id: P1, answer: { status: 'waiting' } }])
  expect(await phone.takes(bruno, 'R1')).toMatchObject([
    {
      outcome: 'applied',
      position: '2',
      fact: {
        parts: [
          {
            path: 'post/requests/fact/a_request_has_been_answered',
            payload: { request_id: P1, event: { pong: true } },
          },
        ],
      },
    },
  ])
  expect(await phone.the_answer()).toEqual([
    { id: P1, answer: { status: 'answered', event: { pong: true } } },
  ])
})

test('the same operation again is the fact it recorded, at its position, and writes nothing', async () => {
  const phone = await a_phone()
  const [first] = await phone.sends(P1)
  const [again] = await phone.sends(P1)
  expect(again).toEqual(first)
  expect(await phone.opened.position()).toBe('1')
})

test('a response from another face is refused, and nothing is written', async () => {
  const phone = await a_phone()
  await phone.sends(P1)
  expect(await phone.takes(carla, 'R1')).toMatchObject([{ outcome: 'rejected' }])
  expect(await phone.opened.position()).toBe('1')
  expect(await phone.the_answer()).toEqual([{ id: P1, answer: { status: 'waiting' } }])
})
