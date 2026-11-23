// The node's database (WEB-8): one IndexedDB database per node, a store for
// each business domain of the kernel and for each extension's partition, and
// the node's own store. The stores a release needs are created when it opens
// the database; none is deleted in stage 1. The whole database is deleted
// when she clears the data of an older test release (WEB-8).

/** A store of the node's database: a business domain's, or an extension's partition. */
export type AStore =
  | { readonly of: 'a_domain'; readonly path: string }
  | { readonly of: 'an_extension'; readonly name: string }

/** The node's own store: the writer's term, the node's counters, the consumers' state. */
export const the_node_s_store = 'node'

/** A store's name in the database, told apart by its kind. */
export const the_name_of = (store: AStore): string =>
  store.of === 'a_domain' ? `domain ${store.path}` : `extension ${store.name}`

/** Why the database was closed under the node: then the node stops (WEB-10). */
export type WhyItClosed = 'a_newer_release_opens_it' | 'the_browser_closed_it'

export interface TheNodesDatabase {
  readonly database: IDBDatabase
  readonly closed: Promise<WhyItClosed>
}

/** The browser's `indexedDB`, given (WEB-5). */
export type AnIndexedDb = Pick<IDBFactory, 'open' | 'deleteDatabase'>

const opened = (
  request: IDBOpenDBRequest,
  missing: (database: IDBDatabase) => readonly string[],
): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    request.onupgradeneeded = () => {
      for (const name of missing(request.result)) request.result.createObjectStore(name)
    }
    request.onsuccess = () => {
      resolve(request.result)
    }
    request.onerror = () => {
      reject(request.error ?? new Error('the database did not open'))
    }
  })

/**
 * Opens the node's database with the stores the release needs: those missing
 * are created by an upgrade, which waits for every other connection to close
 * (another tab of an older release closes on its `versionchange`, WEB-10).
 */
export const open_the_node_s_database =
  (indexed_db: AnIndexedDb) =>
  async (name: string, stores: readonly AStore[]): Promise<TheNodesDatabase> => {
    const needed = [the_node_s_store, ...stores.map(the_name_of)]
    const missing = (database: IDBDatabase): readonly string[] =>
      needed.filter((store) => !database.objectStoreNames.contains(store))
    const first = await opened(indexed_db.open(name), missing)
    const database =
      missing(first).length === 0
        ? first
        : await (async () => {
            const version = first.version
            first.close()
            return opened(indexed_db.open(name, version + 1), missing)
          })()
    const closed = new Promise<WhyItClosed>((resolve) => {
      database.onversionchange = () => {
        database.close()
        resolve('a_newer_release_opens_it')
      }
      database.onclose = () => {
        resolve('the_browser_closed_it')
      }
    })
    return { database, closed }
  }

/**
 * Deletes the node's database, every store in it (WEB-8, the data of an
 * older test release): once the node has stopped and closed it here; another
 * tab's connection closes on its `versionchange` (WEB-10), so the deletion
 * waits for no one.
 */
export const delete_the_node_s_database =
  (indexed_db: AnIndexedDb) =>
  (name: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const request = indexed_db.deleteDatabase(name)
      request.onsuccess = () => {
        resolve()
      }
      request.onerror = () => {
        reject(request.error ?? new Error('the database was not deleted'))
      }
    })
