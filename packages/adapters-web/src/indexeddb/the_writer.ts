// The single writer (DOM-9, WEB-10): of the tabs that open the node, one
// writes, the one that holds the browser's lock of the writer; another
// composes nothing and offers "use here", which takes the lock from the tab
// that holds it. Every commit reads the writer's term in its own transaction,
// so that a tab whose lock was taken writes nothing more, even a commit it had
// already begun.

import { the_node_s_store } from './database.ts'
import { the_end_of, the_record_of } from './requests.ts'

/** The browser's `navigator.locks`, given (WEB-5). */
export type ALockManager = Pick<LockManager, 'request'>

/** The lock's name: one per origin, so one writer per browser for the node's database. */
export const the_writer_s_lock = 'cumino: the writer'

/** The key of the writer's term in the node's store. */
export const the_writer_s_term = 'the_writer_s_term'

/** How a tab asks to be the writer: if no tab is, or taking it from the tab that is ("use here"). */
export type HowToAsk = 'if_no_tab_is' | 'use_here'

/** Why a writer stopped being one. */
export type WhyNotAnyMore = 'used_elsewhere' | 'let_go'

export type TheWriter =
  | {
      readonly writer: 'this_tab'
      readonly term: number
      /** Settles when the lock is taken by another tab, or let go by this one. */
      readonly lost: Promise<WhyNotAnyMore>
      readonly let_go: () => void
    }
  | { readonly writer: 'another_tab' }

/** A commit begun by a tab that is no longer the writer: aborted, nothing written (WEB-10). */
export class NotTheWriter extends Error {
  constructor() {
    super('this tab is no longer the writer of the node')
    this.name = 'NotTheWriter'
  }
}

const a_new_term = async (database: IDBDatabase): Promise<number> => {
  const transaction = database.transaction(the_node_s_store, 'readwrite')
  const store = transaction.objectStore(the_node_s_store)
  const before: unknown = await the_record_of(store.get(the_writer_s_term))
  const term = typeof before === 'number' ? before + 1 : 1
  store.put(term, the_writer_s_term)
  await the_end_of(transaction)
  return term
}

/**
 * Asks the browser for the writer's lock; with it, a new term in the node's
 * store. The lock is held until it is let go or taken.
 */
export const ask_to_be_the_writer =
  (locks: ALockManager, database: IDBDatabase) =>
  (how: HowToAsk): Promise<TheWriter> =>
    new Promise<TheWriter>((resolve, reject) => {
      const held: { let_go: () => void } = { let_go: () => undefined }
      const until_let_go = new Promise<void>((let_go) => {
        held.let_go = let_go
      })
      const options: LockOptions = how === 'if_no_tab_is' ? { ifAvailable: true } : { steal: true }
      const asked = locks.request(the_writer_s_lock, options, async (lock) => {
        if (lock === null) {
          resolve({ writer: 'another_tab' })
          return
        }
        const term = await a_new_term(database).catch((fault: unknown) => {
          reject(fault instanceof Error ? fault : new Error(String(fault)))
          return undefined
        })
        if (term === undefined) return
        resolve({ writer: 'this_tab', term, lost, let_go: held.let_go })
        await until_let_go
      })
      const lost = asked.then(
        (): WhyNotAnyMore => 'let_go',
        (): WhyNotAnyMore => 'used_elsewhere',
      )
    })

/**
 * Inside a commit's transaction, before its writes: the term still this
 * writer's, or the transaction aborted and `NotTheWriter` thrown.
 */
export const the_term_holds = async (transaction: IDBTransaction, term: number): Promise<void> => {
  const now: unknown = await the_record_of(
    transaction.objectStore(the_node_s_store).get(the_writer_s_term),
  )
  if (now !== term) {
    transaction.abort()
    throw new NotTheWriter()
  }
}
