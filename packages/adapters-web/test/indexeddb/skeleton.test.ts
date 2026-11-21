import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { expect, expectTypeOf, test } from 'vitest'
import {
  NotTheWriter,
  ask_to_be_the_writer,
  ask_to_keep_the_storage,
  open_the_node_s_database,
  the_partition_of,
  type ALockManager,
  type AnIndexedDb,
} from '../../src/index.ts'

// The skeleton of step 21 (part 21.1, WEB-8..WEB-12), on fake-indexeddb in
// Node and Node's Web Locks: the stores, the writer and "use here", a
// partition. The domains' suites over it are part 21.2's.

const a_node = async (indexed_db: AnIndexedDb, partition: string) =>
  open_the_node_s_database(indexed_db)('cumino', [
    { of: 'a_domain', path: 'bonds/address_book' },
    { of: 'an_extension', name: partition },
  ])

test("fake-indexeddb's factory is what the adapter takes", () => {
  expectTypeOf<IDBFactory>().toExtend<AnIndexedDb>()
  expectTypeOf<LockManager>().toExtend<ALockManager>()
})

test('one tab writes; "use here" takes the writer, and the old tab writes nothing more', async () => {
  const indexed_db = new IDBFactory()
  const anna = await a_node(indexed_db, 'ping_pong')
  const another = await a_node(indexed_db, 'ping_pong')
  const first = await ask_to_be_the_writer(navigator.locks, anna.database)('if_no_tab_is')
  expect(first.writer).toBe('this_tab')
  if (first.writer !== 'this_tab') return
  const second = await ask_to_be_the_writer(navigator.locks, another.database)('if_no_tab_is')
  expect(second.writer).toBe('another_tab')
  const partition = { key_range: IDBKeyRange, characters: 100 }
  const old = the_partition_of({ ...partition, database: anna.database, term: first.term })(
    'ping_pong',
  )
  expect(await old.commit([{ write: 'set', key: 'a', value: { n: 1 } }])).toEqual({
    answer: 'committed',
  })
  const here = await ask_to_be_the_writer(navigator.locks, another.database)('use_here')
  expect(here.writer).toBe('this_tab')
  expect(await first.lost).toBe('used_elsewhere')
  if (here.writer !== 'this_tab') return
  await expect(old.commit([{ write: 'set', key: 'b', value: 2 }])).rejects.toBeInstanceOf(
    NotTheWriter,
  )
  const now = the_partition_of({ ...partition, database: another.database, term: here.term })(
    'ping_pong',
  )
  expect(await now.read({ read: 'range' })).toEqual({
    answer: 'read',
    entries: [{ key: 'a', value: { n: 1 } }],
  })
  expect(await now.commit([{ write: 'set', key: 'c', value: 'x'.repeat(100) }])).toEqual({
    answer: 'refused',
    why: 'the_partition_is_full',
  })
  expect(await now.read({ read: 'keys', keys: ['c', 'a'] })).toEqual({
    answer: 'read',
    entries: [{ key: 'a', value: { n: 1 } }],
  })
  here.let_go()
  expect(await here.lost).toBe('let_go')
})

test('the storage kept: what the browser says, or not told', async () => {
  expect(await ask_to_keep_the_storage(undefined)).toBe('not_told')
  const asked = { persisted: () => Promise.resolve(false), persist: () => Promise.resolve(false) }
  expect(await ask_to_keep_the_storage(asked)).toBe('best_effort')
})
