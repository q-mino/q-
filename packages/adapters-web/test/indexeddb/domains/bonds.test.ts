import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { expect, test } from 'vitest'
import * as zz from '@q-mino/domains/library'
import { libsodium_primitives } from '@q-mino/adapters-common'
import { majors } from '@q-mino/domains/bonds/address_book/_majors.ts'
import { the_content_a_ticket_s_secret_signs } from '@q-mino/domains/bonds/address_book/_dsl.ts'
import { base64url_of, bytes_of, type Primitives } from '@q-mino/domains/seals/safe/_dsl.ts'
import { bonds_ports_on_indexeddb, the_node_s_storage } from '../../../src/index.ts'

// The address book on IndexedDB (part 21.2, WEB-8, WEB-9), on fake-indexeddb
// in Node: its ports called as the oracle's stories call them (the user's
// commands under `self`, an introduction under `unknown`), a command flow
// read back through the reads, a duplicate, a refusal that writes nothing.
// The domains' suites over the adapter are the conformance's (TST-1).

const time_zone = zz.time_zone.parse('UTC')
const the_relay = 'https://relay.q-mino.test'
const at = zz.date_time.parse('2026-11-16T10:00:00+00:00')

/** Every event of a stream, in order. */
const all = async <event>(events: AsyncIterable<event>): Promise<readonly event[]> => {
  const every: event[] = []
  for await (const event of events) every.push(event)
  return every
}

/** A face's key pair from a seed of one byte repeated: its public key, and its signature over a content. */
const a_face_of = (primitives: Primitives, byte: number) => {
  const seed = new Uint8Array(32).fill(byte)
  return {
    key: base64url_of(primitives.public_key_of(seed)),
    signs: (content: string) => base64url_of(primitives.sign(seed, bytes_of(content))),
  }
}

/** Anna's phone: a node of its own (each its database, so its writer's lock), the address book's ports over it. */
const annas_phone = async () => {
  const opened = await the_node_s_storage({
    indexed_db: new IDBFactory(),
    key_range: IDBKeyRange,
    locks: navigator.locks,
  })(
    {
      name: `bonds ${crypto.randomUUID()}`,
      paths: ['bonds/address_book'],
      extensions: [],
      characters: 1000,
    },
    'if_no_tab_is',
  )
  if (opened.writer !== 'this_tab') throw new Error('the node has another writer')
  const primitives = await libsodium_primitives()
  const versions = await zz.versions([majors])({ stored: opened.stored_versions })
  const address_book = bonds_ports_on_indexeddb(opened, primitives)(versions)
  let operations = 0
  const sent_as =
    (path: string, input: unknown) =>
    (
      sent: { readonly operation?: string; readonly scope?: string } = {},
    ): zz.CommandRootContext => {
      operations += 1
      const id = sent.operation ?? `op-${String(operations)}`
      return {
        now: zz.in_zone(time_zone)(at),
        time_zone,
        operation: { id: zz.operation_id.parse(id), scope: sent.scope ?? 'persona/self' },
        correlation: zz.correlation.parse(`correlation-${id}`),
        fingerprint: zz.fingerprint_of({ path, input }),
      }
    }
  const when = () => ({ now: zz.in_zone(time_zone)(at), time_zone })
  return { opened, primitives, address_book, sent_as, when }
}

/** The entries of a read's snapshot, its first event. */
const entries_of = <entry>(
  events: readonly (
    | { readonly event: 'snapshot'; readonly entries: readonly entry[] }
    | { readonly event: 'invalid_request' }
  )[],
): readonly entry[] => {
  const first = events[0]
  if (first?.event !== 'snapshot') throw new Error('a read began with no snapshot')
  return first.entries
}

/** Anna's first face made, and a ticket of hers ready at her mailbox D. */
const annas_ticket = async () => {
  const phone = await annas_phone()
  const { address_book, sent_as } = phone
  const anna = a_face_of(phone.primitives, 1)
  const D = base64url_of(new Uint8Array(32).fill(9))
  const first_face = { face_id: 'F_a', name: 'Anna' }
  await all(
    address_book.make_my_first_face(
      sent_as('bonds/address_book/usecase/make_my_first_face', first_face)(),
      first_face,
    ),
  )
  const the_key = { face_id: 'F_a', public_key: anna.key }
  await all(
    address_book.keep_the_key_of_a_face(
      sent_as('bonds/address_book/usecase/keep_the_key_of_a_face', the_key)(),
      the_key,
    ),
  )
  const ticket = { bond_id: 'L_b', face_id: 'F_a', relays: [the_relay] }
  await all(
    address_book.prepare_a_ticket(
      sent_as('bonds/address_book/usecase/prepare_a_ticket', ticket)(),
      ticket,
    ),
  )
  const mailbox = { bond_id: 'L_b', deposit_address: D }
  await all(
    address_book.keep_the_mailbox_of_a_ticket(
      sent_as('bonds/address_book/usecase/keep_the_mailbox_of_a_ticket', mailbox)(),
      mailbox,
    ),
  )
  return { ...phone, anna, D }
}

test('a first face made, then a ticket ready: the reads give them back', async () => {
  const { address_book, sent_as, when, opened, primitives } = await annas_phone()
  const anna = a_face_of(primitives, 1)
  const first_face = { face_id: 'F_a', name: 'Anna' }
  const asked = await all(
    address_book.make_my_first_face(
      sent_as('bonds/address_book/usecase/make_my_first_face', first_face)(),
      first_face,
    ),
  )
  expect(asked.at(-1)).toMatchObject({
    outcome: 'applied',
    fact: { parts: [{ path: 'bonds/address_book/fact/a_first_face_has_been_asked_for' }] },
  })
  // Being made, the face is not yet one of hers to show.
  expect(entries_of(await all(address_book.my_faces(when(), {})))).toEqual([])
  const the_key = { face_id: 'F_a', public_key: anna.key }
  await all(
    address_book.keep_the_key_of_a_face(
      sent_as('bonds/address_book/usecase/keep_the_key_of_a_face', the_key)(),
      the_key,
    ),
  )
  expect(entries_of(await all(address_book.my_faces(when(), {})))).toEqual([
    { id: 'F_a', name: 'Anna', position: { place: 'at_the_top' }, public_key: anna.key },
  ])
  const ticket = { bond_id: 'L_b', face_id: 'F_a', relays: [the_relay] }
  await all(
    address_book.prepare_a_ticket(
      sent_as('bonds/address_book/usecase/prepare_a_ticket', ticket)(),
      ticket,
    ),
  )
  // Being prepared, the ticket has no mailbox to show.
  expect(entries_of(await all(address_book.my_ticket(when(), { bond_id: 'L_b' })))).toEqual([])
  const D = base64url_of(new Uint8Array(32).fill(9))
  const mailbox = { bond_id: 'L_b', deposit_address: D }
  await all(
    address_book.keep_the_mailbox_of_a_ticket(
      sent_as('bonds/address_book/usecase/keep_the_mailbox_of_a_ticket', mailbox)(),
      mailbox,
    ),
  )
  expect(entries_of(await all(address_book.my_ticket(when(), { bond_id: 'L_b' })))).toMatchObject([
    {
      id: 'L_b',
      my_face_id: 'F_a',
      key: anna.key,
      introduced_as: 'Anna',
      my_mailbox: { deposit_address: D, relays: [the_relay] },
    },
  ])
  expect(String(await opened.position())).toBe('4')
  opened.let_go()
})

test("an introduction with the ticket's secret bonds; sent again, it is the same fact at the same position", async () => {
  const { address_book, sent_as, when, opened, primitives, anna, D } = await annas_ticket()
  const bruno = a_face_of(primitives, 2)
  const introduction = {
    bond_id: 'L_b',
    secret: anna.signs(the_content_a_ticket_s_secret_signs(D)),
    their_face: { key: bruno.key, introduced_as: 'Bruno' },
    their_mailbox: {
      deposit_address: base64url_of(new Uint8Array(32).fill(3)),
      relays: [the_relay],
    },
  }
  const sent = { operation: 'bruno-introduces-himself', scope: 'persona/unknown' }
  const first = await all(
    address_book.accept_their_introduction(
      sent_as('bonds/address_book/usecase/accept_their_introduction', introduction)(sent),
      introduction,
    ),
  )
  expect(first.at(-1)).toMatchObject({
    outcome: 'applied',
    fact: {
      parts: [{ path: 'bonds/address_book/fact/a_bond_has_been_made_by_their_introduction' }],
    },
  })
  const position = String(await opened.position())
  const again = await all(
    address_book.accept_their_introduction(
      sent_as('bonds/address_book/usecase/accept_their_introduction', introduction)(sent),
      introduction,
    ),
  )
  expect(again).toEqual(first)
  expect(String(await opened.position())).toBe(position)
  expect(entries_of(await all(address_book.my_bonds(when(), {})))).toMatchObject([
    { id: 'L_b', name: 'Bruno', my_face_id: 'F_a', their_face: { key: bruno.key } },
  ])
  opened.let_go()
})

test("an introduction with a secret not the ticket's is refused, and writes no fact", async () => {
  const { address_book, sent_as, when, opened, primitives, D } = await annas_ticket()
  const bruno = a_face_of(primitives, 2)
  const forged = {
    bond_id: 'L_b',
    secret: bruno.signs(the_content_a_ticket_s_secret_signs(D)),
    their_face: { key: bruno.key, introduced_as: 'Bruno' },
    their_mailbox: {
      deposit_address: base64url_of(new Uint8Array(32).fill(3)),
      relays: [the_relay],
    },
  }
  const before = String(await opened.position())
  const refused = await all(
    address_book.accept_their_introduction(
      sent_as(
        'bonds/address_book/usecase/accept_their_introduction',
        forged,
      )({
        scope: 'persona/unknown',
      }),
      forged,
    ),
  )
  expect(refused.at(-1)).toMatchObject({ outcome: 'rejected' })
  expect(JSON.stringify(refused.at(-1))).toContain(
    'bonds/address_book/predicate/the_secret_is_the_ticket_s',
  )
  expect(String(await opened.position())).toBe(before)
  expect(entries_of(await all(address_book.my_bonds(when(), {})))).toEqual([])
  opened.let_go()
})
