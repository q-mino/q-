// A phone over IndexedDB whose transactions are counted (step 21, part 21.2's
// checks: TST-5, DOM-11 "Where the duplicate branch runs", WEB-9, WEB-10):
// the phone of the `memory` stack (`phone(storage)(world)`) over a node's
// storage on fake-indexeddb (`storage.ts`), its database decorated so that
// every transaction it opens is kept with its mode and its stores. Anna's
// face made and her bond with Bruno kept are written through the address
// book's ports, as the reactions and Bruno's introduction would write them
// (no executor runs, no letter leaves the phone); the user's requests go
// through the leaves of `self`, as her entry sends them (step 15). The leaf's
// lookup of the duplicate branch is as built, or reads nothing (the
// measure's variant: only the port's lookup and the step read).

import type { TheNodesStorage } from '@q-mino/adapters-web'
import * as zz from '@q-mino/domains/library'
import { the_content_a_ticket_s_secret_signs } from '@q-mino/domains/bonds/address_book/_dsl.ts'
import { base64url_of, bytes_of } from '@q-mino/domains/seals/safe/_dsl.ts'
import { phone, type PhoneStorage } from '../../src/index.ts'
import { fake_primitives } from '../seals/primitives.ts'
import { a_node_on_indexeddb, a_phone_s_storage } from './storage.ts'

/** The relay of the story (BND-4): one, in stage 1. */
export const the_relay = 'https://relay.q-mino.test'

/** The scope of the user's entry (`self`, step 15). */
export const the_scope_of_the_user = 'self/the_user'

/** The effect a ticket asked for queues (BND-8): its wait of 48 hours. */
export const the_ticket_s_wait = 'bonds/address_book/effect/wait_until_the_ticket_expires'

/** A transaction a database opened: its mode and its stores. */
export interface ATransaction {
  readonly mode: IDBTransactionMode
  readonly stores: readonly string[]
}

/** The transactions of a run, by mode. */
export const by_mode = (
  opened: readonly ATransaction[],
): { readonly readonly: number; readonly readwrite: number } => ({
  readonly: opened.filter((each) => each.mode === 'readonly').length,
  readwrite: opened.filter((each) => each.mode === 'readwrite').length,
})

/**
 * The transactions a database opens from now on, in order: its
 * `transaction` decorated (ADP-5), the same transaction given back. The
 * node's code calls it on the database at each request, so the decorator
 * sees every one.
 */
export const the_transactions_of = (database: IDBDatabase) => {
  const opened: ATransaction[] = []
  const transaction = database.transaction.bind(database)
  Object.defineProperty(database, 'transaction', {
    configurable: true,
    value: (
      stores: string | string[],
      mode?: IDBTransactionMode,
      options?: IDBTransactionOptions,
    ): IDBTransaction => {
      opened.push({
        mode: mode ?? 'readonly',
        stores: typeof stores === 'string' ? [stores] : [...stores],
      })
      return transaction(stores, mode, options)
    },
  })
  return {
    /** How many it opened so far. */
    so_far: (): number => opened.length,
    /** Those it opened from a count on. */
    since: (count: number): readonly ATransaction[] => opened.slice(count),
    /** What a run gives, and the transactions opened while it ran. */
    during: async <result>(
      run: () => Promise<result>,
    ): Promise<{ readonly result: result; readonly opened: readonly ATransaction[] }> => {
      const from = opened.length
      const result = await run()
      return { result, opened: opened.slice(from) }
    },
  }
}

/** How a command leaf looks its operation up before its schema (DOM-11): as built, or reading nothing. */
export type TheLeafsLookup = 'as_built' | 'reads_nothing'

/** The symbol of the lookup a command port gives its leaf (`$Recorded`, the library's own, not exported). */
const the_lookup_of = (port: object): symbol => {
  const found = Object.getOwnPropertySymbols(port).find((each) => each.description === 'Recorded')
  if (found === undefined) throw new Error('the port gives its leaf no lookup (DOM-11)')
  return found
}

/**
 * A command port whose leaf's lookup answers "nothing recorded" with no
 * transaction (a decorator of the lookup the port gives the leaf): the leaf
 * goes on to its schema and its nodes, and the port's own lookup and the
 * step read, as before. The port's other members (what it serves, CFG-2)
 * are copied as they are.
 */
const its_leaf_reads_nothing = <args extends readonly unknown[], events>(
  port: (...args: args) => events,
) =>
  Object.assign((...args: args) => port(...args), port, {
    [the_lookup_of(port)]: () => Promise.resolve({ outcome: 'not_recorded' }),
  })

/** The phone's storage with the leaf's lookup of `rename_a_bond` reading nothing: the command the measure sends. */
const with_the_leaf_s_lookup_off = (kept: PhoneStorage): PhoneStorage => ({
  ...kept,
  address_book: (primitives) => (versions) => {
    const ports = kept.address_book(primitives)(versions)
    return { ...ports, rename_a_bond: its_leaf_reads_nothing(ports.rename_a_bond) }
  },
})

/** Every event of a port's stream, until it ends. */
export const all = async <event>(events: AsyncIterable<event>): Promise<readonly event[]> => {
  const every: event[] = []
  for await (const event of events) every.push(event)
  return every
}

/** The last event of a stream that ended. */
export const last_of = <event>(events: readonly event[]): event => {
  const last = events.at(-1)
  if (last === undefined) throw new Error('a request gave no event')
  return last
}

/** A real timer of so many milliseconds. */
export const a_timer = (milliseconds: number): Promise<void> =>
  new Promise<void>((done) => {
    setTimeout(done, milliseconds)
  })

/** The facts of a node's log as it reads them now: every one, until it is caught up. */
export const the_facts_logged = async (
  log: zz.FactLog,
): Promise<readonly { readonly position: zz.position; readonly fact: zz.StoredEnvelope }[]> => {
  const facts: { readonly position: zz.position; readonly fact: zz.StoredEnvelope }[] = []
  for await (const event of log(undefined)) {
    if (event.event !== 'fact') break
    facts.push({ position: event.position, fact: event.fact })
  }
  return facts
}

/**
 * The entries an effect's outbox gives now (DOM-14): those it reads at once,
 * until it waits for a commit (20 ms of a real timer with nothing new). The
 * outbox follows, so its stream is left there.
 */
export const the_entries_queued = async (
  entries: AsyncIterable<zz.QueuedEntry>,
): Promise<readonly zz.QueuedEntry[]> => {
  const iterator = entries[Symbol.asyncIterator]()
  const queued: zz.QueuedEntry[] = []
  for (let read = 0; read < 1000; read += 1) {
    const next = await Promise.race([iterator.next(), a_timer(20).then(() => 'waiting' as const)])
    if (next === 'waiting' || next.done === true) return queued
    queued.push(next.value)
  }
  throw new Error('an outbox gave more than a thousand entries')
}

const the_result_of = <value>(request: IDBRequest<value>): Promise<value> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result)
    }
    request.onerror = () => {
      reject(request.error ?? new Error('an IndexedDB request failed'))
    }
  })

/** Every record of every store of a node's database, keys and values, in one transaction: what a check compares before and after. */
export const everything_kept = async (
  database: IDBDatabase,
): Promise<Readonly<Record<string, { readonly keys: unknown; readonly values: unknown }>>> => {
  const stores = Array.from(database.objectStoreNames)
  const transaction = database.transaction(stores, 'readonly')
  const read = await Promise.all(
    stores.map(async (store) => {
      const kept = transaction.objectStore(store)
      const [keys, values] = await Promise.all([
        the_result_of(kept.getAllKeys()),
        the_result_of<unknown[]>(kept.getAll()),
      ])
      return [store, { keys, values }] as const
    }),
  )
  return Object.fromEntries(read)
}

/** The nodes' clock, at 10:00:00 UTC on Friday 20 November 2026; it does not move. */
const clock: zz.Clock = {
  now: () => zz.date_time.parse('2026-11-20T10:00:00Z'),
  time_zone: zz.time_zone.parse('UTC'),
}

/** A face's key pair of the fake primitives, from a seed of one byte repeated: its key, and its signature over a content. */
const a_face_of = (byte: number) => {
  const seed = Uint8Array.from({ length: 32 }, () => byte)
  return {
    key: base64url_of(fake_primitives.public_key_of(seed)),
    signs: (content: string): string => base64url_of(fake_primitives.sign(seed, bytes_of(content))),
  }
}

/**
 * A phone over a node's storage on IndexedDB, opened as its writer: the
 * phone of the `memory` stack, in a world where no letter leaves and no
 * time passes (its consumers are not started); its database's transactions
 * counted from here on.
 */
export const a_phone_over = async (
  opened: TheNodesStorage,
  lookup: TheLeafsLookup = 'as_built',
) => {
  const transactions = the_transactions_of(opened.database)
  const kept = a_phone_s_storage(opened)
  const node = await phone(lookup === 'as_built' ? kept : with_the_leaf_s_lookup_off(kept))({
    clock,
    elapsed: (milliseconds) => a_timer(Math.min(milliseconds, 10)),
    primitives: fake_primitives,
    mailbox: {
      deposit: () => Promise.reject(new Error('no letter leaves the phone in these checks')),
    },
    collect: () => Promise.resolve([]),
    extensions: [],
    relays: [the_relay],
  })
  const when = (): zz.RootContext => ({
    now: zz.in_zone(clock.time_zone)(clock.now()),
    time_zone: clock.time_zone,
  })

  /** A command of the address book sent as its stories send it (DOM-11): under an operation, in a scope; its last event. */
  const sends = async <input, outcome>(
    port: (context: zz.CommandRootContext, input: input) => AsyncIterable<outcome>,
    use_case: string,
    input: NoInfer<input>,
    operation: string,
    scope: string = the_scope_of_the_user,
  ): Promise<outcome> =>
    last_of(
      await all(
        port(
          {
            ...when(),
            operation: { id: zz.operation_id.parse(operation), scope },
            correlation: zz.correlation.parse(`correlation-${operation}`),
            fingerprint: zz.fingerprint_of({
              path: `bonds/address_book/usecase/${use_case}`,
              input,
            }),
          },
          input,
        ),
      ),
    )

  /** The user's request on `self`, as her entry sends it (step 15): a leaf by its path, at 1.0.0, under an operation; its events. */
  const the_user = (leaf: string, input: unknown, operation: string) =>
    all(
      node.personas().self(
        {
          ...when(),
          caller: { is: 'the_user' as const },
          version: zz.semver.parse('1.0.0'),
          operation: { id: zz.operation_id.parse(operation), scope: the_scope_of_the_user },
          correlation: zz.correlation.parse(`correlation-${operation}`),
        },
        { leaf, input },
      ),
    )

  const address_book = node.address_book
  return {
    opened,
    node,
    transactions,
    sends,
    the_user,
    /** The address book's bonds, as the user's screens read them. */
    my_bonds: async () => {
      const [first] = await all(address_book.my_bonds(when(), {}))
      return first?.event === 'snapshot' ? first.entries : []
    },
    /** Anna's face made, as the safe's reaction makes it: her key kept. */
    anna_s_face: async (): Promise<void> => {
      const made = [
        await sends(
          address_book.make_my_first_face,
          'make_my_first_face',
          { face_id: 'F_a', name: 'Anna' },
          'anna-first-face',
        ),
        await sends(
          address_book.keep_the_key_of_a_face,
          'keep_the_key_of_a_face',
          { face_id: 'F_a', public_key: a_face_of(1).key },
          'anna-face-key',
          'reaction/first_face',
        ),
      ]
      if (!made.every((each) => each.outcome === 'applied'))
        throw new Error(`Anna's face is not made: ${JSON.stringify(made)}`)
    },
    /**
     * Anna's bond with Bruno kept (BND-10): her ticket L_b ready at her
     * mailbox D, Bruno's introduction with its secret accepted under
     * `unknown`, as the address book's stories make it. After her face.
     */
    anna_s_bond_with_bruno: async (): Promise<void> => {
      const D = base64url_of(Uint8Array.from({ length: 32 }, () => 9))
      const introduction = {
        bond_id: 'L_b',
        secret: a_face_of(1).signs(the_content_a_ticket_s_secret_signs(D)),
        their_face: { key: a_face_of(2).key, introduced_as: 'Bruno' },
        their_mailbox: {
          deposit_address: base64url_of(Uint8Array.from({ length: 32 }, () => 3)),
          relays: [the_relay],
        },
      }
      const made = [
        await sends(
          address_book.prepare_a_ticket,
          'prepare_a_ticket',
          { bond_id: 'L_b', face_id: 'F_a', relays: [the_relay] },
          'anna-ticket-L_b',
        ),
        await sends(
          address_book.keep_the_mailbox_of_a_ticket,
          'keep_the_mailbox_of_a_ticket',
          { bond_id: 'L_b', deposit_address: D },
          'anna-mailbox-L_b',
          'reaction/ticket',
        ),
        await sends(
          address_book.accept_their_introduction,
          'accept_their_introduction',
          introduction,
          'bruno-introduces-himself',
          'persona/unknown',
        ),
      ]
      if (!made.every((each) => each.outcome === 'applied'))
        throw new Error(`Anna's bond with Bruno is not kept: ${JSON.stringify(made)}`)
    },
  }
}

/** A phone of the checks. */
export type APhoneCounted = Awaited<ReturnType<typeof a_phone_over>>

/** A phone on a new browser's IndexedDB (a node of its own, its only tab), Anna's face made and her bond with Bruno kept. */
export const anna_s_phone = async (lookup: TheLeafsLookup = 'as_built'): Promise<APhoneCounted> => {
  const anna = await a_phone_over(await a_node_on_indexeddb(), lookup)
  await anna.anna_s_face()
  await anna.anna_s_bond_with_bruno()
  return anna
}
