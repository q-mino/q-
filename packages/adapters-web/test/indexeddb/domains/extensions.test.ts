import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { expect, test } from 'vitest'
import * as zz from '@q-mino/domains/library'
import { majors } from '@q-mino/domains/extensions/activations/_majors.ts'
import { manifest } from '@q-mino/domains/extensions/activations/_value.ts'
import {
  extensions_ports_on_indexeddb,
  the_node_s_storage,
  the_store_of,
} from '../../../src/index.ts'

// The extensions' office on IndexedDB (part 21.2), a smoke test on
// fake-indexeddb in Node: an activation accepted and read back, its record
// where the layout puts it; the duplicate branch; a refusal, which writes
// nothing. The stories that need a bond (GR-3: the address book's store)
// are the domain's suites', with both modules.

const time_zone = zz.time_zone.parse('Europe/Rome')
const friday = zz.date_time.parse('2026-11-20T09:00:00.000Z')

/** Greetings' manifest in the office's words, as the kernel's adapter translates it. */
const greetings = manifest.parse({
  name: 'greetings',
  version: '0.1.0',
  sees: { known: [] },
  touches: ['the_port_of_requests', 'its_storage'],
  extension_points: [{ point: 'action', name: 'greet', place: 'a_bond' }],
  leaves_on_known: ['usecase/greet'],
  majors: { self: [1], known: [1] },
})

/** A command's context under an operation (DOM-11), as the user's entry sends it. */
const sent_as = (path: string, input: unknown, operation: string): zz.CommandRootContext => ({
  now: friday,
  time_zone,
  operation: { id: zz.operation_id.parse(operation), scope: 'persona/self' },
  correlation: zz.correlation.parse(`correlation-${operation}`),
  fingerprint: zz.fingerprint_of({ path, input }),
})

const when = () => ({ now: friday, time_zone })

const all = async <event>(events: AsyncIterable<event>): Promise<readonly event[]> => {
  const every: event[] = []
  for await (const event of events) every.push(event)
  return every
}

/** The node's storage opened by this tab, its writer, with the office's store and the address book's (WEB-8). */
const the_node_s_storage_of = (name: string) =>
  the_node_s_storage({
    indexed_db: new IDBFactory(),
    key_range: IDBKeyRange,
    locks: navigator.locks,
  })(
    {
      name,
      paths: ['extensions/activations', 'bonds/address_book'],
      extensions: [],
      characters: 1000,
    },
    'if_no_tab_is',
  )

/** A phone's node with the office's store and the address book's, greetings installed; a name of its own (the writer's lock is the database's). */
const a_phone = async () => {
  const opened = await the_node_s_storage_of(`extensions ${crypto.randomUUID()}`)
  if (opened.writer !== 'this_tab') throw new Error('the test is not the writer')
  const versions = await zz.versions([majors])({ stored: opened.stored_versions })
  const office = extensions_ports_on_indexeddb(opened, [greetings])(versions)
  const activate = (given: manifest, operation: string) =>
    all(
      office.activate_an_extension(
        sent_as(
          'extensions/activations/usecase/activate_an_extension',
          { manifest: given },
          operation,
        ),
        { manifest: given },
      ),
    )
  /** The facts recorded, as the node's log gives them (DOM-17). */
  const recorded = async (): Promise<readonly zz.StoredEnvelope[]> => {
    const facts: zz.StoredEnvelope[] = []
    for await (const event of opened.log(undefined)) {
      if (event.event !== 'fact') break
      facts.push(event.fact)
    }
    return facts
  }
  /** A record of the office's store, by its key (WEB-8). */
  const the_record = (key: IDBValidKey) =>
    new Promise<unknown>((found, failed) => {
      const store = the_store_of('extensions/activations')
      const request = opened.database.transaction(store, 'readonly').objectStore(store).get(key)
      request.onsuccess = () => {
        found(request.result)
      }
      request.onerror = () => {
        failed(request.error ?? new Error('no record read'))
      }
    })
  return { opened, office, activate, recorded, the_record }
}

/** The last event of a command, the one that closes its stream. */
const last_of = <event>(events: readonly event[]): event => {
  const last = events.at(-1)
  if (last === undefined) throw new Error('a command gave no event')
  return last
}

test('an activation with the manifest shown is applied, read back, and kept under its key', async () => {
  const phone = await a_phone()
  try {
    const before = await all(phone.office.an_extension(when(), { name: 'greetings' }))
    expect(before[0]).toMatchObject({
      event: 'snapshot',
      entries: [{ name: 'greetings', manifest: greetings, state: { is: 'not_active' } }],
    })
    const activated = last_of(await phone.activate(greetings, 'op-1'))
    expect(activated).toMatchObject({ outcome: 'applied', position: '1' })
    const after = await all(phone.office.an_extension(when(), { name: 'greetings' }))
    expect(after[0]).toMatchObject({
      event: 'snapshot',
      entries: [{ name: 'greetings', manifest: greetings, state: { is: 'active' } }],
    })
    const offered = await all(
      phone.office.the_extensions_offered_to_a_bond(when(), { bond: 'L_b' }),
    )
    expect(offered[0]).toMatchObject({ entries: [{ name: 'greetings', majors: [1] }] })
    expect(await phone.the_record(['state', 'activation', 'greetings'])).toEqual({
      name: 'greetings',
      status: 'activated',
      accepted: greetings,
      at: friday,
    })
    const again = last_of(await phone.activate(greetings, 'op-2'))
    expect(again).toMatchObject({ outcome: 'applied', position: '2' })
    expect(
      (await phone.recorded()).map((fact) => fact.parts.map((part) => part.path.split('/').at(-1))),
    ).toEqual([['an_extension_has_been_activated'], ['an_extension_has_been_activated_again']])
  } finally {
    phone.opened.let_go()
    phone.opened.database.close()
  }
})

test('the same operation again: the recorded fact, at its position, and nothing more written', async () => {
  const phone = await a_phone()
  try {
    const first = last_of(await phone.activate(greetings, 'op-1'))
    const duplicate = last_of(await phone.activate(greetings, 'op-1'))
    expect(first).toMatchObject({ outcome: 'applied', position: '1' })
    expect(duplicate).toEqual(first)
    expect(await phone.opened.position()).toBe('1')
    expect(await phone.recorded()).toHaveLength(1)
  } finally {
    phone.opened.let_go()
    phone.opened.database.close()
  }
})

test('a manifest other than the installed one is refused, and no fact is written', async () => {
  const phone = await a_phone()
  try {
    const older = { ...greetings, version: '0.0.9' }
    const refused = last_of(await phone.activate(older, 'op-1'))
    expect(refused).toMatchObject({ outcome: 'rejected' })
    const failures = 'failures' in refused ? refused.failures : []
    expect(failures.map((failure) => failure.predicate.split('/').at(-1))).toContain(
      'the_extension_is_installed_with_this_manifest',
    )
    expect(await phone.opened.position()).toBe('0')
    expect(await phone.recorded()).toEqual([])
    expect(await phone.the_record(['state', 'activation', 'greetings'])).toBeUndefined()
  } finally {
    phone.opened.let_go()
    phone.opened.database.close()
  }
})
