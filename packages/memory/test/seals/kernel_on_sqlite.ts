// The kernel's storage of the domains' suites on SQLite (TST-1, TST-4; part
// B2 of the assistant): a node's file with every kernel store
// (`../sqlite/storage.ts`), the ports of its domains as the assistant's
// node wires them, read by the suites of the safe, the address book and the
// post (`on_sqlite.test.ts` of each folder), as on IndexedDB
// (`kernel_on_indexeddb.ts`). Its time to run its course is until no
// transaction of it is in flight or waits for its turn (TST-11).

import { a_node_on_sqlite } from '../sqlite/storage.ts'
import { until_quiet } from '../quiet.ts'
import type { AKernelsStorage, Start } from './harness.ts'
import { the_kernel_over } from './kernel_on_indexeddb.ts'

/** The kernel's storage on a new node's file, quiet once no transaction of it is at work, every fact and every entry given twice if asked (TST-4). */
export const the_kernel_on_sqlite = async (start: Start = {}): Promise<AKernelsStorage> => {
  const node = await a_node_on_sqlite()
  const quiet = (): Promise<void> => until_quiet(node.at_work, 'the node on SQLite quiet')
  return the_kernel_over(node, quiet, start)
}
