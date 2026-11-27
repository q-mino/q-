// A phone's storage on SQLite, for the suites (TST-1; part B2 of the
// assistant, AST-2): the node's database in a file of its own, in a folder
// of the test file's that is removed once its tests are over; every kernel
// domain's ports over it as the assistant's node wires them, through
// `memory`'s `on_the_node_s_database`, as the PWA's over IndexedDB.

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  the_node_s_storage_on_sqlite,
  type TheNodeOnSqlite,
  type WhenItSyncs,
} from '@q-mino/adapters-node'
import { afterAll } from 'vitest'
import { on_the_node_s_database } from '../../src/index.ts'
import { the_kernel_s_domains } from '../indexeddb/storage.ts'
import type { AStorageUnderTest } from '../stack/harness.ts'

/** The folders the test file made, removed after its last test. */
const folders: string[] = []
afterAll(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true })
})

/** A new folder of the test file's, for a node's file. */
export const a_folder = (): string => {
  const folder = mkdtempSync(join(tmpdir(), 'cumino-node-'))
  folders.push(folder)
  return folder
}

/** A node's file in a new folder of the test file's. */
export const a_node_s_file = (): string => join(a_folder(), 'node.sqlite')

/** A node's storage opened on SQLite from its file, as its only writer; synced at WAL's checkpoints unless asked (the suites' thousands of commits). */
export const a_node_on_sqlite = async (
  file: string = a_node_s_file(),
  syncs: WhenItSyncs = 'at_checkpoints',
): Promise<TheNodeOnSqlite> => {
  const opened = await the_node_s_storage_on_sqlite(
    file,
    syncs,
  )({
    paths: the_kernel_s_domains,
    characters: 1_000_000,
  })
  if (opened.writer !== 'this_process') throw new Error(`another connection holds ${file}`)
  return opened
}

/** A phone of a story over a node's storage on SQLite (the stack's factory, STK-6). */
export const over_a_node_on_sqlite = (opened: TheNodeOnSqlite): AStorageUnderTest => ({
  storage: on_the_node_s_database(opened),
  position: opened.position,
  held: opened.held,
  held_parts: opened.held_parts,
  at_work: opened.at_work,
})

/** A phone of a story on a new node's file (the stack's factory, STK-6). */
export const on_sqlite = async (): Promise<AStorageUnderTest> =>
  over_a_node_on_sqlite(await a_node_on_sqlite())
