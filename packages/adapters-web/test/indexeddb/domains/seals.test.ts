import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, expect, test } from 'vitest'
import * as zz from '@q-mino/domains/library'
import { majors } from '@q-mino/domains/seals/safe/_majors.ts'
import * as dsl from '@q-mino/domains/seals/safe/_dsl.ts'
import { libsodium_primitives } from '@q-mino/adapters-common'
import { seals_ports_on_indexeddb, the_node_s_storage } from '../../../src/index.ts'

// The safe on IndexedDB (part 21.2, WEB-8, WEB-9), on fake-indexeddb in
// Node, over libsodium: a smoke test of its module, the oracle's stories
// (`packages/memory/test/seals`) being the measure. Through the ports a
// reaction and the executor send to (PER-21): a face asked for and made,
// then read back signing; a mailbox key drawn, then read back; a request
// given again under its operation, the fact it recorded; one refused,
// nothing written. Anna's phone; F1 her face, S1 its seed; M1 a mailbox key,
// R1 its collect secret; C1 a content.

const told = dsl.base64url_of

const bytes_all = (byte: number): Uint8Array => new Uint8Array(32).fill(byte)

const ascii = (text: string): Uint8Array =>
  Uint8Array.from({ length: text.length }, (_, at) => text.charCodeAt(at) & 255)

const S1 = bytes_all(1)
const R1 = bytes_all(3)
const C1 = told(ascii('Anna to Bruno: the first letter'))

const time_zone = zz.time_zone.parse('UTC')
const instant = zz.date_time.parse('2026-11-21T09:00:00.000Z')

/** The scope of the reaction that asks the safe: `bonds`' process (step 11). */
const the_scope_of_a_reaction = 'bonds/reaction/a_face_for_a_bond'

/** Every event of a port's stream, until it ends. */
const all = async <event>(events: AsyncIterable<event>): Promise<readonly event[]> => {
  const every: event[] = []
  for await (const event of events) every.push(event)
  return every
}

/** A command's last event, the one that closes its stream. */
const last_of = <event>(events: readonly event[]): event => {
  const last = events.at(-1)
  if (last === undefined) throw new Error('a command gave no event')
  return last
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

const let_go: (() => void)[] = []

afterEach(() => {
  for (const each of let_go.splice(0)) each()
})

/** Anna's safe on a node of its own: a database named once (the writer's lock is the database's, process-wide). */
const a_safe = async () => {
  const opened = await the_node_s_storage({
    indexed_db: new IDBFactory(),
    key_range: IDBKeyRange,
    locks: navigator.locks,
  })(
    {
      name: `seals ${crypto.randomUUID()}`,
      paths: ['seals/safe'],
      extensions: [],
      characters: 1000,
    },
    'if_no_tab_is',
  )
  if (opened.writer !== 'this_tab') throw new Error('another tab writes the node')
  let_go.push(() => {
    opened.let_go()
    opened.database.close()
  })
  const primitives = await libsodium_primitives()
  const versions = await zz.versions([majors])({ stored: opened.stored_versions })
  const ports = seals_ports_on_indexeddb(opened, primitives)(versions)
  /** The context of a command sent under an operation (DOM-11), its fingerprint over its use case's path and its input. */
  const sent_as =
    (path: string, input: unknown) =>
    (operation: string, scope: string = the_scope_of_a_reaction): zz.CommandRootContext => ({
      now: instant,
      time_zone,
      operation: { id: zz.operation_id.parse(operation), scope },
      correlation: zz.correlation.parse(`correlation-${operation}`),
      fingerprint: zz.fingerprint_of({ path, input }),
    })
  const when = { now: instant, time_zone }
  return {
    opened,
    primitives,
    makes_a_face: (face_id: string, operation: string) => {
      const input = { face_id }
      return all(
        ports.make_a_face_from_a_new_seed(
          sent_as('seals/safe/usecase/make_a_face_from_a_new_seed', input)(operation),
          input,
        ),
      )
    },
    keeps_a_seed: (face_id: string, seed: Uint8Array) => {
      const input = {
        face_id,
        seed_secret: told(seed),
        first_face: dsl.the_face_at(primitives)(told(seed), 0),
      }
      return all(
        ports.keep_a_new_seed_and_its_face(
          sent_as('seals/safe/usecase/keep_a_new_seed_and_its_face', input)(
            face_id,
            'seals/safe/effect/draw_a_seed_for_the_face',
          ),
          input,
        ),
      )
    },
    draws_a_mailbox_key: (mailbox_key_id: string, operation: string) => {
      const input = { mailbox_key_id }
      return all(
        ports.draw_a_mailbox_key(
          sent_as('seals/safe/usecase/draw_a_mailbox_key', input)(operation),
          input,
        ),
      )
    },
    keeps_a_mailbox_key: (mailbox_key_id: string, collect_secret: Uint8Array) => {
      const input = {
        mailbox_key_id,
        collect_secret: told(collect_secret),
        deposit_address: dsl.the_deposit_address_of(primitives)(told(collect_secret)),
      }
      return all(
        ports.keep_a_mailbox_key(
          sent_as('seals/safe/usecase/keep_a_mailbox_key', input)(
            mailbox_key_id,
            'seals/safe/effect/draw_the_mailbox_key',
          ),
          input,
        ),
      )
    },
    signs: (face_id: string, content: string) =>
      all(ports.a_content_signed_by_a_face(when, { face_id, content })),
    the_key_of: (mailbox_key_id: string) =>
      all(ports.the_key_of_a_mailbox(when, { mailbox_key_id })),
    /** The paths of the facts the node's log keeps, fact by fact, up to caught up (DOM-17). */
    recorded: async (): Promise<readonly (readonly string[])[]> => {
      const paths: (readonly string[])[] = []
      for await (const event of opened.log(undefined)) {
        if (event.event !== 'fact') break
        paths.push(event.fact.parts.map((part) => part.path))
      }
      return paths
    },
  }
}

test('a face asked for and made from its seed signs, read back through the read port', async () => {
  const safe = await a_safe()
  expect(last_of(await safe.makes_a_face('F1', 'a-face-for-the-bond-with-bruno'))).toMatchObject({
    outcome: 'applied',
    branch: 'the_face_is_new_so_a_seed_is_drawn_for_it',
    position: '1',
  })
  // Being made, the face signs nothing: the read selects made faces.
  expect(entries_of(await safe.signs('F1', C1))).toEqual([])
  expect(last_of(await safe.keeps_a_seed('F1', S1))).toMatchObject({
    outcome: 'applied',
    branch: 'the_face_is_being_made_so_it_is_made_from_the_seed',
    position: '2',
  })
  const F1 = dsl.the_face_at(safe.primitives)(told(S1), 0)
  const [signed, ...more] = entries_of(await safe.signs('F1', C1))
  expect(more).toEqual([])
  expect(signed).toEqual({
    id: 'F1',
    public_key: F1.public_key,
    signature: dsl.the_signature_of(safe.primitives)(F1.private_key, C1),
  })
  if (signed === undefined) throw new Error('F1 signed nothing')
  expect(dsl.the_signature_holds(safe.primitives)(F1.public_key, C1, signed.signature)).toBe(true)
  expect(await safe.recorded()).toEqual([
    ['seals/safe/fact/a_face_has_been_asked_for'],
    ['seals/safe/fact/a_face_has_been_made_from_a_new_seed'],
  ])
})

test('a mailbox key drawn reads back with its deposit address', async () => {
  const safe = await a_safe()
  await safe.draws_a_mailbox_key('M1', 'a-mailbox-for-the-bond-with-bruno')
  expect(entries_of(await safe.the_key_of('M1'))).toEqual([])
  expect(last_of(await safe.keeps_a_mailbox_key('M1', R1))).toMatchObject({ outcome: 'applied' })
  expect(entries_of(await safe.the_key_of('M1'))).toEqual([
    {
      id: 'M1',
      collect_secret: told(R1),
      deposit_address: told(safe.primitives.blake2b_256(R1)),
    },
  ])
  expect(entries_of(await safe.the_key_of('M2'))).toEqual([])
})

test('a request given again under its operation is the fact it recorded, at its position', async () => {
  const safe = await a_safe()
  const first = await safe.makes_a_face('F1', 'a-face-for-the-bond-with-bruno')
  const again = await safe.makes_a_face('F1', 'a-face-for-the-bond-with-bruno')
  expect(again).toEqual(first)
  expect(last_of(again)).toMatchObject({ outcome: 'applied', position: '1' })
  expect(await safe.opened.position()).toBe('1')
  expect(await safe.recorded()).toEqual([['seals/safe/fact/a_face_has_been_asked_for']])
})

test('a request refused writes no fact', async () => {
  const safe = await a_safe()
  await safe.makes_a_face('F1', 'a-face-for-the-bond-with-bruno')
  expect(last_of(await safe.makes_a_face('F1', 'another-reaction'))).toEqual({
    outcome: 'rejected',
    failures: [
      {
        branch: 'the_face_is_new_so_a_seed_is_drawn_for_it',
        components: [],
        predicate: 'seals/safe/predicate/a_face_has_this_id',
      },
    ],
  })
  // A seed for a face never asked for: no face is being made under F2.
  expect(last_of(await safe.keeps_a_seed('F2', S1))).toMatchObject({ outcome: 'rejected' })
  expect(await safe.opened.position()).toBe('1')
  expect(await safe.recorded()).toEqual([['seals/safe/fact/a_face_has_been_asked_for']])
})
