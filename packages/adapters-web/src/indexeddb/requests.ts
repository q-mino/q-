// IndexedDB's requests and transactions as promises (WEB-9). A transaction
// commits by itself at the first task with no request of its own pending, so
// that inside one only its own requests are awaited: never a clock, a hash, a
// timer or a call to the library (WEB-9).

/** The result of a request, or its error. */
export const the_result_of = <value>(request: IDBRequest<value>): Promise<value> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result)
    }
    request.onerror = () => {
      reject(request.error ?? new Error('an IndexedDB request failed'))
    }
  })

/** A record read, `unknown` until parsed (the DOM types it `any`). */
export const the_record_of = (request: IDBRequest): Promise<unknown> =>
  the_result_of<unknown>(request)

/** The records of a range, `unknown` until parsed. */
export const the_records_of = (request: IDBRequest<unknown[]>): Promise<readonly unknown[]> =>
  the_result_of<unknown[]>(request)

/** A transaction's end: committed, or aborted with its error. */
export const the_end_of = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve()
    }
    transaction.onabort = () => {
      reject(transaction.error ?? new Error('an IndexedDB transaction was aborted'))
    }
  })
