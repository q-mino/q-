import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { expect, test, vi } from 'vitest'
import { NotTheWriter, the_node_s_storage, type TheNodesStorage } from '@q-mino/adapters-web'
import * as zz from '@q-mino/domains/library'
import {
  a_phone_over,
  a_timer,
  anna_s_phone,
  by_mode,
  everything_kept,
  last_of,
  the_entries_queued,
  the_facts_logged,
  the_relay,
  the_ticket_s_wait,
  type APhoneCounted,
} from './a_phone_counted.ts'
import { a_node_on_indexeddb, the_extensions_carried, the_kernel_s_domains } from './storage.ts'

// The checks of step 21 the domains' suites do not cover (part 21.2, TST-5,
// WEB-9, WEB-10, WEB-13), on a phone over a node's storage on
// fake-indexeddb, Anna's face made and her bond with Bruno kept:
// - concurrency equals some serial order (TST-5, DOM-9): requests sent at
//   the same time give the outcomes of one of their serial orders, each run
//   on a fresh node, the state read back through the ports and the log; on
//   the address book's ports (L_b renamed and removed twice) and through the
//   leaves of `self` (the ticket L_c asked for under two operations, one of
//   them sent twice, the retry racing its first try);
// - a rejection leaves no fact (TST-5): every record of the database, the
//   position, the log, the versions kept and the outbox unchanged;
// - a second tab cannot write (WEB-10): it composes nothing; once it takes
//   the writer ("use here"), the first tab's commands write nothing, even
//   one begun before and committed after;
// - the duplicate branch's lookups, counted (DOM-11 "Where the duplicate
//   branch runs", WEB-9): the transactions a request through a leaf opens,
//   by mode, and its retry's.
// Real timers only; every wait bounded.
vi.setConfig({ testTimeout: 15_000 })

/** Every order of a list (`scenarios/serial.ts` of Shed). */
const orders = <item>(items: readonly item[]): readonly (readonly item[])[] =>
  items.length <= 1
    ? [items]
    : items.flatMap((item, i) =>
        orders([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
      )

/** A request sent to a phone: what it answers. */
type ARequest = (phone: APhoneCounted) => Promise<unknown>

/** What a run of requests gives: each request's answer, in its place, and what the phone reads after them. */
interface ARun {
  readonly answers: readonly unknown[]
  readonly read: unknown
}

/** The requests sent one after the other in every order, each order on a fresh phone. */
const serially = async (
  fresh: () => Promise<APhoneCounted>,
  requests: readonly ARequest[],
  read: (phone: APhoneCounted) => Promise<unknown>,
): Promise<readonly ARun[]> => {
  const runs: ARun[] = []
  for (const order of orders(requests.map((_, i) => i))) {
    const phone = await fresh()
    const answers = new Map<number, unknown>()
    for (const i of order) {
      const request = requests[i]
      if (request === undefined) throw new Error('an order names no request')
      answers.set(i, await request(phone))
    }
    runs.push({ answers: requests.map((_, i) => answers.get(i)), read: await read(phone) })
    phone.opened.let_go()
  }
  return runs
}

/** The requests sent at the same time on a fresh phone, and the transactions they opened. */
const at_once = async (
  fresh: () => Promise<APhoneCounted>,
  requests: readonly ARequest[],
  read: (phone: APhoneCounted) => Promise<unknown>,
) => {
  const phone = await fresh()
  const { result, opened } = await phone.transactions.during(() =>
    Promise.all(requests.map((request) => request(phone))),
  )
  const run: ARun = { answers: result, read: await read(phone) }
  phone.opened.let_go()
  return { run, opened }
}

/** What the phone reads after the requests, through its ports: its position, its log, its bonds, the ticket's waits queued. */
const what_it_reads = async (phone: APhoneCounted) => ({
  position: String(await phone.opened.position()),
  facts: await the_facts_logged(phone.node.log),
  bonds: await phone.my_bonds(),
  queued: await the_entries_queued(phone.opened.outbox(the_ticket_s_wait)(undefined)),
})

test('L_b renamed and removed twice at the same time: the outcomes of one serial order', async () => {
  const requests: readonly ARequest[] = [
    (phone) =>
      phone.sends(
        phone.node.address_book.rename_a_bond,
        'rename_a_bond',
        { bond_id: 'L_b', name: 'Bru' },
        'anna-renames-L_b',
      ),
    (phone) =>
      phone.sends(
        phone.node.address_book.remove_a_bond,
        'remove_a_bond',
        { bond_id: 'L_b' },
        'anna-removes-L_b',
      ),
    (phone) =>
      phone.sends(
        phone.node.address_book.remove_a_bond,
        'remove_a_bond',
        { bond_id: 'L_b' },
        'anna-removes-L_b-from-her-tablet',
      ),
  ]
  const serial = await serially(anna_s_phone, requests, what_it_reads)
  // The orders tell their outcomes apart: renamed or refused, removed or removed again.
  expect(new Set(serial.map((run) => JSON.stringify(run.answers))).size).toBe(4)
  const { run, opened } = await at_once(anna_s_phone, requests, what_it_reads)
  // Sent at the same time: each looked its operation up before any step wrote.
  expect(opened.slice(0, requests.length).map((each) => each.mode)).toEqual([
    'readonly',
    'readonly',
    'readonly',
  ])
  expect(by_mode(opened)).toEqual({ readonly: 3, readwrite: 3 })
  expect(serial).toContainEqual(run)
})

test('the ticket L_c asked for under two operations, one sent twice, through the leaves of self: one serial order', async () => {
  const ticket = { bond_id: 'L_c', face_id: 'F_a', relays: [the_relay] }
  const requests: readonly ARequest[] = [
    (phone) => phone.the_user('usecase/prepare_a_ticket', ticket, 'anna-asks-for-L_c'),
    (phone) =>
      phone.the_user('usecase/prepare_a_ticket', ticket, 'anna-asks-for-L_c-on-her-tablet'),
    // The first sent again while it is in flight: the retry races its first try (SC-11).
    (phone) => phone.the_user('usecase/prepare_a_ticket', ticket, 'anna-asks-for-L_c'),
  ]
  const serial = await serially(anna_s_phone, requests, what_it_reads)
  expect(new Set(serial.map((run) => JSON.stringify(run.answers))).size).toBeGreaterThan(1)
  const { run, opened } = await at_once(anna_s_phone, requests, what_it_reads)
  expect(opened.slice(0, requests.length).map((each) => each.mode)).toEqual([
    'readonly',
    'readonly',
    'readonly',
  ])
  // Every try passed the leaf's and the port's lookups before a step wrote, so each ran its step.
  expect(by_mode(opened)).toEqual({ readonly: 6, readwrite: 3 })
  expect(serial).toContainEqual(run)
  // One ticket asked for, one wait queued: the retry met its first try's fact in the step (DOM-11).
  expect(run.answers[2]).toEqual(run.answers[0])
})

test('a rejection leaves no fact: the records, the position, the log, the versions and the outbox unchanged', async () => {
  const anna = await anna_s_phone()
  const kept = async () => ({
    records: await everything_kept(anna.opened.database),
    position: String(await anna.opened.position()),
    facts: await the_facts_logged(anna.opened.log),
    versions: await anna.opened.stored_versions(),
    queued: await the_entries_queued(anna.opened.outbox(the_ticket_s_wait)(undefined)),
  })
  const before = await kept()
  expect(before.queued).toHaveLength(1)
  // A ticket for a bond that is there already: its branch would queue a wait.
  const ticket = { bond_id: 'L_b', face_id: 'F_a', relays: [the_relay] }
  const refused = await anna.sends(
    anna.node.address_book.prepare_a_ticket,
    'prepare_a_ticket',
    ticket,
    'anna-asks-for-L_b-again',
  )
  expect(refused.outcome).toBe('rejected')
  expect(JSON.stringify(refused)).toContain('bonds/address_book/predicate/a_bond_has_this_id')
  // Sent again under its operation: refused again, nothing was recorded.
  const again = await anna.sends(
    anna.node.address_book.prepare_a_ticket,
    'prepare_a_ticket',
    ticket,
    'anna-asks-for-L_b-again',
  )
  expect(again).toEqual(refused)
  // Through the leaf of `self`: a bond never made.
  expect(
    last_of(
      await anna.the_user(
        'usecase/rename_a_bond',
        { bond_id: 'L_x', name: 'Nessuno' },
        'anna-renames-L_x',
      ),
    ),
  ).toMatchObject({ event: 'there_is_no_such_bond' })
  expect(await kept()).toEqual(before)
  anna.opened.let_go()
})

/** The stores of the node as the release opens them (`storage.ts`). */
const the_stores = (name: string) => ({
  name,
  paths: the_kernel_s_domains,
  extensions: the_extensions_carried,
  characters: 1_000_000,
})

/** Another tab of the same browser opens the node: the same factory, the same database's name. */
const another_tab = (indexed_db: IDBFactory, name: string, how: 'if_no_tab_is' | 'use_here') =>
  the_node_s_storage({ indexed_db, key_range: IDBKeyRange, locks: navigator.locks })(
    the_stores(name),
    how,
  )

/** The tab that took the writer, or the check fails. */
const the_writer = async (opening: ReturnType<typeof another_tab>): Promise<TheNodesStorage> => {
  const opened = await opening
  if (opened.writer !== 'this_tab') throw new Error('the tab did not take the writer')
  return opened
}

test('a second tab composes nothing; "use here" takes the writer, and the first tab writes nothing more', async () => {
  const indexed_db = new IDBFactory()
  const name = `cumino ${crypto.randomUUID()}`
  const first = await a_phone_over(await a_node_on_indexeddb(indexed_db, name))
  await first.anna_s_face()
  const second = await another_tab(indexed_db, name, 'if_no_tab_is')
  expect(second.writer).toBe('another_tab')
  // Nothing of the node to compose: no port, no consumer, only its connection to close.
  expect(Object.keys(second).sort()).toEqual(['closes', 'writer'])
  if (second.writer === 'another_tab') second.closes()

  const here = await a_phone_over(await the_writer(another_tab(indexed_db, name, 'use_here')))
  expect(await first.opened.lost).toBe('used_elsewhere')
  expect(here.opened.term).toBe(first.opened.term + 1)
  const before = await everything_kept(here.opened.database)
  const ticket = { bond_id: 'L_b', face_id: 'F_a', relays: [the_relay] }
  await expect(
    first.sends(
      first.node.address_book.prepare_a_ticket,
      'prepare_a_ticket',
      ticket,
      'anna-asks-for-L_b',
    ),
  ).rejects.toBeInstanceOf(NotTheWriter)
  await expect(
    first.the_user('usecase/prepare_a_ticket', ticket, 'anna-asks-for-L_b-from-the-app'),
  ).rejects.toBeInstanceOf(NotTheWriter)
  // A consumer's commit too (DOM-14): the executor's position.
  await expect(
    first.opened.executor.advance(the_ticket_s_wait)(zz.position.parse('1')),
  ).rejects.toBeInstanceOf(NotTheWriter)
  expect(await everything_kept(here.opened.database)).toEqual(before)
  // The new writer's ports write, the operation the old tab tried first among them.
  expect(
    await here.sends(
      here.node.address_book.prepare_a_ticket,
      'prepare_a_ticket',
      ticket,
      'anna-asks-for-L_b',
    ),
  ).toMatchObject({ outcome: 'applied', position: '3' })
  here.opened.let_go()
})

/** The records of a node's database without the writer's term, which "use here" writes (WEB-10). */
const without_the_term = (records: Awaited<ReturnType<typeof everything_kept>>) => {
  const node = records['node']
  if (node === undefined || !Array.isArray(node.keys) || !Array.isArray(node.values))
    throw new Error('the node has no store of its own')
  const values: readonly unknown[] = node.values
  const kept = node.keys.flatMap((key: unknown, at) =>
    key === 'the_writer_s_term' ? [] : [{ key, value: values[at] }],
  )
  return { ...records, node: kept }
}

/**
 * A transaction of a tab kept running, read after read, until it is let go:
 * IndexedDB runs a later transaction over the same store after it, so that a
 * command's lookup waits behind it (at most 100 000 reads).
 */
const a_transaction_held = (database: IDBDatabase, store: string) => {
  const transaction = database.transaction(store, 'readwrite')
  const ended = new Promise<void>((done, failed) => {
    transaction.oncomplete = () => {
      done()
    }
    transaction.onabort = () => {
      failed(new Error('the transaction held was aborted'))
    }
  })
  const held = { on: true, reads: 0 }
  const reads = (): void => {
    held.reads += 1
    if (!held.on) return
    if (held.reads > 100_000) {
      transaction.abort()
      return
    }
    transaction.objectStore(store).get('nothing').onsuccess = reads
  }
  reads()
  return {
    let_go: (): Promise<void> => {
      held.on = false
      return ended
    },
  }
}

test('a command the first tab began before "use here" and commits after it writes nothing', async () => {
  const indexed_db = new IDBFactory()
  const name = `cumino ${crypto.randomUUID()}`
  const first = await a_phone_over(await a_node_on_indexeddb(indexed_db, name))
  await first.anna_s_face()
  const before = await everything_kept(first.opened.database)
  // Its lookup waits behind a transaction over the address book's store.
  const held = a_transaction_held(first.opened.database, 'domain bonds/address_book')
  const count = first.transactions.so_far()
  const ticket = { bond_id: 'L_b', face_id: 'F_a', relays: [the_relay] }
  const begun = first
    .sends(
      first.node.address_book.prepare_a_ticket,
      'prepare_a_ticket',
      ticket,
      'anna-asks-for-L_b',
    )
    .then(
      (outcome) => ({ ended: 'answered', outcome }) as const,
      (fault: unknown) => ({ ended: 'thrown', fault }) as const,
    )
  // The other tab takes the writer: its new term is written beside the transaction held.
  const taken = await the_writer(another_tab(indexed_db, name, 'use_here'))
  expect(await first.opened.lost).toBe('used_elsewhere')
  // When the writer was taken, the command had only asked for its lookup.
  expect(first.transactions.since(count)).toEqual([
    { mode: 'readonly', stores: ['domain bonds/address_book'] },
  ])
  await held.let_go()
  const ended = await Promise.race([
    begun,
    a_timer(5_000).then(() => ({ ended: 'waiting' }) as const),
  ])
  expect(ended).toMatchObject({ ended: 'thrown' })
  if (ended.ended === 'thrown') expect(ended.fault).toBeInstanceOf(NotTheWriter)
  // Its step ran after the writer was taken, and was aborted.
  expect(first.transactions.since(count).map((each) => each.mode)).toEqual([
    'readonly',
    'readwrite',
  ])
  const here = await a_phone_over(taken)
  // Nothing written but the new writer's term.
  expect(without_the_term(await everything_kept(here.opened.database))).toEqual(
    without_the_term(before),
  )
  expect(
    await here.sends(
      here.node.address_book.prepare_a_ticket,
      'prepare_a_ticket',
      ticket,
      'anna-asks-for-L_b',
    ),
  ).toMatchObject({ outcome: 'applied', position: '3' })
  here.opened.let_go()
})

test("the duplicate branch's lookups, counted: a request through a leaf reads its operation twice, then the step", async () => {
  const anna = await anna_s_phone()
  const renamed = { bond_id: 'L_b', name: 'Bru' }
  const first = await anna.transactions.during(() =>
    anna.the_user('usecase/rename_a_bond', renamed, 'anna-renames-L_b'),
  )
  expect(last_of(first.result)).toMatchObject({ event: 'the_bond_is_renamed' })
  // The leaf's lookup and the port's (`recorded_in`), then the step, which reads the operation again inside.
  expect(first.opened).toEqual([
    { mode: 'readonly', stores: ['domain bonds/address_book'] },
    { mode: 'readonly', stores: ['domain bonds/address_book'] },
    { mode: 'readwrite', stores: ['domain bonds/address_book', 'node'] },
  ])
  // Sent again: the leaf's lookup finds the fact, before the schema; nothing else is read.
  const retried = await anna.transactions.during(() =>
    anna.the_user('usecase/rename_a_bond', renamed, 'anna-renames-L_b'),
  )
  expect(retried.result).toEqual(first.result)
  expect(retried.opened).toEqual([{ mode: 'readonly', stores: ['domain bonds/address_book'] }])
  // Another input under the operation: the same lookup answers `identity_already_used`.
  const another = await anna.transactions.during(() =>
    anna.the_user(
      'usecase/rename_a_bond',
      { bond_id: 'L_b', name: 'Brunello' },
      'anna-renames-L_b',
    ),
  )
  expect(JSON.stringify(another.result)).toContain('identity_already_used')
  expect(by_mode(another.opened)).toEqual({ readonly: 1, readwrite: 0 })
  // A caller that is no leaf: the port's lookup and the step; its retry, the lookup.
  const at_the_port = await anna.transactions.during(() =>
    anna.sends(
      anna.node.address_book.rename_a_bond,
      'rename_a_bond',
      { bond_id: 'L_b', name: 'Bruno B.' },
      'anna-renames-L_b-at-the-port',
    ),
  )
  expect(by_mode(at_the_port.opened)).toEqual({ readonly: 1, readwrite: 1 })
  anna.opened.let_go()
})

test("with the leaf's lookup reading nothing, a request reads its operation once before the step, and its retry once", async () => {
  const anna = await anna_s_phone('reads_nothing')
  const renamed = { bond_id: 'L_b', name: 'Bru' }
  const first = await anna.transactions.during(() =>
    anna.the_user('usecase/rename_a_bond', renamed, 'anna-renames-L_b'),
  )
  expect(by_mode(first.opened)).toEqual({ readonly: 1, readwrite: 1 })
  const retried = await anna.transactions.during(() =>
    anna.the_user('usecase/rename_a_bond', renamed, 'anna-renames-L_b'),
  )
  // Answered by the port's lookup, the same events as the leaf's would give.
  expect(retried.result).toEqual(first.result)
  expect(by_mode(retried.opened)).toEqual({ readonly: 1, readwrite: 0 })
  anna.opened.let_go()
})
