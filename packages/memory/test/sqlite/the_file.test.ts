import { spawnSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { dirname } from 'node:path'
import {
  execute_in,
  the_name_of,
  type AStoredKey,
  type Fragment,
  type TheNodesStorage,
  type Write,
} from '@q-mino/adapters-common'
import * as zz from '@q-mino/domains/library'
import { the_node_s_storage_on_sqlite } from '@q-mino/adapters-node'
import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, test } from 'vitest'
import { a_node_on_indexeddb, the_kernel_s_domains } from '../indexeddb/storage.ts'
import { a_node_on_sqlite, a_node_s_file } from './storage.ts'

// The node's database on SQLite itself (part B2 of the assistant, AST-2,
// DOM-8, DOM-9, WEB-8): the order of its keys is IndexedDB's, proved
// against fake-indexeddb's `cmp` (the order the modules were written for);
// a range by its ends; a body that throws writes nothing; one connection
// holds the file, another opening is refused, and the next writer's term
// follows the last; the file and its folder are its user's alone (SEA-7).

/** Keys of every kind the modules write, and their edges: in no order. */
const keys: readonly AStoredKey[] = [
  ['fact', 10],
  ['fact', 9],
  ['fact', 1.5],
  ['fact', -1],
  ['fact', Number.POSITIVE_INFINITY],
  ['fact'],
  ['fact', 'a'],
  ['fact', 2, 'x'],
  ['fact', 2],
  ['state', 'bond', 'L_b'],
  ['state', 'bond', 'L_a'],
  ['state', 'bond'],
  ['state', 'bond', ''],
  ['state', 'bond', 'L_a', []],
  ['state', 'bond', ['L_a']],
  ['state', 'face', 'F_a'],
  'the_last_fact',
  'the_last_entry',
  '',
  'a',
  'ab',
  'b',
  'Z',
  'é',
  '\u0000',
  'a\u0000b',
  '￿',
  '😀',
  'state/pong/1',
  'state/pong/10',
  'state/pong/2',
  0,
  -0.5,
  -1e300,
  1e300,
  Number.NEGATIVE_INFINITY,
  42,
  [],
  [[]],
  [0],
  ['a', ['b']],
]

/** IndexedDB's order of keys, as a browser's `indexedDB.cmp` gives it. */
const indexeddb = new IDBFactory()

test('the keys of SQLite read in IndexedDB’s order, every kind and edge', async () => {
  const node = await a_node_on_sqlite()
  await node.database.transaction(['keys'], 'readwrite', (transaction) => {
    keys.forEach((key, at) => {
      transaction.put('keys', key, at)
    })
    return Promise.resolve()
  })
  const read = await node.database.transaction(['keys'], 'readonly', (transaction) =>
    transaction.within('keys', { lower: undefined, upper: undefined }),
  )
  const sorted = [...keys].sort((a, b) => indexeddb.cmp(a, b))
  expect(read.map((record) => record.key)).toEqual(sorted)
  expect(read.map((record) => record.value)).toEqual(sorted.map((key) => keys.indexOf(key)))
  // A prefix's range, as the modules read a kind (WEB-8): the arrays that begin with it, no nested array after it.
  const bonds = await node.database.transaction(['keys'], 'readonly', (transaction) =>
    transaction.within('keys', {
      lower: { key: ['state', 'bond'], open: false },
      upper: { key: ['state', 'bond', []], open: true },
    }),
  )
  expect(bonds.map((record) => record.key)).toEqual([
    ['state', 'bond'],
    ['state', 'bond', ''],
    ['state', 'bond', 'L_a'],
    ['state', 'bond', 'L_a', []],
    ['state', 'bond', 'L_b'],
  ])
  // A partition's range (EXT-14): from inclusive, before exclusive, texts by code units.
  const pongs = await node.database.transaction(['keys'], 'readonly', (transaction) =>
    transaction.within('keys', {
      lower: { key: 'state/pong/', open: false },
      upper: { key: 'state/pong/2', open: true },
    }),
  )
  expect(pongs.map((record) => record.key)).toEqual(['state/pong/1', 'state/pong/10'])
  await node.close()
})

test('a body that throws writes nothing (DOM-8); a value with no JSON is refused', async () => {
  const node = await a_node_on_sqlite()
  const fault = new Error('the step threw')
  await expect(
    node.database.transaction(['keys'], 'readwrite', async (transaction) => {
      transaction.put('node', ['state', 'kept'], 1)
      expect(await transaction.get('node', ['state', 'kept'])).toBe(1)
      throw fault
    }),
  ).rejects.toBe(fault)
  await expect(
    node.database.transaction(['keys'], 'readwrite', (transaction) => {
      transaction.put('node', ['state', 'kept'], 2)
      transaction.put('node', ['state', 'none'], undefined)
      return Promise.resolve()
    }),
  ).rejects.toThrow('JSON')
  expect(
    await node.database.transaction(['keys'], 'readonly', (transaction) =>
      transaction.get('node', ['state', 'kept']),
    ),
  ).toBeUndefined()
  await node.close()
})

test('one connection holds the file: another opening is refused; opened again, the next term (DOM-9, WEB-10)', async () => {
  const file = a_node_s_file()
  const first = await a_node_on_sqlite(file, 'each_commit')
  const stores = { paths: the_kernel_s_domains, characters: 1_000 }
  expect(await the_node_s_storage_on_sqlite(file)(stores)).toEqual({
    writer: 'another_connection',
  })
  // The refused opening left the first one's lock (B6): another process is refused too.
  const another = spawnSync(
    process.execPath,
    [
      '--disable-warning=ExperimentalWarning',
      '-e',
      "const { DatabaseSync } = require('node:sqlite'); const d = new DatabaseSync(process.argv[1], { timeout: 0 }); try { d.exec('PRAGMA locking_mode = EXCLUSIVE'); d.exec('BEGIN IMMEDIATE'); d.exec('COMMIT'); console.log('held') } catch { console.log('refused') }",
      file,
    ],
    { encoding: 'utf8' },
  )
  expect(another.stdout.trim()).toBe('refused')
  await first.close()
  const again = await a_node_on_sqlite(file)
  expect(again.term).toBe(first.term + 1)
  // The file and its folder, its user's alone: they keep the face's private key (SEA-7).
  expect(statSync(file).mode & 0o777).toBe(0o600)
  expect(statSync(dirname(file)).mode & 0o777).toBe(0o700)
  await again.close()
})

/** A fragment that holds, reading nothing. */
const always: Fragment = { reads: [], holds: () => true }

describe.each([
  ['on SQLite', (): Promise<TheNodesStorage> => a_node_on_sqlite()],
  ['on IndexedDB', (): Promise<TheNodesStorage> => a_node_on_indexeddb()],
])('a command whose write throws %s', (_, a_node) => {
  test('rolls its fact and its state back together: nothing of it is kept (DOM-8)', async () => {
    const node = await a_node()
    const path = 'bonds/address_book'
    const store = the_name_of({ of: 'a_domain', path })
    const fault = new Error('a write threw')
    const first: Write = {
      reads: [],
      puts: () => [{ put: 'set', key: ['state', 'face', 'F_a'], value: { id: 'F_a' } }],
    }
    const second: Write = {
      reads: [],
      puts: () => {
        throw fault
      },
    }
    await expect(
      execute_in(node.domain(path))({
        operation: { scope: 'the_test', id: zz.operation_id.parse('O1') },
        branches: [
          {
            condition: always,
            leaves: [],
            writes: [first, second],
            // cast: never read, the second write throws before the fact is written
            fact: {} as zz.StoredEnvelope,
            entries: [],
          },
        ],
      }),
    ).rejects.toBe(fault)
    const kept = await node.database.transaction([store, 'node'], 'readonly', async (read) => ({
      face: await read.get(store, ['state', 'face', 'F_a']),
      last: await read.get('node', 'the_last_fact'),
      records: await read.within(store, { lower: undefined, upper: undefined }),
    }))
    expect(kept).toEqual({ face: undefined, last: undefined, records: [] })
    expect(String(await node.position())).toBe('0')
  })
})
